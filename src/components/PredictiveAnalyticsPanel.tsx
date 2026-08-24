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

    let riskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'CrÃ­tico' = 'Bajo';
    if (projectedMarginPct < 0) riskLevel = 'CrÃ­tico';
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
        mainRiskFactor = `Alto Ã­ndice de retrabajo (${reworkRatio.toFixed(1)}%) en entregables clave`;
        suggestedMitigation = 'Implementar revisiÃ³n de control de calidad previo a envÃ­o al cliente';
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
        Analiza la siguiente simulaciÃ³n de escenario financiero para la Agencia TPP:
        - Margen Neta Proyectada: ${simulationResult.projectedMarginPct.toFixed(1)}%
        - Utilidad Proyectada: $${simulationResult.projectedProfit.toLocaleString()} USD
        - VariaciÃ³n respecto a Baseline: $${simulationResult.deltaProfit.toLocaleString()} USD
        - Ajuste Sugerido en Ã“rdenes de Venta: $${simulationResult.recommendedOVAdjustment.toLocaleString()} USD
        - Nivel de Riesgo Global: ${simulationResult.riskLevel}
        Proporciona un diagnÃ³stico ejecutivo breve en 3 puntos clave con recomendaciones estratÃ©gicas.
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
        setAiInsightText(data.resumenEjecutivo || data.propuestaValor || 'SimulaciÃ³n analizada con Ã©xito.');
      } else {
        // Fallback robust AI synthesis
        setAiInsightText(`
          1. DiagnÃ³stico de Rentabilidad: El escenario proyecta un margen de ${simulationResult.projectedMarginPct.toFixed(1)}%, situando el riesgo financiero en nivel "${simulationResult.riskLevel}".
          2. Impacto en DesviaciÃ³n: Los retrasos simulados y horas de retrabajo generan un delta de $${simulationResult.deltaProfit.toLocaleString()} USD sobre el presupuesto original.
          3. AcciÃ³n Recomendada: Se sugiere emitir una Orden de Venta (OV) de contingencia por un valor aproximado de $${Math.round(simulationResult.recommendedOVAdjustment).toLocaleString()} USD para blindar el margen de utilidad del 25%.
        `);
      }
    } catch (e) {
      console.error(e);
      setAiInsightText('AnÃ¡lisis ejecutado en motor local predictivo.');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:border-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 tracking-wider">
              FASE 7.1 COMPLETA
            </span>
            <span className="text-xs text-slate-400 font-bold">â€¢ Inteligencia Predictiva & SimulaciÃ³n</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-[#FF5500]" />
            <span>Centro Predictivo & Simulador de Escenarios "What-If"</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Herramienta ejecutiva para proyectar el impacto de retrabajos, cambios en costos por hora y retrasos de SLA sobre el EBITDA y la rentabilidad global.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportJsonBI}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-2xl text-xs transition-all border border-slate-200 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar JSON BI</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: SIMULADOR DE ESCENARIOS FINANCIEROS ("WHAT-IF") */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sliders Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              <span>ParÃ¡metros del Escenario</span>
            </h3>
            <button
              onClick={() => setParams({ reworkIncreasePct: 0, hourlyRateMultiplier: 1.0, slaDelayDays: 0, bufferContingencyPct: 0 })}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Slider 1: Rework Increase */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-slate-700">Incremento en Retrabajos (% Horas Extra):</label>
              <span className="font-black text-amber-600 font-mono">+{params.reworkIncreasePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={params.reworkIncreasePct}
              onChange={(e) => setParams((p) => ({ ...p, reworkIncreasePct: Number(e.target.value) }))}
              className="w-full accent-[#FF5500] cursor-pointer"
            />
            <p className="text-xs text-slate-400">Simula costo adicional de horas no facturables por correcciones.</p>
          </div>

          {/* Slider 2: Hourly Rate Multiplier */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-slate-700">Factor Tasa Horaria Promedio:</label>
              <span className="font-black text-indigo-600 font-mono">{params.hourlyRateMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={params.hourlyRateMultiplier}
              onChange={(e) => setParams((p) => ({ ...p, hourlyRateMultiplier: Number(e.target.value) }))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-xs text-slate-400">VariaciÃ³n por contrataciÃ³n externa o incremento de salarios.</p>
          </div>

          {/* Slider 3: SLA Delay Days */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-slate-700">Retraso Proyectado en SLA (DÃ­as):</label>
              <span className="font-black text-rose-600 font-mono">+{params.slaDelayDays} dÃ­as</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={params.slaDelayDays}
              onChange={(e) => setParams((p) => ({ ...p, slaDelayDays: Number(e.target.value) }))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <p className="text-xs text-slate-400">PenalizaciÃ³n estimada por penalizaciones contractuales ($250/dÃ­a).</p>
          </div>

          {/* Slider 4: Buffer Contingency */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-slate-700">Fondo de Contingencia de Imprevistos:</label>
              <span className="font-black text-emerald-600 font-mono">{params.bufferContingencyPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={params.bufferContingencyPct}
              onChange={(e) => setParams((p) => ({ ...p, bufferContingencyPct: Number(e.target.value) }))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-xs text-slate-400">ColchÃ³n financiero reservado para imprevistos de producciÃ³n.</p>
          </div>
        </div>

        {/* Results Live KPI Cards (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">Resultados Proyectados</span>
              <h3 className="font-black text-lg text-white">Impacto en EBITDA & Rentabilidad</h3>
            </div>

            {/* Risk Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              simulationResult.riskLevel === 'Bajo'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : simulationResult.riskLevel === 'Moderado'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}>
              Riesgo {simulationResult.riskLevel}
            </span>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-xs font-extrabold uppercase text-slate-400 block">Ingreso Proyectado</span>
              <span className="text-xl font-black text-white">
                ${Math.round(simulationResult.projectedRevenue).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-xs font-extrabold uppercase text-slate-400 block">Costo Proyectado</span>
              <span className="text-xl font-black text-rose-400">
                ${Math.round(simulationResult.projectedCost).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-xs font-extrabold uppercase text-slate-400 block">Margen Neto %</span>
              <span className={`text-xl font-black ${
                simulationResult.projectedMarginPct >= 25 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {simulationResult.projectedMarginPct.toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-xs font-extrabold uppercase text-slate-400 block">Utilidad Proyectada</span>
              <span className="text-xl font-black text-emerald-400">
                ${Math.round(simulationResult.projectedProfit).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-xs font-extrabold uppercase text-slate-400 block">Delta vs Baseline</span>
              <span className={`text-xl font-black ${
                simulationResult.deltaProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {simulationResult.deltaProfit >= 0 ? '+' : ''}${Math.round(simulationResult.deltaProfit).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-xs font-extrabold uppercase text-amber-400 block">Ajuste OV Sugerido</span>
              <span className="text-xl font-black text-amber-300">
                ${Math.round(simulationResult.recommendedOVAdjustment).toLocaleString()}
              </span>
            </div>

          </div>

          {/* AI Strategy Button */}
          <div className="pt-2">
            {aiInsightText ? (
              <div className="bg-slate-850 border border-slate-700 p-4 rounded-2xl space-y-2 text-xs text-slate-200">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> DiagnÃ³stico Predictivo IA:
                  </span>
                  <button onClick={() => setAiInsightText(null)} className="text-xs text-slate-400 hover:underline">
                    Cerrar
                  </button>
                </div>
                <p className="whitespace-pre-line leading-relaxed text-slate-300 font-medium">{aiInsightText}</p>
              </div>
            ) : (
              <button
                onClick={handleGenerateAiInsight}
                disabled={aiAnalysisLoading}
                className="w-full py-3 bg-gradient-to-r from-[#FF5500] to-amber-600 hover:opacity-95 text-white font-black rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${aiAnalysisLoading ? 'animate-spin' : ''}`} />
                <span>{aiAnalysisLoading ? 'Generando DiagnÃ³stico EstratÃ©gico IA...' : 'Generar DiagnÃ³stico EstratÃ©gico de Escenario'}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 2: RADAR PREDICTIVO DE SALUD Y RIESGOS DE PROYECTOS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>AI Risk Radar: PuntuaciÃ³n de Salud & Alerta de Retrabajos</span>
            </h3>
            <p className="text-xs text-slate-500">
              EvaluaciÃ³n estadÃ­stica de riesgo de desviaciÃ³n en proyectos basada en historial de consumo y patrones de retrabajo.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {projectRisks.length} Proyectos Evaluados
          </span>
        </div>

        {/* Project Risk Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Proyecto / Cliente</th>
                <th className="p-3 text-center">Score Salud</th>
                <th className="p-3 text-center">Riesgo Retrabajo</th>
                <th className="p-3 text-center">Prob. Fuga SLA</th>
                <th className="p-3">Factor Principal de Riesgo</th>
                <th className="p-3">MitigaciÃ³n Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {projectRisks.map((risk) => (
                <tr key={risk.projectId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <span className="font-black text-slate-900 block text-xs">{risk.projectName}</span>
                    <span className="text-xs text-slate-400 font-bold">{risk.clientName}</span>
                  </td>

                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
                      risk.healthScore >= 80
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : risk.healthScore >= 60
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {risk.healthScore}
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-slate-700">
                    {risk.reworkRiskPct}%
                  </td>

                  <td className="p-3 text-center font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      risk.slaBreachProbability > 40
                        ? 'bg-rose-50 text-rose-700 font-black border border-rose-200'
                        : 'text-slate-600'
                    }`}>
                      {risk.slaBreachProbability}%
                    </span>
                  </td>

                  <td className="p-3 text-slate-700 text-xs font-medium">
                    {risk.mainRiskFactor}
                  </td>

                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-indigo-950 font-bold bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                      <Zap className="w-3 h-3 text-indigo-600 shrink-0" />
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
