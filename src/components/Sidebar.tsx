import { Phase } from '../types';
import { CheckCircle2, ChevronRight, Activity, HelpCircle } from 'lucide-react';
import React from 'react';

interface SidebarProps {
  phases: Phase[];
  activePhaseId: string;
  onSelectPhase: (id: string) => void;
}

export default function Sidebar({ phases, activePhaseId, onSelectPhase }: SidebarProps) {
  const completedCount = phases.filter((p) => p.status === 'completed').length;
  const activeIndex = phases.findIndex((p) => p.id === activePhaseId);

  return (
    <aside className="bg-white border-r border-slate-200 flex flex-col h-full select-none" id="sidebar-container">
      {/* Sidebar Header Brand */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center font-bold text-slate-900 shadow-sm">
            F
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-slate-900">PhaseSystem</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Internal Tool</p>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="p-4 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Flow Navigation
          </span>
          <span className="text-[10px] text-lime-600 bg-lime-100/50 px-1.5 py-0.5 rounded font-mono font-bold">
            {completedCount}/7 OK
          </span>
        </div>

        <div className="space-y-1">
          {phases.map((phase, idx) => {
            const isActive = phase.id === activePhaseId;
            const isCompleted = phase.status === 'completed';

            return (
              <button
                key={phase.id}
                onClick={() => onSelectPhase(phase.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'font-bold bg-white text-slate-900 border border-slate-200 shadow-sm ring-2 ring-lime-400/20'
                    : isCompleted
                    ? 'font-medium bg-slate-50 text-slate-400 border border-transparent'
                    : 'font-medium text-slate-500 hover:bg-slate-50 border border-transparent transition-colors'
                }`}
                id={`phase-tab-${phase.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono text-xs ${
                      isActive
                        ? 'text-lime-600 font-bold'
                        : isCompleted
                        ? 'text-slate-400 opacity-60'
                        : 'text-slate-400'
                    }`}
                  >
                    {phase.id}
                  </span>
                  <span className={`truncate ${isCompleted && !isActive ? 'line-through opacity-70' : ''}`}>
                    {phase.label}
                  </span>
                </div>

                <div className="flex items-center shrink-0 ml-2">
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-lime-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></div>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Lead Manager Area */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-900 rounded-xl p-4 text-white">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Lead Manager</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
              CV
            </div>
            <div className="text-xs">
              <p className="font-semibold">Carlos Vega</p>
              <p className="text-slate-400 text-[10px]">Senior PM</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
