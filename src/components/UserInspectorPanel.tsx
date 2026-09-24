import React, { useMemo } from 'react';
import { X, Clock, Briefcase, Award, TrendingUp, Sparkles, AlertCircle, CheckCircle, Calendar, RotateCcw } from 'lucide-react';
import { VitaminizedMember } from './TeamCard';
import { Project, getUserAvatarUrl } from '../types';
import { getRetrabajoBadgeStyle } from '../dashboardUtils';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { MinimalChartTooltip } from './MinimalChartTooltip';

interface UserInspectorPanelProps {
  member: VitaminizedMember | null;
  onClose: () => void;
  getUserColor: (role: string) => string;
  projects: Project[];
}

// Map roles to hexadecimal colors for the chart fill and stroke
const getRoleHexColor = (role: string): string => {
  switch (role) {
    case 'coordinador':
      return '#0f172a'; // slate-900
    case 'sac':
      return '#059669'; // emerald-600
    case 'contents':
      return '#9333ea'; // purple-600
    case 'contentd':
      return '#2563eb'; // blue-600
    case 'invitado':
      return '#f59e0b'; // amber-500
    default:
      return '#64748b'; // slate-500
  }
};

// Map skills to values
const getSkillsData = (role: string, skills: string[]) => {
  const skillValues: Record<string, number> = {
    // Coordinador
    'Gestión': 95,
    'Finanzas': 90,
    'Liderazgo': 92,
    'Planificación': 88,
    'Comunicación': 85,
    // SAC
    'Cuentas': 92,
    'Figma Inspect': 85,
    'Copywriting': 80,
    'Soporte': 95,
    'Negociación': 88,
    // ContentS
    'Social Media': 94,
    'Estrategia': 90,
    'SEO': 85,
    'Redacción': 88,
    'Analítica': 80,
    // ContentD
    'UI/UX Refactor': 92,
    'Illustrator': 95,
    'Branding': 90,
    'Animación': 80,
    'Prototipado': 85,
    // Other / Dynamic
    'Game Dev': 75,
    'UX/UI': 90,
    'Marketing': 85,
    'Invitado': 60,
  };

  const baseSkills = [...skills];

  let defaultRoleSkills: string[] = [];
  if (role === 'coordinador') {
    defaultRoleSkills = ['Gestión', 'Finanzas', 'Liderazgo', 'Planificación', 'Comunicación'];
  } else if (role === 'sac') {
    defaultRoleSkills = ['Cuentas', 'Figma Inspect', 'Copywriting', 'Soporte', 'Negociación'];
  } else if (role === 'contents') {
    defaultRoleSkills = ['Social Media', 'Estrategia', 'SEO', 'Redacción', 'Analítica'];
  } else if (role === 'contentd') {
    defaultRoleSkills = ['UI/UX Refactor', 'Illustrator', 'Branding', 'Animación', 'Prototipado'];
  } else {
    defaultRoleSkills = ['Feedback', 'Revisión', 'Colaboración', 'Priorización', 'Validaciones'];
  }

  const allSkillsSet = new Set([...baseSkills, ...defaultRoleSkills]);
  const finalSkills = Array.from(allSkillsSet).slice(0, 5);

  return finalSkills.map(skill => ({
    subject: skill,
    value: skillValues[skill] || (75 + (skill.charCodeAt(0) % 15)),
    fullMark: 100,
  }));
};

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

  // Retrabajo calculation for this member
  const userRetrabajo = useMemo(() => {
    let total = 0;
    let retrabajo = 0;
    projects.forEach(p => {
      (p.timeEntries || []).forEach(e => {
        if (e.userId === member.id || e.username?.toLowerCase() === member.username?.toLowerCase()) {
          total += e.hours || 0;
          if (e.type === 'retrabajo') {
            retrabajo += e.hours || 0;
          }
        }
      });
    });
    const percent = total > 0 ? (retrabajo / total) * 100 : 0;
    return { total, retrabajo, percent };
  }, [projects, member]);

  const retrabajoBadge = getRetrabajoBadgeStyle(userRetrabajo.percent);

  return (
    <div
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300"
      id="team-inspector-panel"
    >
      {/* Header del Inspector - Estilo Centrado con Foto de Perfil Grande */}
      <div className="p-8 bg-[#ECEEE9] text-slate-900 flex flex-col items-center relative overflow-hidden text-center" id="team-inspector-header">
        {/* Close button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-stone-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer z-10 bg-white shadow-xs"
          title="Cerrar inspector"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Large Profile Photo - Circular with soft shadow and white border */}
        <div className="relative mt-2 z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-md overflow-hidden relative">
            <img
              src={getUserAvatarUrl(member.username)}
              alt={member.username}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Circular role dot badge */}
          <span className={`absolute bottom-0 right-1 w-5 h-5 rounded-full ${getUserColor(member.role)} border-2 border-white shadow-xs`} />
        </div>

        <div className="z-10 mt-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Ficha Inspector Operativo</p>
          <h2 className="font-semibold text-2xl capitalize text-slate-900 tracking-tight leading-tight">{member.username}</h2>
          <p className="text-xs text-slate-500 font-normal uppercase tracking-wider mt-1">{member.puesto || member.role}</p>
        </div>
      </div>

      {/* Contenido Desglosado */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#F4F5F0]">

        {/* Bloque de Capacidad, Horas y Retrabajo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Capacidad</span>
              <span className="text-xs bg-stone-100 text-slate-800 font-semibold px-2 py-0.5 rounded-full">
                192h
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold font-display text-slate-900">{member.effectiveCapacity || 153.6}</span>
              <span className="text-xs text-slate-500 font-normal">h efectivas</span>
            </div>
            <span className="text-xs text-slate-500 font-normal block mt-1">
              Buffer (20%): <strong className="text-slate-700 font-semibold">{member.idleBuffer || 38.4}h</strong>
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-xs">
            <span className="text-xs text-slate-500 font-semibold block mb-1 uppercase tracking-wider">Horas Ejecutadas</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold font-display text-slate-900">{member.loadedHours}</span>
              <span className="text-xs text-slate-500 font-normal">h / {member.assignedHours}h</span>
            </div>
            <span className="text-xs text-slate-500 font-normal block mt-1">
              Saturación: <strong className={member.loadedHours > (member.effectiveCapacity || 153.6) ? 'text-rose-600 font-semibold' : 'text-slate-700 font-semibold'}>
                {(((member.loadedHours) / (member.effectiveCapacity || 153.6)) * 100).toFixed(0)}%
              </strong>
            </span>
          </div>

          <div className={`p-4 rounded-2xl shadow-xs ${retrabajoBadge.bg}`}>
            <span className="text-xs font-semibold block mb-1 uppercase tracking-wider text-slate-700">Retrabajo</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold font-display text-slate-900">{userRetrabajo.retrabajo}</span>
              <span className="text-xs font-normal text-slate-600">h ({userRetrabajo.percent.toFixed(0)}%)</span>
            </div>
            <span className="text-xs text-slate-500 font-normal block mt-1 truncate">
              {retrabajoBadge.label}
            </span>
          </div>
        </div>

        {/* Especialidades Asignadas - Representadas en un Gráfico Radial */}
        <div className="bg-white p-5 rounded-3xl shadow-xs" id="specialties-radar-container">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-500" /> Especialidades y Perfil Radar
          </h3>

          <div className="w-full h-[220px] flex items-center justify-center mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getSkillsData(member.role, member.skills)}>
                <PolarGrid stroke="none" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={false}
                  axisLine={false}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<MinimalChartTooltip valueFormatter={(val) => `${val}%`} />}
                />
                <Radar
                  name={member.username}
                  dataKey="value"
                  stroke="#000000"
                  strokeWidth={2}
                  fill="#c6ef4e"
                  fillOpacity={1}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center pt-3 border-t border-stone-100">
            {member.skills.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium italic">Sin habilidades registradas en este período.</span>
            ) : (
              member.skills.map((skill) => (
                <span key={skill} className="text-xs bg-[#F4F5F0] text-slate-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider transition-all hover:bg-stone-200">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Desglose por Proyectos */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-600" /> Proyectos Activos e Historial
          </h3>

          <div className="space-y-3">
            {assignedProjects.length === 0 ? (
              <div className="p-6 bg-white rounded-3xl text-center text-xs text-slate-400 font-medium shadow-xs">
                No tiene presupuestos asignados en proyectos actuales.
              </div>
            ) : (
              assignedProjects.map((p) => {
                const consumed = p.budget ? p.budget[member.role]?.consumed || 0 : 0;
                const allocated = p.budget ? p.budget[member.role]?.allocated || 0 : 0;
                const activePhase = p.phases.find(ph => ph.id === p.activePhaseId);
                const progressPercent = allocated > 0 ? (consumed / allocated) * 100 : 0;

                return (
                  <div key={p.id} className="p-4 bg-white rounded-2xl shadow-xs hover:shadow-sm transition-shadow flex flex-col gap-2.5">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">{p.name}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                          Fase: {activePhase?.label || 'Sin Fase'}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        activePhase?.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {activePhase?.status === 'completed' ? 'Completado' : 'En Curso'}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-500 font-bold mb-1">
                        <span>Consumo: {consumed}h / {allocated}h</span>
                        <span className={progressPercent > 100 ? "text-rose-600 font-extrabold" : "text-slate-700"}>
                          {progressPercent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#F4F5F0] h-2 rounded-full overflow-hidden">
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" /> Desglose Temporal de Carga
          </h3>
          <div className="p-5 bg-white rounded-3xl shadow-xs space-y-3 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Semana Actual (S30)
              </span>
              <span className="font-extrabold text-slate-800 bg-[#F4F5F0] px-2.5 py-1 rounded-full">
                {Math.round(member.loadedHours * 0.25)}h
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Semana Anterior (S29)
              </span>
              <span className="font-extrabold text-slate-800 bg-[#F4F5F0] px-2.5 py-1 rounded-full">
                {Math.round(member.loadedHours * 0.3)}h
              </span>
            </div>
            <div className="border-t border-stone-100 pt-3 flex justify-between items-center">
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
