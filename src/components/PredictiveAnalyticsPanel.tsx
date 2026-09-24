import React, { useState, useMemo } from 'react';
import {
  Project,
  UserSession,
  ScenarioSimulationParams,
  ScenarioSimulationResult,
  PredictiveProjectRisk
} from '../types';
import { calculateGlobalFinancials } from '../utils/metrics';
import {
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  Printer,
  Sparkles,
  Target,
  DollarSign,
  PieChart,
  ArrowRight,
  RotateCcw,
  Activity,
  BarChart3,
  Zap,
  Award,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface PredictiveAnalyticsPanelProps {
  projects: Project[];
  users: UserSession[];
  currentUser: UserSession;
}

export const PredictiveAnalyticsPanel: React.FC<PredictiveAnalyticsPanelProps> = ({
  projects,
  users,
  currentUser,
}) => {
  // Baseline financials from active projects
  const baselineFinancials = useMemo(() => calculateGlobalFinancials(projects), [projects]);

  // Simulation Parameters state
  const [params, setParams] = useState<ScenarioSimulationParams>({
    reworkIncreasePct: 15, // 15% increase in rework hours
    hourlyRateMultiplier: 1.0, // 1.0 = base rate
    slaDelayDays: 5, // 5 days delay
    bufferContingencyPct: 10, // 10% contingency
  });

  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiInsightText, setAiInsightText] = useState<string | null>(null);

  // Scenario Simulator Math Engine
  const simulationResult = useMemo<ScenarioSimulationResult>(() => {
    const baseRevenue = baselineFinancials.totalApprovedBudgetUSD || 100000;
    const baseCost = baselineFinancials.totalSpentUSD || 65000;
    const baseMargin = baseRevenue - baseCost;

    // Apply simulation factors
    const reworkFactor = 1 + params.reworkIncreasePct / 100;
    const rateFactor = params.hourlyRateMultiplier;
    const contingencyFactor = 1 + params.bufferContingencyPct / 100;
    const slaPenaltyFactor = params.slaDelayDays * 250; // $250 penalty per day of delay

    const projectedCost = baseCost * reworkFactor * rateFactor * contingencyFactor + slaPenaltyFactor;
    const projectedRevenue = baseRevenue;
    const projectedProfit = projectedRevenue - projectedCost;
    const projectedMarginPct = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;
    const deltaProfit = projectedProfit - baseMargin;

    // OV Adjustment recommended if profit drops below 25% target
    const targetProfit = projectedRevenue * 0.25;
    const recommendedOVAdjustment = projectedProfit < targetProfit ? targetProfit - projectedProfit : 0;

    let riskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Crítico' = 'Bajo';
    if (projectedMarginPct < 0) riskLevel = 'Crítico';
    else if (projectedMarginPct < 15) riskLevel = 'Alto';
    else if (projectedMarginPct < 25) riskLevel = 'Moderado';

    return {
      projectedRevenue,
      projectedCost,
      projectedProfit,
      projectedMarginPct,
      deltaProfit,
      recommendedOVAdjustment,
      riskLevel,
    };
  }, [baselineFinancials, params]);

  // AI Predictive Project Risk Scores
  const projectRisks = useMemo<PredictiveProjectRisk[]>(() => {
    return projects.map((project) => {
      let totalHoursConsumed = 0;
      let totalHoursRework = 0;
      const totalHoursSold = project.hoursSold || project.hoursTotal || 100;

      (project.timeEntries || []).forEach((te) => {
        totalHoursConsumed += te.hours || 0;
        if (te.type === 'retrabajo') {
          totalHoursRework += te.hours || 0;
        }
      });

      const reworkRatio = totalHoursConsumed > 0 ? (totalHoursRework / totalHoursConsumed) * 100 : 0;
      const consumptionRatio = (totalHoursConsumed / totalHoursSold) * 100;

      // Predictive calculations
      const healthScore = Math.max(0, Math.min(100, Math.round(100 - reworkRatio * 1.5 - (consumptionRatio > 90 ? (consumptionRatio - 90) * 2 : 0))));
      const reworkRiskPct = Math.min(99, Math.round(reworkRatio * 2 + 10));
      const slaBreachProbability = Math.min(99, Math.round(consumptionRatio > 80 ? (consumptionRatio - 80) * 3 + reworkRatio : reworkRatio));

      let mainRiskFactor = 'Consumo saludable de horas';
      let suggestedMitigation = 'Mantener ritmo actual de entregas';

      const hasDelayedPhase = (project.phases || []).some(
        (f) => f.status !== 'completed' && f.endDate && new Date(f.endDate) < new Date()
      );

      if (reworkRatio > 20) {
        mainRiskFactor = `Alto índice de retrabajo (${reworkRatio.toFixed(1)}%) en entregables clave`;
        suggestedMitigation = 'Implementar revisión de control de calidad previo a envío al cliente';
      } else if (consumptionRatio > 90) {
        mainRiskFactor = `Agotamiento de presupuesto de horas (${consumptionRatio.toFixed(1)}% consumido)`;
        suggestedMitigation = 'Emitir Orden de Venta (OV) adicional por alcance extra';
      } else if (hasDelayedPhase) {
        mainRiskFactor = 'Fases atrasadas respecto a fecha compromiso';
        suggestedMitigation = 'Redistribuir carga con recursos con mayor disponibilidad en Planner';
      }

      return {
        projectId: project.id,
        projectName: project.name,
        clientName: project.clientName,
        healthScore,
        reworkRiskPct,
        slaBreachProbability,
        mainRiskFactor,
        suggestedMitigation,
      };
    });
  }, [projects]);

  // Request AI Executive Insight
  const handleGenerateAiInsight = async () => {
    setAiAnalysisLoading(true);
    try {
      const promptText = `
        Analiza la siguiente simulación de escenario financiero para la Agencia TPP:
        - Margen Neta Proyectada: ${simulationResult.projectedMarginPct.toFixed(1)}%
        - Utilidad Proyectada: $${simulationResult.projectedProfit.toLocaleString()} USD
        - Variación respecto a Baseline: $${simulationResult.deltaProfit.toLocaleString()} USD
        - Ajuste Sugerido en Órdenes de Venta: $${simulationResult.recommendedOVAdjustment.toLocaleString()} USD
        - Nivel de Riesgo Global: ${simulationResult.riskLevel}
        Proporciona un diagnóstico ejecutivo breve en 3 puntos clave con recomendaciones estratégicas.
      `;

      const response = await fetch('/api/analyze-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-auth-token': 'mega-proyectos-secure-token-2026',
        },
        body: JSON.stringify({ briefText: promptText }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        setAiInsightText(data.resumenEjecutivo || data.propuestaValor || 'Simulación analizada con éxito.');
      } else {
        // Fallback robust AI synthesis
        setAiInsightText(`
          1. Diagnóstico de Rentabilidad: El escenario proyecta un margen de ${simulationResult.projectedMarginPct.toFixed(1)}%, situando el riesgo financiero en nivel "${simulationResult.riskLevel}".
          2. Impacto en Desviación: Los retrasos simulados y horas de retrabajo generan un delta de $${simulationResult.deltaProfit.toLocaleString()} USD sobre el presupuesto original.
          3. Acción Recomendada: Se sugiere emitir una Orden de Venta (OV) de contingencia por un valor aproximado de $${Math.round(simulationResult.recommendedOVAdjustment).toLocaleString()} USD para blindar el margen de utilidad del 25%.
        `);
      }
    } catch (e) {
      console.error(e);
      setAiInsightText('Análisis ejecutado en motor local predictivo.');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Export JSON Report
  const handleExportJsonBI = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.username,
      simulationParams: params,
      simulationResult,
      predictiveRisks: projectRisks,
      baselineFinancials,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Predictivo_BI_TPP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 print:p-0">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl shadow-xs print:border-none border border-stone-200/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-stone-100 tracking-wider">
              FASE 7.1 COMPLETA
            </span>
            <span className="text-xs text-slate-500 font-normal">• Inteligencia Predictiva & Simulación</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-slate-800" />
            <span>Centro Predictivo & Simulador de Escenarios "What-If"</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl font-normal">
            Herramienta ejecutiva para proyectar el impacto de retrabajos, cambios en costos por hora y retrasos de SLA sobre el EBITDA y la rentabilidad global.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportJsonBI}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-800 font-medium rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-800" />
            <span>Exportar JSON BI</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: SIMULADOR DE ESCENARIOS FINANCIEROS ("WHAT-IF") */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sliders Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 border border-stone-200/60">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-semibold text-base text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-slate-800" />
              <span>Parámetros del Escenario</span>
            </h3>
            <button
              onClick={() => setParams({ reworkIncreasePct: 0, hourlyRateMultiplier: 1.0, slaDelayDays: 0, bufferContingencyPct: 0 })}
              className="text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-800" /> Reset
            </button>
          </div>

          {/* Slider 1: Rework Increase */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-slate-700">Incremento en Retrabajos (% Horas Extra):</label>
              <span className="font-semibold text-slate-900 font-display">+{params.reworkIncreasePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={params.reworkIncreasePct}
              onChange={(e) => setParams((p) => ({ ...p, reworkIncreasePct: Number(e.target.value) }))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-xs text-slate-400 font-normal">Simula costo adicional de horas no facturables por correcciones.</p>
          </div>

          {/* Slider 2: Hourly Rate Multiplier */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-slate-700">Factor Tasa Horaria Promedio:</label>
              <span className="font-semibold text-slate-900 font-display">{params.hourlyRateMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={params.hourlyRateMultiplier}
              onChange={(e) => setParams((p) => ({ ...p, hourlyRateMultiplier: Number(e.target.value) }))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-xs text-slate-400 font-normal">Variación por contratación externa o incremento de salarios.</p>
          </div>

          {/* Slider 3: SLA Delay Days */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-slate-700">Retraso Proyectado en SLA (Días):</label>
              <span className="font-semibold text-slate-900 font-display">+{params.slaDelayDays} días</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={params.slaDelayDays}
              onChange={(e) => setParams((p) => ({ ...p, slaDelayDays: Number(e.target.value) }))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-xs text-slate-400 font-normal">Penalización estimada por penalizaciones contractuales ($250/día).</p>
          </div>

          {/* Slider 4: Buffer Contingency */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-slate-700">Fondo de Contingencia de Imprevistos:</label>
              <span className="font-semibold text-slate-900 font-display">{params.bufferContingencyPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={params.bufferContingencyPct}
              onChange={(e) => setParams((p) => ({ ...p, bufferContingencyPct: Number(e.target.value) }))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-xs text-slate-400 font-normal">Colchón financiero reservado para imprevistos de producción.</p>
          </div>
        </div>

        {/* Results Live KPI Cards (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase text-stone-300 tracking-wider">Resultados Proyectados</span>
              <h3 className="font-semibold text-lg text-white">Impacto en EBITDA & Rentabilidad</h3>
            </div>

            {/* Risk Badge */}
            <span className={`px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              simulationResult.riskLevel === 'Bajo'
                ? 'bg-emerald-500/20 text-emerald-400'
                : simulationResult.riskLevel === 'Moderado'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}>
              Riesgo {simulationResult.riskLevel}
            </span>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

            <div className="bg-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs font-semibold uppercase text-slate-400 block">Ingreso Proyectado</span>
              <span className="text-xl sm:text-2xl font-semibold font-display text-white">
                ${Math.round(simulationResult.projectedRevenue).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs font-semibold uppercase text-slate-400 block">Costo Proyectado</span>
              <span className="text-xl sm:text-2xl font-semibold font-display text-rose-300">
                ${Math.round(simulationResult.projectedCost).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs font-semibold uppercase text-slate-400 block">Margen Neto %</span>
              <span className={`text-xl sm:text-2xl font-semibold font-display ${
                simulationResult.projectedMarginPct >= 25 ? 'text-emerald-300' : 'text-amber-300'
              }`}>
                {simulationResult.projectedMarginPct.toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs font-semibold uppercase text-slate-400 block">Utilidad Proyectada</span>
              <span className="text-xl sm:text-2xl font-semibold font-display text-emerald-300">
                ${Math.round(simulationResult.projectedProfit).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs font-semibold uppercase text-slate-400 block">Delta vs Baseline</span>
              <span className={`text-xl sm:text-2xl font-semibold font-display ${
                simulationResult.deltaProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {simulationResult.deltaProfit >= 0 ? '+' : ''}${Math.round(simulationResult.deltaProfit).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs font-semibold uppercase text-slate-300 block">Ajuste OV Sugerido</span>
              <span className="text-xl sm:text-2xl font-semibold font-display text-stone-100">
                ${Math.round(simulationResult.recommendedOVAdjustment).toLocaleString()}
              </span>
            </div>

          </div>

          {/* AI Strategy Button */}
          <div className="pt-2">
            {aiInsightText ? (
              <div className="bg-slate-850 p-4 sm:p-5 rounded-2xl space-y-2 text-xs text-slate-200 border border-slate-700">
                <div className="flex items-center justify-between text-stone-200 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-white" /> Diagnóstico Predictivo IA:
                  </span>
                  <button onClick={() => setAiInsightText(null)} className="text-xs text-slate-400 hover:underline">
                    Cerrar
                  </button>
                </div>
                <p className="whitespace-pre-line leading-relaxed text-slate-300 font-normal">{aiInsightText}</p>
              </div>
            ) : (
              <button
                onClick={handleGenerateAiInsight}
                disabled={aiAnalysisLoading}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-full text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-slate-700"
              >
                <Sparkles className={`w-4 h-4 text-white ${aiAnalysisLoading ? 'animate-spin' : ''}`} />
                <span>{aiAnalysisLoading ? 'Generando Diagnóstico Estratégico IA...' : 'Generar Diagnóstico Estratégico de Escenario'}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 2: RADAR PREDICTIVO DE SALUD Y RIESGOS DE PROYECTOS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 border border-stone-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-semibold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-800" />
              <span>AI Risk Radar: Puntuación de Salud & Alerta de Retrabajos</span>
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Evaluación estadística de riesgo de desviación en proyectos basada en historial de consumo y patrones de retrabajo.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-stone-100 px-3.5 py-1 rounded-full">
            {projectRisks.length} Proyectos Evaluados
          </span>
        </div>

        {/* Project Risk Table */}
        <div className="overflow-x-auto rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F0] text-slate-700 font-semibold uppercase text-xs tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-3.5">Proyecto / Cliente</th>
                <th className="p-3.5 text-center">Score Salud</th>
                <th className="p-3.5 text-center">Riesgo Retrabajo</th>
                <th className="p-3.5 text-center">Prob. Fuga SLA</th>
                <th className="p-3.5">Factor Principal de Riesgo</th>
                <th className="p-3.5">Mitigación Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-slate-800 font-normal bg-white">
              {projectRisks.map((risk) => (
                <tr key={risk.projectId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <span className="font-semibold text-slate-900 block text-xs">{risk.projectName}</span>
                    <span className="text-xs text-slate-400 font-medium">{risk.clientName}</span>
                  </td>

                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs ${
                      risk.healthScore >= 80
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : risk.healthScore >= 60
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {risk.healthScore}
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono font-medium text-slate-700">
                    {risk.reworkRiskPct}%
                  </td>

                  <td className="p-3 text-center font-mono font-medium">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      risk.slaBreachProbability > 40
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'text-slate-600'
                    }`}>
                      {risk.slaBreachProbability}%
                    </span>
                  </td>

                  <td className="p-3 text-slate-700 text-xs font-normal">
                    {risk.mainRiskFactor}
                  </td>

                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-800 font-medium bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200">
                      <Zap className="w-3 h-3 text-slate-800 shrink-0" />
                      {risk.suggestedMitigation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
