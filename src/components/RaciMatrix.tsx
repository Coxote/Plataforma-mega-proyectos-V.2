import React, { useState } from 'react';
import { Project, Role, UserSession, RaciTask } from '../types';
import { Plus, Trash2, ShieldAlert, Check, Users, Info, ShieldCheck } from 'lucide-react';

interface Props {
  project: Project;
  currentUser: UserSession;
  onUpdateRaci: (newMatrix: RaciTask[]) => void;
}

const ROLES_OPTIONS: { value: Role; label: string; bg: string; text: string }[] = [
  { value: 'coordinador', label: 'Coord', bg: 'bg-lime-400/20', text: 'text-lime-800' },
  { value: 'sac', label: 'SAC', bg: 'bg-sky-400/20', text: 'text-sky-800' },
  { value: 'contents', label: 'ContentS', bg: 'bg-amber-400/20', text: 'text-amber-800' },
  { value: 'contentd', label: 'ContentD', bg: 'bg-indigo-400/20', text: 'text-indigo-850' },
  { value: 'invitado', label: 'Cliente', bg: 'bg-slate-500/10', text: 'text-slate-800' },
];

export const RaciMatrix: React.FC<Props> = ({ project, currentUser, onUpdateRaci }) => {
  const canEdit = currentUser.role === 'coordinador' || currentUser.role === 'sac';
  const [newTaskName, setNewTaskName] = useState('');

  const updateCell = (taskId: string, field: 'taskName' | 'responsible' | 'accountable' | 'consulted' | 'informed', value: any) => {
    if (!canEdit) return;
    const newMatrix = project.raciMatrix.map((task) => {
      if (task.id === taskId) {
        return { ...task, [field]: value };
      }
      return task;
    });
    onUpdateRaci(newMatrix);
  };

  const handleToggleRoleInArray = (
    taskId: string, 
    field: 'responsible' | 'consulted' | 'informed', 
    role: Role
  ) => {
    if (!canEdit) return;
    const currentTask = project.raciMatrix.find(t => t.id === taskId);
    if (!currentTask) return;

    const currentArray = currentTask[field] || [];
    let newArray: Role[];
    if (currentArray.includes(role)) {
      newArray = currentArray.filter(r => r !== role);
    } else {
      newArray = [...currentArray, role];
    }
    updateCell(taskId, field, newArray);
  };

  const handleAddTask = () => {
    if (!canEdit || !newTaskName.trim()) return;
    const newTask: RaciTask = {
      id: `raci-${Date.now()}`,
      taskName: newTaskName.trim(),
      responsible: ['contents'],
      accountable: 'coordinador',
      consulted: [],
      informed: ['invitado'],
    };
    onUpdateRaci([...project.raciMatrix, newTask]);
    setNewTaskName('');
  };

  const handleDeleteTask = (taskId: string) => {
    if (!canEdit) return;
    const updated = project.raciMatrix.filter(t => t.id !== taskId);
    onUpdateRaci(updated);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="raci-matrix-component">
      
      {/* Component Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            Matriz de Responsabilidad RACI
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Mapeo interactivo de roles. 
            {canEdit ? (
              <span className="text-lime-700 font-medium"> Tienes permisos de edición.</span>
            ) : (
              <span className="text-slate-400"> Solo lectura para tu rol actual.</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 text-[10px] self-start sm:self-center">
          {canEdit ? (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-lime-50 text-lime-700 border border-lime-200 rounded-full font-bold">
              <ShieldCheck className="w-3 h-3 text-lime-500" /> Editor
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full font-bold">
              <ShieldAlert className="w-3 h-3 text-slate-400" /> Lector
            </span>
          )}
        </div>
      </div>

      {/* RACI Guide Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50/60 p-3 rounded-xl text-[10px] text-slate-500 font-medium border border-slate-150">
        <div><strong className="text-slate-800">R (Responsible):</strong> Quien realiza el trabajo directamente.</div>
        <div><strong className="text-slate-800">A (Accountable):</strong> Quien aprueba y rinde cuentas.</div>
        <div><strong className="text-slate-800">C (Consulted):</strong> Quien asesora y brinda feedback.</div>
        <div><strong className="text-slate-800">I (Informed):</strong> Quien se mantiene informado.</div>
      </div>

      {/* RACI Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-150">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-2.5 px-3 font-semibold text-slate-700 w-1/3">Tarea / Entregable</th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 text-center">R (Ejecuta)</th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 text-center">A (Aprueba)</th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 text-center">C (Asesora)</th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 text-center">I (Informa)</th>
              {canEdit && <th className="py-2.5 px-3 font-semibold text-slate-700 text-center w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!project?.raciMatrix || project.raciMatrix.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                  No hay tareas registradas en la matriz RACI.
                </td>
              </tr>
            ) : (
              project.raciMatrix.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                  
                  {/* Task Name Column */}
                  <td className="py-3 px-3 font-medium text-slate-800 text-xs">
                    {canEdit ? (
                      <input
                        type="text"
                        className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-white px-1 py-0.5 w-full outline-none transition-all rounded"
                        value={task.taskName}
                        onChange={(e) => updateCell(task.id, 'taskName', e.target.value)}
                      />
                    ) : (
                      task.taskName
                    )}
                  </td>

                  {/* R: Responsible - Checkbox Array Column */}
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {ROLES_OPTIONS.map((opt) => {
                        const active = (task.responsible || []).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            disabled={!canEdit}
                            onClick={() => handleToggleRoleInArray(task.id, 'responsible', opt.value)}
                            title={`Alternar ${opt.label} en Responsible`}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                              active 
                                ? `${opt.bg} ${opt.text} border border-slate-300` 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-400 border border-transparent'
                            }`}
                          >
                            {opt.label[0]}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  {/* A: Accountable - Single Select Dropdown Column */}
                  <td className="py-3 px-2 text-center">
                    <div className="flex justify-center">
                      {canEdit ? (
                        <select
                          className="bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-medium outline-none focus:ring-1 focus:ring-lime-400"
                          value={task.accountable}
                          onChange={(e) => updateCell(task.id, 'accountable', e.target.value as Role)}
                        >
                          {ROLES_OPTIONS.map(r => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ROLES_OPTIONS.find(o => o.value === task.accountable)?.bg || 'bg-slate-100'
                        } ${
                          ROLES_OPTIONS.find(o => o.value === task.accountable)?.text || 'text-slate-700'
                        }`}>
                          {ROLES_OPTIONS.find(o => o.value === task.accountable)?.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* C: Consulted - Checkbox Array Column */}
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {ROLES_OPTIONS.map((opt) => {
                        const active = (task.consulted || []).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            disabled={!canEdit}
                            onClick={() => handleToggleRoleInArray(task.id, 'consulted', opt.value)}
                            title={`Alternar ${opt.label} en Consulted`}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                              active 
                                ? `${opt.bg} ${opt.text} border border-slate-300` 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-400 border border-transparent'
                            }`}
                          >
                            {opt.label[0]}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  {/* I: Informed - Checkbox Array Column */}
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {ROLES_OPTIONS.map((opt) => {
                        const active = (task.informed || []).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            disabled={!canEdit}
                            onClick={() => handleToggleRoleInArray(task.id, 'informed', opt.value)}
                            title={`Alternar ${opt.label} en Informed`}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                              active 
                                ? `${opt.bg} ${opt.text} border border-slate-300` 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-400 border border-transparent'
                            }`}
                          >
                            {opt.label[0]}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  {/* Action Delete Column */}
                  {canEdit && (
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-rose-50"
                        title="Eliminar Tarea de Matriz RACI"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Task Control Panel (Only if editor) */}
      {canEdit && (
        <div className="flex gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150">
          <input
            type="text"
            placeholder="Nueva tarea estratégica para la matriz..."
            className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-lime-400 focus:border-lime-400"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
            }}
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskName.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-45 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir Tarea
          </button>
        </div>
      )}
    </div>
  );
};
