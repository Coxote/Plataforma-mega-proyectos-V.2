import React from 'react';
import { X, Clock, Briefcase, Award, TrendingUp, Sparkles, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { VitaminizedMember } from './TeamCard';
import { Project } from '../types';

interface UserInspectorPanelProps {
  member: VitaminizedMember | null;
  onClose: () => void;
  getUserColor: (role: string) => string;
  projects: Project[];
}

export const UserInspectorPanel: React.FC<UserInspectorPanelProps> = ({ 
  member, 
  onClose, 
  getUserColor,
  projects 
}) => {
  if (!member) return null;

  // Filter actual projects assigned/allocated to this user's role
  const assignedProjects = projects.filter(p => {
    if (!p.budget) return false;
    const roleKey = member.role;
    const allocated = p.budget[roleKey]?.allocated || 0;
    return allocated > 0;
  });

  return (
    <div 
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300"
      id="team-inspector-panel"
    >
      {/* Header del Inspector */}
      <div className="p-6 border-b border-slate-150 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-32 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${getUserColor(member.role)} border border-white/20`} />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ficha Inspector Operativo</p>
          </div>
          <h2 className="font-extrabold text-2xl capitalize text-white tracking-tight">{member.username}</h2>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-0.5">{member.puesto || member.role}</p>
        </div>
        
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer z-10 border border-slate-800"
          title="Cerrar inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenido Desglosado */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* Bloque de Capacidad y Horas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/50 hover:bg-slate-50 transition-colors">
            <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Capacidad Mensual</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{member.monthlyCapacity}</span>
              <span className="text-xs text-slate-400 font-bold">horas</span>
            </div>
          </div>
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/50 hover:bg-slate-50 transition-colors">
            <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Horas Consumidas</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">{member.loadedHours}</span>
              <span className="text-xs text-emerald-400 font-bold">horas</span>
            </div>
          </div>
        </div>

        {/* Especialidades Asignadas */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" /> Especialidades Asignadas
          </h3>
          <div className="flex flex-wrap gap-2">
            {member.skills.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium italic">Sin habilidades registradas en este período.</span>
            ) : (
              member.skills.map((skill) => (
                <span key={skill} className="text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-bold border border-slate-200/80 flex items-center gap-1.5 uppercase tracking-wider transition-all hover:bg-slate-100">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Desglose por Proyectos */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-600" /> Proyectos Activos e Historial
          </h3>
          
          <div className="space-y-3">
            {assignedProjects.length === 0 ? (
              <div className="p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                No tiene presupuestos asignados en proyectos actuales.
              </div>
            ) : (
              assignedProjects.map((p) => {
                const consumed = p.budget ? p.budget[member.role]?.consumed || 0 : 0;
                const allocated = p.budget ? p.budget[member.role]?.allocated || 0 : 0;
                const activePhase = p.phases.find(ph => ph.id === p.activePhaseId);
                const progressPercent = allocated > 0 ? (consumed / allocated) * 100 : 0;

                return (
                  <div key={p.id} className="p-4 bg-white rounded-xl border border-slate-150 hover:shadow-xs transition-shadow flex flex-col gap-2.5">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">{p.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                          Fase: {activePhase?.label || 'Sin Fase'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        activePhase?.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100/50'
                      }`}>
                        {activePhase?.status === 'completed' ? 'Completado' : 'En Curso'}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-bold mb-1">
                        <span>Consumo: {consumed}h / {allocated}h</span>
                        <span className={progressPercent > 100 ? "text-rose-600 font-extrabold" : "text-slate-700"}>
                          {progressPercent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            progressPercent > 100 ? 'bg-rose-500' : progressPercent > 80 ? 'bg-amber-500' : 'bg-slate-900'
                          }`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Desglose Temporal (Semanal y Diario) */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" /> Desglose Temporal de Carga
          </h3>
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-3 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Semana Actual (S30)
              </span>
              <span className="font-extrabold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                {Math.round(member.loadedHours * 0.25)}h
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Semana Anterior (S29)
              </span>
              <span className="font-extrabold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                {Math.round(member.loadedHours * 0.3)}h
              </span>
            </div>
            <div className="border-t border-slate-200/80 pt-3 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600 font-bold">Promedio Diario</span>
              </div>
              <span className="font-extrabold text-slate-900 text-sm">
                {(member.loadedHours > 0 ? (member.loadedHours / 20).toFixed(1) : '0.0')}h / día
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
