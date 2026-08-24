import React, { useMemo, useState } from 'react';
import {
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
} from 'lucide-react';
import { Project, UserSession, getUserAvatarUrl } from '../types';
import { runSlaRuleEngine } from '../utils/slaRuleEngine';
import {
  calculateGlobalFinancials,
  calculateTeamWorkload,
  getGlobalReworkIndicator,
} from '../utils/metrics';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import {
  ActionButton,
  DashboardFrame,
  EmptyBlock,
  MetricStrip,
  PageHeader,
  PageShell,
  ProgressBar,
  SectionPanel,
  StatusBadge,
} from './ui/OperationsUI';

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
    <PageShell className="text-slate-900" id="coordinator-control-tower">
      <DashboardFrame>
        <PageHeader
          title="Torre de Control"
          meta="Operacion diaria"
          description="Lectura compacta del portafolio: proyectos que requieren decision, carga del equipo, consumo de horas y alertas SLA."
          actions={
            <>
              <ActionButton tone="secondary" icon={BarChart3} onClick={() => setViewMode('executive')}>
                Vista ejecutiva
              </ActionButton>
              <ActionButton tone="primary" icon={Download}>
                Exportar resumen
              </ActionButton>
            </>
          }
        />

        <MetricStrip
          items={[
            {
              label: 'Proyectos activos',
              value: activeProjects.length,
              detail: `${projects.length} en cartera`,
              icon: Briefcase,
              tone: activeProjects.length > 0 ? 'brand' : 'neutral',
            },
            {
              label: 'Alertas SLA',
              value: slaAlerts.length,
              detail: topAlerts.some((alert) => alert.severity === 'critical') ? 'Critico' : 'En vigilancia',
              icon: AlertTriangle,
              tone: topAlerts.some((alert) => alert.severity === 'critical') ? 'danger' : 'warning',
            },
            {
              label: 'Horas consumidas',
              value: `${financials.totalConsumedHours || 0}h`,
              detail: `${financials.totalSoldHours || 0}h vendidas`,
              icon: Clock,
              tone: 'info',
            },
            {
              label: 'Costo operativo',
              value: formatMoney(financials.totalRealCost || 0),
              detail: `${(financials.costDeviation || 0) > 0 ? '+' : ''}${(financials.costDeviation || 0).toFixed(1)}%`,
              icon: DollarSign,
              tone: (financials.costDeviation || 0) > 10 ? 'danger' : 'success',
            },
            {
              label: 'Retrabajo',
              value: `${(rework.porcentajeGlobal || 0).toFixed(1)}%`,
              detail: `${rework.totalRetrabajoGlobal || 0}h`,
              icon: LineChart,
              tone: (rework.porcentajeGlobal || 0) > 15 ? 'warning' : 'success',
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SectionPanel
          title="Portafolio operativo"
          description="Ordenado por consumo de horas y riesgo. Usa esta tabla para decidir donde intervenir hoy."
          icon={Briefcase}
          action={
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar proyecto, cliente o fase"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 outline-none transition-colors focus:border-[#FF5500] focus:ring-2 focus:ring-orange-500/15"
              />
            </div>
          }
        >
          {projectRows.length === 0 ? (
            <EmptyBlock
              title="No hay proyectos para mostrar"
              description="Ajusta la busqueda o revisa si todos los proyectos activos ya fueron completados."
            />
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-slate-200/70 bg-white/72">
              <div className="grid grid-cols-[1.5fr_1fr_120px_130px_96px] gap-0 border-b border-slate-200/70 bg-slate-50/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 max-lg:hidden">
                <span>Proyecto</span>
                <span>Fase activa</span>
                <span>Salud</span>
                <span>Horas</span>
                <span>Avance</span>
              </div>

              <div className="divide-y divide-slate-100">
                {projectRows.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="grid w-full grid-cols-1 gap-3 px-4 py-4 text-left transition-[background-color,transform] duration-150 ease-out hover:bg-white active:scale-[0.998] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500/20 lg:grid-cols-[1.5fr_1fr_120px_130px_96px] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#FF5500]" />
                        <h3 className="truncate text-sm font-black text-slate-950">{project.name}</h3>
                      </div>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">{project.clientName}</p>
                    </div>

                    <div className="text-xs font-semibold text-slate-600">{project.activePhase}</div>

                    <StatusBadge tone={project.tone}>
                      {project.tone === 'danger' ? 'Riesgo' : project.tone === 'warning' ? 'Atencion' : 'En curso'}
                    </StatusBadge>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>{Math.round(project.consumedHours)}h</span>
                        <span>{Math.round(project.soldHours || 0)}h</span>
                      </div>
                      <ProgressBar value={project.usage} tone={project.tone} />
                    </div>

                    <div className="text-sm font-black tabular-nums text-slate-900">{project.progress}%</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SectionPanel>

        <div className="flex flex-col gap-4">
          <SectionPanel
            title="Alertas de hoy"
            description="Solo las senales que necesitan decision."
            icon={AlertTriangle}
            className="min-h-[320px]"
          >
            {topAlerts.length === 0 ? (
              <EmptyBlock
                title="Operacion en orden"
                description="No hay alertas SLA activas. Mantener revision diaria y carga de horas actualizada."
              />
            ) : (
              <div className="divide-y divide-slate-200/70">
                {topAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => onSelectProject(alert.projectId)}
                    className="w-full px-1 py-3 text-left transition-[background-color,transform] duration-150 ease-out hover:bg-orange-50/35 active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <StatusBadge tone={alert.severity === 'critical' ? 'danger' : 'warning'}>
                        {alert.severity === 'critical' ? 'Critico' : 'Atencion'}
                      </StatusBadge>
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black tabular-nums text-slate-600">
                        {alert.daysDiff < 0 ? `${Math.abs(alert.daysDiff)}d vencido` : `${alert.daysDiff}d`}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-black leading-snug text-slate-950">{alert.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{alert.message}</p>
                    <p className="mt-3 text-xs font-bold text-slate-700">{alert.projectName}</p>
                  </button>
                ))}
              </div>
            )}
          </SectionPanel>

          <SectionPanel
            title="Pulso del equipo"
            description="Capacidad efectiva por colaborador."
            icon={Users}
          >
            <div className="divide-y divide-slate-200/70">
              {teamLoad.map((member) => {
                const saturation = member.effectiveSaturation || 0;
                const tone = saturation > 110 ? 'danger' : saturation > 90 ? 'warning' : 'success';
                return (
                  <div key={member.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getUserAvatarUrl(member.username)}
                        alt={member.username}
                        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-black capitalize text-slate-900">{member.username}</p>
                          <span className="text-xs font-black tabular-nums text-slate-700">
                            {Math.round(saturation)}%
                          </span>
                        </div>
                        <p className="truncate text-xs font-medium text-slate-500">{member.puesto || member.role}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={saturation} tone={tone} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionPanel>
        </div>
      </div>

        <div className="border-t border-slate-200/70 bg-slate-50/45 px-5 py-4">
          <div className="flex flex-col gap-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5500]" />
              <p>
                Prioriza proyectos con alerta critica, redistribuye capacidad sobre 110% y exige carga de horas antes de revisar margen.
              </p>
            </div>
            <ActionButton tone="ghost" icon={CheckCircle2}>
              Revisar intervenciones
            </ActionButton>
          </div>
        </div>
      </DashboardFrame>
    </PageShell>
  );
};
