import React from 'react';
import { 
  X, 
  Search, 
  Briefcase, 
  Activity, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Filter, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Project, UserSession, getUserAvatarUrl } from '../types';
import { KpiType } from '../hooks/useKpiSidePanel';

interface KpiSidePanelProps {
  activeKpi: KpiType;
  isOpen: boolean;
  searchQuery: string;
  statusFilter: string;
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  projects: Project[];
  users: UserSession[];
  userWorkloadSummary: Array<{
    user: UserSession;
    totalTasksCount: number;
    totalHours: number;
    saturationLabel: string;
    saturationBadgeBg: string;
    completionRatio: number;
    userTasks: Array<{ id: string; brand: string; project: string }>;
  }>;
}

export const KpiSidePanel: React.FC<KpiSidePanelProps> = ({
  activeKpi,
  isOpen,
  searchQuery,
  statusFilter,
  onClose,
  onSearchChange,
  onFilterChange,
  projects = [],
  users = [],
  userWorkloadSummary = []
}) => {
  if (!isOpen || !activeKpi) return null;

  // Render titles and badges
  const getPanelMeta = () => {
    switch (activeKpi) {
      case 'active_projects':
        return {
          title: 'Detalle de Proyectos Activos',
          subtitle: 'Portafolio de proyectos en ejecución y métricas de salud',
          icon: <Briefcase className="w-5 h-5 text-indigo-600" />,
          badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          filters: [
            { id: 'todos', label: 'Todos' },
            { id: 'optima', label: 'Salud Óptima (≥80%)' },
            { id: 'atencion', label: 'Atención (<80%)' },
          ]
        };
      case 'agency_utilization':
        return {
          title: 'Utilización por Equipo',
          subtitle: 'Distribución de carga operativa y capacidad del escuadrón',
          icon: <Activity className="w-5 h-5 text-emerald-600" />,
          badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          filters: [
            { id: 'todos', label: 'Todos' },
            { id: 'alta_carga', label: 'Alta Carga' },
            { id: 'optimo', label: 'Carga Balanceada' },
          ]
        };
      case 'pending_approvals':
        return {
          title: 'Aprobaciones & Entregables',
          subtitle: 'Listado de entregables pendientes de revisión interna o del cliente',
          icon: <FileCheck className="w-5 h-5 text-amber-600" />,
          badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
          filters: [
            { id: 'todos', label: 'Todos' },
            { id: 'en_revision', label: 'Revisión Interna' },
            { id: 'pendiente', label: 'Pendiente Cliente' },
          ]
        };
    }
  };

  const meta = getPanelMeta();

  // Filter Active Projects
  const filteredProjects = projects.filter(proj => {
    const activePhase = proj.phases.find(ph => ph.id === proj.activePhaseId) || proj.phases.find(ph => ph.status === 'active');
    const isCompleted = proj.phases.every(ph => ph.status === 'completed');
    if (isCompleted) return false;

    // Search query
    const matchesSearch = searchQuery.trim() === '' || 
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activePhase?.label || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    if (!matchesSearch) return false;
    if (statusFilter === 'optima') return proj.health >= 80;
    if (statusFilter === 'atencion') return proj.health < 80;
    return true;
  });

  // Filter Workload Summary
  const filteredWorkload = userWorkloadSummary.filter(item => {
    const matchesSearch = searchQuery.trim() === '' ||
      item.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user.puesto || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'alta_carga') return item.saturationLabel.includes('Sobrecargado') || item.saturationLabel.includes('Carga Alta');
    if (statusFilter === 'optimo') return item.saturationLabel.includes('Óptima') || item.saturationLabel.includes('Disponible');
    return true;
  });

  // Filter Pending Deliverables
  const allPendingDeliverables: Array<{
    id: string;
    title: string;
    projectName: string;
    clientName: string;
    status: string;
    deadline?: string;
  }> = [];

  projects.forEach(p => {
    (p.deliverables || []).forEach(d => {
      if (d.status === 'pendiente' || d.status === 'en_revision') {
        allPendingDeliverables.push({
          id: d.id,
          title: d.title,
          projectName: p.name,
          clientName: p.clientName,
          status: d.status,
          deadline: d.deadline
        });
      }
    });
  });

  const filteredDeliverables = allPendingDeliverables.filter(del => {
    const matchesSearch = searchQuery.trim() === '' ||
      del.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'en_revision') return del.status === 'en_revision';
    if (statusFilter === 'pendiente') return del.status === 'pendiente';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-slideLeft">
          
          {/* Header */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 sm:p-2.5 rounded-2xl border shadow-2xs shrink-0 ${meta.badgeBg}`}>
                {meta.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">{meta.title}</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">{meta.subtitle}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Cerrar panel lateral"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Pill Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 bg-white space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Buscar por nombre, cliente, responsable..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 rounded-full border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Pill Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Filtrar:
              </span>
              {meta.filters.map(f => (
                <button
                  key={f.id}
                  onClick={() => onFilterChange(f.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all shrink-0 cursor-pointer min-h-[32px] flex items-center justify-center ${
                    statusFilter === f.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200/80 hover:bg-slate-200/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Main Content Area */}
          <div className="p-3.5 sm:p-5 flex-1 overflow-y-auto space-y-3">
            
            {/* ACTIVE PROJECTS LIST */}
            {activeKpi === 'active_projects' && (
              <>
                {filteredProjects.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">No se encontraron proyectos activos con el criterio seleccionado.</p>
                  </div>
                ) : (
                  filteredProjects.map(proj => {
                    const activePhase = proj.phases.find(ph => ph.id === proj.activePhaseId) || proj.phases.find(ph => ph.status === 'active');
                    const completedPhasesCount = proj.phases.filter(ph => ph.status === 'completed').length;
                    const totalPhases = proj.phases.length;

                    return (
                      <div 
                        key={proj.id} 
                        className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              {proj.clientName || 'Cliente'}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">{proj.name}</h4>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 ${
                            proj.health >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            proj.health >= 60 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {proj.health}% Salud
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Fase: {activePhase ? activePhase.label : 'Sin Fase'}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Avance: {completedPhasesCount}/{totalPhases} Fases
                          </span>
                        </div>

                        {/* Phase Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                          <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round((completedPhasesCount / (totalPhases || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* AGENCY UTILIZATION LIST */}
            {activeKpi === 'agency_utilization' && (
              <>
                {filteredWorkload.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">No se encontraron miembros del equipo con los filtros aplicados.</p>
                  </div>
                ) : (
                  filteredWorkload.map(item => {
                    const { user, totalTasksCount, totalHours, saturationLabel, saturationBadgeBg, completionRatio, userTasks } = item;

                    return (
                      <div key={user.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-2xs hover:border-emerald-300 transition-all">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={getUserAvatarUrl(user.username)} 
                              alt={user.username} 
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="text-sm font-black text-slate-900 capitalize">{user.username}</h4>
                              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">{user.puesto || user.role}</span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${saturationBadgeBg}`}>
                            {saturationLabel}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Tareas</span>
                            <span className="text-xs font-black text-slate-800">{totalTasksCount}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Horas</span>
                            <span className="text-xs font-black text-indigo-700">{totalHours}h</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Completado</span>
                            <span className="text-xs font-black text-emerald-700">{completionRatio}%</span>
                          </div>
                        </div>

                        {userTasks.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Proyectos Activos:</span>
                            <div className="flex flex-wrap gap-1">
                              {userTasks.map(t => (
                                <span key={t.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                                  {t.brand}: {t.project}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* PENDING APPROVALS LIST */}
            {activeKpi === 'pending_approvals' && (
              <>
                {filteredDeliverables.length === 0 ? (
                  <div className="p-8 text-center bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-black text-emerald-900">¡Al Día!</h4>
                    <p className="text-xs text-emerald-700 font-medium">No hay entregables pendientes con los filtros seleccionados.</p>
                  </div>
                ) : (
                  filteredDeliverables.map(del => (
                    <div 
                      key={del.id} 
                      className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 hover:bg-white hover:border-amber-300 transition-all space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                          {del.status === 'en_revision' ? 'Revisión Interna' : 'Pendiente Cliente'}
                        </span>
                        {del.deadline && (
                          <span className="text-[10px] font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                            {del.deadline}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900">{del.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Proyecto: <strong className="text-slate-800">{del.projectName}</strong> ({del.clientName})
                      </p>
                    </div>
                  ))
                )}
              </>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              SaaS Phase System · Drill-Down
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              Cerrar Panel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
