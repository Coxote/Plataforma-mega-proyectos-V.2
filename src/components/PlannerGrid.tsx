import React, { useState, useMemo, useEffect } from 'react';
import { DraggableUser } from './DraggableUser';
import { DroppableTaskCell } from './DroppableTaskCell';
import { KpiSidePanel } from './KpiSidePanel';
import { CustomModal } from './CustomModal';
import { useKpiSidePanel } from '../hooks/useKpiSidePanel';
import { Project, UserSession, getUserAvatarUrl } from '../types';
import { getUserColor } from '../dashboardUtils';
import { StatBar, StatItem } from './StatBar';
import { tokens, ui } from '../theme';
import {
  deletePlannerTaskFromFirestore,
  savePlannerTaskToFirestore,
  subscribePlannerTasks,
  type PlannerTaskRecord
} from '../services/firebaseDb';
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
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Check,
  Briefcase,
  AlertTriangle,
  Flame,
  Award,
  FileCheck,
  X
} from 'lucide-react';

type PlannerTask = PlannerTaskRecord;

interface PlannerGridProps {
  projects: Project[];
  users: UserSession[];
  currentUser: UserSession;
}

const STORAGE_KEY = 'saas_phase_system_planner_tasks_prod_v1';

const INITIAL_TASKS: PlannerTask[] = [
  {
    id: 't-1',
    brand: 'Famosa',
    project: 'Rediseño de Marca y Empaques - Fase: Sprint',
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
    project: 'Catálogo Digital 2026 - Fase: Aprobación',
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
  const [formInitialStatus, setFormInitialStatus] = useState<'pendiente' | 'proceso' | 'completado'>('pendiente');
  const [formError, setFormError] = useState<string | null>(null);

  // Smooth scroll ref for available team strip
  const teamScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollTeam = (direction: 'left' | 'right') => {
    if (teamScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      teamScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper to open task creation form with preselected initial status
  const openCreateTaskModal = (initialStatus: 'pendiente' | 'proceso' | 'completado' = 'pendiente') => {
    setFormInitialStatus(initialStatus);
    setFormError(null);
    setWizardStep(1);
    setShowAddForm(true);
  };

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

  // Load local cache first, then subscribe to Cloud Firestore for multi-device sync.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }

    const unsubscribe = subscribePlannerTasks((cloudTasks) => {
      setTasks(cloudTasks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudTasks));
    });

    return () => unsubscribe();
  }, []);

  // Save tasks locally and persist changed records to Cloud Firestore.
  const saveTasks = (updatedTasks: PlannerTask[], changedTask?: PlannerTask, deletedTaskId?: string) => {
    setTasks(updatedTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    if (changedTask) {
      savePlannerTaskToFirestore(changedTask).catch(err => console.warn('Cloud sync error (Planner Task):', err));
    }
    if (deletedTaskId) {
      deletePlannerTaskFromFirestore(deletedTaskId).catch(err => console.warn('Cloud sync error (Delete Planner Task):', err));
    }
  };

  // Assign user to a task (supports configurable max members)
  const handleAssignTask = (taskId: string, userId: string) => {
    let changedTask: PlannerTask | undefined;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const currentArr = t.assignedToUsers || (t.assignedTo ? [t.assignedTo] : []);
        if (!currentArr.includes(userId)) {
          let newArr = [...currentArr, userId];
          if (newArr.length > maxMembersPerTask) {
            newArr = newArr.slice(newArr.length - maxMembersPerTask);
          }
          changedTask = { ...t, assignedToUsers: newArr, assignedTo: newArr[0] };
          return changedTask;
        }
      }
      return t;
    });
    saveTasks(updated, changedTask);
  };

  // Unassign user from a task
  const handleUnassignTask = (taskId: string, userId: string) => {
    let changedTask: PlannerTask | undefined;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const currentArr = t.assignedToUsers || (t.assignedTo ? [t.assignedTo] : []);
        const newArr = currentArr.filter(id => id !== userId);
        changedTask = { ...t, assignedToUsers: newArr, assignedTo: newArr[0] || undefined };
        return changedTask;
      }
      return t;
    });
    saveTasks(updated, changedTask);
  };

  // Change task status
  const handleStatusChange = (taskId: string, status: 'pendiente' | 'proceso' | 'completado') => {
    let changedTask: PlannerTask | undefined;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        changedTask = { ...t, status };
        return changedTask;
      }
      return t;
    });
    saveTasks(updated, changedTask);
  };

  // Delete a task
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    saveTasks(updated, undefined, taskId);
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
      setFormError('La descripción del proyecto/fase es obligatoria.');
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
      status: formInitialStatus,
      priority: formPriority,
      estimatedHours: typeof formHours === 'number' ? formHours : undefined,
      assignedToUsers: formAssignedUsers,
      assignedTo: formAssignedUsers[0] || undefined
    };

    saveTasks([newTask, ...tasks], newTask);

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
        saturationLabel = 'Óptima';
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

  // Horas Planificadas Operativas del Planner
  const totalPlannedHours = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  }, [tasks]);

  const completedPlannedHours = useMemo(() => {
    return tasks.filter(t => t.status === 'completado').reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  }, [tasks]);

  const inProgressPlannedHours = useMemo(() => {
    return tasks.filter(t => t.status === 'proceso').reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  }, [tasks]);

  // Top Header High-Level Project KPI Widgets
  const topHeaderKpis = useMemo(() => {
    // 1. Total Active Projects (proyectos con fases sin completar o estado no finalizado)
    const activeProjects = projects.filter(p => p.phases.some(ph => ph.status !== 'completed'));
    const totalActiveProjectsCount = activeProjects.length;

    // Proyectos con riesgo o salud óptima
    const criticalHealthProjects = activeProjects.filter(p => p.health < 60).length;
    const optimalHealthProjects = activeProjects.filter(p => p.health >= 80).length;

    // 2. Overall Agency Utilization % (Utilización General de la Agencia)
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
    <div className="p-4 sm:p-8 bg-[#F4F5F0] min-h-full overflow-y-auto overflow-x-hidden space-y-6 flex flex-col max-w-full" id="planner-daily-grid">

      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-widest mb-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-800" />
            Planificación Diaria & Dailys
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Planner Dailys & Status del Proyecto</h1>
          <p className="text-xs text-slate-500 font-normal">Asigna operadores al escuadrón arrastrando fichas de usuario y monitorea la salud del proyecto en tiempo real.</p>
        </div>
      </div>

      {/* BANDA DE ESTADO & SALUD GENERAL (ESTILO DE LA IMAGEN DE REFERENCIA CON LOS DATOS REALES DEL PLANNER) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200/70" id="planner-metrics-header-band">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-stone-100 gap-4 sm:gap-0">
          
          {/* 1. Proyectos Activos */}
          <div
            onClick={() => kpiPanel.openPanel('active_projects')}
            className="px-3 sm:px-6 py-1 flex flex-col justify-center cursor-pointer group"
          >
            <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
              Proyectos Activos
            </span>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1 flex items-baseline gap-1">
              <span>{topHeaderKpis.totalActiveProjectsCount}</span>
              <span className="text-base text-emerald-600">▲</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 mt-1">
              {topHeaderKpis.optimalHealthProjects} en salud óptima
            </span>
          </div>

          {/* 2. Tareas Planificadas */}
          <div className="px-3 sm:px-6 py-1 flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-800">
              Tareas Planificadas
            </span>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1 font-sans">
              {projectDashboardMetrics.totalTasksCount}
            </div>
            <span className="text-xs font-medium text-slate-500 mt-1">
              {projectDashboardMetrics.pendingTasksCount} pendientes por iniciar
            </span>
          </div>

          {/* 3. En Producción */}
          <div className="px-3 sm:px-6 py-1 flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-800">
              En Producción
            </span>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1 font-sans">
              {projectDashboardMetrics.inProgressTasksCount}
            </div>
            <span className="text-xs font-semibold text-sky-600 mt-1">
              {inProgressPlannedHours}h en ejecución activa
            </span>
          </div>

          {/* 4. Horas Planificadas */}
          <div className="px-3 sm:px-6 py-1 flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-800">
              Horas Planificadas
            </span>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1 font-mono">
              {totalPlannedHours}h
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-1">
              {completedPlannedHours}h completadas
            </span>
          </div>

          {/* 5. Tareas Completadas */}
          <div className="px-3 sm:px-6 py-1 flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-800">
              Tareas Completadas
            </span>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1 font-sans">
              {projectDashboardMetrics.completedTasksCount}
            </div>
            <span className="text-xs font-semibold text-emerald-600 mt-1">
              {projectDashboardMetrics.taskCompletionPercent}% avance del sprint
            </span>
          </div>

        </div>
      </div>

      {/* PROTASK TABLA DE PENDIENTES & CONTROLES */}
      <div className="bg-white rounded-3xl shadow-xs p-5 sm:p-7 space-y-5 font-sans text-slate-900" id="planner-protask-table-container">

        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Pendientes & Tareas del Día
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Gestión tabular de pendientes con asignación de equipo (máx. 2 por tarea).
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
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Nueva Tarea</span>
              </button>
            )}
          </div>
        </div>

        {/* SECCIÓN: EQUIPO DISPONIBLE */}
        <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Equipo disponible ({operatorsList.length} miembros)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Arrastra la foto circular para asignar a una tarea
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-stone-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => scrollTeam('left')}
                  className="w-6 h-6 rounded-full hover:bg-stone-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Desplazar a la izquierda"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTeam('right')}
                  className="w-6 h-6 rounded-full hover:bg-stone-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Desplazar a la derecha"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={teamScrollRef}
            className="flex items-center justify-center gap-4 overflow-x-auto max-w-full pb-2 scroll-smooth touch-pan-x flex-nowrap py-1"
          >
            {operatorsList.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium">Cargando equipo disponible...</span>
            ) : (
              operatorsList.map(user => (
                <DraggableUser
                  key={user.id}
                  user={user}
                  color={getUserColor(user.role)}
                />
              ))
            )}
          </div>
        </div>

        {/* Protask Tabs & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-stone-100">

          {/* Tabs switchers (Lista y Kanban Pro) */}
          <div className="flex items-center gap-1 bg-[#F4F5F0] p-1.5 rounded-full text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPlannerViewMode('list')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                plannerViewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-slate-800" />
              <span>Lista Detallada</span>
            </button>

            <button
              onClick={() => setPlannerViewMode('kanban')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                plannerViewMode === 'kanban'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Kanban Pro ✨</span>
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
                className="w-full bg-[#F4F5F0] hover:bg-white focus:bg-white border-0 rounded-full pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* Configurable Max Members Selector (Corregido: sin tono café/ámbar) */}
            <select
              value={maxMembersPerTask}
              onChange={(e) => setMaxMembersPerTask(Number(e.target.value))}
              title="Límite máximo de integrantes por tarea"
              className="bg-[#F4F5F0] hover:bg-white text-slate-800 border border-stone-200/80 rounded-full px-3.5 py-1.5 text-xs font-bold outline-none cursor-pointer shadow-2xs transition-colors"
            >
              <option value={1}>Máx Equipo: 1</option>
              <option value={2}>Máx Equipo: 2 (Default)</option>
              <option value={3}>Máx Equipo: 3</option>
              <option value={4}>Máx Equipo: 4</option>
              <option value={5}>Máx Equipo: 5</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F4F5F0] rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-2xs"
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
              className="bg-[#F4F5F0] rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-2xs"
            >
              <option value="todos">Equipo: Todos</option>
              <option value="sin_asignar">Sin Asignar</option>
              <option value="mi_asignado">Asignados a Mí</option>
              {operatorsList.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>

          </div>

        </div>

        {/* Floating Wizard Modal para Añadir Tarea */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Wizard Header */}
              <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-lime-50 text-lime-700 flex items-center justify-center font-bold text-xs">
                    {wizardStep}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#c6ef4e]" />
                      Nueva Tarea / Pendiente
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {wizardStep === 1 ? 'Paso 1: Información del Proyecto y Tarea' : 'Paso 2: Asignar Miembros del Equipo (máx 2)'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold cursor-pointer transition-colors text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Wizard Stepper Tabs */}
              <div className="flex border-b border-stone-100 bg-white px-5 py-2.5 gap-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className={`flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    wizardStep === 1 ? 'bg-lime-50 text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-700">1</span>
                  <span>1. Detalles Tarea</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!formBrand.trim() || !formProjectName.trim()) {
                      setFormError('Por favor completa el cliente y la descripción de la tarea primero.');
                      return;
                    }
                    setFormError(null);
                    setWizardStep(2);
                  }}
                  className={`flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    wizardStep === 2 ? 'bg-lime-50 text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
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
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#c6ef4e] focus:border-[#c6ef4e] outline-none transition-all font-medium cursor-pointer"
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
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#c6ef4e] focus:border-[#c6ef4e] outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Prioridad</label>
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value as any)}
                          className="w-full bg-[#F4F5F0] border-0 rounded-2xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#c6ef4e] outline-none transition-all font-medium cursor-pointer"
                        >
                          <option value="alta">🔴 Alta</option>
                          <option value="media">🟡 Media</option>
                          <option value="baja">🔵 Baja</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">Descripción de la Tarea *</label>
                        <input
                          type="text"
                          value={formProjectName}
                          onChange={(e) => setFormProjectName(e.target.value)}
                          placeholder="Ej: Producción de Video Reels para Redes Sociales"
                          className="w-full bg-[#F4F5F0] border-0 rounded-2xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#c6ef4e] outline-none transition-all font-medium"
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
                          className="w-full bg-[#F4F5F0] border-0 rounded-2xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#c6ef4e] outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Fecha de Inicio *</label>
                        <input
                          type="date"
                          value={formStart}
                          onChange={(e) => setFormStart(e.target.value)}
                          className="w-full bg-[#F4F5F0] border-0 rounded-2xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#c6ef4e] outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">Fecha de Entrega / Deadline *</label>
                        <input
                          type="date"
                          value={formDeadline}
                          onChange={(e) => setFormDeadline(e.target.value)}
                          className="w-full bg-[#F4F5F0] border-0 rounded-2xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#c6ef4e] outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">
                            Asignar Responsables del Escuadrón
                          </label>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {formAssignedUsers.length}/2 Seleccionados
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Selecciona hasta un máximo de 2 operadores para responsabilizarse de esta tarea.
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
                                      setFormError('Máximo 2 miembros por tarea.');
                                      return;
                                    }
                                    setFormError(null);
                                    setFormAssignedUsers(prev => [...prev, u.id]);
                                  }
                                }}
                                className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-lime-50 text-slate-900 shadow-2xs ring-2 ring-[#c6ef4e]'
                                    : 'bg-white text-slate-700 hover:bg-stone-50'
                                }`}
                              >
                                <img
                                  src={getUserAvatarUrl(u.username)}
                                  alt={u.username}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold truncate capitalize">{u.username}</div>
                                  <div className="text-xs text-slate-400 font-medium">{u.puesto || u.role}</div>
                                </div>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isSelected ? 'bg-[#c6ef4e] text-black' : 'bg-stone-200 text-transparent'
                                }`}>
                                  ✓
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wizard Footer Controls */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (wizardStep === 2) {
                          setWizardStep(1);
                        } else {
                          setShowAddForm(false);
                        }
                      }}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-colors cursor-pointer"
                    >
                      {wizardStep === 2 ? '← Volver al Paso 1' : 'Cancelar'}
                    </button>

                    {wizardStep === 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!formBrand.trim() || !formProjectName.trim()) {
                            setFormError('Completa la marca y la descripción de la tarea.');
                            return;
                          }
                          setFormError(null);
                          setWizardStep(2);
                        }}
                        className="bg-[#c6ef4e] hover:bg-[#b5e03b] text-black font-bold px-5 py-2 rounded-full text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-[0.99]"
                      >
                        <span>Siguiente: Asignar Equipo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="bg-[#c6ef4e] hover:bg-[#b5e03b] text-black font-bold px-5 py-2 rounded-full text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-[0.99]"
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

        {/* VISTAS DINÁMICAS: LISTA, KANBAN, CALENDARIO, TARJETAS */}
        {plannerViewMode === 'list' && (
          <div className="overflow-x-auto rounded-2xl shadow-xs bg-white">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                <span className="font-bold text-sm text-slate-800 block">No hay pendientes que coincidan con los filtros</span>
                <span className="text-xs text-slate-400 mt-1">Intenta cambiar la búsqueda o agrega una nueva tarea.</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-[#F4F5F0] text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-stone-200">
                    <th className="p-3 w-10 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-[#c6ef4e] focus:ring-[#c6ef4e] cursor-pointer" />
                    </th>
                    <th className="p-3">PROYECTO & MARCA</th>
                    <th className="p-3">INICIO</th>
                    <th className="p-3">DEADLINE</th>
                    <th className="p-3 text-center">HORAS</th>
                    <th className="p-3 text-center">ESTADO</th>
                    <th className="p-3 text-center min-w-[120px]">EQUIPO (MÁX {maxMembersPerTask})</th>
                    <th className="p-3 text-center">PRIORIDAD</th>
                    <th className="p-3 text-right w-12">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
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
                          <input type="checkbox" className="rounded border-slate-300 text-[#c6ef4e] focus:ring-[#c6ef4e] cursor-pointer" />
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-lime-50 text-lime-700 border border-lime-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
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
                          <div className="inline-flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              task.status === 'completado'
                                ? 'bg-[#D1F349] border border-[#9cc920]'
                                : task.status === 'proceso'
                                ? 'bg-[#D1F349]/70 animate-pulse border border-[#D1F349]'
                                : 'bg-[#D1F349]/30 border border-[#D1F349]/60'
                            }`} />
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                              className={`px-3 py-1 rounded-full text-xs font-bold outline-none cursor-pointer border transition-all shadow-2xs ${
                                task.status === 'completado'
                                  ? 'bg-[#D1F349] text-slate-950 border-[#b5e03b] hover:bg-[#c3e63d] font-extrabold'
                                  : task.status === 'proceso'
                                  ? 'bg-[#D1F349]/40 text-slate-950 border-[#D1F349] hover:bg-[#D1F349]/50 font-bold'
                                  : 'bg-[#D1F349]/15 text-slate-800 border-[#D1F349]/40 hover:bg-[#D1F349]/25 font-semibold'
                              }`}
                            >
                              <option value="pendiente">Brief / Pendiente</option>
                              <option value="proceso">Diseño / En Proceso</option>
                              <option value="completado">Completado</option>
                            </select>
                          </div>
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
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${
                            task.priority === 'alta' ? 'bg-rose-50 text-rose-700 border-rose-200/80' :
                            task.priority === 'baja' ? 'bg-slate-100 text-slate-700 border-slate-200/80' :
                            'bg-amber-50 text-amber-700 border-amber-200/80'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              task.priority === 'alta' ? 'bg-rose-500' :
                              task.priority === 'baja' ? 'bg-slate-400' :
                              'bg-amber-500'
                            }`} />
                            {task.priority === 'alta' ? 'Alta' : task.priority === 'baja' ? 'Baja' : 'Media'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          {currentUser.role === 'coordinador' && (
                            <button
                              type="button"
                              onClick={() => setTaskToDelete(task.id)}
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

        {/* KANBAN PRO VIEW (CON 3 RECUADROS DE COLORES DIFERENCIADOS NO VERDES) */}
        {plannerViewMode === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="kanban-pro-board-view">
            {[
              {
                id: 'pendiente' as const,
                title: 'Brief & Pendientes',
                dotColor: 'bg-amber-500',
                border: 'border-amber-200/90',
                bg: 'bg-amber-50/50',
                badgeText: 'text-amber-900',
                badgeBg: 'bg-amber-100/90 border border-amber-300/80',
                hoursAccent: 'text-amber-900 bg-amber-100/80 border-amber-300/80',
                progressColor: 'bg-amber-500',
                quickBtn: '+ Nuevo Brief'
              },
              {
                id: 'proceso' as const,
                title: 'En Proceso / Producción',
                dotColor: 'bg-sky-500 animate-pulse',
                border: 'border-sky-200/90',
                bg: 'bg-sky-50/50',
                badgeText: 'text-sky-900',
                badgeBg: 'bg-sky-100/90 border border-sky-300/80',
                hoursAccent: 'text-sky-900 bg-sky-100/80 border-sky-300/80',
                progressColor: 'bg-sky-500',
                quickBtn: '+ Iniciar Tarea'
              },
              {
                id: 'completado' as const,
                title: 'Completados / Entregados',
                dotColor: 'bg-indigo-600',
                border: 'border-indigo-200/90',
                bg: 'bg-indigo-50/50',
                badgeText: 'text-indigo-900 font-extrabold',
                badgeBg: 'bg-indigo-100/90 border border-indigo-300/80 shadow-2xs',
                hoursAccent: 'text-indigo-900 bg-indigo-100/80 border-indigo-300/80 font-bold',
                progressColor: 'bg-indigo-600',
                quickBtn: '+ Cerrar Entrega'
              }
            ].map(column => {
              const columnTasks = filteredTasks.filter(t => t.status === column.id);
              const columnHours = columnTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

              return (
                <div
                  key={column.id}
                  className={`p-4 rounded-3xl border ${column.border} ${column.bg} flex flex-col space-y-3.5 min-h-[500px] transition-all`}
                >
                  {/* Encabezado con métricas WIP y capacidad */}
                  <div className="pb-3 border-b border-stone-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                          {column.title}
                        </h3>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border border-stone-200/60 ${column.badgeBg} ${column.badgeText} shadow-2xs`}>
                        {columnTasks.length} {columnTasks.length === 1 ? 'tarea' : 'tareas'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-mono font-bold px-2.5 py-0.5 rounded-lg border text-[11px] ${column.hoursAccent}`}>
                        ⚡ {columnHours} hrs acumuladas
                      </span>
                      <button
                        type="button"
                        onClick={() => openCreateTaskModal(column.id)}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-slate-900" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista de Tarjetas del Tablero */}
                  <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
                    {columnTasks.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 font-medium italic border-2 border-dashed border-stone-200/80 rounded-2xl bg-white/50 flex flex-col items-center gap-2">
                        <Sparkles className="w-5 h-5 text-slate-300" />
                        <span>Sin tareas en esta etapa</span>
                        <button
                          type="button"
                          onClick={() => openCreateTaskModal(column.id)}
                          className="mt-1 px-3 py-1 bg-white hover:bg-stone-100 text-slate-700 font-bold rounded-full border border-stone-200 shadow-2xs text-[11px] cursor-pointer transition-all"
                        >
                          {column.quickBtn}
                        </button>
                      </div>
                    ) : (
                      columnTasks.map(task => {
                        const assignedUsersList = task.assignedToUsers || (task.assignedTo ? [task.assignedTo] : []);

                        return (
                          <div
                            key={task.id}
                            className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3 group/card"
                          >
                            {/* Cabecera Tarjeta: Marca & Prioridad */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                {task.brand}
                              </span>

                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${
                                task.priority === 'alta' ? 'bg-rose-50 text-rose-700 border-rose-200/70' :
                                task.priority === 'baja' ? 'bg-slate-100 text-slate-700 border-slate-200/70' :
                                'bg-amber-50 text-amber-700 border-amber-200/70'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  task.priority === 'alta' ? 'bg-rose-500' :
                                  task.priority === 'baja' ? 'bg-slate-400' :
                                  'bg-amber-500'
                                }`} />
                                {task.priority}
                              </span>
                            </div>

                            {/* Título de Proyecto */}
                            <h4 className="font-bold text-xs text-slate-900 leading-snug">
                              {task.project}
                            </h4>

                            {/* Barra de progreso de la tarea según su estado */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                                <span>
                                  {column.id === 'completado' ? 'Entrega verificada' : column.id === 'proceso' ? 'En ejecución activa' : 'Pendiente de inicio'}
                                </span>
                                <span className="font-mono font-bold text-slate-700">
                                  {column.id === 'completado' ? '100%' : column.id === 'proceso' ? '60%' : '20%'}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${column.progressColor} ${
                                    column.id === 'completado' ? 'w-full shadow-xs' :
                                    column.id === 'proceso' ? 'w-2/3' :
                                    'w-1/4'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Metadatos Horas y Deadline */}
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-[#F4F5F0] p-2 rounded-xl">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <strong>{task.estimatedHours || 0}h</strong>
                              </span>
                              <span className="flex items-center gap-1 font-sans text-[11px]">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{task.deadline || 'Sin fecha'}</span>
                              </span>
                            </div>

                            {/* Asignación de Equipo y Controles de Movimiento de Estado */}
                            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
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
                                    className="px-2.5 py-1 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                                    title="Mover a etapa previa"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                )}
                                {column.id !== 'completado' && (
                                  <button
                                    onClick={() => handleStatusChange(task.id, column.id === 'pendiente' ? 'proceso' : 'completado')}
                                    className="px-3 py-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer transition-all shadow-xs flex items-center gap-1"
                                    title="Avanzar a siguiente etapa"
                                  >
                                    <span>{column.id === 'pendiente' ? 'Iniciar' : 'Finalizar'}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                                {currentUser.role === 'coordinador' && (
                                  <button
                                    onClick={() => setTaskToDelete(task.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-0.5"
                                    title="Eliminar tarea"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

        {/* Protask Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <span className="bg-[#F4F5F0] px-3.5 py-1.5 rounded-full text-slate-700 font-bold">
              {filteredTasks.length} Tareas Mostradas
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="px-3.5 py-1.5 rounded-full bg-stone-100 text-slate-600 hover:bg-stone-200 transition-colors cursor-pointer">
              {"< Anterior"}
            </button>
            <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center">
              1
            </span>
            <button className="px-3.5 py-1.5 rounded-full bg-stone-100 text-slate-600 hover:bg-stone-200 transition-colors cursor-pointer">
              {"Siguiente >"}
            </button>
          </div>
        </div>

      </div>

      {/* 🔍 INTERACTIVE KPI DRILL-DOWN SIDE PANEL */}
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

      {/* Modal Confirmación Eliminación Tarea */}
      <CustomModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        type="danger"
        isDestructive={true}
        title="¿Eliminar este pendiente?"
        description="Esta tarea será eliminada permanentemente del planificador."
        confirmLabel="Eliminar pendiente"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (taskToDelete) {
            handleDeleteTask(taskToDelete);
            setTaskToDelete(null);
          }
        }}
      />
    </div>
  );
};

