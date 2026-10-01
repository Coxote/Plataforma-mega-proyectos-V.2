import React, { useState, useMemo } from 'react';
import { Project, Client, UserSession, ROLE_HOURLY_RATES } from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Calendar,
  Compass
} from 'lucide-react';

interface SCurveAndGaugesProps {
  projects: Project[];
  clients: Client[];
  users: UserSession[];
  currentUser: UserSession;
}

export interface EVMMetrics {
  bac: number; // Budget at Completion (Presupuesto total)
  pv: number;  // Planned Value (Valor Planificado a hoy)
  ev: number;  // Earned Value (Valor Ganado a hoy)
  ac: number;  // Actual Cost (Costo Real a hoy)
  cv: number;  // Cost Variance = EV - AC
  sv: number;  // Schedule Variance = EV - PV
  cpi: number; // Cost Performance Index = EV / AC
  spi: number; // Schedule Performance Index = EV / PV
  eac: number; // Estimate at Completion = BAC / CPI
  vac: number; // Variance at Completion = BAC - EAC
  progressPct: number; // % avance físico real
  plannedPct: number;  // % avance planificado
}

export const SCurveAndGauges: React.FC<SCurveAndGaugesProps> = ({
  projects,
  clients,
  users,
  currentUser
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [timeHorizon, setTimeHorizon] = useState<'meses' | 'fases'>('fases');

  // Mapear tarifas de proveedores si tienen tarifas especiales
  const userRateMap = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => {
      if (u.role === 'proveedor' && u.tarifaHoraProveedor) {
        map.set(u.id, u.tarifaHoraProveedor);
      } else {
        map.set(u.id, ROLE_HOURLY_RATES[u.role] || 35.0);
      }
    });
    return map;
  }, [users]);

  // Lista de proyectos a evaluar
  const targetProjects = useMemo(() => {
    if (selectedProjectId === 'all') return projects;
    return projects.filter((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Cálculo consolidado de EVM
  const evm: EVMMetrics = useMemo(() => {
    let totalBAC = 0;
    let totalPV = 0;
    let totalEV = 0;
    let totalAC = 0;
    let weightedProgressSum = 0;
    let weightedPlannedSum = 0;

    targetProjects.forEach((p) => {
      // 1. BAC: Presupuesto total basado en OVs o totalIncome
      let bac = p.totalIncome || 0;
      if (p.ordenesVenta && p.ordenesVenta.length > 0) {
        bac = p.ordenesVenta.reduce((sum, ov) => sum + (ov.monto || 0), 0);
      }
      if (!bac) {
        bac = (p.hoursTotal || 100) * 40; // Fallback razonable
      }
      totalBAC += bac;

      // 2. Avance físico real (EV %): checklists completadas sobre total de pasos
      const allPhases = p.phases || [];
      let totalTasks = 0;
      let completedTasks = 0;
      let completedPhases = 0;

      allPhases.forEach((phase) => {
        if (phase.status === 'completed') completedPhases++;
        const cl = phase.checklist || [];
        totalTasks += cl.length;
        completedTasks += cl.filter((item) => item.completed).length;
      });

      const actualProgress = totalTasks > 0
        ? completedTasks / totalTasks
        : (allPhases.length > 0 ? completedPhases / allPhases.length : 0.5);

      // 3. Avance planificado (PV %): estimado según tiempo transcurrido o fases activas
      let plannedProgress = 0.5;
      if (p.startDate && p.endDate) {
        const start = new Date(p.startDate).getTime();
        const end = new Date(p.endDate).getTime();
        const now = Date.now();
        if (end > start) {
          plannedProgress = Math.max(0.1, Math.min(1.0, (now - start) / (end - start)));
        }
      } else {
        // Estimación por posición de fase activa
        const activeIdx = allPhases.findIndex((ph) => ph.id === p.activePhaseId);
        plannedProgress = allPhases.length > 0
          ? Math.max(0.1, Math.min(1.0, (activeIdx + 1) / allPhases.length))
          : 0.5;
      }

      const projEV = bac * actualProgress;
      const projPV = bac * plannedProgress;

      // 4. AC: Costo real incurrido en horas
      let projAC = 0;
      (p.timeEntries || []).forEach((te) => {
        const h = te.hours || 0;
        let rate = ROLE_HOURLY_RATES[te.role] || 35.0;
        if (te.role === 'proveedor') {
          const custom = userRateMap.get(te.userId);
          if (custom) rate = custom;
        }
        projAC += h * rate;
      });

      // Si no tiene registros de tiempo pero tiene presupuesto consumido
      if (projAC === 0 && p.budget) {
        Object.keys(p.budget).forEach((rk) => {
          const r = rk as any;
          const consumed = p.budget[r]?.consumed || 0;
          const rate = ROLE_HOURLY_RATES[r] || 35.0;
          projAC += consumed * rate;
        });
      }

      totalEV += projEV;
      totalPV += projPV;
      totalAC += projAC;
      weightedProgressSum += actualProgress * bac;
      weightedPlannedSum += plannedProgress * bac;
    });

    const safeBAC = totalBAC || 10000;
    const safeAC = totalAC || 1;
    const safePV = totalPV || 1;

    const cv = totalEV - totalAC;
    const sv = totalEV - totalPV;
    const cpi = totalAC > 0 ? totalEV / totalAC : 1.0;
    const spi = totalPV > 0 ? totalEV / totalPV : 1.0;
    const eac = cpi > 0 ? safeBAC / cpi : safeBAC;
    const vac = safeBAC - eac;
    const progressPct = totalBAC > 0 ? (weightedProgressSum / totalBAC) * 100 : 50;
    const plannedPct = totalBAC > 0 ? (weightedPlannedSum / totalBAC) * 100 : 50;

    return {
      bac: totalBAC,
      pv: totalPV,
      ev: totalEV,
      ac: totalAC,
      cv,
      sv,
      cpi,
      spi,
      eac,
      vac,
      progressPct,
      plannedPct
    };
  }, [targetProjects, userRateMap]);

  // Datos para la Curva S (Puntos de evolución temporal)
  const curvePoints = useMemo(() => {
    const stepsCount = 7;
    const points = [];
    const bac = evm.bac || 100000;
    const currentProgressRatio = Math.min(1, Math.max(0.1, evm.progressPct / 100));
    const currentPlannedRatio = Math.min(1, Math.max(0.1, evm.plannedPct / 100));
    const currentCost = evm.ac || 50000;

    // Hitos de la curva sigmoide estándar S = 1 / (1 + exp(-k*(x-0.5)))
    const sigmoid = (t: number) => 1 / (1 + Math.exp(-6 * (t - 0.5)));
    const sigMin = sigmoid(0);
    const sigMax = sigmoid(1);
    const normSigmoid = (t: number) => (sigmoid(t) - sigMin) / (sigMax - sigMin);

    const labels = [
      'Inicio',
      'Hito 1 (Alcance)',
      'Hito 2 (Diseño)',
      'Hito 3 (Ejecución)',
      'Fecha Actual (Hoy)',
      'Hito 4 (Validación)',
      'Cierre (Término)'
    ];

    for (let i = 0; i < stepsCount; i++) {
      const t = i / (stepsCount - 1);
      const pvVal = bac * normSigmoid(t);

      // Puntos pasados hasta el punto actual (i <= 4)
      let evVal: number | null = null;
      let acVal: number | null = null;
      let eacProjVal: number | null = null;

      if (i <= 4) {
        const ratio = i / 4;
        evVal = (evm.ev || (bac * currentProgressRatio)) * normSigmoid(ratio * currentPlannedRatio);
        if (i === 4) evVal = evm.ev;
        acVal = (currentCost) * Math.pow(ratio, 1.2);
        if (i === 4) acVal = evm.ac;
      }

      // Proyección futura (i >= 4) hacia EAC
      if (i >= 4) {
        const futureRatio = (i - 4) / (stepsCount - 1 - 4);
        eacProjVal = evm.ac + (evm.eac - evm.ac) * futureRatio;
      }

      points.push({
        label: labels[i],
        t,
        pv: Math.round(pvVal),
        ev: evVal !== null ? Math.round(evVal) : null,
        ac: acVal !== null ? Math.round(acVal) : null,
        eacProj: eacProjVal !== null ? Math.round(eacProjVal) : null
      });
    }

    return points;
  }, [evm]);

  // Dimensiones del gráfico SVG
  const svgWidth = 720;
  const svgHeight = 280;
  const padding = { top: 24, right: 36, bottom: 44, left: 70 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxY = Math.max(evm.bac * 1.25, evm.eac * 1.15, evm.ac * 1.25, 1000);

  const getX = (idx: number, total: number) => padding.left + (idx / (total - 1)) * graphWidth;
  const getY = (val: number) => padding.top + graphHeight - (val / maxY) * graphHeight;

  // Renderizador del Tacómetro / Velocímetro semicircular
  const renderSpeedometer = (
    value: number,
    title: string,
    subtitle: string,
    type: 'cpi' | 'spi'
  ) => {
    // Normalizar valor entre 0 y 2.0 (1.0 = centro/meta)
    const clampedVal = Math.max(0.4, Math.min(1.8, value));
    // Ángulo de -140° a +140°
    const angle = -140 + ((clampedVal - 0.4) / (1.8 - 0.4)) * 280;

    let statusText = 'Eficiente / Óptimo';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let needleColor = '#059669';

    if (value < 0.9) {
      statusText = type === 'cpi' ? 'Sobrecosto Crítico' : 'Retraso Crítico';
      statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
      needleColor = '#e11d48';
    } else if (value < 1.0) {
      statusText = type === 'cpi' ? 'En Tolerancia / Ajustado' : 'Leve Desviación';
      statusColor = 'text-amber-800 bg-amber-50 border-amber-200';
      needleColor = '#d97706';
    }

    return (
      <div className="bg-[#F4F5F0] p-5 rounded-3xl border border-stone-200/80 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xs">
        <div className="w-full flex items-center justify-between border-b border-stone-200/60 pb-2 mb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-700" />
            {title}
          </span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${statusColor}`}>
            {statusText}
          </span>
        </div>

        {/* Gauge SVG */}
        <div className="relative w-48 h-28 my-1 flex items-center justify-center">
          <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
            {/* Arcos de fondo (Rojo, Amarillo, Verde) */}
            {/* Zona Roja: 0.4 a 0.9 */}
            <path
              d="M 25 105 A 75 75 0 0 1 70 38"
              fill="none"
              stroke="#fca5a5"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Zona Amarilla: 0.9 a 1.05 */}
            <path
              d="M 75 35 A 75 75 0 0 1 125 35"
              fill="none"
              stroke="#fde047"
              strokeWidth="14"
            />
            {/* Zona Verde: 1.05 a 1.8 */}
            <path
              d="M 130 38 A 75 75 0 0 1 175 105"
              fill="none"
              stroke="#86efac"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Marcadores de referencia */}
            <text x="25" y="118" fontSize="9" fill="#94a3b8" textAnchor="middle" fontWeight="bold">0.4</text>
            <text x="100" y="24" fontSize="10" fill="#0f172a" textAnchor="middle" fontWeight="bold">1.0 Meta</text>
            <text x="175" y="118" fontSize="9" fill="#94a3b8" textAnchor="middle" fontWeight="bold">1.8+</text>

            {/* Aguja dinámica */}
            <g transform={`translate(100, 105) rotate(${angle})`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-62"
                stroke={needleColor}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="0" cy="0" r="7" fill={needleColor} />
              <circle cx="0" cy="0" r="3" fill="#ffffff" />
            </g>
          </svg>
        </div>

        {/* Valor numérico destacado */}
        <div className="space-y-0.5 mt-1">
          <div className="text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            {value.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 max-w-[210px] leading-tight">
            {subtitle}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="scurve-earned-value-dashboard">

      {/* BARRA SUPERIOR DE CONTROL & SELECCIÓN DE PROYECTO */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-stone-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <Activity className="w-4 h-4" />
            Earned Value Management (EVM)
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Curva S Financiera & Velocímetros de Eficiencia
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Monitoreo en tiempo real de Valor Ganado (EV), Presupuesto Planificado (PV), Costo Real (AC) y proyección final al término (EAC).
          </p>
        </div>

        {/* Selector de proyecto para análisis granular */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1 text-left">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Proyecto a Auditar
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#F4F5F0] border border-stone-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              <option value="all">Portafolio Completo ({projects.length} Proyectos)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName || 'Cliente'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* METRICAS EVM CLAVE (TARJETAS RESUMEN) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* BAC */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">BAC (Presupuesto)</span>
          <div className="text-lg font-bold font-display text-slate-900 truncate">
            ${evm.bac.toLocaleString('es-CL')}
          </div>
          <span className="text-[11px] text-slate-500">100% Contratado</span>
        </div>

        {/* PV */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">PV (Planificado)</span>
          <div className="text-lg font-bold font-display text-blue-900 truncate">
            ${evm.pv.toLocaleString('es-CL')}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">{evm.plannedPct.toFixed(1)}% programado</span>
        </div>

        {/* EV */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">EV (Valor Ganado)</span>
          <div className="text-lg font-bold font-display text-emerald-900 truncate">
            ${evm.ev.toLocaleString('es-CL')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">{evm.progressPct.toFixed(1)}% ejecutado real</span>
        </div>

        {/* AC */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AC (Costo Real)</span>
          <div className="text-lg font-bold font-display text-slate-900 truncate">
            ${evm.ac.toLocaleString('es-CL')}
          </div>
          <span className="text-[11px] text-slate-500">Horas acumuladas</span>
        </div>

        {/* CV (Variación Costo) */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          evm.cv >= 0 ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-rose-50/50 border-rose-200 text-rose-900'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider block">CV (Variación Costo)</span>
          <div className="text-lg font-bold font-display truncate">
            {evm.cv >= 0 ? `+$${evm.cv.toLocaleString('es-CL')}` : `-$${Math.abs(evm.cv).toLocaleString('es-CL')}`}
          </div>
          <span className="text-[11px] font-semibold">{evm.cv >= 0 ? 'Ahorro favorable' : 'Sobrecosto incurrido'}</span>
        </div>

        {/* EAC (Proyección Término) */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">EAC (Costo Proyectado)</span>
          <div className="text-lg font-bold font-display text-purple-900 truncate">
            ${evm.eac.toLocaleString('es-CL')}
          </div>
          <span className="text-[11px] text-purple-600 font-semibold">
            {evm.vac >= 0 ? `Margen seguro +$${Math.round(evm.vac).toLocaleString('es-CL')}` : `Riesgo desborde -$${Math.round(Math.abs(evm.vac)).toLocaleString('es-CL')}`}
          </span>
        </div>
      </div>

      {/* SECCIÓN INTERMEDIA: GRÁFICO CURVA S + VELOCÍMETROS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* GRÁFICO SVG CURVA S FINANCIERA (8 COLS) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-stone-200/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Curva S de Desempeño Acumulado
              </h3>
              <p className="text-xs text-slate-500">
                Comparación temporal entre Planificado (PV), Valor Ganado (EV) y Costo Real (AC).
              </p>
            </div>

            {/* LEYENDA INTERACTIVA */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-3 h-1 bg-blue-600 rounded-full inline-block border-b-2 border-dotted border-blue-600"></span> PV Planificado
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-2 bg-emerald-500 rounded-sm inline-block"></span> EV Ganado
              </span>
              <span className="flex items-center gap-1.5 text-slate-800">
                <span className="w-3 h-2 bg-slate-900 rounded-sm inline-block"></span> AC Costo Real
              </span>
              <span className="flex items-center gap-1.5 text-purple-700">
                <span className="w-3 h-1 bg-purple-500 border-t-2 border-dashed border-purple-500 inline-block"></span> Proyección EAC
              </span>
            </div>
          </div>

          {/* CONTENEDOR SVG CON ESCALABILIDAD RESPONSIVA */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[560px]"
            >
              {/* Grilla horizontal de fondo */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const yPos = padding.top + graphHeight * (1 - pct);
                const val = Math.round(maxY * pct);
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={yPos}
                      x2={padding.left + graphWidth}
                      y2={yPos}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={yPos + 4}
                      fontSize="10"
                      fill="#94a3b8"
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Línea vertical de Fecha Actual (Hoy) */}
              <line
                x1={getX(4, curvePoints.length)}
                y1={padding.top}
                x2={getX(4, curvePoints.length)}
                y2={padding.top + graphHeight}
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <text
                x={getX(4, curvePoints.length)}
                y={padding.top - 8}
                fontSize="10"
                fill="#4f46e5"
                textAnchor="middle"
                fontWeight="extrabold"
              >
                ● Fecha Actual
              </text>

              {/* 1. CURVA PV (Planificado) - Azul discontinua */}
              <path
                d={curvePoints
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx, curvePoints.length)} ${getY(p.pv)}`)
                  .join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* 2. CURVA PROYECCIÓN EAC - Púrpura punteada (desde Hoy a Cierre) */}
              <path
                d={`M ${getX(4, curvePoints.length)} ${getY(curvePoints[4].ac || 0)} L ${getX(5, curvePoints.length)} ${getY(curvePoints[5].eacProj || 0)} L ${getX(6, curvePoints.length)} ${getY(curvePoints[6].eacProj || 0)}`}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />

              {/* 3. CURVA EV (Valor Ganado) - Verde sólida */}
              <path
                d={curvePoints
                  .filter((p) => p.ev !== null)
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx, curvePoints.length)} ${getY(p.ev!)}`)
                  .join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* 4. CURVA AC (Costo Real) - Slate sólida */}
              <path
                d={curvePoints
                  .filter((p) => p.ac !== null)
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx, curvePoints.length)} ${getY(p.ac!)}`)
                  .join(' ')}
                fill="none"
                stroke="#0f172a"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Puntos y Nodos */}
              {curvePoints.map((p, idx) => {
                const cx = getX(idx, curvePoints.length);
                return (
                  <g key={idx}>
                    {/* PV Dot */}
                    <circle cx={cx} cy={getY(p.pv)} r="3" fill="#3b82f6" />

                    {/* EV Dot */}
                    {p.ev !== null && (
                      <circle cx={cx} cy={getY(p.ev)} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    )}

                    {/* AC Dot */}
                    {p.ac !== null && (
                      <circle cx={cx} cy={getY(p.ac)} r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                    )}

                    {/* EAC Dot */}
                    {p.eacProj !== null && idx > 4 && (
                      <circle cx={cx} cy={getY(p.eacProj)} r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                    )}

                    {/* Label Eje X */}
                    <text
                      x={cx}
                      y={padding.top + graphHeight + 18}
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="middle"
                      fontWeight={idx === 4 ? 'bold' : 'normal'}
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Diagnóstico Ejecutivo al pie del gráfico */}
          <div className="bg-[#F4F5F0] p-4 rounded-2xl flex items-start gap-3 text-xs border border-stone-200/60">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-slate-900 font-bold">Diagnóstico Ejecutivo de Curva S:</strong>
              <p className="text-slate-600 leading-relaxed">
                {evm.cpi >= 1.0 && evm.spi >= 1.0 && (
                  <span>
                    El portafolio se encuentra en <strong className="text-emerald-700">zona óptima de control</strong>: se está entregando mayor valor físico que el costo consumido (CPI: {evm.cpi.toFixed(2)}) y a un ritmo alineado con el cronograma planificado (SPI: {evm.spi.toFixed(2)}).
                  </span>
                )}
                {evm.cpi < 1.0 && evm.spi >= 1.0 && (
                  <span>
                    Existe <strong className="text-rose-700">sobrecosto operativo</strong> (CPI: {evm.cpi.toFixed(2)}). Aunque el proyecto avanza en tiempo, el costo real incurrido supera el valor ganado de las entregas. Se proyecta un costo final de ${evm.eac.toLocaleString('es-CL')}.
                  </span>
                )}
                {evm.cpi >= 1.0 && evm.spi < 1.0 && (
                  <span>
                    El proyecto es <strong className="text-emerald-700">eficiente en costos</strong> (CPI: {evm.cpi.toFixed(2)}) pero presenta <strong className="text-amber-700">retraso en el cronograma</strong> (SPI: {evm.spi.toFixed(2)}). Se recomienda acelerar revisiones y aprobación de hitos.
                  </span>
                )}
                {evm.cpi < 1.0 && evm.spi < 1.0 && (
                  <span>
                    <strong className="text-rose-700">Alerta crítica de doble desvío:</strong> sobrecosto (CPI: {evm.cpi.toFixed(2)}) y retraso de cronograma (SPI: {evm.spi.toFixed(2)}). Se proyecta un desborde presupuestario de ${Math.round(Math.abs(evm.vac)).toLocaleString('es-CL')}.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* VELOCÍMETROS / TACÓMETROS (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          {/* Velocímetro 1: CPI */}
          {renderSpeedometer(
            evm.cpi,
            'Velocímetro CPI (Eficiencia Costo)',
            evm.cpi >= 1.0
              ? `Generando $${evm.cpi.toFixed(2)} de valor por cada $1 invertido.`
              : `Consumiendo más presupuesto del avance entregado ($${(1 / (evm.cpi || 1)).toFixed(2)} por $1 valor).`,
            'cpi'
          )}

          {/* Velocímetro 2: SPI */}
          {renderSpeedometer(
            evm.spi,
            'Velocímetro SPI (Eficiencia Cronograma)',
            evm.spi >= 1.0
              ? `Avanzando a un ${(evm.spi * 100).toFixed(0)}% del ritmo previsto.`
              : `Progreso al ${(evm.spi * 100).toFixed(0)}% del plan. Riesgo de retraso.`,
            'spi'
          )}
        </div>
      </div>
    </div>
  );
};
