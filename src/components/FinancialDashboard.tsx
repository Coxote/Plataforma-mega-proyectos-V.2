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
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-y-auto" id="financial-health-dashboard">
      
      {/* HEADER SUPERIOR */}
      <div className="px-8 py-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">
            <DollarSign className="w-4 h-4" />
            Módulo de Control Financiero & Rentabilidad
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Salud Financiera de Proyectos</h1>
          <p className="text-xs text-slate-500 font-medium">
            Supervisión ejecutiva de ingresos por OVs, costo real incurrido, margen de ganancia e impacto por retrabajo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-emerald-600/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Margen Consolidado</div>
              <div className="text-base font-black text-emerald-700">
                {globalMetrics.marginPercent.toFixed(1)}% <span className="text-xs text-emerald-600 font-bold">(${globalMetrics.marginAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* KPI CARDS (RESUMEN EJECUTIVO) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* CARD 1: INGRESOS CONTRATADOS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ingresos Totales (OVs)</span>
              <div className="w-9 h-9 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ${globalMetrics.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 pt-1">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              <span>{globalMetrics.totalHoursSold} hrs vendidas en total</span>
            </div>
          </div>

          {/* CARD 2: COSTO REAL INCURRIDO */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Costo Operativo Real</span>
              <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ${globalMetrics.totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 pt-1">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>{globalMetrics.totalHoursConsumed} hrs trabajadas ({globalMetrics.internalCost > 0 ? `$${globalMetrics.internalCost.toFixed(0)} interno` : ''})</span>
            </div>
          </div>

          {/* CARD 3: MARGEN BRUTO OPERATIVO */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Margen Operativo Bruto</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              ${globalMetrics.marginAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 pt-1">
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black text-[10px]">
                {globalMetrics.marginPercent.toFixed(1)}% Margen
              </span>
              <span className="text-slate-400 text-[10px]">Meta &ge; 30%</span>
            </div>
          </div>

          {/* CARD 4: IMPACTO DE RETRABAJO / RIESGO */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Costo Pérdida Retrabajo</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 font-mono">
              ${globalMetrics.reworkCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between pt-1">
              <span className="text-amber-700 font-bold">{globalMetrics.totalReworkHours} hrs desperdiciadas</span>
              <span className="text-red-600 font-black text-[10px]">{globalMetrics.criticalCount} Proy. Críticos</span>
            </div>
          </div>

        </div>

        {/* GRAFICOS VISUALES & ESTRUCTURA DE COSTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* BARS: INGRESO VS COSTO POR PROYECTO */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-600" />
                  Comparativo Ingreso vs. Costo Incurrido por Proyecto
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Visión rápida de facturación en OVs frente a costo total de horas trabajadas.</p>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-cyan-600 block"></span> Ingreso
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-slate-300 block"></span> Costo
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
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 truncate max-w-[200px] sm:max-w-[280px]">{pData.project.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({pData.clientName})</span>
                      </div>
                      <div className="font-mono text-[11px]">
                        <span className="text-emerald-700 font-black">${pData.totalIncome.toLocaleString('es-ES')}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-slate-600 font-bold">${pData.totalCost.toLocaleString('es-ES')}</span>
                      </div>
                    </div>

                    {/* DUAL BAR */}
                    <div className="space-y-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                      {/* BAR 1: INGRESO */}
                      <div className="h-2.5 bg-slate-200/60 rounded-lg overflow-hidden w-full relative">
                        <div 
                          className="h-full bg-cyan-600 rounded-lg transition-all duration-500"
                          style={{ width: `${incomeWidth}%` }}
                        />
                      </div>
                      {/* BAR 2: COSTO */}
                      <div className="h-2.5 bg-slate-200/60 rounded-lg overflow-hidden w-full relative">
                        <div 
                          className={`h-full rounded-lg transition-all duration-500 ${
                            pData.totalCost > pData.totalIncome ? 'bg-red-500' : 'bg-slate-500'
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

          {/* PIE / BREAKDOWN: DESG LASE DE COSTOS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Estructura de Costos del Negocio
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Distribución del gasto total acumulado en la operación.</p>
              </div>

              <div className="space-y-4 pt-5">
                {/* INTERNO */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-600" /> Costo Equipo Interno
                    </span>
                    <span className="font-mono text-slate-900 font-black">${globalMetrics.internalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {globalMetrics.totalCost > 0 ? ((globalMetrics.internalCost / globalMetrics.totalCost) * 100).toFixed(1) : 0}% del costo total
                  </div>
                </div>

                {/* PROVEEDORES */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-purple-600" /> Costo Proveedores Externos
                    </span>
                    <span className="font-mono text-slate-900 font-black">${globalMetrics.providerCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {globalMetrics.totalCost > 0 ? ((globalMetrics.providerCost / globalMetrics.totalCost) * 100).toFixed(1) : 0}% del costo total
                  </div>
                </div>

                {/* RETRABAJO */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-amber-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Pérdida por Retrabajo
                    </span>
                    <span className="font-mono text-amber-700 font-black">${globalMetrics.reworkCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium">
                    {globalMetrics.totalCost > 0 ? ((globalMetrics.reworkCost / globalMetrics.totalCost) * 100).toFixed(1) : 0}% del costo total absorbido
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-medium text-center">
              💡 <strong className="text-slate-800">Recomendación:</strong> Reducir el retrabajo en 50% incrementaría la utilidad neta en <strong className="text-emerald-700">${(globalMetrics.reworkCost * 0.5).toLocaleString('es-ES')}</strong>.
            </div>
          </div>

        </div>

        {/* TABLA PRINCIPAL DE SALUD FINANCIERA POR PROYECTO */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-0">
          
          {/* CONTROLES Y FILTROS TABLA */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Tabla de Auditoría Financiera de Proyectos</h3>
              <p className="text-xs text-slate-500 font-medium">Desglose individual de margen operativo, OVs vinculadas y alertas de salud financiera.</p>
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
                  className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-48 sm:w-60"
                />
              </div>

              {/* CLIENT FILTER */}
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Cualquier Salud</option>
                <option value="optimo">🟢 Salud Óptima</option>
                <option value="observacion">🟡 En Observación</option>
                <option value="critico">🔴 Crítico / Riesgo</option>
              </select>
            </div>
          </div>

          {/* TABLA DATA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
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
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No se encontraron proyectos con los criterios de búsqueda seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(pData => {
                    const healthBadge = {
                      optimo: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '🟢 Óptimo', dot: 'bg-emerald-500' },
                      observacion: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: '🟡 En Observación', dot: 'bg-amber-500' },
                      critico: { bg: 'bg-red-50 text-red-700 border-red-200', label: '🔴 Crítico', dot: 'bg-red-500' }
                    }[pData.healthScore];

                    return (
                      <tr key={pData.project.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* PROYECTO & CLIENTE */}
                        <td className="py-4 px-6 space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>{pData.project.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                            <span className="text-slate-600 font-bold">{pData.clientName}</span>
                            <span>•</span>
                            <span className="font-mono">ID: {pData.project.id}</span>
                          </div>
                        </td>

                        {/* OVs REGISTRADAS */}
                        <td className="py-4 px-4 text-center">
                          <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-xl text-[11px] inline-flex items-center gap-1 font-mono">
                            <Receipt className="w-3 h-3 text-cyan-600" />
                            {pData.ovs.length} {pData.ovs.length === 1 ? 'OV' : 'OVs'}
                          </span>
                        </td>

                        {/* INGRESO OVs */}
                        <td className="py-4 px-4 text-right font-mono font-black text-emerald-700">
                          ${pData.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>

                        {/* HORAS VENDIDAS / INCURRIDAS */}
                        <td className="py-4 px-4 text-center font-mono text-[11px]">
                          <span className="text-slate-800 font-bold">{pData.totalHoursSold}h</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className={`font-black ${pData.totalHoursConsumed > pData.totalHoursSold && pData.totalHoursSold > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {pData.totalHoursConsumed}h
                          </span>
                          {pData.reworkHours > 0 && (
                            <div className="text-[9px] text-amber-600 font-extrabold mt-0.5">
                              ({pData.reworkHours}h retrabajo)
                            </div>
                          )}
                        </td>

                        {/* COSTO TOTAL */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-800">
                          ${pData.totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>

                        {/* MARGEN BRUTO */}
                        <td className="py-4 px-4 text-right font-mono font-black">
                          <span className={pData.marginAmount < 0 ? 'text-red-600' : 'text-emerald-700'}>
                            ${pData.marginAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* MARGEN % */}
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border font-mono ${
                            pData.marginPercent >= 30 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : pData.marginPercent >= 15
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {pData.marginPercent.toFixed(1)}%
                          </span>
                        </td>

                        {/* SALUD FINANCIERA */}
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${healthBadge.bg}`}>
                            {healthBadge.label}
                          </span>
                        </td>

                        {/* ACCIONES */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedProjectForAudit(pData)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Auditoría</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* HEADER MODAL */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  <Calculator className="w-3.5 h-3.5" />
                  Auditoría Financiera Extensiva
                </div>
                <h2 className="text-xl font-black">{selectedProjectForAudit.project.name}</h2>
                <p className="text-xs text-slate-300 font-medium">Cliente: <strong className="text-white">{selectedProjectForAudit.clientName}</strong> | ID: {selectedProjectForAudit.project.id}</p>
              </div>

              <button
                onClick={() => setSelectedProjectForAudit(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENIDO MODAL EN SCROLL */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* ALERTAS Y FACTORES DE RIESGO */}
              {selectedProjectForAudit.riskFactors.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Factores de Riesgo Financiero Detectados ({selectedProjectForAudit.riskFactors.length})</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-amber-900 space-y-1 font-medium pl-1">
                    {selectedProjectForAudit.riskFactors.map((rf, idx) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Este proyecto presenta parámetros financieros totalmente saludables sin factores de riesgo activos.</span>
                </div>
              )}

              {/* GRID DE METRICAS PRINCIPALES DEL PROYECTO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Ingreso por OVs</div>
                  <div className="text-lg font-black text-slate-900 font-mono">${selectedProjectForAudit.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                  <div className="text-[10px] text-slate-500">{selectedProjectForAudit.ovs.length} Orden(es) de Venta</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Costo Incurrido</div>
                  <div className="text-lg font-black text-slate-900 font-mono">${selectedProjectForAudit.totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                  <div className="text-[10px] text-slate-500">{selectedProjectForAudit.totalHoursConsumed} hrs ejecutadas</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Margen de Utilidad</div>
                  <div className="text-lg font-black text-emerald-700 font-mono">${selectedProjectForAudit.marginAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                  <div className="text-[10px] font-extrabold text-emerald-700">{selectedProjectForAudit.marginPercent.toFixed(1)}% de margen</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tarifa Real Obtenida</div>
                  <div className="text-lg font-black text-cyan-700 font-mono">${selectedProjectForAudit.hourlyRateReal.toFixed(2)}/h</div>
                  <div className="text-[10px] text-slate-500">Ingreso total / horas trabajadas</div>
                </div>
              </div>

              {/* LISTA DE ÓRDENES DE VENTA (OVS) */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Receipt className="w-4 h-4 text-cyan-600" />
                  Órdenes de Venta & Adendas Vinculadas
                </h3>
                
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {selectedProjectForAudit.ovs.map(ov => (
                    <div key={ov.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-xl">
                          {ov.numero}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800">Emisión: {ov.fechaEmision || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">Horas Contratadas: {ov.horasAsociadas} hrs</div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-black text-emerald-700 text-sm">${(ov.monto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {ov.moneda || 'USD'}</div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{ov.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REGISTRO DE HORAS Y RETRABAJO */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  Registro de Tiempos & Horas de Retrabajo
                </h3>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Horas Normales Producción:</span>
                    <span className="font-bold font-mono text-slate-900">{selectedProjectForAudit.normalHours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-amber-700">Horas de Retrabajo / Correcciones:</span>
                    <span className="font-bold font-mono text-amber-700">{selectedProjectForAudit.reworkHours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-black text-slate-900">Costo Perdido por Retrabajo:</span>
                    <span className="font-black font-mono text-amber-600 text-sm">${selectedProjectForAudit.reworkCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* FOOTER MODAL */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">Auditoría generada para {currentUser.username} ({currentUser.puesto})</span>
              <button
                onClick={() => setSelectedProjectForAudit(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
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
