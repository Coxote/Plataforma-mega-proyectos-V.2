import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Filter,
  Layers,
  Users,
  Search,
  Briefcase,
  Clock,
  ChevronDown,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Project, UserSession } from '../types';

interface GanttViewProps {
  projects: Project[];
  users: UserSession[];
}

export interface GanttItem {
  id: string;
  title: string;
  subtitle?: string;
  projectName: string;
  clientName: string;
  category?: string;
  assignedUsers: { id: string; name: string; avatar?: string; role?: string }[];
  startDay: number; // 1 - 31
  durationDays: number;
  progressPercent: number;
  status: 'completado' | 'proceso' | 'pendiente' | 'atrasado' | 'cancelado';
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
  };
  type: 'project' | 'phase' | 'task';
  originalDates: string;
  details: string;
  projectId: string;
}

const STORAGE_KEY = 'saas_phase_system_planner_tasks_v1';

// Preset vibrant & clean color palettes inspired by Taskken UI
const COLOR_THEMES = [
  {
    bg: 'bg-emerald-500 hover:bg-emerald-600',
    border: 'border-emerald-600',
    text: 'text-white',
    badgeBg: 'bg-white/25',
    badgeText: 'text-white',
  },
  {
    bg: 'bg-sky-500 hover:bg-sky-600',
    border: 'border-sky-600',
    text: 'text-white',
    badgeBg: 'bg-white/25',
    badgeText: 'text-white',
  },
  {
    bg: 'bg-indigo-600 hover:bg-indigo-700',
    border: 'border-indigo-700',
    text: 'text-white',
    badgeBg: 'bg-white/25',
    badgeText: 'text-white',
  },
  {
    bg: 'bg-amber-500 hover:bg-amber-600',
    border: 'border-amber-600',
    text: 'text-slate-950',
    badgeBg: 'bg-slate-950/20',
    badgeText: 'text-slate-950',
  },
  {
    bg: 'bg-purple-600 hover:bg-purple-700',
    border: 'border-purple-700',
    text: 'text-white',
    badgeBg: 'bg-white/25',
    badgeText: 'text-white',
  },
  {
    bg: 'bg-rose-500 hover:bg-rose-600',
    border: 'border-rose-600',
    text: 'text-white',
    badgeBg: 'bg-white/25',
    badgeText: 'text-white',
  },
];

export const GanttView: React.FC<GanttViewProps> = ({ projects = [], users = [] }) => {
  // View states
  const [groupBy, setGroupBy] = useState<'project' | 'user'>('project');
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week'>('day');

  // Filters
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('todos');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item modal for mobile & desktop
  const [activeModalItem, setActiveModalItem] = useState<GanttItem | null>(null);

  // Planner tasks from local storage
  const [plannerTasks, setPlannerTasks] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPlannerTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing planner tasks in GanttView:", e);
      }
    }
  }, []);

  // Helper date parser
  const getDayNumber = (dateStr: string, defaultDay: number): number => {
    if (!dateStr) return defaultDay;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        return isNaN(day) ? defaultDay : day;
      }
    }
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10);
        return isNaN(day) ? defaultDay : day;
      }
    }
    const parsed = parseInt(dateStr, 10);
    return isNaN(parsed) ? defaultDay : parsed;
  };

  // Build unified items from projects + planner tasks
  const rawGanttItems = useMemo<GanttItem[]>(() => {
    const items: GanttItem[] = [];

    // 1. PROJECTS AS MAIN GANTT BARS
    projects.forEach((proj, idx) => {
      // Calculate real project progress
      const completedPhases = proj.phases.filter(p => p.status === 'completed').length;
      const totalPhases = proj.phases.length || 1;
      const progressPercent = Math.round((completedPhases / totalPhases) * 100);

      // Find assigned users for this project
      const assignedUserMap = new Map<string, { id: string; name: string; avatar?: string; role?: string }>();

      // Add users allocated in budget
      Object.entries(proj.budget || {}).forEach(([role, budget]) => {
        if ((budget as any).allocated > 0) {
          users.filter(u => u.role === role).forEach(u => {
            assignedUserMap.set(u.id, {
              id: u.id,
              name: u.username,
              avatar: u.avatar || `https://i.pravatar.cc/100?u=${u.username}`,
              role: u.puesto || u.role
            });
          });
        }
      });

      // Also add members explicitly listed in project
      (proj.members || []).forEach(m => {
        assignedUserMap.set(m.id, {
          id: m.id,
          name: m.name || m.username || 'Miembro',
          avatar: m.avatar || `https://i.pravatar.cc/100?u=${m.name || m.id}`,
          role: m.role
        });
      });

      const assignedUsers = Array.from(assignedUserMap.values());

      // Determine timeline position (staggered realistically across days 1 to 31)
      const startDay = Math.min(24, Math.max(1, (idx * 5) % 20 + 2));
      const durationDays = Math.min(31 - startDay + 1, Math.max(6, 8 + (idx % 3) * 3));

      // Active phase label
      const activePhase = proj.phases.find(p => p.id === proj.activePhaseId) || proj.phases[0];
      const activePhaseLabel = activePhase ? activePhase.label : 'En Desarrollo';

      const theme = COLOR_THEMES[idx % COLOR_THEMES.length];

      items.push({
        id: `proj-${proj.id}`,
        title: proj.name,
        subtitle: `Cliente: ${proj.clientName} â€¢ Fase: ${activePhaseLabel}`,
        projectName: proj.name,
        clientName: proj.clientName,
        category: proj.activePhaseId ? activePhaseLabel : 'Proyecto',
        assignedUsers: assignedUsers.length > 0 ? assignedUsers : [
          { id: 'u1', name: 'Karen O.', role: 'Coordinador' },
          { id: 'u2', name: 'Carlos R.', role: 'Senior Dev' }
        ],
        startDay,
        durationDays,
        progressPercent: progressPercent || 45,
        status: progressPercent === 100 ? 'completado' : progressPercent > 0 ? 'proceso' : 'pendiente',
        colorTheme: theme,
        type: 'project',
        originalDates: `Julio ${startDay} - Julio ${startDay + durationDays - 1}`,
        details: `Proyecto con ${proj.phases.length} fases configuradas. Presupuesto activo de equipo.`,
        projectId: proj.id
      });
    });

    // 2. ADD PLANNER DAILY TASKS IF AVAILABLE
    plannerTasks.forEach((task, idx) => {
      if (!task.assignedTo) return;
      const assignedUser = users.find(u => u.id === task.assignedTo);
      const startDay = Math.min(30, Math.max(1, getDayNumber(task.start, 4)));
      const endDay = Math.min(31, Math.max(startDay, getDayNumber(task.deadline, 14)));
      const durationDays = Math.max(2, endDay - startDay + 1);

      const status = task.status === 'completado' ? 'completado' : task.status === 'proceso' ? 'proceso' : 'pendiente';
      const progressPercent = status === 'completado' ? 100 : status === 'proceso' ? 55 : 15;
      const theme = COLOR_THEMES[(idx + 2) % COLOR_THEMES.length];

      items.push({
        id: `task-${task.id}`,
        title: task.project || 'Tarea Planner',
        subtitle: `${task.brand} â€¢ ${task.status}`,
        projectName: task.project || 'Daily Task',
        clientName: task.brand || 'Marca',
        category: 'Tarea Planner',
        assignedUsers: assignedUser ? [{
          id: assignedUser.id,
          name: assignedUser.username,
          avatar: assignedUser.avatar || `https://i.pravatar.cc/100?u=${assignedUser.username}`,
          role: assignedUser.puesto || assignedUser.role
        }] : [],
        startDay,
        durationDays,
        progressPercent,
        status,
        colorTheme: theme,
        type: 'task',
        originalDates: `Del ${task.start} al ${task.deadline}`,
        details: `Tarea operativa asignada en el Planner diario.`,
        projectId: task.projectId || 'planner'
      });
    });

    // Fallback sample items if store is thin
    if (items.length === 0) {
      const fallbackThemes = COLOR_THEMES;
      const sampleProjects = [
        { id: 'f1', title: 'RediseÃ±o Web Corporativo', client: 'Arrocha', progress: 76, start: 2, dur: 12, theme: fallbackThemes[1] },
        { id: 'f2', title: 'Wireframing & Prototipado UX', client: 'Banco General', progress: 45, start: 8, dur: 10, theme: fallbackThemes[3] },
        { id: 'f3', title: 'Design System & TokenizaciÃ³n', client: 'SaaS Platform', progress: 100, start: 1, dur: 18, theme: fallbackThemes[0] },
        { id: 'f4', title: 'CampaÃ±a Redes Q3 (Sprites)', client: 'Cerveza PanamÃ¡', progress: 22, start: 14, dur: 11, theme: fallbackThemes[4] },
        { id: 'f5', title: 'InvestigaciÃ³n & Entrevistas UAT', client: 'Skaldic', progress: 62, start: 18, dur: 9, theme: fallbackThemes[2] },
      ];

      sampleProjects.forEach(sp => {
        items.push({
          id: sp.id,
          title: sp.title,
          subtitle: `Cliente: ${sp.client}`,
          projectName: sp.title,
          clientName: sp.client,
          category: 'DemostraciÃ³n',
          assignedUsers: [
            { id: 'u1', name: 'Karen O.', role: 'Coordinador' },
            { id: 'u2', name: 'LucÃ­a M.', role: 'DiseÃ±ador' }
          ],
          startDay: sp.start,
          durationDays: sp.dur,
          progressPercent: sp.progress,
          status: sp.progress === 100 ? 'completado' : 'proceso',
          colorTheme: sp.theme,
          type: 'project',
          originalDates: `Julio ${sp.start} - Julio ${sp.start + sp.dur - 1}`,
          details: 'Proyecto de demostraciÃ³n de lÃ­nea de tiempo estilo Gantt.',
          projectId: sp.id
        });
      });
    }

    return items;
  }, [projects, plannerTasks, users]);

  // Distinct lists for dropdown filters
  const distinctProjects = useMemo(() => {
    return Array.from(new Set(rawGanttItems.map(i => i.projectName)));
  }, [rawGanttItems]);

  const distinctUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    rawGanttItems.forEach(item => {
      item.assignedUsers.forEach(u => map.set(u.id, { id: u.id, name: u.name }));
    });
    if (map.size === 0) {
      users.forEach(u => map.set(u.id, { id: u.id, name: u.username }));
    }
    return Array.from(map.values());
  }, [rawGanttItems, users]);

  // Filtered Gantt Items
  const filteredGanttItems = useMemo(() => {
    return rawGanttItems.filter(item => {
      const matchesSearch = searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProject = selectedProjectFilter === 'todos' || item.projectName === selectedProjectFilter;

      const matchesUser = selectedUserFilter === 'todos' ||
        item.assignedUsers.some(u => u.id === selectedUserFilter || u.name === selectedUserFilter);

      const matchesStatus = selectedStatusFilter === 'todos' || item.status === selectedStatusFilter;

      return matchesSearch && matchesProject && matchesUser && matchesStatus;
    });
  }, [rawGanttItems, searchQuery, selectedProjectFilter, selectedUserFilter, selectedStatusFilter]);

  // Grouped Rows for rendering
  const groupedRows = useMemo(() => {
    if (groupBy === 'project') {
      return filteredGanttItems.map(item => ({
        id: item.id,
        label: item.title,
        sublabel: item.clientName,
        category: item.category,
        progressPercent: item.progressPercent,
        assignedUsers: item.assignedUsers,
        items: [item]
      }));
    } else {
      const userMap = new Map<string, { id: string; label: string; sublabel: string; items: GanttItem[] }>();

      filteredGanttItems.forEach(item => {
        if (item.assignedUsers.length === 0) {
          const fallbackKey = 'unassigned';
          if (!userMap.has(fallbackKey)) {
            userMap.set(fallbackKey, { id: fallbackKey, label: 'Sin Asignar', sublabel: 'General', items: [] });
          }
          userMap.get(fallbackKey)!.items.push(item);
        } else {
          item.assignedUsers.forEach(u => {
            if (!userMap.has(u.id)) {
              userMap.set(u.id, { id: u.id, label: u.name, sublabel: u.role || 'Miembro', items: [] });
            }
            userMap.get(u.id)!.items.push(item);
          });
        }
      });

      return Array.from(userMap.values());
    }
  }, [filteredGanttItems, groupBy]);

  const DAYS_IN_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);
  const CURRENT_DAY = 14; // Day 14 (July 14) reference date with 8:42 time marker

  // Calculate percentage center for Today line
  const todayLineLeftPct = ((CURRENT_DAY - 0.5) / 31) * 100;

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-full space-y-4 sm:space-y-6 flex flex-col relative font-sans text-slate-900" id="gantt-timeline-container">

      {/* HEADER PRINCIPAL VISTA GANTT */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-blue-600" />
            LÃ­nea de Tiempo & Cronograma
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gantt de Proyectos & Asignaciones
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Duraciones, porcentaje de avance en vivo y colaboradores asignados.
          </p>
        </div>

        {/* Calendar Month Header & Zoom Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => setZoomLevel('day')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                zoomLevel === 'day' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DÃ­a
            </button>
            <button
              onClick={() => setZoomLevel('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                zoomLevel === 'week' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/90 text-xs font-extrabold text-slate-800 shadow-2xs">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Julio 2026</span>
          </div>
        </div>
      </div>

      {/* FILTROS Y CONTROLES SUPERIORES (Elegantes y Minimalistas) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

        {/* Toggle Por Proyecto / Por Usuario */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 w-full lg:w-auto shrink-0">
          <button
            onClick={() => setGroupBy('project')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              groupBy === 'project'
                ? 'bg-white text-slate-950 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            Por Proyecto
          </button>
          <button
            onClick={() => setGroupBy('user')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              groupBy === 'user'
                ? 'bg-white text-slate-950 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Por Usuario
          </button>
        </div>

        {/* BÃºsqueda y Dropdowns personalizados ultra-limpios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2.5 w-full lg:w-auto">

          {/* Input BÃºsqueda */}
          <div className="relative w-full lg:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por proyecto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Select Proyecto */}
          <div className="relative w-full lg:w-48">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="appearance-none w-full bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all truncate"
            >
              <option value="todos">Todos los Proyectos</option>
              {distinctProjects.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Select Usuario */}
          <div className="relative w-full lg:w-44">
            <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="appearance-none w-full bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all truncate"
            >
              <option value="todos">Todos los Usuarios</option>
              {distinctUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Select Estado */}
          <div className="relative w-full lg:w-40">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="appearance-none w-full bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all truncate"
            >
              <option value="todos">Todos los Estados</option>
              <option value="proceso">En Curso</option>
              <option value="completado">Completado</option>
              <option value="pendiente">Pendiente</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

        </div>

      </div>

      {/* MOBILE SCROLL HINT */}
      <div className="block sm:hidden text-xs text-slate-500 font-bold flex items-center justify-between px-1">
        <span>Desliza para ver la lÃ­nea de tiempo</span>
        <span className="text-blue-600 font-extrabold uppercase">Deslizar â†’</span>
      </div>

      {/* CONTENEDOR PRINCIPAL DEL GANTT */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col relative min-h-[500px]">

        {/* SCROLL WRAPPER HORIZONTAL Y VERTICAL */}
        <div className="overflow-x-auto overflow-y-auto flex-1 touch-pan-x">

          <div className="min-w-[1150px] sm:min-w-[1300px] flex flex-col h-full divide-y divide-slate-100">

            {/* CABECERA EJE DÃAS */}
            <div className="flex bg-slate-50/90 sticky top-0 z-30 border-b border-slate-200/90 backdrop-blur-xs">

              {/* Columna Izquierda Fija: TÃ­tulos */}
              <div className="w-64 sm:w-72 p-3.5 font-black text-xs text-slate-500 uppercase tracking-wider border-r border-slate-200/80 shrink-0 bg-slate-50 sticky left-0 z-40 flex items-center justify-between shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <span>{groupBy === 'project' ? 'Proyectos' : 'Colaborador'}</span>
                <span className="text-xs font-extrabold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                  {groupedRows.length}
                </span>
              </div>

              {/* Grid de DÃ­as con Marcador de HOY */}
              <div className="grid flex-1 relative" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>

                {/* Marcador Badge Flotante para HOY (Inspirado en Taskken UI) */}
                <div
                  className="absolute -bottom-1 z-40 -translate-x-1/2 pointer-events-none"
                  style={{ left: `${todayLineLeftPct}%` }}
                >
                  <div className="bg-slate-950 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-slate-800 whitespace-nowrap">
                    <Clock className="w-2.5 h-2.5 text-rose-400" />
                    <span>8:42</span>
                  </div>
                </div>

                {DAYS_IN_MONTH.map(day => {
                  const isToday = day === CURRENT_DAY;
                  const isWeekend = day % 7 === 4 || day % 7 === 5;

                  return (
                    <div
                      key={day}
                      className={`text-center py-2.5 text-xs font-black border-r border-slate-200/60 flex flex-col justify-center items-center relative ${
                        isToday
                          ? 'bg-blue-50 text-blue-900 font-black z-10'
                          : isWeekend
                          ? 'bg-slate-100/60 text-slate-400 font-semibold'
                          : 'text-slate-600 font-bold bg-slate-50/50'
                      }`}
                      title={isToday ? "Hoy (14 de Julio)" : `DÃ­a ${day}`}
                    >
                      <span>{day}</span>
                      <span className="text-[7.5px] uppercase tracking-tighter opacity-70">
                        {isWeekend ? 'FdeS' : 'Jul'}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* CUERPO DE FILAS Y BARRAS DEL GANTT */}
            <div className="divide-y divide-slate-100 flex-1 relative">

              {/* LÃNEA GUÃA ROJA VERTICAL DE HOY (Top a Bottom) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] z-20 pointer-events-none"
                style={{ left: `calc(288px + (100% - 288px) * ${todayLineLeftPct / 100})` }}
              />

              {groupedRows.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium text-xs">
                  No se encontraron proyectos o tareas con los filtros aplicados.
                </div>
              ) : (
                groupedRows.map((row) => (
                  <div key={row.id} className="flex hover:bg-slate-50/70 transition-colors min-h-[72px] sm:min-h-[80px] relative group">

                    {/* Columna Fija Izquierda: Nombre de Proyecto/Usuario */}
                    <div className="w-64 sm:w-72 p-3 sm:p-4 border-r border-slate-200/80 shrink-0 flex items-center justify-between bg-white group-hover:bg-slate-50/90 transition-all sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-black text-xs text-slate-900 truncate block leading-tight">
                            {row.label}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-500 truncate">
                          {row.sublabel}
                        </p>

                        {/* Barra de progreso bajo el nombre */}
                        {groupBy === 'project' && row.progressPercent !== undefined && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/80">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${row.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[9.5px] font-extrabold text-slate-700 shrink-0">
                              {row.progressPercent}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Avatares de equipo asignado */}
                      {row.assignedUsers && row.assignedUsers.length > 0 && (
                        <div className="flex -space-x-2 overflow-hidden shrink-0 pl-1">
                          {row.assignedUsers.slice(0, 3).map((u, i) => (
                            <img
                              key={i}
                              src={u.avatar || `https://i.pravatar.cc/100?u=${u.name}`}
                              alt={u.name}
                              title={`${u.name} (${u.role || ''})`}
                              className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-2xs"
                            />
                          ))}
                          {row.assignedUsers.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 border-2 border-white text-xs font-black flex items-center justify-center">
                              +{row.assignedUsers.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Area de Cronograma X-Axis */}
                    <div className="flex-1 relative h-full flex items-center">

                      {/* Grid Fondo DÃ­as (Lineas Verticales) */}
                      <div className="absolute inset-0 grid grid-cols-31 h-full pointer-events-none">
                        {DAYS_IN_MONTH.map(day => (
                          <div
                            key={day}
                            className={`border-r border-slate-100/90 h-full ${
                              day === CURRENT_DAY ? 'bg-rose-50/20' : ''
                            }`}
                          />
                        ))}
                      </div>

                      {/* Renderizado de Barras de Gantt con posicionamiento exacto sin recortes */}
                      {row.items.map((item) => {
                        const leftPct = ((item.startDay - 1) / 31) * 100;
                        const widthPct = (item.durationDays / 31) * 100;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setActiveModalItem(item)}
                            className={`absolute h-10 sm:h-11 rounded-full px-3 flex items-center justify-between border shadow-2xs text-xs font-bold transition-all cursor-pointer select-none hover:scale-[1.01] hover:shadow-md z-10 ${item.colorTheme.bg} ${item.colorTheme.border} ${item.colorTheme.text}`}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              minWidth: '60px',
                            }}
                            title={`${item.title} (${item.progressPercent}% avance) - Tap para ver detalles`}
                          >
                            {/* Insignia % Avance (Pill a la izquierda como en Taskken) */}
                            <div className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${item.colorTheme.badgeBg} ${item.colorTheme.badgeText}`}>
                              {item.progressPercent}%
                            </div>

                            {/* TÃ­tulo en Centro */}
                            <span className="truncate px-2 text-center text-xs font-extrabold flex-1">
                              {item.title}
                            </span>

                            {/* Avatares a la derecha dentro de la barra */}
                            {item.assignedUsers.length > 0 && (
                              <div className="hidden sm:flex -space-x-1.5 shrink-0 pl-1">
                                {item.assignedUsers.slice(0, 2).map((u, ui) => (
                                  <img
                                    key={ui}
                                    src={u.avatar || `https://i.pravatar.cc/100?u=${u.name}`}
                                    alt={u.name}
                                    className="w-5 h-5 rounded-full border border-white/70 object-cover shadow-2xs"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>

                  </div>
                ))
              )}

            </div>

          </div>

        </div>

      </div>

      {/* MODAL DETALLE DE PROYECTO O TAREA */}
      {activeModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 relative space-y-5">

            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                  {activeModalItem.type === 'project' ? 'Proyecto' : 'Tarea Planner'}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {activeModalItem.clientName}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {activeModalItem.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {activeModalItem.details}
              </p>
            </div>

            {/* MÃ©tricas */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-400 block mb-0.5">
                  % Avance Actual
                </label>
                <div className="text-xl font-black text-slate-900">
                  {activeModalItem.progressPercent}%
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-slate-400 block mb-0.5">
                  LÃ­nea de Tiempo
                </label>
                <div className="text-xs font-bold text-slate-800 mt-1">
                  {activeModalItem.originalDates}
                </div>
              </div>
            </div>

            {/* Equipo Asignado */}
            <div>
              <label className="text-xs font-extrabold uppercase text-slate-400 block mb-2">
                Equipo Asignado ({activeModalItem.assignedUsers.length})
              </label>
              <div className="space-y-2">
                {activeModalItem.assignedUsers.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <img
                      src={u.avatar || `https://i.pravatar.cc/100?u=${u.name}`}
                      alt={u.name}
                      className="w-8 h-8 rounded-full border border-white shadow-2xs object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500 font-semibold capitalize">{u.role || 'Colaborador'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
              >
                Cerrar Detalle
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
