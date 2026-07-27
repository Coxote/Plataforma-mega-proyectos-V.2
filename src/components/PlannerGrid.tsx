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
  const [formBrand, setFormBrand] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formSelectedProjectId, setFormSelectedProjectId] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPriority, setFormPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [formHours, setFormHours] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

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

  // Assign user to a task (supports multiple users)
  const handleAssignTask = (taskId: string, userId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const currentArr = t.assignedToUsers || (t.assignedTo ? [t.assignedTo] : []);
        if (!currentArr.includes(userId)) {
          const newArr = [...currentArr, userId];
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
      assignedToUsers: []
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
            <Calendar className="w-3.5 h-3.5 text-lime-600" />
            Planificación Diaria & Dailys
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Planner Dailys & Status del Proyecto</h1>
          <p className="text-xs text-slate-500 font-medium">Asigna operadores al escuadrón arrastrando fichas de usuario y monitorea la salud del proyecto en tiempo real.</p>
        </div>

        {/* El "Banquillo" del equipo con fotos Y NOMBRES ABAJO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs w-full lg:w-auto overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
            Arrastrar Equipo:
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none touch-pan-x flex-nowrap sm:flex-wrap">
            {operatorsList.length === 0 ? (
              <span className="text-[10px] text-slate-400 font-medium">Cargando operadores...</span>
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
      </div>

      {/* 🚀 TOP HEADER ROW: HIGH-LEVEL PROJECT KPI WIDGETS (PILL-SHAPED DESIGN WITH MODAL DRILL-DOWN) */}
      <div className="flex md:grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none touch-pan-x max-w-full" id="planner-top-kpi-row">
        
        {/* KPI 1: Total Active Projects */}
        <div 
          onClick={() => kpiPanel.openPanel('active_projects')}
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-indigo-300 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group w-[280px] sm:w-[320px] md:w-auto shrink-0 md:shrink"
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
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-emerald-300 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group w-[280px] sm:w-[320px] md:w-auto shrink-0 md:shrink"
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

        {/* KPI 3: Total Pending Approvals */}
        <div 
          onClick={() => kpiPanel.openPanel('pending_approvals')}
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-amber-300 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group w-[280px] sm:w-[320px] md:w-auto shrink-0 md:shrink"
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
                  <span className="text-amber-800 font-bold">Entregables aguardando validación o feedback</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 📊 DASHBOARD DE STATUS GENERAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="planner-project-status-dashboard">
        
        {/* KPI 1: Proyectos Activos & Progreso */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Proyectos Activos
            </span>
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {projectDashboardMetrics.totalProjects} Portafolio
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {projectDashboardMetrics.totalProjects} Proyectos
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {projects.filter(p => p.health >= 80).length} en salud óptima (≥80%)
            </p>
          </div>
        </div>

        {/* KPI 2: Consumo de Horas & Retrabajo */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Consumo de Horas
            </span>
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
              projectDashboardMetrics.reworkPercent > 15 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {projectDashboardMetrics.reworkPercent}% Retrabajo
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {projectDashboardMetrics.totalConsumedHours}h <span className="text-xs font-normal text-slate-400">/ {projectDashboardMetrics.totalBudgetHours}h</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              <strong className="font-bold text-slate-700">{projectDashboardMetrics.totalReworkHours}h</strong> registradas en correcciones
            </p>
          </div>
        </div>

        {/* KPI 3: Capacidad del Escuadrón */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-200 transition-all duration-300 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Escuadrón Activo
            </span>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {operatorsList.length} Operadores
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {operatorsList.length} Miembros
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Listos para asignaciones mediante drag & drop
            </p>
          </div>
        </div>

        {/* KPI 4: Estado de Tareas Dailys */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-lime-200 transition-all duration-300 flex flex-col justify-between cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-lime-600" /> Avance de Tareas
            </span>
            <span className="text-xs font-extrabold text-lime-700 bg-lime-50 px-2 py-0.5 rounded-full border border-lime-200">
              {projectDashboardMetrics.taskCompletionPercent}% Completadas
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {projectDashboardMetrics.completedTasksCount} / {projectDashboardMetrics.totalTasksCount}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold mt-1 text-slate-500">
              <span className="text-sky-600">🔵 {projectDashboardMetrics.inProgressTasksCount} en proceso</span>
              <span className="text-rose-600">🔴 {projectDashboardMetrics.pendingTasksCount} pendientes</span>
            </div>
          </div>
        </div>

      </div>

      {/* 🚀 TARJETA DE RESUMEN: CARGA ACTUAL POR USUARIO */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-full overflow-hidden" id="planner-user-workload-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Resumen de Carga Actual por Usuario
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Saturación, horas estimadas asignadas y balance operativo del escuadrón.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 bg-slate-900 text-white rounded-full">
              {operatorsList.length} Miembros
            </span>
          </div>
        </div>

        <div className="flex sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none touch-pan-x max-w-full">
          {userWorkloadSummary.map(item => {
            const { user, totalTasksCount, completedCount, inProgressCount, pendingCount, totalHours, saturationLabel, saturationBadgeBg, progressColor, completionRatio } = item;

            return (
              <div 
                key={user.id} 
                className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:bg-white hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md transition-all duration-300 shadow-xs space-y-3 flex flex-col justify-between cursor-pointer w-[260px] sm:w-auto shrink-0 sm:shrink"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={getUserAvatarUrl(user.username)} 
                        alt={user.username} 
                        className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="overflow-hidden">
                        <span className="text-xs font-black text-slate-900 block truncate capitalize">
                          {user.username}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {user.puesto || user.role}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${saturationBadgeBg}`}>
                      {saturationLabel}
                    </span>
                  </div>

                  {/* Task counts & Hours */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Tareas Asignadas</span>
                      <span className="text-sm font-black text-slate-800">{totalTasksCount}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        ({completedCount} comp / {inProgressCount} proc)
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Carga Estimada</span>
                      <span className="text-sm font-black text-indigo-700">{totalHours} hrs</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {pendingCount} pendientes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-500">Tasa de Finalización</span>
                    <span className="text-slate-800 font-mono">{completionRatio}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
                      style={{ width: `${completionRatio}%` }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
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

      {/* FILTER & ADD BAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por marca o proyecto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium text-slate-800 min-h-[40px]"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 font-bold min-h-[40px] justify-between sm:justify-start">
            <div className="flex items-center gap-1.5 shrink-0">
              <ListFilter className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer text-slate-700 w-full"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="proceso">En Proceso</option>
              <option value="completado">Completados</option>
            </select>
          </div>

          {/* Assigned filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 font-bold min-h-[40px] justify-between sm:justify-start">
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer text-slate-700 w-full"
            >
              <option value="todos">Cualquier Asignado</option>
              <option value="sin_asignar">Sin Asignar</option>
              <option value="mi_asignado">Asignados a Mí</option>
              {operatorsList.map(u => (
                <option key={u.id} value={u.id}>Asignado a: {u.username}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add task button */}
        {currentUser.role === 'coordinador' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs min-h-[40px]"
          >
            <Plus className="w-4 h-4 text-lime-400" />
            Nueva Tarea Diaria
          </button>
        )}
      </div>

      {/* CREATE TASK MODAL / EXPANDABLE FORM */}
      {showAddForm && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Añadir Tarea al Tablero de Dailys</h3>
            </div>
            <button 
              onClick={() => setShowAddForm(false)} 
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              Cerrar
            </button>
          </div>

          {formError && (
            <div className="bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded-xl p-3 font-semibold">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddTaskSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Opcional: Link to real active project */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asociar Proyecto (Opcional)</label>
              <select
                value={formSelectedProjectId}
                onChange={(e) => handleSelectProjectInForm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold cursor-pointer"
              >
                <option value="">-- No asociar --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente / Marca *</label>
              <input
                type="text"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                placeholder="Ej: Alpha S.A."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Project description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción Tarea o Fase *</label>
              <input
                type="text"
                value={formProjectName}
                onChange={(e) => setFormProjectName(e.target.value)}
                placeholder="Ej: Diseño de Mockup Mobile o Revisión de Textos"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Prioridad */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold cursor-pointer"
              >
                <option value="alta">🔥 Alta Prioridad</option>
                <option value="media">⚡ Media Prioridad</option>
                <option value="baja">🔹 Baja Prioridad</option>
              </select>
            </div>

            {/* Horas Estimadas */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horas Estimadas</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formHours}
                onChange={(e) => setFormHours(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ej: 4"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Inicio *</label>
              <input
                type="date"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entrega Interna *</label>
              <input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Submit button */}
            <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black px-6 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-lime-400/10"
              >
                Crear Tarea Diaria
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TABLA DE TAREAS MEJORADA CON COLUMNAS RICAS & VARIOS OPERADORES */}
      <div className="flex-1 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden min-h-[350px]">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <HelpCircle className="w-12 h-12 text-slate-300 mb-3" />
            <span className="font-bold text-sm text-slate-800 block">No se encontraron tareas diarias</span>
            <span className="text-xs text-slate-400 max-w-sm mt-1">
              Ajusta los filtros o haz clic en "Nueva Tarea Diaria" para planificar el día.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider divide-x divide-slate-800">
                  <th className="p-3.5">Cliente / Marca</th>
                  <th className="p-3.5">Proyecto, Fase o Tarea</th>
                  <th className="p-3.5 text-center">Prioridad / Horas</th>
                  <th className="p-3.5"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Rango de Fechas</div></th>
                  <th className="p-3.5 text-center">Estado de Operación</th>
                  <th className="p-3.5 text-center min-w-[220px]">Operadores Asignados</th>
                  {currentUser.role === 'coordinador' && (
                    <th className="p-3.5 text-right w-16">Borrar</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTasks.map(task => {
                  const assignedUsersList = task.assignedToUsers || (task.assignedTo ? [task.assignedTo] : []);

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-100">
                      
                      {/* Brand */}
                      <td className="p-3.5">
                        <span className="font-black text-slate-900 text-sm block">{task.brand}</span>
                        {task.projectId && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wider">
                            Proyecto Enlazado
                          </span>
                        )}
                      </td>

                      {/* Project Name / Tasks */}
                      <td className="p-3.5 text-slate-800 font-semibold text-xs">
                        <span className="block font-bold">{task.project}</span>
                      </td>

                      {/* Priority / Estimated Hours */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            task.priority === 'alta' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            task.priority === 'baja' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {task.priority || 'media'}
                          </span>
                          {task.estimatedHours ? (
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              Est: {task.estimatedHours}h
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="p-3.5 text-slate-500 font-bold">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] text-slate-700 block">Inicia: {task.start}</span>
                          <span className="text-[11px] text-slate-400 block font-medium">Entrega: {task.deadline}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col gap-1.5 items-center justify-center">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border outline-none cursor-pointer transition-all ${
                              task.status === 'completado'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : task.status === 'proceso'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <option value="pendiente">🔴 Pendiente</option>
                            <option value="proceso">🔵 En Proceso</option>
                            <option value="completado">🟢 Completado</option>
                          </select>
                        </div>
                      </td>

                      {/* Droppable cell (Multi-Operator) */}
                      <td className="p-2.5">
                        <DroppableTaskCell
                          taskId={task.id}
                          assignedUserIds={assignedUsersList}
                          users={operatorsList}
                          onAssign={handleAssignTask}
                          onUnassign={handleUnassignTask}
                          getUserColor={getUserColor}
                        />
                      </td>

                      {/* Delete */}
                      {currentUser.role === 'coordinador' && (
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              if (confirm('¿Estás seguro de que deseas eliminar esta tarea diaria?')) {
                                handleDeleteTask(task.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

