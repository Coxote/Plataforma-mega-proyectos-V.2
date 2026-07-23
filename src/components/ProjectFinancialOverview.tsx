import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Activity 
} from 'lucide-react';
import { Project, ROLE_HOURLY_RATES, Role } from '../types';

interface ProjectFinancialOverviewProps {
  project: Project;
}

export const ProjectFinancialOverview: React.FC<ProjectFinancialOverviewProps> = ({ project }) => {
  // Extract or calculate hours sold (allocated) and hours consumed per role
  const stats = useMemo(() => {
    const roles: Role[] = ['coordinador', 'sac', 'contents', 'contentd'];
    
    // Get sold hours from project.roleHours or fallback to project.budget allocated
    const hoursSold = {
      coordinador: project.roleHours?.coordinador ?? project.budget?.coordinador?.allocated ?? 0,
      sac: project.roleHours?.sac ?? project.budget?.sac?.allocated ?? 0,
      contents: project.roleHours?.contents ?? project.budget?.contents?.allocated ?? 0,
      contentd: project.roleHours?.contentd ?? project.budget?.contentd?.allocated ?? 0,
    };

    // Get consumed hours from project.budget consumed
    const hoursConsumed = {
      coordinador: project.budget?.coordinador?.consumed ?? 0,
      sac: project.budget?.sac?.consumed ?? 0,
      contents: project.budget?.contents?.consumed ?? 0,
      contentd: project.budget?.contentd?.consumed ?? 0,
    };

    const totalHoursSold = Object.values(hoursSold).reduce((sum, h) => sum + h, 0);
    const totalHoursConsumed = Object.values(hoursConsumed).reduce((sum, h) => sum + h, 0);

    // Cost calculations
    const costSold = roles.reduce((sum, role) => sum + (hoursSold[role] * ROLE_HOURLY_RATES[role]), 0);
    const costConsumed = roles.reduce((sum, role) => sum + (hoursConsumed[role] * ROLE_HOURLY_RATES[role]), 0);

    // Income
    const income = project.totalIncome || costSold || 1000; // fallback to costSold if no income is set
    const profitEstimated = income - costSold;
    const profitReal = income - costConsumed;

    const marginPercentage = income > 0 ? (profitReal / income) * 100 : 0;
    const hourConsumptionRate = totalHoursSold > 0 ? (totalHoursConsumed / totalHoursSold) * 100 : 0;

    // Transform roles for chart data
    const chartData = [
      {
        name: 'Coordinador',
        roleKey: 'coordinador',
        'Horas Vendidas': hoursSold.coordinador,
        'Horas Consumidas': hoursConsumed.coordinador,
        costSold: hoursSold.coordinador * ROLE_HOURLY_RATES.coordinador,
        costConsumed: hoursConsumed.coordinador * ROLE_HOURLY_RATES.coordinador,
        rate: ROLE_HOURLY_RATES.coordinador,
      },
      {
        name: 'SAC (Cuentas)',
        roleKey: 'sac',
        'Horas Vendidas': hoursSold.sac,
        'Horas Consumidas': hoursConsumed.sac,
        costSold: hoursSold.sac * ROLE_HOURLY_RATES.sac,
        costConsumed: hoursConsumed.sac * ROLE_HOURLY_RATES.sac,
        rate: ROLE_HOURLY_RATES.sac,
      },
      {
        name: 'Contents',
        roleKey: 'contents',
        'Horas Vendidas': hoursSold.contents,
        'Horas Consumidas': hoursConsumed.contents,
        costSold: hoursSold.contents * ROLE_HOURLY_RATES.contents,
        costConsumed: hoursConsumed.contents * ROLE_HOURLY_RATES.contents,
        rate: ROLE_HOURLY_RATES.contents,
      },
      {
        name: 'ContentD (Diseño)',
        roleKey: 'contentd',
        'Horas Vendidas': hoursSold.contentd,
        'Horas Consumidas': hoursConsumed.contentd,
        costSold: hoursSold.contentd * ROLE_HOURLY_RATES.contentd,
        costConsumed: hoursConsumed.contentd * ROLE_HOURLY_RATES.contentd,
        rate: ROLE_HOURLY_RATES.contentd,
      }
    ];

    return {
      hoursSold,
      hoursConsumed,
      totalHoursSold,
      totalHoursConsumed,
      costSold,
      costConsumed,
      income,
      profitReal,
      marginPercentage,
      hourConsumptionRate,
      chartData,
    };
  }, [project]);

  // Determine financial status indicators
  const marginIsHealthy = stats.marginPercentage >= 35;
  const isOverBudget = stats.totalHoursConsumed > stats.totalHoursSold;

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs shadow-lg space-y-1" id="chart-tooltip">
          <p className="font-bold text-slate-200">{label}</p>
          <div className="flex justify-between gap-6">
            <span className="text-indigo-300">Planificadas:</span>
            <span className="font-mono font-bold">{data['Horas Vendidas']}h</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-emerald-300">Consumidas:</span>
            <span className="font-mono font-bold">{data['Horas Consumidas']}h</span>
          </div>
          <div className="border-t border-slate-800 my-1 pt-1 flex justify-between gap-6 text-[10px] text-slate-400">
            <span>Costo Consumido:</span>
            <span className="font-mono">${data.costConsumed.toLocaleString('es-CL', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" id="project-financial-overview">
      {/* 1. TOP METRICS BLOCK (Flattened Hierarchy, No nested cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="financial-income">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ingreso de Venta (OV)</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-950 font-mono">
              ${stats.income.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Orden de Venta: <span className="text-slate-700 font-bold">{project.ovNumber || project.saleOrderNumber || 'No registrada'}</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Operational Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="financial-cost">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo Operativo Real</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-950 font-mono">
              ${stats.costConsumed.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Presupuesto máximo: <span className="text-slate-700 font-bold">${stats.costSold.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Profit Margin */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-colors ${
          marginIsHealthy 
            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' 
            : 'bg-rose-50/50 border-rose-100 text-rose-950'
        }`} id="financial-margin">
          <div className="flex justify-between items-start">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${marginIsHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>
              Margen de Rentabilidad
            </span>
            {marginIsHealthy ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-black font-mono ${marginIsHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>
              {stats.marginPercentage.toFixed(1)}%
            </div>
            <p className={`text-[10px] font-semibold mt-1 ${marginIsHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
              Utilidad neta: <span className="font-bold">${stats.profitReal.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Hours Progress */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-colors ${
          isOverBudget 
            ? 'bg-amber-50/60 border-amber-200 text-amber-950' 
            : 'bg-white border-slate-200'
        }`} id="financial-hours">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Esfuerzo Consumido</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-950 font-mono">
              {stats.totalHoursConsumed.toFixed(1)}h
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              De <span className="text-slate-700 font-bold">{stats.totalHoursSold}h vendidas</span> ({stats.hourConsumptionRate.toFixed(0)}%)
            </p>
          </div>
        </div>
      </div>

      {/* 2. BAR CHART & DETAILED ROLES GRID (Grid split) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Chart Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[360px]" id="financial-chart-panel">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Comparativa de Horas por Rol
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Análisis visual entre las horas vendidas al cliente vs. las horas consumidas por cada rol operativo.
            </p>
          </div>

          <div className="h-64 mt-4 w-full" id="recharts-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  height={36} 
                  iconSize={10} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="Horas Vendidas" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32}
                />
                <Bar 
                  dataKey="Horas Consumidas" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Status Panel: Roles List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="financial-roles-panel">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Desglose Operativo
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Rendimiento de horas y costo real acumulado por cada perfil.
              </p>
            </div>

            <div className="divide-y divide-slate-100 space-y-3 pt-2">
              {stats.chartData.map((data) => {
                const sold = data['Horas Vendidas'];
                const cons = data['Horas Consumidas'];
                const ratio = sold > 0 ? (cons / sold) * 100 : 0;
                
                // Alert styles per role
                let pillStyle = 'bg-slate-100 text-slate-800';
                let pillLabel = 'Sin horas';
                if (sold > 0) {
                  if (ratio > 100) {
                    pillStyle = 'bg-rose-50 text-rose-700 border-rose-100';
                    pillLabel = 'Excedido';
                  } else if (ratio >= 85) {
                    pillStyle = 'bg-amber-50 text-amber-700 border-amber-100';
                    pillLabel = 'Límite';
                  } else {
                    pillStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    pillLabel = 'Eficiente';
                  }
                }

                return (
                  <div key={data.roleKey} className="pt-3 flex flex-col gap-2" id={`role-stat-${data.roleKey}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">{data.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${pillStyle}`}>
                        {pillLabel}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <div>
                        <span className="font-mono font-bold text-slate-700">{cons}h</span> / <span className="font-semibold">{sold}h</span>
                      </div>
                      <div className="font-mono font-semibold">
                        Costo: <span className="font-bold text-slate-800">${data.costConsumed.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    {/* Miniature horizontal bar progress */}
                    {sold > 0 && (
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            ratio > 100 ? 'bg-rose-500' : ratio >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(ratio, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Callout under roles list */}
          <div className="pt-4 border-t border-slate-100 mt-4">
            {isOverBudget ? (
              <div className="flex items-start gap-2.5 text-xs bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200" id="hours-overrun-warning">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-semibold leading-relaxed">
                  <strong className="font-bold">Desviación detectada:</strong> El consumo de horas operativas ha superado las horas vendidas. El margen del proyecto se reducirá de forma directa.
                </p>
              </div>
            ) : stats.hourConsumptionRate >= 80 ? (
              <div className="flex items-start gap-2.5 text-xs bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200" id="hours-warning">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-semibold leading-relaxed">
                  <strong className="font-bold">Consumo Próximo al Límite:</strong> Has consumido el {stats.hourConsumptionRate.toFixed(0)}% del total vendido. Revisa el alcance con SAC antes de cargar más horas.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200" id="hours-healthy-info">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-semibold leading-relaxed">
                  <strong className="font-bold">Mapeo de Horas Saludable:</strong> El consumo de horas de los roles se encuentra dentro del margen de rentabilidad estipulado de forma segura.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
