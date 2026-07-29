import React, { useState, useMemo } from 'react';
import { Project, UserSession } from '../types';
import { runSlaRuleEngine } from '../utils/slaRuleEngine';
import { 
  calculateGlobalFinancials, 
  calculateTeamWorkload, 
  getGlobalRetrabajoStats, 
  getRetrabajoBadgeStyle, 
  getProjectProfitabilityRanking,
  getGlobalReworkIndicator,
  getTeamPerformanceComparisons,
  GROSS_MONTHLY_CAPACITY, 
  IDLE_TIME_HOURS, 
  EFFECTIVE_MONTHLY_CAPACITY 
} from '../utils/metrics';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Activity, 
  Shield, 
  Clock, 
  DollarSign, 
  Filter,
  Search,
  ArrowUpDown,
  Briefcase,
  RotateCcw,
  Coins,
  PieChart,
  CheckCircle2,
  Printer,
  Download,
  Award,
  ShieldCheck,
  FileCheck2,
  Trophy,
  BarChart3,
  Zap,
  Target,
  BellRing
} from 'lucide-react';
import { TeamCard, VitaminizedMember } from './TeamCard';
import { UserInspectorPanel } from './UserInspectorPanel';
import { ExecutiveDashboard } from './ExecutiveDashboard';

interface Props {
  projects: Project[];
  users: UserSession[];
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
}

export const CoordinatorDashboard: React.FC<Props> = ({ projects, users, activeProjectId, onSelectProject }) => {
  const [subView, setSubView] = useState<'executive' | 'operations'>('executive');
  const [selectedMember, setSelectedMember] = useState<VitaminizedMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'saturation' | 'name'>('saturation');
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'deliverable' | 'phase'>('all');

  // Motor de Reglas SLA
  const slaAlerts = useMemo(() => runSlaRuleEngine(projects), [projects]);

  const filteredAlerts = useMemo(() => {
    return slaAlerts.filter(alert => {
      if (alertFilter === 'critical') return alert.severity === 'critical';
      if (alertFilter === 'warning') return alert.severity === 'warning';
      if (alertFilter === 'deliverable') return alert.targetType === 'entregable';
      if (alertFilter === 'phase') return alert.targetType === 'fase' || alert.targetType === 'proyecto';
      return true;
    });
  }, [slaAlerts, alertFilter]);

  // Métricas unificadas desde utils/metrics.ts
  const financials = useMemo(() => calculateGlobalFinancials(projects), [projects]);
  const globalRework = useMemo(() => getGlobalReworkIndicator(projects, users), [projects, users]);
  const profitabilityRanking = useMemo(() => getProjectProfitabilityRanking(projects), [projects]);
  const teamPerformance = useMemo(() => getTeamPerformanceComparisons(users, projects), [users, projects]);
  
  // Color helper for roles
  const getUserColor = (role: string): string => {
    switch (role) {
      case 'coordinador':
        return 'bg-slate-900';
      case 'sac':
        return 'bg-emerald-600';
      case 'contents':
        return 'bg-purple-600';
      case 'contentd':
        return 'bg-blue-600';
      case 'invitado':
        return 'bg-amber-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Build Vitaminized Member objects dynamically from real user database + active project budgets
  const teamMembers = useMemo<VitaminizedMember[]>(() => {
    // Filter out client accounts (role 'invitado') for workload dashboard
    const activeStaff = users.filter(u => u.role !== 'invitado');
    const loads = calculateTeamWorkload(activeStaff, projects);
    
    return loads.map(load => {
      // Determine skills based on role
      let baseSkills: string[] = [];
      if (load.role === 'coordinador') {
        baseSkills = ['Gestión', 'Finanzas', 'Liderazgo'];
      } else if (load.role === 'sac') {
        baseSkills = ['Cuentas', 'Figma Inspect', 'Copywriting'];
      } else if (load.role === 'contents') {
        baseSkills = ['Social Media', 'Estrategia', 'SEO'];
      } else if (load.role === 'contentd') {
        baseSkills = ['UI/UX Refactor', 'Illustrator', 'Branding'];
      } else {
        baseSkills = ['Staff'];
      }

      // Add extra skills if they are allocated to specific projects
      const userProjects = projects.filter(p => p.budget && (p.budget[load.role]?.allocated || 0) > 0);
      userProjects.forEach(p => {
        const nameLower = p.name.toLowerCase();
        if (nameLower.includes('futbol') || nameLower.includes('game') || nameLower.includes('recreativo') || nameLower.includes('gaming')) {
          baseSkills.push('Game Dev');
        }
        if (nameLower.includes('ui') || nameLower.includes('ux') || nameLower.includes('web') || nameLower.includes('diseño')) {
          baseSkills.push('UX/UI');
        }
        if (nameLower.includes('redes') || nameLower.includes('campaña') || nameLower.includes('social')) {
          baseSkills.push('Marketing');
        }
      });

      // Clean duplicate skills and limit to 4
      const uniqueSkills = Array.from(new Set(baseSkills)).slice(0, 4);

      return {
        id: load.id,
        username: load.username,
        role: load.role,
        puesto: load.puesto,
        monthlyCapacity: load.grossCapacity || GROSS_MONTHLY_CAPACITY,
        effectiveCapacity: load.effectiveCapacity || EFFECTIVE_MONTHLY_CAPACITY,
        idleBuffer: load.idleBuffer || IDLE_TIME_HOURS,
        loadedHours: load.consumedHours,
        assignedHours: load.assignedHours,
        saturation: load.assignedHours > 0 ? (load.consumedHours / load.assignedHours) * 100 : 0,
        effectiveSaturation: load.effectiveSaturation || 0,
        skills: uniqueSkills,
        activeProjectsCount: load.activeProjectsCount
      };
    });
  }, [users, projects]);

  // Filter and sort team members
  const filteredAndSortedMembers = useMemo(() => {
    return teamMembers
      .filter(member => {
        const query = searchQuery.toLowerCase();
        return (
          member.username.toLowerCase().includes(query) ||
          (member.puesto || member.role).toLowerCase().includes(query) ||
          member.skills.some(s => s.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'saturation') {
          return b.saturation - a.saturation; // Highest load first
        } else {
          return a.username.localeCompare(b.username); // Alphabetical
        }
      });
  }, [teamMembers, searchQuery, sortBy]);

  // Proyectos ordenados por riesgo (Horas consumidas vs vendidas/totales)
  const criticalProjects = useMemo(() => {
    return [...projects]
      .filter(p => !p.phases.every(ph => ph.status === 'completed')) // Solo activos
      .map(p => {
        const consumed = p.budget 
          ? (Object.values(p.budget) as Array<{ allocated: number; consumed: number }>).reduce((sum, r) => sum + (r.consumed || 0), 0) 
          : 0;
        const totalSold = p.hoursTotal || 40;
        const risk = totalSold > 0 ? (consumed / totalSold) * 100 : 0;
        
        // Determinar fase activa
        const activePhase = p.phases.find(ph => ph.id === p.activePhaseId)?.label || 'Kickoff';

        return { ...p, risk, consumed, activePhase };
      })
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5); // Mostramos los 5 más críticos
  }, [projects]);

  // Percent consumed of sold hours helper
  const globalHoursProgress = financials.totalSoldHours > 0 
    ? (financials.totalConsumedHours / financials.totalSoldHours) * 100 
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden relative" id="coordinator-control-tower">
      
      {/* Header Superior Interno con Conmutador de Vistas */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            {subView === 'executive' ? 'Dirección C-Level' : 'Herramienta de Control Interno'}
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {subView === 'executive' ? 'Dashboard Ejecutivo del Proyecto' : 'Torre de Control de Operaciones'}
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setSubView('executive')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'executive' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Dashboard Ejecutivo
          </button>
          <button
            onClick={() => setSubView('operations')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'operations' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Torre de Control & SLA
          </button>
        </div>
      </div>

      {subView === 'executive' ? (
        <div className="flex-1 overflow-y-auto">
          <ExecutiveDashboard 
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={onSelectProject}
            users={users}
          />
        </div>
      ) : (
      /* Contenido scrolleable del Dashboard Operativo */
      <div className="flex-1 p-8 overflow-y-auto space-y-8">
        
        {/* ZONA DE KPIS FINANCIEROS Y OPERATIVOS (Banda Ejecutiva Compacta) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Horas de Operación */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-none flex flex-col justify-between" id="metric-global-hours">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Horas de Operación</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums text-slate-950 mb-1">{financials.totalConsumedHours} h</div>
              <p className="text-xs font-medium text-slate-500 mb-2">Consumidas de {financials.totalSoldHours} h vendidas</p>
              
              {/* Dynamic progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-800 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(globalHoursProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Costo Operativo Real */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-none flex flex-col justify-between" id="metric-real-cost">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Costo Operativo Real</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums text-slate-950 mb-1">
                ${financials.totalRealCost.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs font-medium text-slate-500">
                Presupuesto ideal: <span className="text-slate-900 font-bold">${financials.totalEstimatedCost.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          {/* Desviación de Costo */}
          <div 
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
              financials.costDeviation > 10 
                ? 'border-rose-200 bg-rose-50/70 shadow-none' 
                : 'border-slate-200 bg-white shadow-none'
            }`}
            id="metric-profitability-deviation"
            title="Cálculo: ((Costo Real - Costo Estimado) / Costo Estimado) * 100"
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wide ${financials.costDeviation > 10 ? 'text-rose-700' : 'text-slate-500'}`}>
                Desviación de Costo
              </span>
              {financials.costDeviation > 10 ? (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div>
              <div className={`text-3xl font-black tabular-nums mb-1 ${financials.costDeviation > 10 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {financials.costDeviation > 0 ? '▲ +' : '▼ '}{financials.costDeviation.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${financials.costDeviation > 10 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                <span className={`text-[11px] font-bold uppercase tracking-wide ${financials.costDeviation > 10 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {financials.costDeviation > 10 ? 'Alerta de Desviación' : 'Eficiencia Óptima'}
                </span>
              </div>
            </div>
          </div>

          {/* Retrabajo Global (Fase 1) - Métricas desde utils/metrics.ts */}
          <div 
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 ${globalRework.badgeStyle.bg} ${globalRework.badgeStyle.border}`}
            id="metric-global-retrabajo"
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wide ${globalRework.badgeStyle.text}`}>
                Retrabajo Global
              </span>
              <RotateCcw className={`w-4 h-4 ${globalRework.badgeStyle.text}`} />
            </div>
            <div>
              <div className={`text-3xl font-black tabular-nums mb-1 ${globalRework.badgeStyle.text}`}>
                {globalRework.porcentajeGlobal.toFixed(1)}%
              </div>
              <p className="text-xs font-medium text-slate-600">
                <strong className="font-bold">{globalRework.totalRetrabajoGlobal}h</strong> de {globalRework.totalHorasGlobal}h registradas
              </p>
            </div>
          </div>

        </div>

        {/* MOTOR DE REGLAS: ALERTAS DE VENCIMIENTOS Y CUMPLIMIENTO DE SLA */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs" id="sla-rule-engine-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-rose-600 animate-bounce" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Motor de Reglas & Control de Alertas SLA
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-white">
                  {slaAlerts.length} {slaAlerts.length === 1 ? 'Alerta' : 'Alertas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Monitoreo automatizado en tiempo real de plazos de fases, entregables en revisión y fechas límite de SLA.
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAlertFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  alertFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Todas ({slaAlerts.length})
              </button>

              <button
                type="button"
                onClick={() => setAlertFilter('critical')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  alertFilter === 'critical'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                🚨 Críticas ({slaAlerts.filter(a => a.severity === 'critical').length})
              </button>

              <button
                type="button"
                onClick={() => setAlertFilter('warning')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  alertFilter === 'warning'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                ⚠️ Próximas ({slaAlerts.filter(a => a.severity === 'warning').length})
              </button>

              <button
                type="button"
                onClick={() => setAlertFilter('deliverable')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  alertFilter === 'deliverable'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                📦 Entregables ({slaAlerts.filter(a => a.targetType === 'entregable').length})
              </button>

              <button
                type="button"
                onClick={() => setAlertFilter('phase')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  alertFilter === 'phase'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
              >
                📋 Fases / Proyectos ({slaAlerts.filter(a => a.targetType === 'fase' || a.targetType === 'proyecto').length})
              </button>
            </div>
          </div>

          {/* Alert Cards Container */}
          {filteredAlerts.length === 0 ? (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-black text-emerald-900">¡SLA y Plazos en Orden!</h3>
              <p className="text-xs text-emerald-700 font-medium max-w-md mx-auto">
                No hay alertas pendientes para el filtro seleccionado. Todas las fases y entregables activos cumplen sus fechas límites y niveles de servicio.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlerts.map(alert => {
                const isCritical = alert.severity === 'critical';
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between space-y-3 ${
                      isCritical
                        ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                        : 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCritical ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {isCritical ? <AlertTriangle className="w-3 h-3 text-rose-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            {isCritical ? 'Vencido / Crítico' : 'Próximo a Vencer'}
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-extrabold text-slate-700 uppercase">
                            {alert.targetType === 'entregable' ? '📦 Entregable' : alert.targetType === 'fase' ? `📋 Fase ${alert.phaseLabel || ''}` : '💼 Proyecto'}
                          </span>
                        </div>

                        {/* Days Diff Pill */}
                        <span className={`text-[11px] font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                          alert.daysDiff < 0 ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {alert.daysDiff < 0 ? `${Math.abs(alert.daysDiff)}d vencido` : `${alert.daysDiff}d restante(s)`}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-slate-900 leading-snug">{alert.title}</h3>
                        <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{alert.message}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="text-[11px] font-medium text-slate-500">
                        <strong className="text-slate-800">{alert.projectName}</strong> ({alert.clientName})
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectProject(alert.projectId)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                          isCritical
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                        }`}
                      >
                        <span>Intervenir</span>
                        <Briefcase className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECCIÓN DE CARGA Y SATURACIÓN DEL EQUIPO */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Carga de Trabajo y Saturación del Equipo</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Haz clic en cualquier ficha para ver el desglose detallado.</p>
            </div>

            {/* Controls panel: Search and Sorting */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:border-slate-400 focus:outline-none w-48 transition-colors"
                />
              </div>

              {/* Sort toggle */}
              <button
                onClick={() => setSortBy(prev => prev === 'saturation' ? 'name' : 'saturation')}
                className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Cambiar orden"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>{sortBy === 'saturation' ? 'Ordenar: Carga' : 'Ordenar: Nombre'}</span>
              </button>
            </div>
          </div>

          {/* Grid de Tarjetas de Equipo Reales */}
          {filteredAndSortedMembers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
              No se encontraron colaboradores que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredAndSortedMembers.map(member => (
                <TeamCard 
                  key={member.id} 
                  member={member} 
                  onSelect={(m) => setSelectedMember(m)} 
                  getUserColor={getUserColor}
                />
              ))}
            </div>
          )}
        </div>

        {/* 📊 NUEVA SECCIÓN: COMPARATIVAS DE DESEMPEÑO Y PRODUCTIVIDAD ENTRE MIEMBROS (utils/metrics.ts) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-indigo-600" />
                Comparativa de Desempeño y Productividad del Equipo
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Benchmarking interno combinando saturación efectiva, tasa de retrabajo y proyectos activos.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Colaborador</th>
                    <th className="px-4 py-3 text-center">Score Desempeño</th>
                    <th className="px-4 py-3">Nivel Eficiencia</th>
                    <th className="px-4 py-3">Saturación Efectiva (153.6h)</th>
                    <th className="px-4 py-3">Tasa Retrabajo</th>
                    <th className="px-4 py-3">Proyectos Activos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {teamPerformance.map((item) => {
                    let scoreBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    if (item.performanceScore < 70) scoreBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                    else if (item.performanceScore < 85) scoreBadge = 'bg-amber-50 text-amber-800 border-amber-200';

                    let ratingBadge = 'bg-emerald-100 text-emerald-800';
                    if (item.efficiencyRating === 'sobrecargado') ratingBadge = 'bg-rose-100 text-rose-800';
                    if (item.efficiencyRating === 'alerta') ratingBadge = 'bg-amber-100 text-amber-800';

                    return (
                      <tr key={item.userId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black ${getUserColor(item.role)}`}>
                              {(item.username || '').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-slate-900 block">{item.username}</strong>
                              <span className="text-[10px] text-slate-400 capitalize">{item.puesto}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${scoreBadge}`}>
                            <Zap className="w-3 h-3" />
                            {item.performanceScore} / 100
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ratingBadge}`}>
                            {item.efficiencyRating}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-1 max-w-[140px]">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-700 font-mono">{item.consumedHours}h</span>
                              <span className="text-slate-400">{item.effectiveSaturation}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.effectiveSaturation > 100 ? 'bg-rose-500' : item.effectiveSaturation > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, item.effectiveSaturation)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`font-mono font-bold text-xs ${item.reworkPercentage > 15 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {item.reworkPercentage}%
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">({item.reworkHours}h de retrabajo)</span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-800 text-center">
                          {item.activeProjectsCount} proy.
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BLOQUE DE RANKING DE RETRABAJOS (FASE 1) */}
        {(() => {
          const stats = getGlobalRetrabajoStats(projects, users);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-600" />Ranking de Retrabajo por Proyecto y Colaborador
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Identifica dónde se están concentrando las re-iteraciones y reprocesos.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking de Proyectos con más Retrabajo */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Proyectos con Mayor % de Retrabajo
                  </span>
                  
                  {stats.porProyecto.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">No hay registros de horas en los proyectos.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {stats.porProyecto.slice(0, 5).map(p => {
                        const badge = getRetrabajoBadgeStyle(p.porcentaje);
                        return (
                          <div 
                            key={p.projectId}
                            onClick={() => onSelectProject(p.projectId)}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <div>
                              <strong className="text-xs font-extrabold text-slate-800 block">{p.projectName}</strong>
                              <span className="text-[10px] text-slate-400 font-medium">{p.clientName}</span>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {p.porcentaje.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{p.horasRetrabajo}h / {p.totalHoras}h</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ranking de Usuarios con más Retrabajo acumulado */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Horas de Retrabajo por Colaborador
                  </span>

                  {stats.usuariosList.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">No hay registros de horas de equipo.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {stats.usuariosList.slice(0, 5).map(u => {
                        const badge = getRetrabajoBadgeStyle(u.porcentaje);
                        return (
                          <div 
                            key={u.userId}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold ${getUserColor(u.role)}`}>
                                {(u.username || '').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <strong className="text-xs font-bold text-slate-800 block">{u.username}</strong>
                                <span className="text-[10px] text-slate-400 font-medium capitalize">{u.puesto}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {u.horasRetrabajo}h ({u.porcentaje.toFixed(1)}%)
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">De {u.totalHoras}h totales</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* BLOQUE FASE 5: RANKING Y MATRIZ DE RENTABILIDAD Y SALUD FINANCIERA */}
        <div className="space-y-4" id="phase-5-profitability-matrix">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-4.5 h-4.5 text-amber-500" />
                Ranking de Proyectos por Rentabilidad y Salud Financiera
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Evaluación y jerarquía según margen bruto %, costo laboral real y rendimiento hora por proyecto.
              </p>
            </div>

            {/* Badges de resumen global de la agencia */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/80 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Margen Bruto Global: <strong className="font-extrabold text-slate-900">${financials.totalGrossProfit.toLocaleString('es-CL')} ({financials.grossMarginPercent}%)</strong>
              </span>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-200/80 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Rendimiento Hora: <strong className="font-extrabold text-slate-900">${financials.realHourlyYield.toLocaleString('es-CL')}/h</strong>
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {profitabilityRanking.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No hay proyectos registrados para análisis de rentabilidad.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 text-center">Ranking</th>
                      <th className="px-4 py-3">Proyecto / Cliente</th>
                      <th className="px-4 py-3">Ingreso (OVs)</th>
                      <th className="px-4 py-3">Costo Laboral</th>
                      <th className="px-4 py-3">Margen Bruto</th>
                      <th className="px-4 py-3">Rendimiento Hora</th>
                      <th className="px-4 py-3">Estado de Salud</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {profitabilityRanking.map(item => {
                      let badgeStyle = { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Alta Rentabilidad (≥40%)' };
                      if (item.status === 'optima') {
                        badgeStyle = { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Óptima (20-39%)' };
                      } else if (item.status === 'ajustada') {
                        badgeStyle = { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Ajustada (0-19%)' };
                      } else if (item.status === 'perdida') {
                        badgeStyle = { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'En Pérdida (<0%)' };
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs ${
                              item.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              item.rank === 2 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                              item.rank === 3 ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                              'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}>
                              #{item.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{item.clientName}</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            ${item.income.toLocaleString('es-CL')}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            ${item.realCost.toLocaleString('es-CL')}
                            <span className="block text-[10px] text-slate-400">{item.consumedHours}h ejec.</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-black">
                            <span className={item.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                              ${item.grossProfit.toLocaleString('es-CL')}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-bold">{item.marginPercent}% margen</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                            ${item.hourlyYield.toLocaleString('es-CL')}/h
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle.bg}`}>
                              {badgeStyle.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onSelectProject(item.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            >
                              Ver Finanzas
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE FASE 6: INFORME CONSOLIDADO & AUDITORÍA DE CIERRE DE AGENCIA */}
        <div className="space-y-4 pt-2 border-t border-slate-200/80" id="phase-6-audit-report">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
            {/* Background Decorative Glow */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Fase 6 Finalizada — Cierre Consolidado & Auditoría
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Informe Ejecutivo y Certificación de Operaciones
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
                  Matriz unificada con métricas de capacidad (192h/20% ocio), margen de rentabilidad bruta, control de retrabajo y trazabilidad Multi-OV.
                </p>
              </div>

              {/* Botones de Exportación / Impresión */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl border border-slate-700 transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  Imprimir Reporte (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const headers = "Proyecto,Cliente,Ingreso,Costo,Margen_Bruto,Margen_Porcentaje,Horas_Consumidas,Rendimiento_Hora\n";
                    const rows = financials.projectProfitabilityList.map(p => 
                      `"${p.name}","${p.clientName}",${p.income},${p.realCost},${p.grossProfit},${p.marginPercent}%,${p.consumedHours},${p.hourlyYield}`
                    ).join("\n");
                    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `Auditoria_Agencia_Fase6_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Exportar Auditoría (CSV)
                </button>
              </div>
            </div>

            {/* SUMMARY CHECKLIST OF THE 6 PHASES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800 relative z-10">
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <FileCheck2 className="w-4 h-4" />
                  Fase 1: Control de Retrabajo
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  {globalRework.totalRetrabajoGlobal}h registradas ({globalRework.porcentajeGlobal.toFixed(1)}% del total general).
                </p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <FileCheck2 className="w-4 h-4" />
                  Fase 2: Allocations de Tiempos
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Desglose por rol (Coordinador, SAC, Contents, ContentD).
                </p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <FileCheck2 className="w-4 h-4" />
                  Fase 3: Gestión Multi-OV
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Múltiples Órdenes de Venta asociadas por proyecto.
                </p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <FileCheck2 className="w-4 h-4" />
                  Fase 4: Capacidad (192h / 20% Ocio)
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Capacidad efectiva de {EFFECTIVE_MONTHLY_CAPACITY}h por integrante ({IDLE_TIME_HOURS}h de margen).
                </p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <FileCheck2 className="w-4 h-4" />
                  Fase 5: Matriz de Rentabilidad
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Margen Bruto de {financials.grossMarginPercent}% y ${financials.realHourlyYield.toLocaleString('es-CL')}/h rendido.
                </p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Award className="w-4 h-4 text-purple-300" />
                  Fase 6: Cierre & Auditoría
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Reporte unificado y listo para presentación gerencial.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE: MATRIZ DE RIESGO DE PROYECTOS */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-orange-600 animate-pulse" /> Proyectos con Mayor Consumo de Horas (Top 5)
          </h2>
          
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-none">
            {criticalProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium border-dashed border-2 border-slate-100 rounded-2xl">
                No hay proyectos activos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Proyecto / Cliente</th>
                      <th className="px-4 py-3">Fase Actual</th>
                      <th className="px-4 py-3">Consumo de Horas</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {criticalProjects.map(p => {
                      const isCritical = p.risk > 90;
                      const isWarning = p.risk > 75 && p.risk <= 90;

                      return (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-orange-50/30 transition duration-150">
                          <td className="px-4 py-3.5">
                            <div className="font-extrabold text-slate-900">
                              {p.ovNumber ? `${p.ovNumber} - ` : ''}{p.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{p.clientName}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isCritical 
                                ? 'border-rose-200 bg-rose-50 text-rose-700' 
                                : isWarning 
                                ? 'border-amber-200 bg-amber-50 text-amber-700' 
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}>
                              {p.activePhase}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 min-w-[200px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                <span className={`font-extrabold ${isCritical ? 'text-rose-600' : isWarning ? 'text-amber-500' : 'text-emerald-600'}`}>
                                  {p.risk.toFixed(1)}%
                                </span>
                                <span className="text-slate-500 font-medium">{p.consumed} de {p.hoursTotal}h</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(p.risk, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {isCritical ? (
                              <button 
                                onClick={() => onSelectProject(p.id)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-orange-600 px-3 text-xs font-extrabold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer shadow-none border border-orange-500"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Intervenir</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => onSelectProject(p.id)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer shadow-none"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Ver Expediente</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
      )}

      {/* INSPECTOR LATERAL (Se despliega al hacer clic en un usuario) */}
      {selectedMember && (
        <React.Fragment key="user-inspector-container">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity" 
            onClick={() => setSelectedMember(null)}
          />
          <UserInspectorPanel 
            member={selectedMember} 
            onClose={() => setSelectedMember(null)} 
            getUserColor={getUserColor}
            projects={projects}
          />
        </React.Fragment>
      )}

    </div>
  );
};
