import React, { useState } from 'react';
import { UserSession, getUserAvatarUrl } from '../types';
import { UserPlus, X, Check } from 'lucide-react';

interface DroppableTaskCellProps {
  taskId: string;
  assignedUserIds?: string[];
  users: UserSession[];
  onAssign: (taskId: string, userId: string) => void;
  onUnassign: (taskId: string, userId: string) => void;
  getUserColor: (role: string) => string;
}

export const DroppableTaskCell: React.FC<DroppableTaskCellProps> = ({ 
  taskId, 
  assignedUserIds = [], 
  users, 
  onAssign,
  onUnassign,
  getUserColor
}) => {
  const [isOver, setIsOver] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const assignedUsers = users.filter(u => assignedUserIds.includes(u.id));

  return (
    <div className="relative" id={`task-cell-${taskId}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`min-h-[3.25rem] p-2 border-2 border-dashed rounded-xl flex flex-wrap items-center gap-1.5 transition-all cursor-pointer ${
          isOver 
            ? 'border-lime-500 bg-lime-500/10' 
            : assignedUsers.length > 0
            ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50' 
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        {assignedUsers.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            {assignedUsers.map(user => (
              <div 
                key={user.id}
                className={`px-2 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs shrink-0 max-w-[130px] ${getUserColor(user.role)}`}
              >
                <img 
                  src={getUserAvatarUrl(user.username)} 
                  alt={user.username}
                  className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/30"
                  referrerPolicy="no-referrer"
                />
                <span className="truncate capitalize">{user.username}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnassign(taskId, user.id);
                  }}
                  className="p-0.5 hover:bg-black/20 text-white/80 hover:text-white rounded-md transition-colors shrink-0 cursor-pointer"
                  title={`Quitar a ${user.username}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:text-slate-700 hover:border-slate-400 text-[10px] font-bold flex items-center gap-1 ml-auto"
              title="Agregar otro operador"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Mas</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold select-none hover:text-slate-600 transition-colors mx-auto py-1">
            <UserPlus className="w-3.5 h-3.5 text-lime-600" />
            <span>Soltar u originar asignaciones</span>
          </div>
        )}
      </div>

      {/* Accessible Dropdown Fallback */}
      {showDropdown && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs text-slate-700 max-h-56 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
            <span>Asignar Operadores ({assignedUsers.length})</span>
            <button 
              onClick={() => setShowDropdown(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {users.map(u => {
            const isAssigned = assignedUserIds.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAssigned) {
                    onUnassign(taskId, u.id);
                  } else {
                    onAssign(taskId, u.id);
                  }
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium flex items-center gap-2 capitalize transition-colors ${
                  isAssigned ? 'bg-slate-50 font-bold text-slate-900' : 'text-slate-700'
                }`}
              >
                <img 
                  src={getUserAvatarUrl(u.username)} 
                  alt={u.username}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <span className="truncate">{u.username}</span>
                <span className="text-[9px] text-slate-400 font-bold ml-auto uppercase tracking-wider">{u.puesto || u.role}</span>
                {isAssigned && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
