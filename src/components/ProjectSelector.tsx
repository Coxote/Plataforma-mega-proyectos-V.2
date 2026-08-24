import { Project } from '../types';
import { FolderKanban, Plus, Trash2, FolderGit, AlertCircle, AlertTriangle, Star } from 'lucide-react';
import React, { useState } from 'react';

interface ProjectSelectorProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
  userRole: 'coordinador' | 'sac' | 'contents' | 'contentd' | 'invitado';
  overdueProjectIds?: Set<string>;
  approachingProjectIds?: Set<string>;
  followedProjectIds?: string[];
}

export default function ProjectSelector({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  userRole,
  overdueProjectIds = new Set(),
  approachingProjectIds = new Set(),
  followedProjectIds = [],
}: ProjectSelectorProps) {
  const [filterFollowedOnly, setFilterFollowedOnly] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const isActiveOverdue = activeProject && overdueProjectIds.has(activeProject.id);
  const isActiveApproaching = activeProject && approachingProjectIds.has(activeProject.id);

  // Sort projects: Followed first, then others
  const sortedProjects = [...projects].sort((a, b) => {
    const aFollowed = followedProjectIds.includes(a.id);
    const bFollowed = followedProjectIds.includes(b.id);
    if (aFollowed && !bFollowed) return -1;
    if (!aFollowed && bFollowed) return 1;
    return 0;
  });

  const displayedProjects = filterFollowedOnly
    ? sortedProjects.filter((p) => followedProjectIds.includes(p.id))
    : sortedProjects;

  return (
    <div className="border-b border-slate-200 bg-white" id="project-selector-container">
      {/* Current Project Header Bar */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isActiveOverdue
              ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500/30 animate-pulse'
              : isActiveApproaching
              ? 'bg-amber-100 text-amber-800'
              : 'bg-lime-400/20 text-lime-800'
          }`}>
            {isActiveOverdue ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : isActiveApproaching ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <FolderKanban className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Proyecto Activo</label>
              {isActiveOverdue && (
                <span className="text-xs font-black uppercase px-1.5 py-0.2 bg-rose-600 text-white rounded">Vencido</span>
              )}
              {activeProject && followedProjectIds.includes(activeProject.id) && (
                <span className="text-xs font-black uppercase px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Seguido
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-900 truncate">
              {activeProject ? activeProject.name : 'Seleccionar...'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {followedProjectIds.length > 0 && (
            <button
              onClick={() => setFilterFollowedOnly(!filterFollowedOnly)}
              className={`p-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                filterFollowedOnly
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
              }`}
              title={filterFollowedOnly ? "Mostrar todos los proyectos" : "Filtrar por mis proyectos seguidos"}
            >
              <Star className={`w-3.5 h-3.5 ${filterFollowedOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Seguidos</span>
            </button>
          )}

          {(userRole === 'coordinador' || userRole === 'sac') && (
            <button
              onClick={onAddProject}
              className="p-2 text-slate-500 hover:text-lime-600 hover:bg-lime-50 rounded-lg transition-colors cursor-pointer"
              title="Nuevo Proyecto"
              id="btn-add-project"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Project Switcher List */}
      <div className="px-3 pb-3 max-h-40 overflow-y-auto space-y-1 border-t border-slate-100 pt-2" id="project-list">
        {displayedProjects.map((project) => {
          const isActive = project.id === activeProjectId;
          const completedPhases = project.phases.filter((p) => p.status === 'completed').length;
          const isOverdue = overdueProjectIds.has(project.id);
          const isApproaching = approachingProjectIds.has(project.id);
          const isFollowed = followedProjectIds.includes(project.id);

          return (
            <div
              key={project.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                isOverdue
                  ? isActive
                    ? 'bg-rose-50 font-bold text-rose-950 border border-rose-300 shadow-xs'
                    : 'bg-rose-50/50 hover:bg-rose-100/70 text-rose-900 border border-rose-200/60'
                  : isActive
                  ? 'bg-slate-100 font-bold text-slate-900 border border-slate-200/50 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <button
                onClick={() => onSelectProject(project.id)}
                className="flex-1 text-left min-w-0 flex items-center gap-2 cursor-pointer py-0.5"
              >
                {isOverdue ? (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 animate-pulse" />
                ) : isApproaching ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                ) : (
                  <FolderGit className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-lime-600' : 'text-slate-400'}`} />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-semibold">{project.name}</p>
                    {isFollowed && (
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" title="Proyecto Seguido" />
                    )}
                    {isOverdue && (
                      <span className="text-xs font-black px-1 py-0.2 bg-rose-600 text-white rounded shrink-0">SLA Vencido</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate font-medium">{project.clientName}</p>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0 ml-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold border ${
                  isOverdue
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}>
                  {completedPhases}/{project.phases.length}
                </span>

                {projects.length > 1 && (userRole === 'coordinador' || userRole === 'sac') && (
                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-opacity cursor-pointer"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

