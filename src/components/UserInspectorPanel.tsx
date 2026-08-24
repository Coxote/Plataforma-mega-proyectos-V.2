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
  ResponsiveContainer
} from 'recharts';

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
    'GestiÃ³n': 95,
    'Finanzas': 90,
    'Liderazgo': 92,
    'PlanificaciÃ³n': 88,
    'ComunicaciÃ³n': 85,
    // SAC
    'Cuentas': 92,
    'Figma Inspect': 85,
    'Copywriting': 80,
    'Soporte': 95,
    'NegociaciÃ³n': 88,
    // ContentS
    'Social Media': 94,
    'Estrategia': 90,
    'SEO': 85,
    'RedacciÃ³n': 88,
    'AnalÃ­tica': 80,
    // ContentD
    'UI/UX Refactor': 92,
    'Illustrator': 95,
    'Branding': 90,
    'AnimaciÃ³n': 80,
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
    defaultRoleSkills = ['GestiÃ³n', 'Finanzas', 'Liderazgo', 'PlanificaciÃ³n', 'ComunicaciÃ³n'];
  } else if (role === 'sac') {
    defaultRoleSkills = ['Cuentas', 'Figma Inspect', 'Copywriting', 'Soporte', 'NegociaciÃ³n'];
  } else if (role === 'contents') {
    defaultRoleSkills = ['Social Media', 'Estrategia', 'SEO', 'RedacciÃ³n', 'AnalÃ­tica'];
  } else if (role === 'contentd') {
    defaultRoleSkills = ['UI/UX Refactor', 'Illustrator', 'Branding', 'AnimaciÃ³n', 'Prototipado'];
  } else {
    defaultRoleSkills = ['Feedback', 'RevisiÃ³n', 'ColaboraciÃ³n', 'PriorizaciÃ³n', 'Validaciones'];
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
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300"
      id="team-inspector-panel"
    >
      {/* Header del Inspector - Estilo Centrado con Foto de Perfil Grande */}
      <div className="p-8 border-b border-slate-200 bg-slate-50 text-slate-900 flex flex-col items-center relative overflow-hidden text-center" id="team-inspector-header">
        <div className="absolute right-0 bottom-0 top-0 w-32 bg-gradient-to-l from-slate-100 to-transparent pointer-events-none" />

        {/* Close button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer z-10 border border-slate-200 bg-white shadow-xs"
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
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Ficha Inspector Operativo</p>
          <h2 className="font-black text-2xl capitalize text-slate-900 tracking-tight leading-tight">{member.username}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{member.puesto || member.role}</p>
        </div>
      </div>

      {/* Contenido Desglosado */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Bloque de Capacidad, Horas y Retrabajo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Capacidad Mensual</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded border border-indigo-100">
                192h Brutas
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{member.effectiveCapacity || 153.6}</span>
              <span className="text-xs text-slate-400 font-bold">h efectivas (80%)</span>
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              Margen de ocio (20%): <strong className="text-slate-600">{member.idleBuffer || 38.4}h</strong>
            </span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
            <span className="text-xs text-slate-400 font-bold block mb-1 uppercase tracking-wider">Horas Ejecutadas</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-600">{member.loadedHours}</span>
              <span className="text-xs text-emerald-500 font-bold">h / {member.assignedHours}h asig.</span>
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              SaturaciÃ³n Objetivo: <strong className={member.loadedHours > (member.effectiveCapacity || 153.6) ? 'text-rose-600' : 'text-slate-700'}>
                {(((member.loadedHours) / (member.effectiveCapacity || 153.6)) * 100).toFixed(0)}%
              </strong>
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${retrabajoBadge.bg} ${retrabajoBadge.border}`}>
            <span className={`text-xs font-bold block mb-1 uppercase tracking-wider ${retrabajoBadge.text}`}>Retrabajo Reg.</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${retrabajoBadge.text}`}>{userRetrabajo.retrabajo}</span>
              <span className={`text-xs font-bold ${retrabajoBadge.text}`}>h ({userRetrabajo.percent.toFixed(0)}%)</span>
            </div>
            <span className="text-xs text-slate-500 block mt-1 truncate">
              {retrabajoBadge.label}
            </span>
          </div>
        </div>

        {/* Especialidades Asignadas - Representadas en un GrÃ¡fico Radial */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60" id="specialties-radar-container">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-500" /> Especialidades y Perfil Radar
          </h3>

          <div className="w-full h-[220px] flex items-center justify-center mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getSkillsData(member.role, member.skills)}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name={member.username}
                  dataKey="value"
                  stroke={getRoleHexColor(member.role)}
                  fill={getRoleHexColor(member.role)}
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center pt-3 border-t border-slate-200/40">
            {member.skills.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium italic">Sin habilidades registradas en este perÃ­odo.</span>
            ) : (
              member.skills.map((skill) => (
                <span key={skill} className="text-xs bg-white text-slate-700 px-2.5 py-1 rounded-full font-bold border border-slate-200 flex items-center gap-1 uppercase tracking-wider transition-all hover:bg-slate-50 shadow-2xs">
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
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                          Fase: {activePhase?.label || 'Sin Fase'}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase ${
                        activePhase?.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                          : 'bg-amber-50 text-amber-700 border border-amber-100/50'
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                {(member.loadedHours > 0 ? (member.loadedHours / 20).toFixed(1) : '0.0')}h / dÃ­a
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
