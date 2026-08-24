import React, { useState, useMemo, useEffect } from 'react';
import { DraggableUser } from './DraggableUser';
import { DroppableTaskCell } from './DroppableTaskCell';
import { KpiSidePanel } from './KpiSidePanel';
import { useKpiSidePanel } from '../hooks/useKpiSidePanel';
import { Project, UserSession, getUserAvatarUrl } from '../types';
import { StatBar, StatItem } from './StatBar';
import { tokens, ui } from '../theme';
import {
  Plus,
  Trash2,
  Calendar,
  Search,
  ListFilter,
  Clock,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Users,
  ShieldCheck,
  TrendingUp,
  Layers,
  Zap,
  Target,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  Flame,
  Award,
  FileCheck,
  X
} from 'lucide-react';

interface PlannerTask {
  id: string;
  brand: string;
  project: string;
  projectId?: string;
  start: string;
  deadline: string;
  assignedTo?: string; // Legacy single user
  assignedToUsers?: string[]; // Multi-user array
  status: 'pendiente' | 'proceso' | 'completado';
  priority?: 'alta' | 'media' | 'baja';
  estimatedHours?: number;
}

interface PlannerGridProps {
  projects: Project[];
  users: UserSession[];
  currentUser: UserSession;
}

const STORAGE_KEY = 'saas_phase_system_planner_tasks_v4_demo';

const INITIAL_TASKS: PlannerTask[] = [
  {
    id: 't-1',
    brand: 'Famosa',
    project: 'RediseÃ±o de Marca y Empaques - Fase: Sprint',
    projectId: 'p1',
    start: '2026-07-28',
    deadline: '2026-08-05',
    status: 'proceso',
    assignedToUsers: ['u-rodrigo', 'u-eduardo'],
    priority: 'alta',
    estimatedHours: 40
  },
  {
    id: 't-2',
    brand: 'El tejar',
    project: 'CatÃ¡logo Digital 2026 - Fase: AprobaciÃ³n',
    projectId: 'p3',
    start: '2026-07-27',
    deadline: '2026-08-02',
    status: 'proceso',
    assignedToUsers: ['u-noemi', 'u-edgar'],
    priority: 'alta',
    estimatedHours: 35
  },
  {
    id: 't-3',
    brand: 'El tejar',
    project: 'E-commerce B2B Portal - Fase: Sprint',
    projectId: 'p4',
    start: '2026-07-29',
    deadline: '2026-08-10',
    status: 'pendiente',
    assignedToUsers: ['u-luis', 'u-eduardo'],
    priority: 'alta',
    estimatedHours: 50
  },
  {
    id: 't-4',
    brand: 'BI-Credid',
    project: 'Portal BI-Credid Express - Fase: Sprint',
    projectId: 'p9',
    start: '2026-07-28',
    deadline: '2026-08-08',
    status: 'proceso',
    assignedToUsers: ['u-lourdes', 'u-edgar'],
    priority: 'alta',
    estimatedHours: 45
  },
];

export const PlannerGrid: React.FC<PlannerGridProps> = ({ projects = [], users = [], currentUser }) => {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [assignedFilter, setAssignedFilter] = useState<string>('todos');

  // Active view mode: 'list' | 'calendar' | 'cards' | 'kanban'
  const [plannerViewMode, setPlannerViewMode] = useState<'list' | 'calendar' | 'cards' | 'kanban'>(
    currentUser?.preferences?.defaultView || 'list'
  );

  // Sync plannerViewMode when user preferences change
  useEffect(() => {
    if (currentUser?.preferences?.defaultView) {
      setPlannerViewMode(currentUser.preferences.defaultView);
    }
  }, [currentUser?.preferences?.defaultView]);

  // Configurable team limit per task (default 2)
  const [maxMembersPerTask, setMaxMembersPerTask] = useState<number>(2);

  // Custom hook for KPI Side Panel interactive drill-down
  const kpiPanel = useKpiSidePanel();

  // Form states for creating a new task
  const [showAddForm, setShowAddForm] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [formBrand, setFormBrand] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formSelectedProjectId, setFormSelectedProjectId] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPriority, setFormPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [formHours, setFormHours] = useState<number | ''>('');
  const [formAssignedUsers, setFormAssignedUsers] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Toggle user assignment in Wizard form
  const toggleFormUserAssignment = (userId: string) => {
    if (formAssignedUsers.includes(userId)) {
      setFormAssignedUsers(formAssignedUsers.filter(id => id !== userId));
    } else {
      if (formAssignedUsers.length >= maxMembersPerTask) {
        setFormAssignedUsers([...formAssignedUsers.slice(1), userId]);
      } else {
        setFormAssignedUsers([...formAssignedUsers, userId]);
      }
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        setTasks(INITIAL_TASKS);
      }
    } else {
      setTasks(INITIAL_TASKS);
    }
  }, []);

  // Save tasks to localStorage on change
  const saveTasks = (updatedTasks: PlannerTask[]) => {
    setTasks(updatedTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
  };

  // Assign user to a task (supports configurable max members)
  const handleAssignTask = (taskId: string, userId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const currentArr = t.assignedToUsers || (t.assignedTo ? [t.assignedTo] : []);
        if (!currentArr.includes(userId)) {
          let newArr = [...currentArr, userId];
          if (newArr.length > maxMembersPerTask) {
            newArr = newArr.slice(newArr.length - maxMembersPerTask);
          }
          return { ...t, assignedToUsers: newArr, assignedTo: newArr[0] };
        }
      }
      return t;
    });
    saveTasks(updated);
  };

  // Unassign user from a task
  const handleUnassignTask = (taskId: string, userId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const currentArr = t.assignedToUsers || (t.assignedTo ? [t.assignedTo] : []);
        const newArr = currentArr.filter(id => id !== userId);
        return { ...t, assignedToUsers: newArr, assignedTo: newArr[0] || undefined };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Change task status
  const handleStatusChange = (taskId: string, status: 'pendiente' | 'proceso' | 'completado') => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Delete a task
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    saveTasks(updated);
  };

  // Handle Project Selection in Create Form to pre-fill brand
  const handleSelectProjectInForm = (projId: string) => {
    setFormSelectedProjectId(projId);
    const selected = projects.find(p => p.id === projId);
    if (selected) {
      setFormBrand(selected.clientName || selected.name);
      const activePhase = selected.phases.find(ph => ph.id === selected.activePhaseId);
      const phaseLabel = activePhase ? ` - Fase: ${activePhase.label}` : '';
      setFormProjectName(`${selected.name}${phaseLabel}`);
    } else {
      setFormBrand('');
      setFormProjectName('');
    }
  };

  // Handle Form submit
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formBrand.trim()) {
      setFormError('El cliente o marca es obligatorio.');
      return;
    }
    if (!formProjectName.trim()) {
      setFormError('La descripciÃ³n del proyecto/fase es obligatoria.');
      return;
    }
    if (!formStart || !formDeadline) {
      setFormError('Las fechas de inicio y entrega interna son obligatorias.');
      return;
    }

    const newTask: PlannerTask = {
      id: `t-${Date.now()}`,
      brand: formBrand.trim(),
      project: formProjectName.trim(),
      projectId: formSelectedProjectId || undefined,
      start: formStart,
      deadline: formDeadline,
      status: 'pendiente',
      priority: formPriority,
      estimatedHours: typeof formHours === 'number' ? formHours : undefined,
      assignedToUsers: formAssignedUsers,
      assignedTo: formAssignedUsers[0] || undefined
    };

    saveTasks([newTask, ...tasks]);

    // Reset form
    setFormBrand('');
    setFormProjectName('');
    setFormSelectedProjectId('');
    setFormStart('');
    setFormDeadline('');
    setFormHours('');
    setFormPriority('media');
    setFormAssignedUsers([]);
    setWizardStep(1);
    setShowAddForm(false);
  };

  // Get color per role to pass to avatars
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

  // Exclude client/guests from task assignees dock
  const operatorsList = useMemo(() => {
    return users.filter(u => u.role !== 'invitado');
  }, [users]);

  // CALCULO DE CARGA ACTUAL POR USUARIO (Resumen de Carga por Usuario)
  const userWorkloadSummary = useMemo(() => {
    return operatorsList.map(user => {
      const userTasks = tasks.filter(t => {
        const assignedArr = t.assignedToUsers || (t.assignedTo ? [t.assignedTo] : []);
        return assignedArr.includes(user.id);
      });

      const completedCount = userTasks.filter(t => t.status === 'completado').length;
      const inProgressCount = userTasks.filter(t => t.status === 'proceso').length;
      const pendingCount = userTasks.filter(t => t.status === 'pendiente').length;

      const totalHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 4), 0);
      const totalTasksCount = userTasks.length;

      let saturationLabel = 'Baja / Disponible';
      let saturationBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      let progressColor = 'bg-emerald-500';

      if (totalHours >= 30 || totalTasksCount >= 5) {
        saturationLabel = 'Saturado / Alta Carga';
        saturationBadgeBg = 'bg-rose-50 text-rose-800 border-rose-200';
        progressColor = 'bg-rose-500';
      } else if (totalHours >= 16 || totalTasksCount >= 3) {
        saturationLabel = 'Carga Moderada';
        saturationBadgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
        progressColor = 'bg-amber-500';
      } else if (totalTasksCount > 0) {
        saturationLabel = 'Ã“ptima';
        saturationBadgeBg = 'bg-blue-50 text-blue-800 border-blue-200';
        progressColor = 'bg-blue-500';
      }

      const completionRatio = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

      return {
        user,
        userTasks,
        totalTasksCount,
        completedCount,
        inProgressCount,
        pendingCount,
        totalHours,
        saturationLabel,
        saturationBadgeBg,
        progressColor,
        completionRatio
      };
    });
  }, [operatorsList, tasks]);

  // CALCULO DE BARRAS DE PROGRESO DE FASE POR PROYECTO
  const projectPhaseProgressList = useMemo(() => {
    return projects.map(project => {
      const totalPhases = project.phases.length;
      const completedPhasesCount = project.phases.filter(ph => ph.status === 'completed').length;
      const activePhase = project.phases.find(ph => ph.id === project.activePhaseId) || project.phases.find(ph => ph.status === 'active');

      const progressPercent = totalPhases > 0 ? Math.round((completedPhasesCount / totalPhases) * 100) : 0;

      // Entregables
      const deliverablesTotal = (project.deliverables || []).length;
      const deliverablesApproved = (project.deliverables || []).filter(d => d.status === 'aprobado').length;

      // Consumo de horas
      const totalHoursBudget = project.hoursTotal || 40;
      const totalHoursConsumed = (project.timeEntries || []).reduce((s, te) => s + (te.hours || 0), 0);

      return {
        project,
        totalPhases,
        completedPhasesCount,
        activePhase,
        progressPercent,
        deliverablesTotal,
        deliverablesApproved,
        totalHoursBudget,
        totalHoursConsumed
      };
    });
  }, [projects]);

  // Global Project Status Dashboard Metrics
  const projectDashboardMetrics = useMemo(() => {
    const totalProjects = projects.length;
    let totalBudgetHours = 0;
    let totalConsumedHours = 0;
    let totalReworkHours = 0;

    projects.forEach(p => {
      totalBudgetHours += p.hoursTotal || 0;
      (p.timeEntries || []).forEach(te => {
        totalConsumedHours += te.hours || 0;
        if (te.type === 'retrabajo') {
          totalReworkHours += te.hours || 0;
        }
      });
    });

    const totalTasksCount = tasks.length;
    const completedTasksCount = tasks.filter(t => t.status === 'completado').length;
    const inProgressTasksCount = tasks.filter(t => t.status === 'proceso').length;
    const pendingTasksCount = tasks.filter(t => t.status === 'pendiente').length;

    const reworkPercent = totalConsumedHours > 0 ? (totalReworkHours / totalConsumedHours) * 100 : 0;
    const taskCompletionPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    return {
      totalProjects,
      totalBudgetHours,
      totalConsumedHours,
      totalReworkHours,
      reworkPercent: Number(reworkPercent.toFixed(1)),
      totalTasksCount,
      completedTasksCount,
      inProgressTasksCount,
      pendingTasksCount,
      taskCompletionPercent
    };
  }, [projects, tasks]);

  // Top Header High-Level Project KPI Widgets
  const topHeaderKpis = useMemo(() => {
    // 1. Total Active Projects (proyectos con fases sin completar o estado no finalizado)
    const activeProjects = projects.filter(p => p.phases.some(ph => ph.status !== 'completed'));
    const totalActiveProjectsCount = activeProjects.length;

    // Proyectos con riesgo o salud Ã³ptima
    const criticalHealthProjects = activeProjects.filter(p => p.health < 60).length;
    const optimalHealthProjects = activeProjects.filter(p => p.health >= 80).length;

    // 2. Overall Agency Utilization % (UtilizaciÃ³n General de la Agencia)
    // Capacidad mensual efectiva por operador (153.6h)
    const totalOperatorsCount = operatorsList.length || 1;
    const totalAgencyMonthlyCapacity = totalOperatorsCount * 153.6;

    // Suma de horas consumidas en proyectos activos
    let agencyConsumedHours = 0;
    projects.forEach(p => {
      (p.timeEntries || []).forEach(te => {
        agencyConsumedHours += te.hours || 0;
      });
    });

    const agencyUtilizationPercent = Math.min(100, Math.round((agencyConsumedHours / (totalAgencyMonthlyCapacity > 0 ? totalAgencyMonthlyCapacity : 1)) * 100));

    // 3. Total Pending Approvals (Total Aprobaciones Pendientes)
    let totalPendingApprovalsCount = 0;
    projects.forEach(p => {
      (p.deliverables || []).forEach(d => {
        if (d.status === 'pendiente' || d.status === 'en_revision') {
          totalPendingApprovalsCount += 1;
        }
      });
    });

    return {
      totalActiveProjectsCount,
      totalProjects: projects.length,
      criticalHealthProjects,
      optimalHealthProjects,
      agencyUtilizationPercent,
      agencyConsumedHours,
      totalAgencyMonthlyCapacity: Math.round(totalAgencyMonthlyCapacity),
      totalPendingApprovalsCount
    };
  }, [projects, operatorsList]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'todos' ||
        task.status === statusFilter;

      const userList = task.assignedToUsers || (task.assignedTo ? [task.assignedTo] : []);

      const matchesAssigned =
        assignedFilter === 'todos' ||
        (assignedFilter === 'sin_asignar' && userList.length === 0) ||
        (assignedFilter === 'mi_asignado' && userList.includes(currentUser.id)) ||
        (userList.includes(assignedFilter));

      return matchesSearch && matchesStatus && matchesAssigned;
    });
  }, [tasks, searchQuery, statusFilter, assignedFilter, currentUser]);

  return (
    <div className="p-3 sm:p-6 bg-slate-50/50 min-h-full overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-6 flex flex-col max-w-full" id="planner-daily-grid">

      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
            PlanificaciÃ³n Diaria & Dailys
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Planner Dailys & Status del Proyecto</h1>
          <p className="text-xs text-slate-500 font-medium">Asigna operadores al escuadrÃ³n arrastrando fichas de usuario y monitorea la salud del proyecto en tiempo real.</p>
        </div>
      </div>

      {/* ðŸš€ BANDA DE ESTADO HORIZONTAL COMPACTA (StatBar) */}
      <StatBar
        stats={[
          {
            id: 'planner-active-projects',
            label: 'Proyectos Activos',
            value: `${topHeaderKpis.totalActiveProjectsCount}`,
            trend: {
              value: `${topHeaderKpis.optimalHealthProjects} Ã³ptima`,
              isPositive: true
            },
            icon: Briefcase,
            status: 'info',
            onClick: () => kpiPanel.openPanel('active_projects')
          },
          {
            id: 'planner-utilization',
            label: 'UtilizaciÃ³n Agencia',
            value: `${topHeaderKpis.agencyUtilizationPercent}%`,
            trend: {
              value: `${topHeaderKpis.agencyConsumedHours}h / ${topHeaderKpis.totalAgencyMonthlyCapacity}h`,
              isPositive: topHeaderKpis.agencyUtilizationPercent < 85
            },
            icon: Activity,
            status: topHeaderKpis.agencyUtilizationPercent >= 85 ? 'warning' : 'success',
            onClick: () => kpiPanel.openPanel('agency_utilization')
          },
          {
            id: 'planner-hours-consumed',
            label: 'Consumo de Horas',
            value: `${projectDashboardMetrics.totalConsumedHours}h`,
            trend: {
              value: `${projectDashboardMetrics.reworkPercent}% Retrabajo`,
              isPositive: projectDashboardMetrics.reworkPercent <= 15
            },
            icon: Clock,
            status: projectDashboardMetrics.reworkPercent > 15 ? 'danger' : 'info',
            onClick: () => kpiPanel.openPanel('time_entry_log')
          },
          {
            id: 'planner-approvals',
            label: 'Aprobaciones Pendientes',
            value: `${topHeaderKpis.totalPendingApprovalsCount}`,
            trend: {
              value: topHeaderKpis.totalPendingApprovalsCount > 0 ? 'Pendiente cliente' : 'Al dÃ­a',
              isPositive: topHeaderKpis.totalPendingApprovalsCount === 0
            },
            icon: FileCheck,
            status: topHeaderKpis.totalPendingApprovalsCount > 0 ? 'warning' : 'success',
            onClick: () => kpiPanel.openPanel('pending_approvals')
          }
        ]}
      />

      {/* PROTASK TABLA DE PENDIENTES & CONTROLES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4 font-sans text-slate-900" id="planner-protask-table-container">

        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Pendientes & Tareas del DÃ­a
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              GestiÃ³n tabular de pendientes con asignaciÃ³n de equipo (mÃ¡x. 2 por tarea).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentUser.role === 'coordinador' && (
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true);
                  setWizardStep(1);
                  setFormError(null);
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Tarea</span>
              </button>
            )}
          </div>
        </div>

        {/* ðŸ‘¥ SECCIÃ“N: EQUIPO DISPONIBLE (Arrastrables con Avatares y Nombres Abajo) */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
              Equipo disponible
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Arrastra un miembro a la columna Equipo o haz clic en +
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1 scrollbar-none touch-pan-x flex-nowrap">
            {operatorsList.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium">Cargando equipo disponible...</span>
            ) : (
              operatorsList.slice(0, 10).map(user => (
                <DraggableUser
                  key={user.id}
                  user={user}
                  color={getUserColor(user.role)}
                />
              ))
            )}
            {operatorsList.length > 10 && (
              <div className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded-xl shrink-0">
                +{operatorsList.length - 10} mÃ¡s
              </div>
            )}
          </div>
        </div>

        {/* Protask Tabs & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">

          {/* Tabs switchers (Calendar, List, Cards, Kanban) */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setPlannerViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                plannerViewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-pink-600" />
              <span>Lista</span>
            </button>

            <button
              onClick={() => setPlannerViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                plannerViewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Calendario</span>
            </button>

            <button
              onClick={() => setPlannerViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                plannerViewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tarjetas</span>
            </button>

            <button
              onClick={() => setPlannerViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                plannerViewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Filters & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Search */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar pendiente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Configurable Max Members Selector */}
            <select
              value={maxMembersPerTask}
              onChange={(e) => setMaxMembersPerTask(Number(e.target.value))}
              title="LÃ­mite mÃ¡ximo de integrantes por tarea"
              className="bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-900 outline-none cursor-pointer hover:bg-amber-100/80 transition-colors"
            >
              <option value={1}>MÃ¡x Equipo: 1</option>
              <option value={2}>MÃ¡x Equipo: 2 (Default)</option>
              <option value={3}>MÃ¡x Equipo: 3</option>
              <option value={4}>MÃ¡x Equipo: 4</option>
              <option value={5}>MÃ¡x Equipo: 5</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="todos">Estado: Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="proceso">En Proceso</option>
              <option value="completado">Completados</option>
            </select>

            {/* Assigned Filter */}
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="todos">Equipo: Todos</option>
              <option value="sin_asignar">Sin Asignar</option>
              <option value="mi_asignado">Asignados a MÃ­</option>
              {operatorsList.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>

          </div>

        </div>

        {/* Floating Wizard Modal para AÃ±adir Tarea */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white text-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Wizard Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-[#FF5500] flex items-center justify-center font-bold text-xs">
                    {wizardStep}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#FF5500]" />
                      Nueva Tarea / Pendiente
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {wizardStep === 1 ? 'Paso 1: InformaciÃ³n del Proyecto y Tarea' : 'Paso 2: Asignar Miembros del Equipo (mÃ¡x 2)'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold cursor-pointer transition-colors text-xs"
                >
                  âœ•
                </button>
              </div>

              {/* Wizard Stepper Tabs */}
              <div className="flex border-b border-slate-100 bg-white px-5 py-2.5 gap-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    wizardStep === 1 ? 'bg-orange-50 text-[#FF5500] border border-orange-200 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-700">1</span>
                  <span>1. Detalles Tarea</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!formBrand.trim() || !formProjectName.trim()) {
                      setFormError('Por favor completa el cliente y la descripciÃ³n de la tarea primero.');
                      return;
                    }
                    setFormError(null);
                    setWizardStep(2);
                  }}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    wizardStep === 2 ? 'bg-orange-50 text-[#FF5500] border border-orange-200 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-700">2</span>
                  <span>2. Asignar Equipo ({formAssignedUsers.length}/2)</span>
                </button>
              </div>

              {/* Wizard Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {formError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleAddTaskSubmit} className="space-y-4">
                  {wizardStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-fadeIn">
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">Asociar a Proyecto Existente (Opcional)</label>
                        <select
                          value={formSelectedProjectId}
                          onChange={(e) => handleSelectProjectInForm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#FF5500] focus:border-[#FF5500] outline-none transition-all font-medium cursor-pointer"
                        >
                          <option value="">-- No asociar / Tarea Independiente --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Cliente / Marca *</label>
                        <input
                          type="text"
                          value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          placeholder="Ej: Arrocha, Banco General"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#FF5500] focus:border-[#FF5500] outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Prioridad</label>
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#FF5500] focus:border-[#FF5500] outline-none transition-all font-medium cursor-pointer"
                        >
                          <option value="alta">ðŸ”´ Alta</option>
                          <option value="media">ðŸŸ  Media</option>
                          <option value="baja">ðŸ”µ Baja</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">DescripciÃ³n de la Tarea *</label>
                        <input
                          type="text"
                          value={formProjectName}
                          onChange={(e) => setFormProjectName(e.target.value)}
                          placeholder="Ej: ProducciÃ³n de Video Reels para Redes Sociales"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#FF5500] focus:border-[#FF5500] outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Horas Estimadas</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formHours}
                          onChange={(e) => setFormHours(e.target.value ? Number(e.target.value) : '')}
                          placeholder="Ej: 8"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#FF5500] focus:border-[#FF5500] outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Fecha de Inicio *</label>
                        <input
                          type="date"
                          value={formStart}
                          onChange={(e) => setFormStart(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#FF5500] focus:border-[#FF5500] outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">Fecha de Entrega / Deadline *</label>
                        <input
                          type="date"
                          value={formDeadline}
                          onChange={(e) => setFormDeadline(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#FF5500] focus:border-[#FF5500] outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">
                            Asignar Responsables del EscuadrÃ³n
                          </label>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {formAssignedUsers.length}/2 Seleccionados
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Selecciona hasta un mÃ¡ximo de 2 operadores para responsabilizarse de esta tarea.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {operatorsList.map(u => {
                            const isSelected = formAssignedUsers.includes(u.id);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormAssignedUsers(prev => prev.filter(id => id !== u.id));
                                  } else {
                                    if (formAssignedUsers.length >= 2) {
                                      setFormError('MÃ¡ximo 2 miembros por tarea.');
                                      return;
                                    }
                                    setFormError(null);
                                    setFormAssignedUsers(prev => [...prev, u.id]);
                                  }
                                }}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-orange-50 border-orange-300 text-slate-900 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <img
                                  src={getUserAvatarUrl(u.username)}
                                  alt={u.username}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold truncate capitalize">{u.username}</div>
                                  <div className="text-xs text-slate-400 font-medium">{u.puesto || u.role}</div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs font-bold ${
                                  isSelected ? 'bg-[#FF5500] border-[#FF5500] text-white' : 'border-slate-300 text-transparent'
                                }`}>
                                  âœ“
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wizard Footer Controls */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (wizardStep === 2) {
                          setWizardStep(1);
                        } else {
                          setShowAddForm(false);
                        }
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      {wizardStep === 2 ? 'â† Volver al Paso 1' : 'Cancelar'}
                    </button>

                    {wizardStep === 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!formBrand.trim() || !formProjectName.trim()) {
                            setFormError('Completa la marca y la descripciÃ³n de la tarea.');
                            return;
                          }
                          setFormError(null);
                          setWizardStep(2);
                        }}
                        className="bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-[0.99]"
                      >
                        <span>Siguiente: Asignar Equipo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-[0.99]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Crear Tarea</span>
                      </button>
                    )}
                  </div>

                </form>
              </div>

            </div>
          </div>
        )}

        {/* VISTAS DINÃMICAS: LISTA, KANBAN, CALENDARIO, TARJETAS */}
        {plannerViewMode === 'list' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                <span className="font-bold text-sm text-slate-800 block">No hay pendientes que coincidan con los filtros</span>
                <span className="text-xs text-slate-400 mt-1">Intenta cambiar la bÃºsqueda o agrega una nueva tarea.</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                    <th className="p-3 w-10 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-[#FF5500] focus:ring-[#FF5500] cursor-pointer" />
                    </th>
                    <th className="p-3">PROYECTO & MARCA</th>
                    <th className="p-3">INICIO</th>
                    <th className="p-3">DEADLINE</th>
                    <th className="p-3 text-center">HORAS</th>
                    <th className="p-3 text-center">ESTADO</th>
                    <th className="p-3 text-center min-w-[120px]">EQUIPO (MÃX {maxMembersPerTask})</th>
                    <th className="p-3 text-center">PRIORIDAD</th>
                    <th className="p-3 text-right w-12">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(task => {
                    const assignedUsersList = task.assignedToUsers || (task.assignedTo ? [task.assignedTo] : []);

                    const formatDateStr = (str: string) => {
                      if (!str) return '16/07/2026';
                      if (str.includes('-')) {
                        const parts = str.split('-');
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      }
                      return str;
                    };

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/70 transition-colors group">

                        <td className="p-3 text-center">
                          <input type="checkbox" className="rounded border-slate-300 text-[#FF5500] focus:ring-[#FF5500] cursor-pointer" />
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5500] border border-orange-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {task.brand.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block leading-snug">
                                {task.project}
                              </span>
                              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                                {task.brand}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-600 font-semibold text-xs whitespace-nowrap">
                          {formatDateStr(task.start)}
                        </td>

                        <td className="p-3.5 text-slate-600 font-semibold text-xs whitespace-nowrap">
                          {formatDateStr(task.deadline)}
                        </td>

                        <td className="p-3.5 text-center font-mono font-extrabold text-slate-700">
                          {task.estimatedHours ? `${task.estimatedHours}h` : '---'}
                        </td>

                        <td className="p-3.5 text-center">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                            className={`px-3 py-1 rounded-full text-xs font-extrabold outline-none cursor-pointer border transition-all ${
                              task.status === 'completado'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : task.status === 'proceso'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="pendiente">Brief / Pendiente</option>
                            <option value="proceso">DiseÃ±o / En Proceso</option>
                            <option value="completado">Completado</option>
                          </select>
                        </td>

                        <td className="p-3.5 text-center">
                          <DroppableTaskCell
                            taskId={task.id}
                            assignedUserIds={assignedUsersList}
                            users={operatorsList}
                            onAssign={handleAssignTask}
                            onUnassign={handleUnassignTask}
                            getUserColor={getUserColor}
                          />
                        </td>

                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            task.priority === 'alta' ? 'bg-rose-50 text-rose-700' :
                            task.priority === 'baja' ? 'bg-sky-50 text-sky-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              task.priority === 'alta' ? 'bg-rose-500' :
                              task.priority === 'baja' ? 'bg-sky-500' :
                              'bg-amber-500'
                            }`} />
                            {task.priority === 'alta' ? 'High' : task.priority === 'baja' ? 'Low' : 'Medium'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          {currentUser.role === 'coordinador' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Â¿Eliminar este pendiente?')) {
                                  handleDeleteTask(task.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* KANBAN VIEW */}
        {plannerViewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="kanban-board-view">
            {[
              { id: 'pendiente', title: 'Pendientes / Brief', bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-800' },
              { id: 'proceso', title: 'En Proceso / ProducciÃ³n', bg: 'bg-sky-50/50', border: 'border-sky-200', text: 'text-sky-800' },
              { id: 'completado', title: 'Completados / Entregados', bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-800' }
            ].map(column => {
              const columnTasks = filteredTasks.filter(t => t.status === column.id);
              return (
                <div key={column.id} className={`p-4 rounded-2xl border ${column.border} ${column.bg} flex flex-col space-y-3 min-h-[400px]`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <h3 className={`font-black text-xs uppercase tracking-wider ${column.text}`}>
                      {column.title}
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-white font-extrabold text-xs text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {columnTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium italic border border-dashed border-slate-200 rounded-xl">
                        Sin tareas en esta columna
                      </div>
                    ) : (
                      columnTasks.map(task => {
                        const assignedUsersList = task.assignedToUsers || (task.assignedTo ? [task.assignedTo] : []);
                        return (
                          <div key={task.id} className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                                  {task.brand}
                                </span>
                                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                                  {task.project}
                                </h4>
                              </div>
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full uppercase ${
                                task.priority === 'alta' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-b border-slate-100 py-1.5">
                              <span>Horas: <strong className="text-slate-800 font-mono">{task.estimatedHours || 0}h</strong></span>
                              <span>Plazo: <strong className="text-slate-800">{task.deadline || '---'}</strong></span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <DroppableTaskCell
                                taskId={task.id}
                                assignedUserIds={assignedUsersList}
                                users={operatorsList}
                                onAssign={handleAssignTask}
                                onUnassign={handleUnassignTask}
                                getUserColor={getUserColor}
                              />

                              <div className="flex items-center gap-1">
                                {column.id !== 'pendiente' && (
                                  <button
                                    onClick={() => handleStatusChange(task.id, column.id === 'completado' ? 'proceso' : 'pendiente')}
                                    className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                                    title="Mover a columna previa"
                                  >
                                    â†
                                  </button>
                                )}
                                {column.id !== 'completado' && (
                                  <button
                                    onClick={() => handleStatusChange(task.id, column.id === 'pendiente' ? 'proceso' : 'completado')}
                                    className="px-2 py-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
                                    title="Avanzar a siguiente columna"
                                  >
                                    â†’
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CALENDAR VIEW */}
        {plannerViewMode === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs" id="calendar-grid-view">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Calendario de Entregas & Fechas Clave
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                {filteredTasks.length} Tareas Programadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTasks.map(task => {
                const assignedUsersList = task.assignedToUsers || (task.assignedTo ? [task.assignedTo] : []);
                return (
                  <div key={task.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {task.brand}
                      </span>
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        ðŸ“… {task.deadline || 'Sin fecha'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900">
                      {task.project}
                    </h4>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                        className="text-xs font-bold px-2 py-0.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="proceso">En Proceso</option>
                        <option value="completado">Completado</option>
                      </select>

                      <DroppableTaskCell
                        taskId={task.id}
                        assignedUserIds={assignedUsersList}
                        users={operatorsList}
                        onAssign={handleAssignTask}
                        onUnassign={handleUnassignTask}
                        getUserColor={getUserColor}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CARDS / BENTO VIEW */}
        {plannerViewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="cards-bento-view">
            {filteredTasks.map(task => {
              const assignedUsersList = task.assignedToUsers || (task.assignedTo ? [task.assignedTo] : []);
              return (
                <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:shadow-lg hover:border-emerald-300 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5500] border border-orange-200 font-bold flex items-center justify-center text-sm shadow-2xs">
                        {task.brand.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                          {task.brand}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                          {task.project}
                        </h3>
                      </div>
                    </div>

                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                      className={`text-xs font-black px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                        task.status === 'completado' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        task.status === 'proceso' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block">Inicio:</span>
                      <strong className="text-slate-800 font-medium">{task.start || '---'}</strong>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block">Deadline:</span>
                      <strong className="text-slate-800 font-medium">{task.deadline || '---'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                        Equipo (MÃ¡x {maxMembersPerTask}):
                      </span>
                      <DroppableTaskCell
                        taskId={task.id}
                        assignedUserIds={assignedUsersList}
                        users={operatorsList}
                        onAssign={handleAssignTask}
                        onUnassign={handleUnassignTask}
                        getUserColor={getUserColor}
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 uppercase block">Horas:</span>
                      <span className="font-mono font-extrabold text-sm text-slate-900">
                        {task.estimatedHours || 0} hrs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Protask Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 px-3 py-1 rounded-xl text-slate-700 font-bold border border-slate-200/80">
              {filteredTasks.length} Tareas Mostradas
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              {"< Anterior"}
            </button>
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center">
              1
            </span>
            <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              {"Siguiente >"}
            </button>
          </div>
        </div>

      </div>

      {/* ðŸ“Œ INDICADORES VISUALES: BARRAS DE PROGRESO DE FASE POR PROYECTO */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-full overflow-hidden" id="planner-phase-progress-indicators">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-lime-50 text-lime-800 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Avance de Fases & Salud del Portafolio
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Barras de progreso de fase e hitos activos de cada proyecto en desarrollo.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Total Proyectos: <strong className="text-slate-900">{projects.length}</strong>
          </span>
        </div>

        <div className="flex md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none touch-pan-x max-w-full">
          {projectPhaseProgressList.map(item => {
            const { project, totalPhases, completedPhasesCount, activePhase, progressPercent, deliverablesTotal, deliverablesApproved, totalHoursBudget, totalHoursConsumed } = item;

            return (
              <div
                key={project.id}
                className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:bg-white hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md transition-all duration-300 shadow-xs space-y-3 flex flex-col justify-between cursor-pointer w-[280px] sm:w-[320px] md:w-auto shrink-0 md:shrink"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                        {project.clientName || 'Cliente General'}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {project.name}
                      </h3>
                    </div>

                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                      project.health >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      project.health >= 60 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {project.health}% Salud
                    </span>
                  </div>

                  {/* Active Phase Pill */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">Fase Activa:</span>
                      <span className="text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {activePhase ? activePhase.label : 'Sin fase activa'}
                      </span>
                    </div>
                  </div>

                  {/* Phase Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">Progreso de Fases ({completedPhasesCount}/{totalPhases})</span>
                      <span className="text-slate-900 font-mono">{progressPercent}%</span>
                    </div>

                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Step Chips for each Phase */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.phases.map((ph, idx) => {
                      const isDone = ph.status === 'completed';
                      const isActive = ph.id === project.activePhaseId || ph.status === 'active';

                      return (
                        <div
                          key={ph.id}
                          className={`px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 border ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isActive
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-400 border-slate-200'
                          }`}
                        >
                          <span>{idx + 1}. {(ph.label || (ph as any).name || '').substring(0, 10)}</span>
                          {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    Entregables: <strong className="text-slate-800">{deliverablesApproved}/{deliverablesTotal}</strong>
                  </span>
                  <span>
                    Horas: <strong className="text-slate-800">{totalHoursConsumed}h / {totalHoursBudget}h</strong>
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ðŸ” INTERACTIVE KPI DRILL-DOWN SIDE PANEL */}
      <KpiSidePanel
        activeKpi={kpiPanel.activeKpi}
        isOpen={kpiPanel.isOpen}
        searchQuery={kpiPanel.searchQuery}
        statusFilter={kpiPanel.statusFilter}
        onClose={kpiPanel.closePanel}
        onSearchChange={kpiPanel.setSearchQuery}
        onFilterChange={kpiPanel.setStatusFilter}
        projects={projects}
        users={users}
        userWorkloadSummary={userWorkloadSummary}
      />

    </div>
  );
};

