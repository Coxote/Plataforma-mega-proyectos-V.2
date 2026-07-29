import React, { useState } from 'react';
import { Project } from '../types';
import { 
  Plus, 
  Search, 
  FolderGit, 
  AlertCircle, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  X,
  Pin,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
  userRole: 'coordinador' | 'sac' | 'contents' | 'contentd' | 'invitado';
  overdueProjectIds?: Set<string>;
  approachingProjectIds?: Set<string>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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
  onToggleCollapse
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <aside 
      className={`bg-white border-r border-slate-200 flex flex-col h-full select-none transition-all duration-300 relative shrink-0 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
      id="main-projects-sidebar"
    >
      {/* 🟢 HEADER SIDEBAR */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-sm text-slate-900 tracking-tight truncate leading-tight">
                PhaseSystem
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                {projects.length} Proyectos Activos
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xs mx-auto">
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        {/* MINIMIZE / COLLAPSE BUTTON */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
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
            className={`w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-2.5 px-3 transition-all cursor-pointer font-bold text-xs shadow-xs ${
              isCollapsed ? 'p-2.5' : ''
            }`}
            title="Nuevo Proyecto"
            id="btn-add-new-project-sidebar"
          >
            <Plus className="w-4 h-4 shrink-0 text-emerald-400" />
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
              className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all"
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

        {filteredProjects.map((project) => {
          const isActive = project.id === activeProjectId;
          const isOverdue = overdueProjectIds.has(project.id);
          const isApproaching = approachingProjectIds.has(project.id);
          const completedPhases = project.phases.filter((p) => p.status === 'completed').length;

          return (
            <div
              key={project.id}
              className={`group relative flex items-center justify-between rounded-2xl transition-all ${
                isCollapsed ? 'p-2 justify-center' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : isOverdue
                  ? 'bg-rose-50/80 text-rose-950 hover:bg-rose-100/80 border border-rose-200/80'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
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
                    <AlertCircle className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-rose-600'} animate-pulse`} />
                  ) : isApproaching ? (
                    <AlertTriangle className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-amber-600'}`} />
                  ) : (
                    <FolderGit className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs truncate block ${isActive ? 'text-white font-black' : 'font-semibold text-slate-800'}`}>
                        {project.name}
                      </span>
                      {isOverdue && (
                        <span className="text-[9px] font-black uppercase bg-rose-600 text-white px-1.5 py-0.2 rounded shrink-0">
                          Vencido
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] truncate block ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      {project.clientName || 'Cliente no asignado'}
                    </span>
                  </div>
                )}
              </button>

              {!isCollapsed && (
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {isActive ? (
                    <Pin className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {completedPhases}/{project.phases.length}
                    </span>
                  )}

                  {(userRole === 'coordinador' || userRole === 'sac') && projects.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                        isActive 
                          ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' 
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
