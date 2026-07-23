import { Project } from '../types';
import { FolderKanban, Plus, Trash2, FolderGit } from 'lucide-react';
import React, { useState } from 'react';

interface ProjectSelectorProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
  userRole: 'coordinador' | 'sac' | 'contents' | 'contentd' | 'invitado';
}

export default function ProjectSelector({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  userRole,
}: ProjectSelectorProps) {

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="border-b border-slate-200 bg-white" id="project-selector-container">
      {/* Current Project Header Bar */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-lime-400/20 text-lime-800 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Proyecto Activo</label>
            <h3 className="font-bold text-sm text-slate-900 truncate">
              {activeProject ? activeProject.name : 'Seleccionar...'}
            </h3>
          </div>
        </div>
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

      {/* Project Switcher List */}
      <div className="px-3 pb-3 max-h-40 overflow-y-auto space-y-1 border-t border-slate-100 pt-2" id="project-list">
        {projects.map((project) => {
          const isActive = project.id === activeProjectId;
          const completedPhases = project.phases.filter((p) => p.status === 'completed').length;
          
          return (
            <div
              key={project.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                isActive
                  ? 'bg-slate-100 font-bold text-slate-900 border border-slate-200/50 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <button
                onClick={() => onSelectProject(project.id)}
                className="flex-1 text-left min-w-0 flex items-center gap-2 cursor-pointer py-0.5"
              >
                <FolderGit className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-lime-600' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{project.name}</p>
                  <p className="text-[10px] text-slate-400 truncate font-medium">{project.clientName}</p>
                </div>
              </button>
              
              <div className="flex items-center gap-2 shrink-0 ml-1">
                <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-full text-slate-500 font-bold">
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
