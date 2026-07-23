import React, { useState, useMemo, useEffect } from 'react';
import { DraggableUser } from './DraggableUser';
import { DroppableTaskCell } from './DroppableTaskCell';
import { Project, UserSession } from '../types';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Search, 
  ListFilter, 
  Clock, 
  Sparkles,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface PlannerTask {
  id: string;
  brand: string;
  project: string;
  projectId?: string;
  start: string;
  deadline: string;
  assignedTo?: string;
  status: 'pendiente' | 'proceso' | 'completado';
}

interface PlannerGridProps {
  projects: Project[];
  users: UserSession[];
  currentUser: UserSession;
}

const STORAGE_KEY = 'saas_phase_system_planner_tasks_v1';

const INITIAL_TASKS: PlannerTask[] = [
  { id: 't-1', brand: 'Alpha Brand', project: 'Renovación de UI & Copy', start: '2026-07-24', deadline: '2026-07-28', status: 'proceso' },
  { id: 't-2', brand: 'Beta Global', project: 'Campaña Creativa Redes', start: '2026-07-25', deadline: '2026-07-30', status: 'pendiente' },
];

export const PlannerGrid: React.FC<PlannerGridProps> = ({ projects = [], users = [], currentUser }) => {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [assignedFilter, setAssignedFilter] = useState<string>('todos');

  // Form states for creating a new task
  const [showAddForm, setShowAddForm] = useState(false);
  const [formBrand, setFormBrand] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formSelectedProjectId, setFormSelectedProjectId] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
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

  // Assign user to a task
  const handleAssignTask = (taskId: string, userId: string | undefined) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, assignedTo: userId };
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
      // Determine active phase to offer a clean default project name description
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
      status: 'pendiente'
    };

    saveTasks([newTask, ...tasks]);
    
    // Reset form
    setFormBrand('');
    setFormProjectName('');
    setFormSelectedProjectId('');
    setFormStart('');
    setFormDeadline('');
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'todos' || 
        task.status === statusFilter;

      const matchesAssigned = 
        assignedFilter === 'todos' ||
        (assignedFilter === 'sin_asignar' && !task.assignedTo) ||
        (assignedFilter === 'mi_asignado' && task.assignedTo === currentUser.id) ||
        (task.assignedTo === assignedFilter);

      return matchesSearch && matchesStatus && matchesAssigned;
    });
  }, [tasks, searchQuery, statusFilter, assignedFilter, currentUser]);

  return (
    <div className="p-6 bg-slate-50/50 min-h-full overflow-y-auto space-y-6 flex flex-col" id="planner-daily-grid">
      
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
            <Calendar className="w-3.5 h-3.5 text-lime-600" />
            Planificación Diaria
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Planner Dailys</h1>
          <p className="text-xs text-slate-500 font-medium">Asigna operadores del escuadrón a tareas críticas arrastrando fichas de usuario.</p>
        </div>

        {/* El "Banquillo" del equipo (Operadores activos para arrastrar) */}
        <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm self-start">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
            Arrastrar Equipo:
          </div>
          <div className="flex gap-2">
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

      {/* FILTER & ADD BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por marca o proyecto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium text-slate-800"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 font-bold">
            <ListFilter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer text-slate-700"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="proceso">En Proceso</option>
              <option value="completado">Completados</option>
            </select>
          </div>

          {/* Assigned filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 font-bold">
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer text-slate-700"
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
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
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
                className="w-full bg-slate-850 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold cursor-pointer"
              >
                <option value="">-- No asociar --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente / Marca</label>
              <input
                type="text"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                placeholder="Ej: Alpha S.A."
                className="w-full bg-slate-850 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Project description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción Tarea o Fase</label>
              <input
                type="text"
                value={formProjectName}
                onChange={(e) => setFormProjectName(e.target.value)}
                placeholder="Ej: Diseño de Mockup Mobile o Revisión de Textos"
                className="w-full bg-slate-850 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Inicio</label>
              <input
                type="date"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="w-full bg-slate-850 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entrega Interna</label>
              <input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full bg-slate-850 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-lime-400/40 outline-none transition-all font-semibold"
              />
            </div>

            {/* Submit button */}
            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-lime-400/10"
              >
                Crear Tarea Diaria
              </button>
            </div>

          </form>
        </div>
      )}

      {/* EXCEL EXTREME TABLE */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[350px]">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <HelpCircle className="w-12 h-12 text-slate-300 mb-3" />
            <span className="font-bold text-sm text-slate-800 block">No se encontraron tareas diarias</span>
            <span className="text-xs text-slate-400 max-w-sm mt-1">
              Ajusta los filtros o haz clic en "Nueva Tarea Diaria" si tienes rol de Coordinador para planificar el día.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider divide-x divide-slate-800">
                  <th className="p-4">Cliente / Marca</th>
                  <th className="p-4">Proyecto, Fase o Tarea</th>
                  <th className="p-4"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Rango de Fechas</div></th>
                  <th className="p-4 text-center">Estado de Operación</th>
                  <th className="p-4 text-center w-56">Operador Asignado</th>
                  {currentUser.role === 'coordinador' && (
                    <th className="p-4 text-right w-20">Borrar</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTasks.map(task => {
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors divide-x divide-slate-100">
                      
                      {/* Brand */}
                      <td className="p-4">
                        <span className="font-black text-slate-900 text-sm block">{task.brand}</span>
                        {task.projectId && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md mt-1 inline-block uppercase">
                            Proyecto Enlazado
                          </span>
                        )}
                      </td>

                      {/* Project Name / Tasks */}
                      <td className="p-4 text-slate-700 font-semibold text-[13px]">
                        {task.project}
                      </td>

                      {/* Dates */}
                      <td className="p-4 text-slate-500 font-bold">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] text-slate-600 block">Inicia: {task.start}</span>
                          <span className="text-[11px] text-slate-400 block font-medium">Entrega: {task.deadline}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col gap-1.5 items-center justify-center">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border outline-none cursor-pointer transition-all ${
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

                      {/* Droppable cell */}
                      <td className="p-3">
                        <DroppableTaskCell
                          taskId={task.id}
                          assignedUserId={task.assignedTo}
                          users={operatorsList}
                          onAssign={handleAssignTask}
                          getUserColor={getUserColor}
                        />
                      </td>

                      {/* Delete */}
                      {currentUser.role === 'coordinador' && (
                        <td className="p-4 text-right">
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

    </div>
  );
};
