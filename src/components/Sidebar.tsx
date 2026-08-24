import React, { useState } from 'react';
import { Project, Role, UserSession } from '../types';
import { TppLogo } from './TppLogo';
import { 
  Plus, 
  Search, 
  FolderGit, 
  AlertCircle, 
  AlertTriangle, 
  Trash2, 
  X,
  Pin,
  PanelLeftClose,
  PanelLeftOpen,
  Star
} from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
  userRole: Role;
  overdueProjectIds?: Set<string>;
  approachingProjectIds?: Set<string>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser?: UserSession;
}

export default function Sidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  userRole,
  overdueProjectIds = new Set(),
  approachingProjectIds = new Set(),
  isCollapsed,
  onToggleCollapse,
  currentUser
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const PINNED_KEY = 'saas_phase_system_pinned_projects_v2';
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (pinnedIds.includes(id)) {
      updated = pinnedIds.filter(pid => pid !== id);
    } else {
      updated = [...pinnedIds, id];
    }
    setPinnedIds(updated);
    localStorage.setItem(PINNED_KEY, JSON.stringify(updated));
  };

  // Filter projects by search term
  const filteredProjects = projects.filter((project) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      project.name.toLowerCase().includes(term) ||
      (project.clientName && project.clientName.toLowerCase().includes(term)) ||
      (project.id && project.id.toLowerCase().includes(term))
    );
  });

  // Sort pinned projects to the top
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return (
    <aside 
      className={`bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex flex-col h-full select-none transition-all duration-300 relative shrink-0 shadow-sm ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
      id="main-projects-sidebar"
    >
      {/* 🟢 HEADER SIDEBAR WITH OFFICIAL TPP LOGO */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed ? (
          <TppLogo size="sm" variant="full" />
        ) : (
          <TppLogo size="sm" variant="icon" className="mx-auto" />
        )}

        {/* MINIMIZE / COLLAPSE BUTTON */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
          title={isCollapsed ? 'Expandir barra lateral' : 'Minimizar barra lateral'}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Minimizar barra lateral'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* 🟢 ACTION ITEM 1: NUEVO PROYECTO */}
      <div className="p-3">
        {(userRole === 'coordinador' || userRole === 'sac') && (
          <button
            onClick={onAddProject}
            className={`w-full flex items-center justify-center gap-2 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl py-2.5 px-3 transition-all cursor-pointer font-bold text-xs shadow-sm active:scale-[0.99] ${
              isCollapsed ? 'p-2.5' : ''
            }`}
            title="Nuevo Proyecto"
            id="btn-add-new-project-sidebar"
          >
            <Plus className="w-4 h-4 shrink-0 text-white" />
            {!isCollapsed && <span className="truncate">Nuevo proyecto</span>}
          </button>
        )}
      </div>

      {/* 🟢 ACTION ITEM 2: BUSCAR PROYECTO */}
      {!isCollapsed ? (
        <div className="px-3 pb-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar proyectos..."
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF5500] focus:border-[#FF5500] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="px-3 pb-2 flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Buscar proyecto"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 🟢 RECIENTES / LISTA DE PROYECTOS */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-none">
        {!isCollapsed && (
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Recientes</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-semibold">
              {filteredProjects.length}
            </span>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-400 font-medium">
            {!isCollapsed ? 'No se encontraron proyectos' : '—'}
          </div>
        )}

        {sortedProjects.map((project) => {
          const isActive = project.id === activeProjectId;
          const isPinned = pinnedIds.includes(project.id);
          const isOverdue = overdueProjectIds.has(project.id);
          const isApproaching = approachingProjectIds.has(project.id);
          const completedPhases = project.phases.filter((p) => p.status === 'completed').length;

          let statusBadgeText = 'en tiempo';
          let badgeTextStyle = 'text-emerald-600 font-bold';

          if (isOverdue) {
            statusBadgeText = 'vencido';
            badgeTextStyle = 'text-rose-600 font-bold';
          } else if (isApproaching) {
            statusBadgeText = 'por vencer';
            badgeTextStyle = 'text-amber-600 font-bold';
          } else if (project.activePhaseId) {
            statusBadgeText = 'activo';
            badgeTextStyle = 'text-sky-600 font-bold';
          }

          return (
            <div
              key={project.id}
              className={`group relative flex items-center justify-between rounded-xl transition-all duration-200 ${
                isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
              } ${
                isActive
                  ? 'bg-orange-50/90 text-[#FF5500] font-bold shadow-2xs border border-orange-200/60'
                  : 'text-slate-700 bg-transparent hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
              }`}
            >
              <button
                onClick={() => onSelectProject(project.id)}
                className={`flex items-center gap-2.5 text-left cursor-pointer min-w-0 ${
                  isCollapsed ? 'w-full justify-center' : 'flex-1'
                }`}
                title={`${project.name} (${project.clientName || 'Sin cliente'})`}
              >
                {/* Status Indicator Icon */}
                <div className="shrink-0 flex items-center justify-center">
                  {isOverdue ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  ) : isApproaching ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <FolderGit className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-xs truncate flex items-center gap-1 ${isActive ? 'text-slate-900 font-bold' : 'font-semibold text-slate-800'}`}>
                        {currentUser?.preferences?.followedProjectIds?.includes(project.id) && (
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" title="Proyecto Seguido" />
                        )}
                        <span className="truncate">{project.name}</span>
                      </span>
                      {/* Text-only status label as requested */}
                      <span className={`text-[10px] ${badgeTextStyle} shrink-0`}>
                        {statusBadgeText}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                      {project.clientName || 'Cliente no asignado'}
                    </span>
                  </div>
                )}
              </button>

              {!isCollapsed && (
                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                  {/* Pin button */}
                  <button
                    onClick={(e) => togglePin(project.id, e)}
                    className={`p-1 rounded-md transition-all cursor-pointer ${
                      isPinned
                        ? 'text-slate-600 bg-slate-200/60'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/40 opacity-0 group-hover:opacity-100'
                    }`}
                    title={isPinned ? 'Despinear proyecto' : 'Pinear proyecto'}
                  >
                    <Pin className={`w-3 h-3 ${isPinned ? 'fill-slate-600 text-slate-600' : ''}`} />
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    {completedPhases}/{project.phases.length}
                  </span>

                  {(userRole === 'coordinador' || userRole === 'sac') && projects.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🟢 FOOTER BAR */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Selecciona un proyecto para abrir su expediente
          </p>
        </div>
      )}
    </aside>
  );
}
