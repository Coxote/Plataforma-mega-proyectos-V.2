import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Filter, 
  Layers, 
  Users, 
  Search, 
  Briefcase, 
  Clock, 
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Project, UserSession } from '../types';

interface GanttViewProps {
  projects: Project[];
  users: UserSession[];
}

interface GanttTask {
  id: string;
  projectName: string;
  assignedUser: string;
  assignedUserId: string;
  startDay: number; // Día del mes (1 al 31)
  durationDays: number;
  color: string;
  status: 'pendiente' | 'proceso' | 'completado' | 'fase_activa' | 'fase_pendiente' | 'fase_completada';
  type: 'planner' | 'project';
  originalDates: string;
  details: string;
}

const STORAGE_KEY = 'saas_phase_system_planner_tasks_v1';

export const GanttView: React.FC<GanttViewProps> = ({ projects = [], users = [] }) => {
  const [viewType, setViewType] = useState<'all' | 'planner' | 'project'>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTask, setHoveredTask] = useState<GanttTask | null>(null);

  // Read daily tasks from localStorage to mirror the PlannerGrid state
  const [plannerTasks, setPlannerTasks] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPlannerTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading planner tasks in Gantt view:", e);
      }
    }
  }, []);

  // Helper to parse dates like "2026-07-24" or "24/07" and get July day number
  const getDayNumber = (dateStr: string, defaultDay: number): number => {
    if (!dateStr) return defaultDay;
    
    // Check YYYY-MM-DD
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        return isNaN(day) ? defaultDay : day;
      }
    }
    // Check DD/MM
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10);
        return isNaN(day) ? defaultDay : day;
      }
    }

    const dayNum = parseInt(dateStr, 10);
    return isNaN(dayNum) ? defaultDay : dayNum;
  };

  // Get color for a task status or role
  const getTaskColor = (status: string, index: number): string => {
    // Generate a beautiful color palette
    const colors = [
      'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white',
      'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white',
      'bg-purple-500 hover:bg-purple-600 border-purple-600 text-white',
      'bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-900',
      'bg-indigo-500 hover:bg-indigo-600 border-indigo-600 text-white',
      'bg-rose-500 hover:bg-rose-600 border-rose-600 text-white',
      'bg-sky-500 hover:bg-sky-600 border-sky-600 text-white',
    ];
    return colors[index % colors.length];
  };

  // Build unified Gantt tasks list
  const ganttTasks = useMemo<GanttTask[]>(() => {
    const list: GanttTask[] = [];
    let colorIndex = 0;

    // 1. ADD PLANNER DAILY TASKS (Dynamic)
    if (viewType === 'all' || viewType === 'planner') {
      plannerTasks.forEach(task => {
        if (!task.assignedTo) return; // Only show assigned tasks in the Gantt

        const assignedUserObj = users.find(u => u.id === task.assignedTo);
        if (!assignedUserObj) return;

        const startDay = getDayNumber(task.start, 5);
        const endDay = getDayNumber(task.deadline, 10);
        const duration = Math.max(endDay - startDay + 1, 1);

        list.push({
          id: task.id,
          projectName: `[Daily] ${task.brand} - ${task.project}`,
          assignedUser: assignedUserObj.username,
          assignedUserId: assignedUserObj.id,
          startDay: Math.min(Math.max(startDay, 1), 31),
          durationDays: Math.min(duration, 31 - startDay + 1),
          color: task.status === 'completado' 
            ? 'bg-emerald-500/90 border-emerald-600/50' 
            : task.status === 'proceso' 
            ? 'bg-sky-500/90 border-sky-600/50' 
            : 'bg-indigo-500/90 border-indigo-600/50',
          status: task.status,
          type: 'planner',
          originalDates: `Del ${task.start} al ${task.deadline}`,
          details: `Cliente: ${task.brand}. Estado: ${task.status.toUpperCase()}`
        });
        colorIndex++;
      });
    }

    // 2. ADD CLIENT PROJECTS & ACTIVE PHASES (Dynamic)
    if (viewType === 'all' || viewType === 'project') {
      projects.forEach((proj, projIdx) => {
        const activePhase = proj.phases.find(p => p.id === proj.activePhaseId) || proj.phases[0];
        if (!activePhase) return;

        // Find which operator has consumed or is allocated hours on this project's active phase
        // We will assign this project's bar to whoever has allocated hours, mapping a nice timeline representation
        const rolesWithAllocated = Object.entries(proj.budget || {})
          .filter(([role, budget]) => (budget as any).allocated > 0)
          .map(([role]) => role);

        rolesWithAllocated.forEach(role => {
          const matchingUsers = users.filter(u => u.role === role);
          
          matchingUsers.forEach(user => {
            // Let's spread projects on the timeline using stable day algorithms based on project index or phase status
            const startDay = ((projIdx * 3) % 20) + 1;
            const duration = 6 + (projIdx % 5) * 2; // stable duration

            list.push({
              id: `${proj.id}-${user.id}`,
              projectName: `[Fase] ${proj.name} (${activePhase.label})`,
              assignedUser: user.username,
              assignedUserId: user.id,
              startDay: startDay,
              durationDays: duration,
              color: getTaskColor(activePhase.status, projIdx + 3),
              status: activePhase.status === 'completed' 
                ? 'fase_completada' 
                : activePhase.status === 'active' 
                ? 'fase_activa' 
                : 'fase_pendiente',
              type: 'project',
              originalDates: `Fase Actual: ${activePhase.label}`,
              details: `Presupuesto del rol ${user.role.toUpperCase()}: ${(proj.budget as any)[user.role]?.allocated || 0}h`
            });
          });
        });
      });
    }

    // If list is completely empty, add some premium fallback mock tasks so the chart looks stunning instantly
    if (list.length === 0) {
      const fallbackUsers = users.length > 0 ? users : [
        { id: 'fu1', username: 'Carlos', role: 'coordinador' },
        { id: 'fu2', username: 'Lucia', role: 'contents' },
        { id: 'fu3', username: 'Pedro', role: 'contentd' },
        { id: 'fu4', username: 'Ana', role: 'sac' },
      ];

      const fallbacks = [
        { id: 'fb1', projectName: 'Renovación UI Arrocha', assignedUser: fallbackUsers[0]?.username || 'Carlos', assignedUserId: fallbackUsers[0]?.id || 'fu1', startDay: 2, durationDays: 6, color: 'bg-emerald-500 text-white', status: 'proceso' },
        { id: 'fb2', projectName: 'Minijuego Fútbol (Sprites)', assignedUser: fallbackUsers[2]?.username || 'Pedro', assignedUserId: fallbackUsers[2]?.id || 'fu3', startDay: 5, durationDays: 10, color: 'bg-blue-500 text-white', status: 'proceso' },
        { id: 'fb3', projectName: 'Campaña Redes Q3', assignedUser: fallbackUsers[1]?.username || 'Lucia', assignedUserId: fallbackUsers[1]?.id || 'fu2', startDay: 12, durationDays: 7, color: 'bg-purple-500 text-white', status: 'pendiente' },
        { id: 'fb4', projectName: 'Estrategia Skaldic (Lang)', assignedUser: fallbackUsers[3]?.username || 'Ana', assignedUserId: fallbackUsers[3]?.id || 'fu4', startDay: 15, durationDays: 8, color: 'bg-amber-500 text-slate-900', status: 'pendiente' },
      ];

      fallbacks.forEach(fb => {
        list.push({
          id: fb.id,
          projectName: fb.projectName,
          assignedUser: fb.assignedUser,
          assignedUserId: fb.assignedUserId,
          startDay: fb.startDay,
          durationDays: fb.durationDays,
          color: fb.color,
          status: fb.status as any,
          type: 'planner',
          originalDates: `Julio ${fb.startDay} - Julio ${fb.startDay + fb.durationDays - 1}`,
          details: 'Planificación de prueba del sistema'
        });
      });
    }

    return list;
  }, [plannerTasks, projects, users, viewType]);

  // Unique list of users that have any tasks
  const distinctUsers = useMemo(() => {
    const list = users.filter(u => u.role !== 'invitado');
    if (list.length === 0) {
      return [
        { id: 'fu1', username: 'Carlos', role: 'coordinador', puesto: 'Coordinador' },
        { id: 'fu2', username: 'Lucia', role: 'contents', puesto: 'ContentS' },
        { id: 'fu3', username: 'Pedro', role: 'contentd', puesto: 'ContentD' },
        { id: 'fu4', username: 'Ana', role: 'sac', puesto: 'SAC' },
      ];
    }
    return list;
  }, [users]);

  // Filter tasks based on selected filters
  const filteredGanttTasks = useMemo(() => {
    return ganttTasks.filter(task => {
      const matchesSearch = task.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUser = selectedUserFilter === 'todos' || task.assignedUserId === selectedUserFilter;
      return matchesSearch && matchesUser;
    });
  }, [ganttTasks, searchQuery, selectedUserFilter]);

  const DAYS_IN_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="p-6 bg-slate-50/50 min-h-full overflow-y-auto space-y-6 flex flex-col relative" id="gantt-timeline-view">
      
      {/* GANTT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
            <Layers className="w-3.5 h-3.5 text-lime-600 animate-pulse" />
            Línea de Tiempo Operativa
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gantt de Carga & Solapes</h1>
          <p className="text-xs text-slate-500 font-medium">Visualiza solapes y asignación de tareas por colaborador a lo largo de Julio 2026.</p>
        </div>
        
        {/* Date Selector Badge */}
        <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-xs self-start">
          <CalendarIcon className="w-4 h-4 text-lime-600" />
          <span className="text-xs font-black text-slate-800">Julio 2026</span>
          <div className="flex gap-1 border-l border-slate-200 pl-2 ml-1">
            <button className="p-1 hover:bg-slate-100 rounded text-slate-400" disabled>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-400" disabled>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SELECT BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Toggle View Type */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setViewType('all')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewType === 'all'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todo
          </button>
          <button
            onClick={() => setViewType('planner')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewType === 'planner'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tareas Planner
          </button>
          <button
            onClick={() => setViewType('project')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewType === 'project'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Fases Proyectos
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por proyecto o fase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium text-slate-800"
            />
          </div>

          {/* User selector filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 font-bold">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer text-slate-700"
            >
              <option value="todos">Todos los Colaboradores</option>
              {distinctUsers.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DETAILED ACTIVE TOOLTIP INDICATOR */}
      {hoveredTask && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white shadow-lg animate-fadeIn flex items-start gap-3.5 max-w-xl">
          <div className="p-2 bg-slate-800 rounded-lg text-lime-400 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-sm text-lime-300 capitalize">{hoveredTask.projectName}</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 rounded px-1.5 font-bold uppercase tracking-widest">
                {hoveredTask.type === 'planner' ? 'Daily' : 'Proyecto'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-semibold">{hoveredTask.details}</p>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold mt-2.5">
              <span>Encargado: <strong className="text-slate-200 capitalize">{hoveredTask.assignedUser}</strong></span>
              <span>Línea: <strong>{hoveredTask.originalDates}</strong></span>
              <span>Días: <strong>{hoveredTask.durationDays} días</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* GANTT TIMELINE GRID CONTAINER */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        
        {/* Horizontal scroll wrap for entire grid structure */}
        <div className="overflow-x-auto overflow-y-auto flex-1">
          
          <div className="min-w-[1240px] flex flex-col h-full divide-y divide-slate-200">
            
            {/* Header row: days of the month */}
            <div className="flex bg-slate-50 sticky top-0 z-20 shadow-xs border-b border-slate-200">
              {/* Top-Left empty cell for team lists */}
              <div className="w-56 p-4 font-black text-xs text-slate-500 uppercase tracking-widest border-r border-slate-200 shrink-0 bg-slate-50 flex items-center justify-between">
                <span>Colaborador</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              
              {/* Day numbers column grid */}
              <div className="grid flex-1" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
                {DAYS_IN_MONTH.map(day => {
                  // highlight current day (Julio 22, 2026 is current local time reference)
                  const isToday = day === 22;
                  return (
                    <div 
                      key={day} 
                      className={`text-center py-3 text-[10px] font-black border-r border-slate-100 flex flex-col justify-center items-center ${
                        isToday 
                          ? 'bg-lime-400 text-slate-950 font-black shadow-inner' 
                          : 'text-slate-500 font-semibold bg-slate-50'
                      }`}
                      title={isToday ? "Hoy (22 de Julio 2026)" : `Día ${day}`}
                    >
                      <span>{day}</span>
                      <span className="text-[7.5px] uppercase tracking-tighter opacity-80 mt-0.5">
                        {day % 7 === 4 || day % 7 === 5 ? 'FdeS' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content lines for each distinct teammate */}
            <div className="flex-1 divide-y divide-slate-100">
              {distinctUsers.map(member => {
                // Filter tasks belonging only to this member
                const memberTasks = filteredGanttTasks.filter(t => t.assignedUserId === member.id);

                return (
                  <div key={member.id} className="flex hover:bg-slate-50/30 transition-colors h-24 relative group">
                    
                    {/* Member Column Y-Axis */}
                    <div className="w-56 p-4 border-r border-slate-200 shrink-0 flex items-center gap-3 bg-white group-hover:bg-slate-50 transition-all z-10">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-white font-black flex items-center justify-center text-xs uppercase select-none">
                        {member.username.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-black text-slate-900 text-xs truncate capitalize leading-tight">{member.username}</div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{member.puesto || member.role}</span>
                        <span className="text-[9px] font-black text-lime-600 block bg-lime-50 rounded-md px-1 py-0.5 mt-1 border border-lime-100/50 w-max">
                          {memberTasks.length} Tareas
                        </span>
                      </div>
                    </div>

                    {/* Timeline bar container X-Axis */}
                    <div className="grid flex-1 relative h-full items-center" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
                      
                      {/* Grid background columns lines */}
                      {DAYS_IN_MONTH.map(day => (
                        <div 
                          key={day} 
                          className={`border-r border-slate-100/60 h-full ${day === 22 ? 'bg-lime-500/5 border-r-lime-400/40' : ''}`} 
                        />
                      ))}

                      {/* Render absolute visual task bars */}
                      {memberTasks.map((task, index) => {
                        // Calculate CSS grid start and span
                        // startDay can be 1 to 31. CSS Grid start is 1-indexed.
                        const startCol = task.startDay;
                        const spanCols = task.durationDays;

                        // Give subtle vertical stack offset to prevent full overlap if multiple tasks start on the same days
                        const vertOffsetClass = index % 3 === 0 
                          ? 'top-[8px]' 
                          : index % 3 === 1 
                          ? 'top-[36px]' 
                          : 'top-[16px]';

                        return (
                          <div
                            key={task.id}
                            onMouseEnter={() => setHoveredTask(task)}
                            onMouseLeave={() => setHoveredTask(null)}
                            className={`absolute h-7 rounded-lg px-2.5 flex items-center border shadow-xs text-[10px] font-black transition-all cursor-help select-none hover:scale-[1.02] hover:shadow-sm z-10 ${vertOffsetClass} ${task.color}`}
                            style={{
                              gridColumnStart: startCol,
                              gridColumnEnd: startCol + spanCols,
                              width: 'calc(100% - 3px)',
                              marginLeft: '1.5px',
                            }}
                            title={`${task.projectName} - ${task.originalDates}`}
                          >
                            <span className="truncate w-full text-left capitalize">
                              {task.projectName}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
