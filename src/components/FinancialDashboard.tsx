import React, { useState, useMemo } from 'react';
import { Project, Client, UserSession, ROLE_HOURLY_RATES, ROLE_LABELS, OrdenVenta, TimeEntry } from '../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Receipt,
  Users,
  PieChart,
  BarChart3,
  Filter,
  Search,
  Building2,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  FileText,
  ChevronRight,
  X,
  Download,
  Calculator,
  Sliders,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Layers,
  Zap
} from 'lucide-react';
import { StatBar } from './StatBar';
import { EmptyState } from './EmptyState';
import { ui } from '../theme';

interface FinancialDashboardProps {
  projects: Project[];
  clients: Client[];
  users: UserSession[];
  currentUser: UserSession;
}

interface ProjectFinancialData {
  project: Project;
  clientName: string;
  totalIncome: number;
  ovs: OrdenesVentaHelper[];
  totalHoursSold: number;
  totalHoursConsumed: number;
  reworkHours: number;
  normalHours: number;
  totalCost: number;
  internalTeamCost: number;
  providerCost: number;
  reworkCost: number;
  marginAmount: number;
  marginPercent: number;
  hourlyRateReal: number;
  healthScore: 'optimo' | 'observacion' | 'critico';
  riskFactors: string[];
}

interface OrdenesVentaHelper {
  id: string;
  numero: string;
  monto: number;
  moneda: string;
  horasAsociadas: number;
  fechaEmision: string;
  estado: string;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  projects,
  clients,
  users,
  currentUser
}) => {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'optimo' | 'observacion' | 'critico'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProjectForAudit, setSelectedProjectForAudit] = useState<ProjectFinancialData | null>(null);
  const [sortBy, setSortBy] = useState<'marginAmount' | 'marginPercent' | 'totalIncome' | 'reworkCost'>('marginAmount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Map users list to get custom rates if any (e.g. providers)
  const userRateMap = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach(u => {
      if (u.role === 'proveedor' && u.tarifaHoraProveedor) {
        map.set(u.id, u.tarifaHoraProveedor);
      } else {
        map.set(u.id, ROLE_HOURLY_RATES[u.role] || 35.00);
      }
    });
    return map;
  }, [users]);

  // Compute comprehensive financial analysis for each project
  const analyzedProjects: ProjectFinancialData[] = useMemo(() => {
    return projects.map(p => {
      // 1. OVs & Total Income
      let ovs: OrdenesVentaHelper[] = [];
      if (p.ordenesVenta && p.ordenesVenta.length > 0) {
        ovs = p.ordenesVenta;
      } else if (p.ovNumber || p.saleOrderNumber || p.totalIncome) {
        ovs = [{
          id: `ov-${p.id}`,
          numero: String(p.saleOrderNumber || p.ovNumber || `OV-${p.id.toUpperCase()}-101`),
          monto: p.totalIncome || (p.hoursTotal ? p.hoursTotal * 40 : 0),
          moneda: p.currency || 'USD',
          horasAsociadas: p.hoursTotal || p.hoursSold || 0,
          fechaEmision: p.createdAt ? p.createdAt.split('T')[0] : '2026-07-15',
          estado: 'facturada'
        }];
      }

      const totalIncome = ovs.length > 0
        ? ovs.reduce((sum, ov) => sum + (ov.monto || 0), 0)
        : (p.totalIncome || (p.hoursTotal ? p.hoursTotal * 40 : 0));

      const totalHoursSold = ovs.length > 0
        ? ovs.reduce((sum, ov) => sum + (ov.horasAsociadas || 0), 0)
        : (p.hoursTotal || 0);

      // 2. Compute Costs from TimeEntries
      const entries = p.timeEntries || [];
      let internalTeamCost = 0;
      let providerCost = 0;
      let reworkCost = 0;
      let totalHoursConsumed = 0;
      let reworkHours = 0;
      let normalHours = 0;

      entries.forEach(te => {
        const hours = te.hours || 0;
        totalHoursConsumed += hours;

        if (te.type === 'retrabajo') {
          reworkHours += hours;
        } else {
          normalHours += hours;
        }

        // Calculate cost per entry
        let rate = ROLE_HOURLY_RATES[te.role] || 35.00;
        if (te.role === 'proveedor') {
          const customRate = userRateMap.get(te.userId);
          if (customRate) rate = customRate;
        }

        const entryCost = hours * rate;

        if (te.role === 'proveedor') {
          providerCost += entryCost;
        } else {
          internalTeamCost += entryCost;
        }

        if (te.type === 'retrabajo') {
          reworkCost += entryCost;
        }
      });

      const totalCost = internalTeamCost + providerCost;
      const marginAmount = totalIncome - totalCost;
      const marginPercent = totalIncome > 0 ? (marginAmount / totalIncome) * 100 : 0;
      const hourlyRateReal = totalHoursConsumed > 0 ? totalIncome / totalHoursConsumed : 0;

      // 3. Health & Risk Assessment
      const riskFactors: string[] = [];
      if (marginPercent < 15) {
        riskFactors.push('Margen operativo por debajo del umbral mínimo (15%)');
      }
      if (reworkHours > 0 && (reworkHours / (totalHoursConsumed || 1)) > 0.15) {
        riskFactors.push('Elevado porcentaje de horas perdidas en retrabajo (>15%)');
      }
      if (totalHoursConsumed > totalHoursSold && totalHoursSold > 0) {
        riskFactors.push('Exceso de horas consumidas sobre horas vendidas en OVs');
      }
      if (totalCost > totalIncome * 0.85 && totalIncome > 0) {
        riskFactors.push('Costo acumulado supera el 85% del ingreso contratado');
      }

      let healthScore: 'optimo' | 'observacion' | 'critico' = 'optimo';
      if (riskFactors.length >= 2 || marginPercent < 10) {
        healthScore = 'critico';
      } else if (riskFactors.length === 1 || marginPercent < 25) {
        healthScore = 'observacion';
      }

      return {
        project: p,
        clientName: p.clientName || 'Cliente No Asignado',
        totalIncome,
        ovs,
        totalHoursSold,
        totalHoursConsumed,
        reworkHours,
        normalHours,
        totalCost,
        internalTeamCost,
        providerCost,
        reworkCost,
        marginAmount,
        marginPercent,
        hourlyRateReal,
        healthScore,
        riskFactors
      };
    });
  }, [projects, userRateMap]);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    return analyzedProjects.filter(pData => {
      // Client filter
      if (selectedClient !== 'all' && pData.clientName.toLowerCase() !== selectedClient.toLowerCase()) {
        return false;
      }
      // Health filter
      if (healthFilter !== 'all' && pData.healthScore !== healthFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = pData.project.name.toLowerCase().includes(q);
        const matchesClient = pData.clientName.toLowerCase().includes(q);
        const matchesOv = pData.ovs.some(ov => ov.numero.toLowerCase().includes(q));
        if (!matchesName && !matchesClient && !matchesOv) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
      return 0;
    });
  }, [analyzedProjects, selectedClient, healthFilter, searchQuery, sortBy, sortOrder]);

  // Consolidated Top Level Financial Metrics
  const globalMetrics = useMemo(() => {
    const totalIncome = analyzedProjects.reduce((sum, p) => sum + p.totalIncome, 0);
    const totalCost = analyzedProjects.reduce((sum, p) => sum + p.totalCost, 0);
    const internalCost = analyzedProjects.reduce((sum, p) => sum + p.internalTeamCost, 0);
    const providerCost = analyzedProjects.reduce((sum, p) => sum + p.providerCost, 0);
    const reworkCost = analyzedProjects.reduce((sum, p) => sum + p.reworkCost, 0);
    const marginAmount = totalIncome - totalCost;
    const marginPercent = totalIncome > 0 ? (marginAmount / totalIncome) * 100 : 0;

    const totalHoursSold = analyzedProjects.reduce((sum, p) => sum + p.totalHoursSold, 0);
    const totalHoursConsumed = analyzedProjects.reduce((sum, p) => sum + p.totalHoursConsumed, 0);
    const totalReworkHours = analyzedProjects.reduce((sum, p) => sum + p.reworkHours, 0);

    const criticalCount = analyzedProjects.filter(p => p.healthScore === 'critico').length;
    const observationCount = analyzedProjects.filter(p => p.healthScore === 'observacion').length;
    const optimoCount = analyzedProjects.filter(p => p.healthScore === 'optimo').length;

    return {
      totalIncome,
      totalCost,
      internalCost,
      providerCost,
      reworkCost,
      marginAmount,
      marginPercent,
      totalHoursSold,
      totalHoursConsumed,
      totalReworkHours,
      criticalCount,
      observationCount,
      optimoCount
    };
  }, [analyzedProjects]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F5F0] overflow-y-auto" id="financial-health-dashboard">

      {/* HEADER SUPERIOR */}
      <div className="px-8 py-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-slate-800 text-xs font-semibold uppercase tracking-widest mb-1">
            <DollarSign className="w-4 h-4 text-slate-800" />
            Módulo de Control Financiero & Rentabilidad
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Salud Financiera de Proyectos</h1>
          <p className="text-xs text-slate-500 font-normal">
            Supervisión ejecutiva de ingresos por OVs, costo real incurrido, margen de ganancia e impacto por retrabajo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F4F5F0] rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-slate-800 flex items-center justify-center font-semibold text-xs shadow-2xs">
              <Calculator className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margen Consolidado</div>
              <div className="text-2xl font-semibold text-slate-900 font-display">
                {globalMetrics.marginPercent.toFixed(1)}% <span className="text-xs text-slate-500 font-normal">(${globalMetrics.marginAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

        {/* NIVEL 1: BANDA DE ESTADO FINANCIERA (StatBar) */}
        <StatBar
          stats={[
            {
              id: 'fin-income',
              label: 'Ingresos Totales (OVs)',
              value: `$${globalMetrics.totalIncome.toLocaleString('es-ES')}`,
              subValue: `${globalMetrics.totalHoursSold} hrs vendidas`,
              icon: Receipt,
              status: 'neutral'
            },
            {
              id: 'fin-cost',
              label: 'Costo Operativo Real',
              value: `$${globalMetrics.totalCost.toLocaleString('es-ES')}`,
              subValue: `${globalMetrics.totalHoursConsumed} hrs ejecutadas`,
              icon: BarChart3,
              status: 'neutral'
            },
            {
              id: 'fin-margin',
              label: 'Margen Operativo Bruto',
              value: `$${globalMetrics.marginAmount.toLocaleString('es-ES')}`,
              subValue: `Margen: ${globalMetrics.marginPercent.toFixed(1)}% (Meta ≥ 30%)`,
              trend: {
                value: `${globalMetrics.marginPercent.toFixed(1)}%`,
                isPositive: globalMetrics.marginPercent >= 30
              },
              icon: TrendingUp,
              status: 'neutral'
            },
            {
              id: 'fin-rework',
              label: 'Pérdida por Retrabajo',
              value: `$${globalMetrics.reworkCost.toLocaleString('es-ES')}`,
              subValue: `${globalMetrics.totalReworkHours} hrs retrabajo`,
              icon: ShieldAlert,
              status: 'neutral'
            },
            {
              id: 'fin-health',
              label: 'Salud de Portafolio',
              value: `${globalMetrics.optimoCount} Óptimos`,
              subValue: `${globalMetrics.criticalCount} críticos · ${globalMetrics.observationCount} en obs.`,
              icon: Briefcase,
              status: 'neutral'
            }
          ]}
        />

        {/* GRAFICOS VISUALES & ESTRUCTURA DE COSTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* BARS: INGRESO VS COSTO POR PROYECTO */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-800" />
                  Comparativo Ingreso vs. Costo Incurrido por Proyecto
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">Visión rápida de facturación en OVs frente a costo total de horas trabajadas.</p>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-slate-900 block"></span> Ingreso
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-stone-300 block"></span> Costo
                </span>
              </div>
            </div>

            {/* BARS LIST */}
            <div className="space-y-4 pt-2">
              {analyzedProjects.slice(0, 6).map(pData => {
                const maxVal = Math.max(pData.totalIncome, pData.totalCost, 1000);
                const incomeWidth = Math.min((pData.totalIncome / maxVal) * 100, 100);
                const costWidth = Math.min((pData.totalCost / maxVal) * 100, 100);

                return (
                  <div key={pData.project.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-[280px]">{pData.project.name}</span>
                        <span className="text-xs text-slate-400 font-normal">({pData.clientName})</span>
                      </div>
                      <div className="font-display text-xs">
                        <span className="text-slate-900 font-semibold">${pData.totalIncome.toLocaleString('es-ES')}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-slate-500 font-normal">${pData.totalCost.toLocaleString('es-ES')}</span>
                      </div>
                    </div>

                    {/* DUAL BAR */}
                    <div className="space-y-1 bg-[#F4F5F0] p-1.5 rounded-2xl">
                      {/* BAR 1: INGRESO */}
                      <div className="h-2 bg-stone-200 rounded-full overflow-hidden w-full relative">
                        <div
                          className="h-full bg-slate-900 rounded-full transition-all duration-500"
                          style={{ width: `${incomeWidth}%` }}
                        />
                      </div>
                      {/* BAR 2: COSTO */}
                      <div className="h-2 bg-stone-200 rounded-full overflow-hidden w-full relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pData.totalCost > pData.totalIncome ? 'bg-rose-500' : 'bg-stone-400'
                          }`}
                          style={{ width: `${costWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PIE / BREAKDOWN: DESGLOSE DE COSTOS */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-slate-800" />
                  Estructura de Costos del Negocio
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">Distribución del gasto total acumulado en la operación.</p>
              </div>

              <div className="space-y-4 pt-5">
                {/* INTERNO */}
                <div className="p-4 rounded-2xl bg-[#F4F5F0] space-y-1">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-800" /> Costo Equipo Interno
                    </span>
                    <span className="font-display text-slate-900 font-semibold">${globalMetrics.internalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-normal">
                    {globalMetrics.totalCost > 0 ? ((globalMetrics.internalCost / globalMetrics.totalCost) * 100).toFixed(1) : 0}% del costo total
                  </div>
                </div>

                {/* PROVEEDORES */}
                <div className="p-4 rounded-2xl bg-[#F4F5F0] space-y-1">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-slate-800" /> Costo Proveedores Externos
                    </span>
                    <span className="font-display text-slate-900 font-semibold">${globalMetrics.providerCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-normal">
                    {globalMetrics.totalCost > 0 ? ((globalMetrics.providerCost / globalMetrics.totalCost) * 100).toFixed(1) : 0}% del costo total
                  </div>
                </div>

                {/* RETRABAJO */}
                <div className="p-4 rounded-2xl bg-[#F4F5F0] space-y-1">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-800" /> Pérdida por Retrabajo
                    </span>
                    <span className="font-display text-slate-900 font-semibold">${globalMetrics.reworkCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-normal">
                    {globalMetrics.totalCost > 0 ? ((globalMetrics.reworkCost / globalMetrics.totalCost) * 100).toFixed(1) : 0}% del costo total absorbido
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 text-xs text-slate-500 font-normal text-center">
              💡 <strong className="text-slate-800 font-semibold">Recomendación:</strong> Reducir el retrabajo en 50% incrementaría la utilidad neta en <strong className="text-slate-900 font-semibold font-display">${(globalMetrics.reworkCost * 0.5).toLocaleString('es-ES')}</strong>.
            </div>
          </div>

        </div>

        {/* TABLA PRINCIPAL DE SALUD FINANCIERA POR PROYECTO */}
        <div className="bg-white rounded-3xl shadow-xs overflow-hidden space-y-0">

          {/* CONTROLES Y FILTROS TABLA */}
          <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F4F5F0]/50">
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Tabla de Auditoría Financiera de Proyectos</h3>
              <p className="text-xs text-slate-500 font-normal">Desglose individual de margen operativo, OVs vinculadas y alertas de salud financiera.</p>
            </div>

            {/* FILTROS */}
            <div className="flex flex-wrap items-center gap-3">

              {/* SEARCH */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por proyecto, cliente u OV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-white rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 w-48 sm:w-60 shadow-2xs"
                />
              </div>

              {/* CLIENT FILTER */}
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 py-2 bg-white rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
              >
                <option value="all">Todos los Clientes</option>
                {clients.map(c => (
                  <option key={c.id} value={c.nombreComercial}>{c.nombreComercial}</option>
                ))}
              </select>

              {/* HEALTH FILTER */}
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value as any)}
                className="px-3 py-2 bg-white rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
              >
                <option value="all">Cualquier Salud</option>
                <option value="optimo">Salud Óptima</option>
                <option value="observacion">En Observación</option>
                <option value="critico">Crítico / Riesgo</option>
              </select>
            </div>
          </div>

          {/* TABLA DATA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F5F0] text-slate-600 font-semibold uppercase tracking-wider text-xs border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-6">Proyecto & Cliente</th>
                  <th className="py-3.5 px-4 text-center">OVs Registradas</th>
                  <th className="py-3.5 px-4 text-right">Ingreso OVs ($)</th>
                  <th className="py-3.5 px-4 text-center">Horas Vend. / Incur.</th>
                  <th className="py-3.5 px-4 text-right">Costo Total ($)</th>
                  <th className="py-3.5 px-4 text-right">Margen Bruto ($)</th>
                  <th className="py-3.5 px-4 text-center">Margen %</th>
                  <th className="py-3.5 px-4 text-center">Salud Financiera</th>
                  <th className="py-3.5 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-normal">
                      No se encontraron proyectos con los criterios de búsqueda seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(pData => {
                    const healthBadge = {
                      optimo: { bg: 'bg-emerald-50 text-emerald-700', label: 'Óptimo', dot: 'bg-emerald-500' },
                      observacion: { bg: 'bg-amber-50 text-amber-700', label: 'En Observación', dot: 'bg-amber-500' },
                      critico: { bg: 'bg-red-50 text-red-700', label: 'Crítico', dot: 'bg-red-500' }
                    }[pData.healthScore];

                    return (
                      <tr key={pData.project.id} className="hover:bg-[#F4F5F0]/60 transition-colors">

                        {/* PROYECTO & CLIENTE */}
                        <td className="py-4 px-6 space-y-0.5">
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                            <span>{pData.project.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-normal flex items-center gap-2">
                            <span className="text-slate-600 font-medium">{pData.clientName}</span>
                            <span>•</span>
                            <span className="font-mono">ID: {pData.project.id}</span>
                          </div>
                        </td>

                        {/* OVs REGISTRADAS */}
                        <td className="py-4 px-4 text-center">
                          <span className="bg-[#F4F5F0] text-slate-700 font-medium px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                            <Receipt className="w-3 h-3 text-slate-800" />
                            {pData.ovs.length} {pData.ovs.length === 1 ? 'OV' : 'OVs'}
                          </span>
                        </td>

                        {/* INGRESO OVs */}
                        <td className="py-4 px-4 text-right font-display font-semibold text-slate-900">
                          ${pData.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>

                        {/* HORAS VENDIDAS / INCURRIDAS */}
                        <td className="py-4 px-4 text-center font-display text-xs">
                          <span className="text-slate-800 font-medium">{pData.totalHoursSold}h</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className={`font-semibold ${pData.totalHoursConsumed > pData.totalHoursSold && pData.totalHoursSold > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {pData.totalHoursConsumed}h
                          </span>
                          {pData.reworkHours > 0 && (
                            <div className="text-xs text-slate-500 font-normal mt-0.5">
                              ({pData.reworkHours}h retrabajo)
                            </div>
                          )}
                        </td>

                        {/* COSTO TOTAL */}
                        <td className="py-4 px-4 text-right font-display font-medium text-slate-700">
                          ${pData.totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>

                        {/* MARGEN BRUTO */}
                        <td className="py-4 px-4 text-right font-display font-semibold">
                          <span className={pData.marginAmount < 0 ? 'text-rose-600' : 'text-slate-900'}>
                            ${pData.marginAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* MARGEN % */}
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-display ${
                            pData.marginPercent >= 30
                              ? 'bg-emerald-50 text-emerald-700'
                              : pData.marginPercent >= 15
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {pData.marginPercent.toFixed(1)}%
                          </span>
                        </td>

                        {/* SALUD FINANCIERA */}
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${healthBadge.bg}`}>
                            {healthBadge.label}
                          </span>
                        </td>

                        {/* ACCIONES */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedProjectForAudit(pData)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-xs transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Auditoría</span>
                            <ChevronRight className="w-3.5 h-3.5 text-white" />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* MODAL DE AUDITORÍA FINANCIERA DETALLADA POR PROYECTO */}
      {selectedProjectForAudit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* HEADER MODAL */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-widest">
                  <Calculator className="w-3.5 h-3.5 text-slate-300" />
                  Auditoría Financiera Extensiva
                </div>
                <h2 className="text-xl font-semibold">{selectedProjectForAudit.project.name}</h2>
                <p className="text-xs text-slate-400 font-normal">Cliente: <strong className="text-white font-medium">{selectedProjectForAudit.clientName}</strong> | ID: {selectedProjectForAudit.project.id}</p>
              </div>

              <button
                onClick={() => setSelectedProjectForAudit(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* CONTENIDO MODAL EN SCROLL */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">

              {/* ALERTAS Y FACTORES DE RIESGO */}
              {selectedProjectForAudit.riskFactors.length > 0 ? (
                <div className="bg-amber-50/90 p-4 sm:p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-slate-800" />
                    <span>Factores de Riesgo Financiero Detectados ({selectedProjectForAudit.riskFactors.length})</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-amber-900 space-y-1 font-normal pl-1">
                    {selectedProjectForAudit.riskFactors.map((rf, idx) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-[#F4F5F0] p-4 sm:p-5 rounded-2xl flex items-center gap-3 text-slate-800 font-medium text-xs">
                  <CheckCircle2 className="w-5 h-5 text-slate-800 shrink-0" />
                  <span>Este proyecto presenta parámetros financieros totalmente saludables sin factores de riesgo activos.</span>
                </div>
              )}

              {/* GRID DE METRICAS PRINCIPALES DEL PROYECTO (KPIs DISPLAY) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#F4F5F0] p-4 rounded-2xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Ingreso por OVs</div>
                  <div className="text-2xl font-semibold text-slate-900 font-display">${selectedProjectForAudit.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                  <div className="text-xs text-slate-500 font-normal">{selectedProjectForAudit.ovs.length} Orden(es) de Venta</div>
                </div>

                <div className="bg-[#F4F5F0] p-4 rounded-2xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Costo Incurrido</div>
                  <div className="text-2xl font-semibold text-slate-900 font-display">${selectedProjectForAudit.totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                  <div className="text-xs text-slate-500 font-normal">{selectedProjectForAudit.totalHoursConsumed} hrs ejecutadas</div>
                </div>

                <div className="bg-[#F4F5F0] p-4 rounded-2xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Margen de Utilidad</div>
                  <div className="text-2xl font-semibold text-slate-900 font-display">${selectedProjectForAudit.marginAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                  <div className="text-xs font-medium text-slate-600">{selectedProjectForAudit.marginPercent.toFixed(1)}% de margen</div>
                </div>

                <div className="bg-[#F4F5F0] p-4 rounded-2xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Tarifa Real Obtenida</div>
                  <div className="text-2xl font-semibold text-slate-900 font-display">${selectedProjectForAudit.hourlyRateReal.toFixed(2)}/h</div>
                  <div className="text-xs text-slate-500 font-normal">Ingreso total / horas trabajadas</div>
                </div>
              </div>

              {/* LISTA DE ÓRDENES DE VENTA (OVS) */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-2">
                  <Receipt className="w-4 h-4 text-slate-800" />
                  Órdenes de Venta & Adendas Vinculadas
                </h3>

                <div className="divide-y divide-stone-100 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {selectedProjectForAudit.ovs.map(ov => (
                    <div key={ov.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#F4F5F0]/60">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-slate-800 bg-[#F4F5F0] px-2.5 py-1 rounded-full">
                          {ov.numero}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">Emisión: {ov.fechaEmision || 'N/A'}</div>
                          <div className="text-xs text-slate-500 font-normal">Horas Contratadas: {ov.horasAsociadas} hrs</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-slate-900 font-display text-base">${(ov.monto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {ov.moneda || 'USD'}</div>
                        <span className="text-xs uppercase font-normal text-slate-400">{ov.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REGISTRO DE HORAS Y RETRABAJO */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-2">
                  <Clock className="w-4 h-4 text-slate-800" />
                  Registro de Tiempos & Horas de Retrabajo
                </h3>

                <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-normal text-slate-700">Horas Normales Producción:</span>
                    <span className="font-semibold font-display text-slate-900">{selectedProjectForAudit.normalHours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-normal text-slate-700">Horas de Retrabajo / Correcciones:</span>
                    <span className="font-semibold font-display text-slate-900">{selectedProjectForAudit.reworkHours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                    <span className="font-semibold text-slate-900">Costo Perdido por Retrabajo:</span>
                    <span className="font-semibold font-display text-rose-600 text-sm">${selectedProjectForAudit.reworkCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* FOOTER MODAL */}
            <div className="p-4 bg-[#F4F5F0] border-t border-stone-200 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-normal">Auditoría generada para {currentUser.username} ({currentUser.puesto})</span>
              <button
                onClick={() => setSelectedProjectForAudit(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-full cursor-pointer transition-all"
              >
                Cerrar Auditoría
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
