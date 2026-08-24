import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  LineChart,
  Search,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import { Project, UserSession, getUserAvatarUrl } from '../types';
import { runSlaRuleEngine } from '../utils/slaRuleEngine';
import {
  calculateGlobalFinancials,
  calculateTeamWorkload,
  getGlobalReworkIndicator,
} from '../utils/metrics';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { ActionButton, EmptyBlock, ProgressBar, StatusBadge } from './ui/OperationsUI';

interface Props {
  projects: Project[];
  users: UserSession[];
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
}

type ViewMode = 'operations' | 'executive';
type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);

const getUsageTone = (value: number): Tone => {
  if (value >= 100) return 'danger';
  if (value >= 85) return 'warning';
  return 'success';
};

const getToneDot = (tone: Tone) => {
  if (tone === 'danger') return 'bg-rose-500';
  if (tone === 'warning') return 'bg-amber-500';
  if (tone === 'success') return 'bg-lime-500';
  if (tone === 'info') return 'bg-blue-500';
  return 'bg-[#FF5500]';
};

const getStatToneClass = (tone: Tone) => {
  if (tone === 'brand') return 'bg-orange-50 text-[#FF5500]';
  if (tone === 'success') return 'bg-lime-50 text-lime-700';
  if (tone === 'danger') return 'bg-rose-50 text-rose-700';
  if (tone === 'warning') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

const MiniBars: React.FC<{ values: number[]; tone?: 'orange' | 'lime' | 'blue' }> = ({
  values,
  tone = 'orange',
}) => {
  const barColor = tone === 'lime' ? 'bg-lime-400' : tone === 'blue' ? 'bg-sky-400' : 'bg-[#FF5500]';

  return (
    <div className="flex h-12 items-end gap-1.5">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={`w-2 rounded-full ${barColor}`}
          style={{ height: `${Math.max(18, Math.min(100, value))}%`, opacity: 0.45 + index * 0.07 }}
        />
      ))}
    </div>
  );
};

const StatModule: React.FC<{
  label: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
}> = ({ label, value, detail, icon: Icon, tone = 'neutral' as Tone }) => (
  <div className="min-w-0 rounded-[20px] border border-white/75 bg-white/68 px-4 py-4 shadow-[0_12px_38px_-34px_rgba(15,23,42,0.42)]">
    <div className="flex items-center justify-between gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${getStatToneClass(tone)}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className={`h-2 w-2 rounded-full ${getToneDot(tone)}`} />
    </div>
    <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <div className="mt-1 flex flex-wrap items-baseline gap-2">
      <span className="text-2xl font-black tracking-tight text-slate-950">{value}</span>
      <span className="text-xs font-semibold text-slate-400">{detail}</span>
    </div>
  </div>
);

export const CoordinatorDashboard: React.FC<Props> = ({
  projects,
  users,
  activeProjectId,
  onSelectProject,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('operations');
  const [query, setQuery] = useState('');

  const slaAlerts = useMemo(() => runSlaRuleEngine(projects), [projects]);
  const financials = useMemo(() => calculateGlobalFinancials(projects), [projects]);
  const rework = useMemo(() => getGlobalReworkIndicator(projects, users), [projects, users]);

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.phases?.every((phase) => phase.status === 'completed')),
    [projects]
  );

  const teamLoad = useMemo(() => {
    const staff = users.filter((user) => user.role !== 'invitado');
    return calculateTeamWorkload(staff, projects)
      .sort((a, b) => (b.effectiveSaturation || 0) - (a.effectiveSaturation || 0))
      .slice(0, 6);
  }, [users, projects]);

  const projectRows = useMemo(() => {
    const criticalProjectIds = new Set(
      slaAlerts.filter((alert) => alert.severity === 'critical').map((alert) => alert.projectId)
    );

    return activeProjects
      .map((project) => {
        const consumedHours = project.budget
          ? (Object.values(project.budget) as Array<{ consumed?: number }>).reduce(
              (sum, roleBudget) => sum + (roleBudget.consumed || 0),
              0
            )
          : 0;
        const soldHours = project.hoursSold || project.hoursTotal || 0;
        const usage = soldHours > 0 ? (consumedHours / soldHours) * 100 : 0;
        const completed = project.phases?.filter((phase) => phase.status === 'completed').length || 0;
        const total = project.phases?.length || 1;
        const progress = Math.round((completed / total) * 100);
        const activePhase = project.phases?.find((phase) => phase.id === project.activePhaseId)?.label || 'Sin fase activa';
        const hasCriticalSla = criticalProjectIds.has(project.id);
        const tone = hasCriticalSla ? 'danger' : getUsageTone(usage);

        return {
          ...project,
          activePhase,
          consumedHours,
          soldHours,
          progress,
          tone,
          usage,
        };
      })
      .filter((project) => {
        const term = query.trim().toLowerCase();
        if (!term) return true;
        return (
          project.name.toLowerCase().includes(term) ||
          project.clientName.toLowerCase().includes(term) ||
          project.activePhase.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 8);
  }, [activeProjects, query, slaAlerts]);

  const topAlerts = useMemo(
    () =>
      [...slaAlerts]
        .sort((a, b) => {
          if (a.severity === b.severity) return a.daysDiff - b.daysDiff;
          return a.severity === 'critical' ? -1 : 1;
        })
        .slice(0, 5),
    [slaAlerts]
  );

  const focusProjects = projectRows.slice(0, 4);
  const chartPeak = Math.max(120, ...teamLoad.map((member) => member.effectiveSaturation || 0));
  const criticalAlerts = topAlerts.filter((alert) => alert.severity === 'critical').length;
  const totalSoldHours = financials.totalSoldHours || 0;
  const hourUsage = totalSoldHours > 0 ? ((financials.totalConsumedHours || 0) / totalSoldHours) * 100 : 0;

  if (viewMode === 'executive') {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-5 py-3 backdrop-blur-xl">
          <ActionButton tone="secondary" icon={BarChart3} onClick={() => setViewMode('operations')}>
            Volver a Torre de Control
          </ActionButton>
        </div>
        <ExecutiveDashboard
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={onSelectProject}
          users={users}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 text-slate-950 sm:px-5 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[30px] border border-white/85 bg-[#f5f8fb]/88 shadow-[0_36px_110px_-70px_rgba(15,23,42,0.62)] backdrop-blur-xl">
        <header className="border-b border-slate-200/70 px-4 py-4 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                  Operacion diaria
                </span>
                <span className="rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-lime-700">
                  TPP Hub Digital
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Torre de Control
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Vista de mando para decidir prioridades, capacidad, alertas SLA y consumo operativo del portafolio.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-full border border-slate-200 bg-white/72 p-1">
                {['Hoy', 'Semana', 'Mes', 'Reportes'].map((item, index) => (
                  <button
                    key={item}
                    className={`rounded-full px-3 py-2 text-xs font-black transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] ${
                      index === 2 ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <ActionButton tone="secondary" icon={BarChart3} onClick={() => setViewMode('executive')}>
                Vista ejecutiva
              </ActionButton>
              <ActionButton tone="primary" icon={Download}>
                Exportar
              </ActionButton>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[230px_minmax(0,1fr)_320px]">
          <aside className="border-b border-slate-200/70 bg-white/38 px-4 py-5 sm:px-6 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Focos</p>
                <h2 className="mt-1 text-sm font-black text-slate-950">Intervenir hoy</h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FF5500] text-white shadow-sm shadow-orange-500/20">
                <Zap className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {focusProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.985] ${
                    project.id === activeProjectId
                      ? 'border-orange-200 bg-orange-50/85'
                      : 'border-transparent bg-white/42 hover:border-slate-200 hover:bg-white/75'
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${getToneDot(project.tone)}`} />
                    <p className="truncate text-xs font-black text-slate-950">{project.name}</p>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{project.clientName}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-black tabular-nums text-slate-500">
                    <span>{Math.round(project.usage)}% horas</span>
                    <span>{project.progress}% avance</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar proyecto, cliente o fase"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/82 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out focus:border-[#FF5500] focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3 py-2 text-xs font-black text-slate-500">
                <Activity className="h-4 w-4 text-lime-600" />
                {activeProjects.length} activos / {projects.length} en cartera
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_0.9fr_0.9fr]">
              <div className="overflow-hidden rounded-[24px] bg-slate-950 p-5 text-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.7)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Estado general</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight">{criticalAlerts || 'Sin'} alertas criticas</h2>
                    <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
                      Prioriza vencimientos, exceso de horas y capacidad sobrecargada antes de revisar margen.
                    </p>
                  </div>
                  <MiniBars values={[42, 66, 48, 78, 58, 88, 72]} />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-500">Horas</p>
                    <p className="mt-1 font-black tabular-nums">{Math.round(hourUsage)}%</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Costo</p>
                    <p className="mt-1 font-black tabular-nums">{(financials.costDeviation || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Retrabajo</p>
                    <p className="mt-1 font-black tabular-nums">{(rework.porcentajeGlobal || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <StatModule
                label="Horas consumidas"
                value={`${financials.totalConsumedHours || 0}h`}
                detail={`${financials.totalSoldHours || 0}h vendidas`}
                icon={Clock}
                tone={hourUsage > 90 ? 'warning' : 'info'}
              />
              <StatModule
                label="Costo operativo"
                value={formatMoney(financials.totalRealCost || 0)}
                detail={`${(financials.costDeviation || 0) > 0 ? '+' : ''}${(financials.costDeviation || 0).toFixed(1)}%`}
                icon={DollarSign}
                tone={(financials.costDeviation || 0) > 10 ? 'danger' : 'success'}
              />
            </div>

            <section className="mt-4 rounded-[24px] border border-white/75 bg-white/58 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Capacidad</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">Carga efectiva por equipo</h2>
                </div>
                <StatusBadge tone={teamLoad.some((member) => (member.effectiveSaturation || 0) > 110) ? 'warning' : 'success'}>
                  {teamLoad.some((member) => (member.effectiveSaturation || 0) > 110) ? 'Rebalancear' : 'En rango'}
                </StatusBadge>
              </div>

              <div className="mt-6 flex h-64 items-end gap-3 border-b border-slate-200/70 px-1">
                {teamLoad.map((member) => {
                  const saturation = member.effectiveSaturation || 0;
                  const height = Math.max(14, Math.round((saturation / chartPeak) * 100));
                  const tone = saturation > 110 ? 'bg-[#FF5500]' : saturation > 90 ? 'bg-amber-400' : 'bg-lime-500';

                  return (
                    <button
                      key={member.id}
                      className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2 outline-none"
                      type="button"
                    >
                      <span className="text-[11px] font-black tabular-nums text-slate-500">{Math.round(saturation)}%</span>
                      <span
                        className={`w-full max-w-14 rounded-t-2xl ${tone} transition-[filter,transform] duration-150 ease-out group-hover:brightness-105 group-active:scale-[0.98]`}
                        style={{ height: `${height}%` }}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500 sm:grid-cols-3 lg:grid-cols-6">
                {teamLoad.map((member) => (
                  <div key={member.id} className="truncate">{member.username}</div>
                ))}
              </div>
            </section>

            <section className="mt-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Portafolio operativo</p>
                  <h2 className="text-lg font-black text-slate-950">Proyectos que mueven la semana</h2>
                </div>
                <p className="text-xs font-semibold text-slate-500">Ordenado por consumo y riesgo</p>
              </div>

              {projectRows.length === 0 ? (
                <EmptyBlock
                  title="No hay proyectos para mostrar"
                  description="Ajusta la busqueda o revisa si todos los proyectos activos ya fueron completados."
                />
              ) : (
                <div className="overflow-hidden rounded-[22px] border border-slate-200/70 bg-white/64">
                  <div className="hidden grid-cols-[1.5fr_1fr_116px_150px_72px] border-b border-slate-200/70 bg-white/50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-400 lg:grid">
                    <span>Proyecto</span>
                    <span>Fase</span>
                    <span>Salud</span>
                    <span>Horas</span>
                    <span>Avance</span>
                  </div>
                  <div className="divide-y divide-slate-200/70">
                    {projectRows.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        className="grid w-full grid-cols-1 gap-3 px-4 py-4 text-left transition-[background-color,transform] duration-150 ease-out hover:bg-white active:scale-[0.998] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500/20 lg:grid-cols-[1.5fr_1fr_116px_150px_72px] lg:items-center"
                        type="button"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${getToneDot(project.tone)}`} />
                            <h3 className="truncate text-sm font-black text-slate-950">{project.name}</h3>
                          </div>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{project.clientName}</p>
                        </div>
                        <div className="text-xs font-bold text-slate-600">{project.activePhase}</div>
                        <StatusBadge tone={project.tone}>
                          {project.tone === 'danger' ? 'Riesgo' : project.tone === 'warning' ? 'Atencion' : 'En curso'}
                        </StatusBadge>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-500">
                            <span>{Math.round(project.consumedHours)}h</span>
                            <span>{Math.round(project.soldHours || 0)}h</span>
                          </div>
                          <ProgressBar value={project.usage} tone={project.tone} />
                        </div>
                        <div className="text-sm font-black tabular-nums text-slate-950">{project.progress}%</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </main>

          <aside className="border-t border-slate-200/70 bg-white/36 px-4 py-5 sm:px-6 xl:border-l xl:border-t-0">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Alertas</p>
                  <h2 className="mt-1 text-sm font-black text-slate-950">Decision inmediata</h2>
                </div>
                <AlertTriangle className="h-5 w-5 text-[#FF5500]" />
              </div>

              <div className="mt-4 space-y-2">
                {topAlerts.length === 0 ? (
                  <div className="rounded-2xl border border-lime-200 bg-lime-50 px-4 py-4">
                    <p className="text-sm font-black text-lime-800">Operacion en orden</p>
                    <p className="mt-1 text-xs leading-5 text-lime-700">No hay alertas SLA activas para hoy.</p>
                  </div>
                ) : (
                  topAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => onSelectProject(alert.projectId)}
                      className="w-full rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 text-left transition-[background-color,border-color,transform] duration-150 ease-out hover:border-orange-200 hover:bg-orange-50/45 active:scale-[0.985]"
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <StatusBadge tone={alert.severity === 'critical' ? 'danger' : 'warning'}>
                          {alert.severity === 'critical' ? 'Critico' : 'Atencion'}
                        </StatusBadge>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black tabular-nums text-slate-600">
                          {alert.daysDiff < 0 ? `${Math.abs(alert.daysDiff)}d vencido` : `${alert.daysDiff}d`}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-sm font-black leading-snug text-slate-950">{alert.title}</h3>
                      <p className="mt-1 truncate text-xs font-bold text-slate-500">{alert.projectName}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200/70 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Equipo</p>
                  <h2 className="mt-1 text-sm font-black text-slate-950">Pulso operativo</h2>
                </div>
                <Users className="h-5 w-5 text-slate-500" />
              </div>

              <div className="mt-4 space-y-4">
                {teamLoad.map((member) => {
                  const saturation = member.effectiveSaturation || 0;
                  const tone = saturation > 110 ? 'danger' : saturation > 90 ? 'warning' : 'success';
                  return (
                    <div key={member.id}>
                      <div className="flex items-center gap-3">
                        <img
                          src={getUserAvatarUrl(member.username)}
                          alt={member.username}
                          className="h-9 w-9 rounded-full border border-white object-cover shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-black capitalize text-slate-950">{member.username}</p>
                            <span className="text-xs font-black tabular-nums text-slate-600">{Math.round(saturation)}%</span>
                          </div>
                          <p className="truncate text-xs font-semibold text-slate-500">{member.puesto || member.role}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={saturation} tone={tone} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        <footer className="border-t border-slate-200/70 bg-white/45 px-4 py-4 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5500]" />
              <p>
                Prioriza alertas criticas, rebalancea capacidad sobre 110% y valida horas antes de tomar decisiones de margen.
              </p>
            </div>
            <ActionButton tone="ghost" icon={CheckCircle2}>
              Revisar intervenciones
            </ActionButton>
          </div>
        </footer>
      </div>
    </div>
  );
};
