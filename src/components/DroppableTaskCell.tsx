import React, { useState } from 'react';
import { UserSession } from '../types';
import { UserPlus, X } from 'lucide-react';

interface DroppableTaskCellProps {
  taskId: string;
  assignedUserId?: string;
  users: UserSession[];
  onAssign: (taskId: string, userId: string | undefined) => void;
  getUserColor: (role: string) => string;
}

export const DroppableTaskCell: React.FC<DroppableTaskCellProps> = ({ 
  taskId, 
  assignedUserId, 
  users, 
  onAssign,
  getUserColor
}) => {
  const [isOver, setIsOver] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Obligatorio para que el navegador permita soltar elementos aquí
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const userId = e.dataTransfer.getData('text/plain');
    if (userId) {
      onAssign(taskId, userId);
    }
  };

  const assignedUser = users.find(u => u.id === assignedUserId);

  return (
    <div className="relative" id={`task-cell-${taskId}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`min-h-[3.5rem] p-2 border-2 border-dashed rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          isOver 
            ? 'border-lime-500 bg-lime-500/10' 
            : assignedUser 
            ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50' 
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        {assignedUser ? (
          <div className="flex items-center gap-1.5 w-full justify-between">
            <div className={`px-2.5 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm max-w-[85%] truncate ${getUserColor(assignedUser.role)}`}>
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] uppercase shrink-0">
                {assignedUser.username.charAt(0)}
              </span>
              <span className="truncate capitalize">{assignedUser.username}</span>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAssign(taskId, undefined);
              }}
              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-md transition-colors shrink-0"
              title="Quitar asignación"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold select-none hover:text-slate-550 transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Soltar o asignar</span>
          </div>
        )}
      </div>

      {/* Accessible Dropdown Fallback */}
      {showDropdown && (
        <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-xs text-slate-700 max-h-48 overflow-y-auto">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Asignar Operador
          </div>
          {users.map(u => (
            <button
              key={u.id}
              onClick={(e) => {
                e.stopPropagation();
                onAssign(taskId, u.id);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium flex items-center gap-2 capitalize"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${getUserColor(u.role)} shrink-0`} />
              <span>{u.username}</span>
              <span className="text-[9px] text-slate-400 font-bold ml-auto uppercase tracking-wider">{u.puesto || u.role}</span>
            </button>
          ))}
          {assignedUserId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign(taskId, undefined);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-bold border-t border-slate-100 mt-1"
            >
              Desasignar de tarea
            </button>
          )}
        </div>
      )}
    </div>
  );
};
