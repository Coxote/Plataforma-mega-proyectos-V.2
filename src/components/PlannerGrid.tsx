import React, { useState, useMemo, useEffect } from 'react';
import { DraggableUser } from './DraggableUser';
import { DroppableTaskCell } from './DroppableTaskCell';
import { KpiSidePanel } from './KpiSidePanel';
import { useKpiSidePanel } from '../hooks/useKpiSidePanel';
import { Project, UserSession, getUserAvatarUrl } from '../types';
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

const STORAGE_KEY = 'saas_phase_system_planner_tasks_v2';

const INITIAL_TASKS: PlannerTask[] = [
  { 
    id: 't-1', 
    brand: 'Alpha Brand', 
    project: 'Renovación de UI & Copy', 
    start: '2026-07-24', 
    deadline: '2026-07-28', 
    status: 'proceso',
    assignedToUsers: ['u-1', 'u-2'],
    priority: 'alta',
    estimatedHours: 8
  },
  { 
    id: 't-2', 
    brand: 'Beta Global', 
    project: 'Campaña Creativa Redes', 
    start: '2026-07-25', 
    deadline: '2026-07-30', 
    status: 'pendiente',
    assignedToUsers: ['u-3'],
    priority: 'media',
    estimatedHours: 12
  },
];

export const PlannerGrid: React.FC<PlannerGridProps> = ({ projects = [], users = [], currentUser }) => {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [assignedFilter, setAssignedFilter] = useState<string>('todos');

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
      if (formAssignedUsers.length >= 2) {
        setFormAssignedUsers([formAssignedUsers[1], userId]);
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

  // Assign user to a task (supports max 2 users)
  const handleAssignTask = (taskId: string, userId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const currentArr = t.assignedToUsers || (t.assignedTo ? [t.assignedTo] : []);
        if (!currentArr.includes(userId)) {
          let newArr = [...currentArr, userId];
          if (newArr.length > 2) {
            newArr = newArr.slice(newArr.length - 2); // strictly max 2 members
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
    <div className="p-3 sm:p-6 bg-slate-50/50 min-h-full overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-6 flex flex-col max-w-full" id="planner-daily-grid">
      
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
            <Calendar className="w-3.5 h-3.5 text-lime-600" />
            Planificación Diaria & Dailys
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Planner Dailys & Status del Proyecto</h1>
          <p className="text-xs text-slate-500 font-medium">Asigna operadores al escuadrón arrastrando fichas de usuario y monitorea la salud del proyecto en tiempo real.</p>
        </div>
      </div>

      {/* 🚀 TOP HEADER ROW: HIGH-LEVEL PROJECT KPI WIDGETS (PILL-SHAPED DESIGN WITH MODAL DRILL-DOWN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-full" id="planner-top-kpi-row">
        
        {/* KPI 1: Total Active Projects */}
        <div 
          onClick={() => kpiPanel.openPanel('active_projects')}
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-indigo-300 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group"
          title="Haz clic para ver el desglose de proyectos activos en el panel lateral"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="w-full space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Proyectos Activos
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs flex items-center gap-1 shrink-0">
                  {topHeaderKpis.totalActiveProjectsCount} / {topHeaderKpis.totalProjects} Portafolio
                  <ChevronRight className="w-3 h-3 text-indigo-500" />
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {topHeaderKpis.totalActiveProjectsCount} <span className="text-xs sm:text-sm font-extrabold text-slate-500">Activos</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium text-slate-500 pt-0.5">
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {topHeaderKpis.optimalHealthProjects} óptima
                </span>
                {topHeaderKpis.criticalHealthProjects > 0 && (
                  <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[10px] font-bold">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    {topHeaderKpis.criticalHealthProjects} atención
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Overall Agency Utilization % */}
        <div 
          onClick={() => kpiPanel.openPanel('agency_utilization')}
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-emerald-300 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group"
          title="Haz clic para ver la utilización por miembro de equipo en el panel lateral"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <div className="w-full space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Utilización General Agencia
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs flex items-center gap-1 shrink-0 ${
                  topHeaderKpis.agencyUtilizationPercent >= 85
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {topHeaderKpis.agencyUtilizationPercent >= 85 ? 'Alta Carga' : 'Saludable'}
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </span>
              </div>

              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {topHeaderKpis.agencyUtilizationPercent}% <span className="text-xs sm:text-sm font-extrabold text-slate-500">Utilización</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500">
                  {topHeaderKpis.agencyConsumedHours}h / {topHeaderKpis.totalAgencyMonthlyCapacity}h cap.
                </span>
              </div>

              {/* Pill Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    topHeaderKpis.agencyUtilizationPercent >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${topHeaderKpis.agencyUtilizationPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Consumo de Horas & Retrabajo (SUBIDO A LA PRIMERA LINEA) */}
        <div 
          onClick={() => kpiPanel.openPanel('time_entry_log')}
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-300 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group"
          title="Haz clic para ver el registro detallado de horas consumidas"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <div className="w-full space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Consumo de Horas
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs flex items-center gap-1 shrink-0 ${
                  projectDashboardMetrics.reworkPercent > 15 
                    ? 'bg-rose-100 text-rose-900 border-rose-300' 
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {projectDashboardMetrics.reworkPercent}% Retrabajo
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {projectDashboardMetrics.totalConsumedHours}h <span className="text-xs sm:text-sm font-extrabold text-slate-400">/ {projectDashboardMetrics.totalBudgetHours}h Presup.</span>
              </div>

              <div className="text-[11px] font-medium text-slate-500">
                <strong className="font-bold text-slate-700">{projectDashboardMetrics.totalReworkHours}h</strong> en ajustes y correcciones
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Pending Approvals */}
        <div 
          onClick={() => kpiPanel.openPanel('pending_approvals')}
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-amber-300 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group"
          title="Haz clic para ver los entregables pendientes de aprobación en el panel lateral"
        >
          <div className="flex items-center gap-3 w-full">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
              topHeaderKpis.totalPendingApprovalsCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700 group-hover:bg-amber-500 group-hover:text-white'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
            }`}>
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="w-full space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Aprobaciones Pendientes
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs flex items-center gap-1 shrink-0 ${
                  topHeaderKpis.totalPendingApprovalsCount > 0
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {topHeaderKpis.totalPendingApprovalsCount > 0 ? 'Pendiente Cliente' : 'Al Día'}
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {topHeaderKpis.totalPendingApprovalsCount} <span className="text-xs sm:text-sm font-extrabold text-slate-500">Entregable(s)</span>
              </div>

              <div className="text-[11px] font-medium text-slate-500">
                {topHeaderKpis.totalPendingApprovalsCount === 0 ? (
                  <span className="text-emerald-700 font-bold">Sin entregables estancados en revisión</span>
                ) : (
                  <span className="text-amber-800 font-bold">Entregables aguardando validación</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PROTASK TABLA DE PENDIENTES & CONTROLES */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-4 font-sans text-slate-900" id="planner-protask-table-container">
        
        {/* Header Bar inspired by Protask */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pendientes & Tareas del Día
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
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
                className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Tarea</span>
              </button>
            )}
          </div>
        </div>

        {/* 👥 SECCIÓN: EQUIPO DISPONIBLE (Arrastrables con Avatares y Nombres Abajo) */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
              Equipo disponible
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Arrastra un miembro a la columna Equipo o haz clic en +
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1 scrollbar-none touch-pan-x flex-nowrap">
            {operatorsList.length === 0 ? (
              <span className="text-[10px] text-slate-400 font-medium">Cargando equipo disponible...</span>
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
                +{operatorsList.length - 10} más
              </div>
            )}
          </div>
        </div>

        {/* Protask Tabs & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          
          {/* Tabs switchers (Calendar, List, Cards, Kanban) */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-2xs border border-slate-200/80 cursor-pointer">
              <ListFilter className="w-3.5 h-3.5 text-pink-600" />
              <span>Lista</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">
              <Layers className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">
              <BarChart3 className="w-3.5 h-3.5" />
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
              <option value="mi_asignado">Asignados a Mí</option>
              {operatorsList.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>

          </div>

        </div>

        {/* Floating Wizard Modal para Añadir Tarea */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 text-white w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Wizard Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-black text-sm">
                    {wizardStep}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      Wizard: Nueva Tarea / Pendiente
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {wizardStep === 1 ? 'Paso 1: Información del Proyecto y Tarea' : 'Paso 2: Asignar Miembros del Equipo (máx 2)'}
                    </p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)} 
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-black cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Wizard Stepper Tabs */}
              <div className="flex border-b border-slate-800/80 bg-slate-900/80 px-6 py-3 gap-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    wizardStep === 1 ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">1</span>
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
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    wizardStep === 2 ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">2</span>
                  <span>2. Asignar Equipo ({formAssignedUsers.length}/2)</span>
                </button>
              </div>

              {/* Wizard Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                {formError && (
                  <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs rounded-xl p-3 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleAddTaskSubmit} className="space-y-4">
                  {wizardStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asociar a Proyecto Existente (Opcional)</label>
                        <select
                          value={formSelectedProjectId}
                          onChange={(e) => handleSelectProjectInForm(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-pink-400/40 outline-none transition-all font-semibold cursor-pointer"
                        >
                          <option value="">-- No asociar / Tarea Independiente --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente / Marca *</label>
                        <input
                          type="text"
                          value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          placeholder="Ej: Arrocha, Banco General"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-pink-400/40 outline-none transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad</label>
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value as any)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-pink-400/40 outline-none transition-all font-semibold cursor-pointer"
                        >
                          <option value="alta">🔴 Alta (High)</option>
                          <option value="media">🟠 Media (Medium)</option>
                          <option value="baja">🔵 Baja (Low)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción del Pendiente / Tarea *</label>
                        <input
                          type="text"
                          value={formProjectName}
                          onChange={(e) => setFormProjectName(e.target.value)}
                          placeholder="Ej: Producción de Video Reels para Redes Social"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-pink-400/40 outline-none transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horas Estimadas</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formHours}
                          onChange={(e) => setFormHours(e.target.value ? Number(e.target.value) : '')}
                          placeholder="Ej: 8"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-pink-400/40 outline-none transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Inicio *</label>
                        <input
                          type="date"
                          value={formStart}
                          onChange={(e) => setFormStart(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-pink-400/40 outline-none transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline / Entrega *</label>
                        <input
                          type="date"
                          value={formDeadline}
                          onChange={(e) => setFormDeadline(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-pink-400/40 outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black uppercase tracking-wider text-pink-400">
                            Asignar Responsables del Escuadrón
                          </label>
                          <span className="text-xs font-mono font-bold text-slate-300">
                            {formAssignedUsers.length}/2 Seleccionados
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Selecciona hasta un máximo de 2 operadores para responsabilizarse de esta tarea.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
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
                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-pink-600/20 border-pink-500 text-white shadow-xs'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                                }`}
                              >
                                <img
                                  src={getUserAvatarUrl(u.username)}
                                  alt={u.username}
                                  className="w-9 h-9 rounded-full object-cover border-2 border-slate-700 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold truncate capitalize">{u.username}</div>
                                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{u.puesto || u.role}</div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                                  isSelected ? 'bg-pink-500 border-pink-400 text-white' : 'border-slate-600 text-transparent'
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
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (wizardStep === 2) {
                          setWizardStep(1);
                        } else {
                          setShowAddForm(false);
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
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
                        className="bg-pink-600 hover:bg-pink-500 text-white font-black px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md flex items-center gap-2"
                      >
                        <span>Siguiente: Asignar Equipo</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="bg-pink-600 hover:bg-pink-500 text-white font-black px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Crear Tarea</span>
                      </button>
                    )}
                  </div>

                </form>
              </div>

            </div>
          </div>
        )}

        {/* Tabla Protask */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
              <span className="font-bold text-sm text-slate-800 block">No hay pendientes que coincidan con los filtros</span>
              <span className="text-xs text-slate-400 mt-1">Intenta cambiar la búsqueda o agrega una nueva tarea.</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                  <th className="p-3.5 w-10 text-center">
                    <input type="checkbox" className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer" />
                  </th>
                  <th className="p-3.5">PROJECT NAME</th>
                  <th className="p-3.5">START DATE</th>
                  <th className="p-3.5">DEADLINE</th>
                  <th className="p-3.5 text-center">HORAS</th>
                  <th className="p-3.5 text-center">STATUS</th>
                  <th className="p-3.5 text-center min-w-[120px]">EQUIPO (MÁX 2)</th>
                  <th className="p-3.5 text-center">PRIORITY</th>
                  <th className="p-3.5 text-right w-12">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(task => {
                  const assignedUsersList = task.assignedToUsers || (task.assignedTo ? [task.assignedTo] : []);

                  // Format dates nicely like 16/07/2026
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
                      
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer" />
                      </td>

                      {/* Project Name & Brand */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            {task.brand.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block leading-snug">
                              {task.project}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                              {task.brand}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="p-3.5 text-slate-600 font-semibold text-xs whitespace-nowrap">
                        {formatDateStr(task.start)}
                      </td>

                      {/* Deadline */}
                      <td className="p-3.5 text-slate-600 font-semibold text-xs whitespace-nowrap">
                        {formatDateStr(task.deadline)}
                      </td>

                      {/* Horas */}
                      <td className="p-3.5 text-center font-mono font-extrabold text-slate-700">
                        {task.estimatedHours ? `${task.estimatedHours}h` : '---'}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold outline-none cursor-pointer border transition-all ${
                            task.status === 'completado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : task.status === 'proceso'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="pendiente">Brief / Pendiente</option>
                          <option value="proceso">Diseño / En Proceso</option>
                          <option value="completado">Completado</option>
                        </select>
                      </td>

                      {/* Equipo (Solo Avatares Redondeados - Máx 2) */}
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

                      {/* Priority */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
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

                      {/* Acciones */}
                      <td className="p-3.5 text-right">
                        {currentUser.role === 'coordinador' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('¿Eliminar este pendiente?')) {
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

      {/* 📌 INDICADORES VISUALES: BARRAS DE PROGRESO DE FASE POR PROYECTO */}
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
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        {project.clientName || 'Cliente General'}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {project.name}
                      </h3>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      project.health >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      project.health >= 60 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {project.health}% Salud
                    </span>
                  </div>

                  {/* Active Phase Pill */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
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
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 border ${
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
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-bold text-slate-500">
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

    </div>
  );
};

