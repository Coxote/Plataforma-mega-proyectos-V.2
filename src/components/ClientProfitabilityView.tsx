import React, { useState, useMemo } from 'react';
import { Project, Client, UserSession, ROLE_HOURLY_RATES } from '../types';
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Clock,
  Search,
  Filter,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  BarChart3,
  Receipt,
  ArrowUpRight
} from 'lucide-react';

interface ClientProfitabilityViewProps {
  projects: Project[];
  clients: Client[];
  users: UserSession[];
  currentUser: UserSession;
}

export interface ClientFinancialSummary {
  clientId: string;
  clientName: string;
  contactName: string;
  projectsCount: number;
  totalIncome: number;
  totalHoursSold: number;
  totalHoursConsumed: number;
  internalCost: number;
  providerCost: number;
  totalCost: number;
  reworkHours: number;
  reworkCost: number;
  reworkOriginClientHours: number;
  reworkOriginInternalHours: number;
  reworkOriginProviderHours: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
  hourDeviationPct: number; // % desvío sobre horas vendidas
  tier: 'tier1' | 'saludable' | 'observacion' | 'critico';
  riskNote: string;
}

export const ClientProfitabilityView: React.FC<ClientProfitabilityViewProps> = ({
  projects,
  clients,
  users,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'tier1' | 'saludable' | 'observacion' | 'critico'>('all');
  const [sortBy, setSortBy] = useState<'marginAmount' | 'marginPercent' | 'reworkCost' | 'totalIncome'>('marginAmount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mapeo de tarifas personalizadas
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

  // Agrupar proyectos y timeEntries por cliente
  const clientSummaries: ClientFinancialSummary[] = useMemo(() => {
    // Agrupar proyectos por clientName o clientId
    const clientMap = new Map<string, { clientObj: Client | null; projects: Project[] }>();

    // Inicializar con clientes registrados
    clients.forEach((c) => {
      clientMap.set(c.nombreComercial.toLowerCase(), { clientObj: c, projects: [] });
    });

    // Asignar proyectos
    projects.forEach((p) => {
      const cName = (p.clientName || 'Sin Cliente').trim().toLowerCase();
      if (!clientMap.has(cName)) {
        clientMap.set(cName, { clientObj: null, projects: [] });
      }
      clientMap.get(cName)!.projects.push(p);
    });

    const summaries: ClientFinancialSummary[] = [];

    clientMap.forEach(({ clientObj, projects: pList }, cKey) => {
      if (pList.length === 0 && !clientObj) return;

      const clientName = clientObj?.nombreComercial || pList[0]?.clientName || 'Cliente No Asignado';
      const contactName = (typeof clientObj?.contactoPrincipal === 'string' ? clientObj.contactoPrincipal : '') || pList[0]?.clientContact || 'Contacto Comercial';
      const clientId = clientObj?.id || `client-${cKey}`;

      let totalIncome = 0;
      let totalHoursSold = 0;
      let totalHoursConsumed = 0;
      let internalCost = 0;
      let providerCost = 0;
      let reworkHours = 0;
      let reworkCost = 0;
      let reworkOriginClientHours = 0;
      let reworkOriginInternalHours = 0;
      let reworkOriginProviderHours = 0;

      pList.forEach((p) => {
        // Ingresos
        let pIncome = p.totalIncome || 0;
        if (p.ordenesVenta && p.ordenesVenta.length > 0) {
          pIncome = p.ordenesVenta.reduce((sum, ov) => sum + (ov.monto || 0), 0);
          totalHoursSold += p.ordenesVenta.reduce((sum, ov) => sum + (ov.horasAsociadas || 0), 0);
        } else {
          totalHoursSold += p.hoursTotal || 0;
        }
        if (!pIncome) pIncome = (p.hoursTotal || 100) * 40;
        totalIncome += pIncome;

        // Horas y Costos
        (p.timeEntries || []).forEach((te) => {
          const h = te.hours || 0;
          totalHoursConsumed += h;

          let rate = ROLE_HOURLY_RATES[te.role] || 35.0;
          if (te.role === 'proveedor') {
            const custom = userRateMap.get(te.userId);
            if (custom) rate = custom;
            providerCost += h * rate;
          } else {
            internalCost += h * rate;
          }

          if (te.type === 'retrabajo') {
            reworkHours += h;
            reworkCost += h * rate;

            const orig = te.retrabajoOrigen || 'cliente';
            if (orig === 'cliente') reworkOriginClientHours += h;
            else if (orig === 'interno') reworkOriginInternalHours += h;
            else if (orig === 'proveedor') reworkOriginProviderHours += h;
          }
        });
      });

      const totalCost = internalCost + providerCost;
      const grossMarginAmount = totalIncome - totalCost;
      const grossMarginPercent = totalIncome > 0 ? (grossMarginAmount / totalIncome) * 100 : 0;
      const hourDeviationPct = totalHoursSold > 0
        ? ((totalHoursConsumed - totalHoursSold) / totalHoursSold) * 100
        : 0;

      // Clasificación de Tier de Rentabilidad
      let tier: 'tier1' | 'saludable' | 'observacion' | 'critico' = 'saludable';
      let riskNote = 'Margen saludable y volumen controlado.';

      if (grossMarginPercent >= 40) {
        tier = 'tier1';
        riskNote = 'Cliente de alta rentabilidad (>40% margen). Prioritario para retención.';
      } else if (grossMarginPercent >= 25) {
        tier = 'saludable';
        riskNote = 'Margen alineado con metas de la agencia (25% - 39%).';
      } else if (grossMarginPercent >= 10) {
        tier = 'observacion';
        riskNote = 'Margen ajustado. Desvío de horas o sobrecosto en ejecución.';
      } else {
        tier = 'critico';
        riskNote = 'En pérdida operativa o margen crítico (<10%). Requiere renegociar OVs.';
      }

      if (reworkHours > 0 && (reworkHours / (totalHoursConsumed || 1)) > 0.18) {
        riskNote += ` Elevado retrabajo (${((reworkHours / (totalHoursConsumed || 1)) * 100).toFixed(0)}% del tiempo).`;
      }

      summaries.push({
        clientId,
        clientName,
        contactName,
        projectsCount: pList.length,
        totalIncome,
        totalHoursSold,
        totalHoursConsumed,
        internalCost,
        providerCost,
        totalCost,
        reworkHours,
        reworkCost,
        reworkOriginClientHours,
        reworkOriginInternalHours,
        reworkOriginProviderHours,
        grossMarginAmount,
        grossMarginPercent,
        hourDeviationPct,
        tier,
        riskNote
      });
    });

    return summaries;
  }, [projects, clients, userRateMap]);

  // Filtrado y ordenamiento
  const filteredSummaries = useMemo(() => {
    return clientSummaries.filter((item) => {
      if (tierFilter !== 'all' && item.tier !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClient = item.clientName.toLowerCase().includes(q);
        const matchesContact = item.contactName.toLowerCase().includes(q);
        if (!matchesClient && !matchesContact) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'marginAmount') { valA = a.grossMarginAmount; valB = b.grossMarginAmount; }
      else if (sortBy === 'marginPercent') { valA = a.grossMarginPercent; valB = b.grossMarginPercent; }
      else if (sortBy === 'reworkCost') { valA = a.reworkCost; valB = b.reworkCost; }
      else if (sortBy === 'totalIncome') { valA = a.totalIncome; valB = b.totalIncome; }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [clientSummaries, tierFilter, searchQuery, sortBy, sortOrder]);

  // Totales consolidados de clientes
  const portfolioClientTotals = useMemo(() => {
    const totalIncome = clientSummaries.reduce((sum, c) => sum + c.totalIncome, 0);
    const totalCost = clientSummaries.reduce((sum, c) => sum + c.totalCost, 0);
    const totalMargin = totalIncome - totalCost;
    const marginPct = totalIncome > 0 ? (totalMargin / totalIncome) * 100 : 0;
    const totalReworkCost = clientSummaries.reduce((sum, c) => sum + c.reworkCost, 0);
    const totalReworkHours = clientSummaries.reduce((sum, c) => sum + c.reworkHours, 0);

    const clientTiers = {
      tier1: clientSummaries.filter((c) => c.tier === 'tier1').length,
      saludable: clientSummaries.filter((c) => c.tier === 'saludable').length,
      observacion: clientSummaries.filter((c) => c.tier === 'observacion').length,
      critico: clientSummaries.filter((c) => c.tier === 'critico').length
    };

    return {
      totalIncome,
      totalCost,
      totalMargin,
      marginPct,
      totalReworkCost,
      totalReworkHours,
      clientTiers
    };
  }, [clientSummaries]);

  // Exportar reporte de rentabilidad en Markdown
  const handleExportClientReportMD = () => {
    let md = `# Reporte Ejecutivo de Rentabilidad por Cliente - Agencia TPP\n`;
    md += `**Fecha de Emisión:** ${new Date().toLocaleString('es-CL')}\n`;
    md += `**Clientes Analizados:** ${clientSummaries.length}\n`;
    md += `**Margen Consolidado de Cartera:** ${portfolioClientTotals.marginPct.toFixed(1)}% ($${portfolioClientTotals.totalMargin.toLocaleString('es-CL')})\n\n`;

    md += `## 1. Resumen de Cartera por Tiers de Rentabilidad\n`;
    md += `- Tier 1 (Alta Rentabilidad ≥40%): ${portfolioClientTotals.clientTiers.tier1} clientes\n`;
    md += `- Saludable (25% - 39%): ${portfolioClientTotals.clientTiers.saludable} clientes\n`;
    md += `- En Observación (10% - 24%): ${portfolioClientTotals.clientTiers.observacion} clientes\n`;
    md += `- En Riesgo / Pérdida (<10%): ${portfolioClientTotals.clientTiers.critico} clientes\n`;
    md += `- Impacto Total por Horas de Retrabajo: $${portfolioClientTotals.totalReworkCost.toLocaleString('es-CL')} (${portfolioClientTotals.totalReworkHours} hrs)\n\n`;

    md += `## 2. Detalle Individual por Cliente\n\n`;
    clientSummaries.forEach((c, idx) => {
      md += `### ${idx + 1}. ${c.clientName} (${c.projectsCount} proyectos)\n`;
      md += `- **Facturación (OVs):** $${c.totalIncome.toLocaleString('es-CL')}\n`;
      md += `- **Costo Real Total:** $${c.totalCost.toLocaleString('es-CL')} (Interno: $${c.internalCost.toLocaleString('es-CL')} | Proveedor: $${c.providerCost.toLocaleString('es-CL')})\n`;
      md += `- **Margen Bruto:** $${c.grossMarginAmount.toLocaleString('es-CL')} (${c.grossMarginPercent.toFixed(1)}%)\n`;
      md += `- **Horas:** ${c.totalHoursSold} hrs vendidas vs ${c.totalHoursConsumed} hrs consumidas (${c.hourDeviationPct >= 0 ? '+' : ''}${c.hourDeviationPct.toFixed(1)}% desvío)\n`;
      md += `- **Retrabajo:** ${c.reworkHours} hrs ($${c.reworkCost.toLocaleString('es-CL')}) - Por Cliente: ${c.reworkOriginClientHours}h, Interno: ${c.reworkOriginInternalHours}h\n`;
      md += `- **Diagnóstico:** ${c.riskNote}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Rentabilidad_Clientes_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="client-profitability-view">

      {/* HEADER & SUMMARY BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-stone-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <Building2 className="w-4 h-4" />
            Control Gerencial & Dirección
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Control de Rentabilidad por Cliente
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Análisis financiero de márgenes brutos, horas de retrabajo causadas por cambios de clientes y desvíos presupuestarios.
          </p>
        </div>

        <button
          onClick={handleExportClientReportMD}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0 active:scale-95"
          id="btn-export-client-profitability-md"
        >
          <FileText className="w-4 h-4" />
          Descargar Reporte (.md)
        </button>
      </div>

      {/* CARDS DE RESUMEN EJECUTIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Facturación Cartera */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/70 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-slate-600" />
            Facturación Total Cartera
          </span>
          <div className="text-2xl font-bold font-display text-slate-900">
            ${portfolioClientTotals.totalIncome.toLocaleString('es-CL')}
          </div>
          <p className="text-xs text-slate-500">{clientSummaries.length} clientes activos con proyectos</p>
        </div>

        {/* Margen Bruto Consolidado */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/70 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Margen Bruto Promedio
          </span>
          <div className="text-2xl font-bold font-display text-emerald-700">
            {portfolioClientTotals.marginPct.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-500">Utilidad acumulada: ${portfolioClientTotals.totalMargin.toLocaleString('es-CL')}</p>
        </div>

        {/* Costo Retrabajo en Clientes */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/70 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Pérdida por Retrabajo
          </span>
          <div className="text-2xl font-bold font-display text-rose-700">
            ${portfolioClientTotals.totalReworkCost.toLocaleString('es-CL')}
          </div>
          <p className="text-xs text-slate-500">{portfolioClientTotals.totalReworkHours} horas absorbidas</p>
        </div>

        {/* Tiers de Rentabilidad */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/70 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-indigo-600" />
            Salud de Clientes
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs" title="Tier 1">
              {portfolioClientTotals.clientTiers.tier1} Tier 1
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs" title="Saludables">
              {portfolioClientTotals.clientTiers.saludable} OK
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs" title="En riesgo o pérdida">
              {portfolioClientTotals.clientTiers.critico} Críticos
            </span>
          </div>
          <p className="text-xs text-slate-500">Distribución de rentabilidad de cartera</p>
        </div>
      </div>

      {/* COMPARATIVA VISUAL DE MARGEN VS RETRABAJO */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-stone-200/70 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-800" />
              Comparativo de Margen Bruto vs. Impacto de Retrabajo por Cliente
            </h3>
            <p className="text-xs text-slate-500">
              Proporción de rentabilidad neta generada frente al costo de horas de ajustes solicitados.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-2 bg-emerald-500 rounded-sm"></span> Margen Bruto ($)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-3 h-2 bg-rose-500 rounded-sm"></span> Retrabajo ($)
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {clientSummaries.slice(0, 5).map((c) => {
            const maxVal = Math.max(c.totalIncome, c.totalCost, 1000);
            const marginWidth = Math.max(0, Math.min(100, (c.grossMarginAmount / maxVal) * 100));
            const reworkWidth = Math.max(0, Math.min(100, (c.reworkCost / maxVal) * 100));

            return (
              <div key={c.clientId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.clientName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({c.projectsCount} proj.)</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono font-bold text-xs">
                    <span className="text-emerald-700">Margen: ${c.grossMarginAmount.toLocaleString('es-CL')} ({c.grossMarginPercent.toFixed(1)}%)</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-rose-600">Retrabajo: ${c.reworkCost.toLocaleString('es-CL')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#F4F5F0] p-1.5 rounded-2xl">
                  {/* Barra Margen */}
                  <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${marginWidth}%` }}
                    />
                  </div>
                  {/* Barra Retrabajo */}
                  <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${reworkWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABLA PRINCIPAL DE RENTABILIDAD POR CLIENTE */}
      <div className="bg-white rounded-3xl shadow-xs border border-stone-200/70 overflow-hidden">
        {/* Controles de Filtros y Búsqueda */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F4F5F0]/60">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Matriz de Control y Auditoría por Cliente
            </h3>
            <p className="text-xs text-slate-500">
              Desglose detallado de facturación en OVs, horas ejecutadas, desvíos y alertas gerenciales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente o contacto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3.5 py-2 bg-white rounded-xl text-xs font-semibold text-slate-800 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 w-48 sm:w-60 shadow-2xs"
              />
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="px-3 py-2 bg-white rounded-xl text-xs font-bold text-slate-700 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              <option value="all">Todos los Tiers</option>
              <option value="tier1">Tier 1 (≥40% Margen)</option>
              <option value="saludable">Saludable (25% - 39%)</option>
              <option value="observacion">En Observación (10% - 24%)</option>
              <option value="critico">Crítico / En Pérdida (&lt;10%)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white rounded-xl text-xs font-bold text-slate-700 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              <option value="marginAmount">Ordenar por Margen ($)</option>
              <option value="marginPercent">Ordenar por Margen (%)</option>
              <option value="totalIncome">Ordenar por Facturación</option>
              <option value="reworkCost">Ordenar por Pérdida Retrabajo</option>
            </select>
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F0] text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-6">Cliente & Contacto</th>
                <th className="py-3.5 px-4 text-center">Proyectos</th>
                <th className="py-3.5 px-4 text-right">Facturación OVs</th>
                <th className="py-3.5 px-4 text-center">Horas Vend. / Consum.</th>
                <th className="py-3.5 px-4 text-right">Costo Operativo</th>
                <th className="py-3.5 px-4 text-right">Margen Bruto</th>
                <th className="py-3.5 px-4 text-center">Retrabajo</th>
                <th className="py-3.5 px-4 text-center">Semáforo</th>
                <th className="py-3.5 px-6">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron clientes que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((c) => {
                  const tierBadge = {
                    tier1: { label: 'Tier 1', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                    saludable: { label: 'Saludable', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                    observacion: { label: 'Observación', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                    critico: { label: 'Crítico', color: 'bg-rose-50 text-rose-800 border-rose-200' }
                  }[c.tier];

                  return (
                    <tr key={c.clientId} className="hover:bg-[#F4F5F0]/60 transition-colors">
                      {/* Cliente */}
                      <td className="py-4 px-6 space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {c.clientName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {c.contactName}
                        </div>
                      </td>

                      {/* Proyectos */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-[#F4F5F0] font-bold text-slate-700 text-xs inline-block">
                          {c.projectsCount} {c.projectsCount === 1 ? 'proyecto' : 'proyectos'}
                        </span>
                      </td>

                      {/* Facturación */}
                      <td className="py-4 px-4 text-right font-display font-bold text-slate-900">
                        ${c.totalIncome.toLocaleString('es-CL')}
                      </td>

                      {/* Horas */}
                      <td className="py-4 px-4 text-center space-y-0.5">
                        <div className="font-mono text-xs font-bold text-slate-800">
                          {c.totalHoursConsumed}h / {c.totalHoursSold}h
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          c.hourDeviationPct > 10 ? 'bg-rose-100 text-rose-800' : 'text-slate-500'
                        }`}>
                          {c.hourDeviationPct > 0 ? `+${c.hourDeviationPct.toFixed(0)}% desvío` : 'En cuota'}
                        </span>
                      </td>

                      {/* Costo Operativo */}
                      <td className="py-4 px-4 text-right space-y-0.5">
                        <div className="font-display font-semibold text-slate-900 text-xs">
                          ${c.totalCost.toLocaleString('es-CL')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Int: ${c.internalCost.toLocaleString('es-CL')} | Ext: ${c.providerCost.toLocaleString('es-CL')}
                        </div>
                      </td>

                      {/* Margen Bruto */}
                      <td className="py-4 px-4 text-right space-y-0.5">
                        <div className={`font-display font-bold text-xs ${
                          c.grossMarginAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          ${c.grossMarginAmount.toLocaleString('es-CL')}
                        </div>
                        <div className={`text-[10px] font-bold ${
                          c.grossMarginPercent >= 25 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {c.grossMarginPercent.toFixed(1)}% margen
                        </div>
                      </td>

                      {/* Retrabajo */}
                      <td className="py-4 px-4 text-center space-y-0.5">
                        <div className="font-mono font-bold text-xs text-rose-700">
                          {c.reworkHours} hrs
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          ${c.reworkCost.toLocaleString('es-CL')}
                          {c.reworkOriginClientHours > 0 && ` (${c.reworkOriginClientHours}h por cliente)`}
                        </div>
                      </td>

                      {/* Semáforo */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider inline-block ${tierBadge.color}`}>
                          {tierBadge.label}
                        </span>
                      </td>

                      {/* Diagnóstico */}
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs leading-relaxed">
                        {c.riskNote}
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
  );
};
