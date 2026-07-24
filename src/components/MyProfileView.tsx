import React, { useState } from 'react';
import { Project, UserSession, getUserAvatarUrl } from '../types';
import { User, Clock, AlertTriangle, CheckCircle2, Briefcase, CalendarDays, Shield, Layers, TrendingUp, Filter } from 'lucide-react';
import { GROSS_MONTHLY_CAPACITY, IDLE_TIME_HOURS, EFFECTIVE_MONTHLY_CAPACITY } from '../dashboardUtils';

interface MyProfileViewProps {
  currentUser: UserSession;
  projects: Project[];
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({ currentUser, projects }) => {
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Collect all time entries logged by currentUser across all projects
  const userEntries: Array<{
    id: string;
    projectId: string;
    projectName: string;
    clientName: string;
    hours: number;
    date: string;
    description: string;
    type?: string;
    retrabajoOrigen?: string;
    retrabajoMotivo?: string;
    phaseId?: string;
  }> = [];

  const assignedProjects = projects.filter(p => 
    currentUser.role === 'coordinador' || p.members?.some(m => m.id === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase())
  );

  projects.forEach(p => {
    (p.timeEntries || []).forEach(e => {
      if (e.userId === currentUser.id || e.username?.toLowerCase() === currentUser.username.toLowerCase()) {
        userEntries.push({
          id: e.id,
          projectId: p.id,
          projectName: p.name,
          clientName: p.clientName,
          hours: e.hours || 0,
          date: e.date || new Date().toISOString().split('T')[0],
          description: e.description || '',
          type: e.type || 'normal',
          retrabajoOrigen: e.retrabajoOrigen,
          retrabajoMotivo: e.retrabajoMotivo,
          phaseId: e.phaseId
        });
      }
    });
  });

  // Calculate totals for currentUser
  const totalLoggedHours = userEntries.reduce((sum, e) => sum + e.hours, 0);
  const retrabajoEntries = userEntries.filter(e => e.type === 'retrabajo');
  const totalRetrabajoHours = retrabajoEntries.reduce((sum, e) => sum + e.hours, 0);
  const retrabajoPercentage = totalLoggedHours > 0 ? (totalRetrabajoHours / totalLoggedHours) * 100 : 0;

  const targetCapacity = currentUser.capacidadMensualHoras || EFFECTIVE_MONTHLY_CAPACITY;
  const loadPercentage = Math.min(100, Math.round((totalLoggedHours / targetCapacity) * 100));

  // Filter userEntries for history table
  const filteredEntries = userEntries.filter(e => {
    if (filterProject !== 'all' && e.projectId !== filterProject) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-50" id="my-profile-view">
      
      {/* HEADER DE IDENTIDAD */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-2 border-orange-500 shadow-xl overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
              <img
                src={getUserAvatarUrl(currentUser.username)}
                alt={currentUser.username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold capitalize">
                <User className="w-3.5 h-3.5" />
                {currentUser.puesto || currentUser.role}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight capitalize">
                {currentUser.username}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Panel Personal de Carga de Horas, Capacidad Mensual y Seguimiento de Retrabajo
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/90 px-4 py-2.5 rounded-2xl border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacidad Mensual (Meta)</span>
              <span className="text-lg font-black text-white">{targetCapacity}h / mes</span>
            </div>
          </div>
        </div>

        {/* METRICAS DE CAPACIDAD Y OCIO (192h - 20% OCIO) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800 relative z-10">
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Horas Registradas</span>
            <span className="text-2xl font-black text-white">{totalLoggedHours}h</span>
            <span className="text-[10px] text-slate-400 block">{loadPercentage}% de capacidad consumida</span>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Margen de Ocio (20%)</span>
            <span className="text-2xl font-black text-cyan-400">{IDLE_TIME_HOURS}h</span>
            <span className="text-[10px] text-slate-400 block">Formación & gestión administrativa</span>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Horas de Retrabajo</span>
            <span className="text-2xl font-black text-amber-400">{totalRetrabajoHours}h</span>
            <span className="text-[10px] text-slate-400 block">{retrabajoPercentage.toFixed(1)}% de tus horas</span>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Proyectos Activos</span>
            <span className="text-2xl font-black text-emerald-400">{assignedProjects.length}</span>
            <span className="text-[10px] text-slate-400 block">En los que participas</span>
          </div>
        </div>

        {/* BARRA DE CAPACIDAD INDIVIDUAL */}
        <div className="space-y-1.5 pt-2 relative z-10">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Ocupación Mensual Relativa</span>
            <span className="text-orange-400 font-mono">{totalLoggedHours} / {targetCapacity} hrs</span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                loadPercentage > 100 ? 'bg-rose-500' : loadPercentage > 85 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, loadPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: PROYECTOS ASIGNADOS */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-orange-600" />
          Proyectos Asignados y Consumo Individual
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedProjects.map(p => {
            const myProjEntries = userEntries.filter(e => e.projectId === p.id);
            const myProjHours = myProjEntries.reduce((s, e) => s + e.hours, 0);
            const myRetrabajoProjHours = myProjEntries.filter(e => e.type === 'retrabajo').reduce((s, e) => s + e.hours, 0);

            return (
              <div key={p.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-900 truncate max-w-[180px]">{p.name}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                    {p.clientName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Horas Cargadas</span>
                    <span className="text-base font-black text-slate-800">{myProjHours}h</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Retrabajo</span>
                    <span className="text-base font-black text-amber-600">{myRetrabajoProjHours}h</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: HISTORIAL DETALLADO DE REGISTROS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" /> Historial de Horas Registradas ({filteredEntries.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Listado cronológico de horas imputadas en tus proyectos</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por Proyecto */}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">Todos los proyectos</option>
              {assignedProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Filtro por Tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">Todos los tipos</option>
              <option value="normal">Normal</option>
              <option value="retrabajo">Retrabajo</option>
              <option value="no_facturable">No Facturable</option>
            </select>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            No hay registros de horas guardados con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Proyecto</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Descripción / Motivo</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {entry.projectName}
                      <span className="block text-[10px] font-normal text-slate-400">{entry.clientName}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {entry.type === 'retrabajo' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                          ⚠️ Retrabajo ({entry.retrabajoOrigen || 'cliente'})
                        </span>
                      ) : entry.type === 'no_facturable' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          No Facturable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium max-w-md">
                      {entry.description}
                      {entry.retrabajoMotivo && entry.retrabajoMotivo !== entry.description && (
                        <span className="block text-[10px] text-amber-700 font-semibold italic mt-0.5">
                          Motivo: {entry.retrabajoMotivo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm whitespace-nowrap">
                      {entry.hours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
