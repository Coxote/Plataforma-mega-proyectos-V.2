import React, { useState, useMemo } from 'react';
import { Project, UserSession } from '../types';
import { calculateGlobalFinancials, calculateTeamWorkload, ROLE_CAPACITIES } from '../dashboardUtils';
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
  Briefcase
} from 'lucide-react';
import { TeamCard, VitaminizedMember } from './TeamCard';
import { UserInspectorPanel } from './UserInspectorPanel';

interface Props {
  projects: Project[];
  users: UserSession[];
  onSelectProject: (projectId: string) => void;
}

export const CoordinatorDashboard: React.FC<Props> = ({ projects, users, onSelectProject }) => {
  const [selectedMember, setSelectedMember] = useState<VitaminizedMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'saturation' | 'name'>('saturation');

  const financials = useMemo(() => calculateGlobalFinancials(projects), [projects]);
  
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
        monthlyCapacity: ROLE_CAPACITIES[load.role] || 160,
        loadedHours: load.consumedHours,
        assignedHours: load.assignedHours,
        saturation: load.assignedHours > 0 ? (load.consumedHours / load.assignedHours) * 100 : 0,
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
      
      {/* Header Superior Interno */}
      <div className="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Herramienta del Administrador
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Torre de Control de Operaciones</h1>
          <p className="text-xs text-slate-500 font-medium">Radiografía instantánea del equipo, finanzas y mitigación de desviaciones.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Últimos 30 días</span>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable del Dashboard */}
      <div className="flex-1 p-8 overflow-y-auto space-y-8">
        
        {/* ZONA DE KPIS FINANCIEROS Y OPERATIVOS (Banda Ejecutiva Compacta) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
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
