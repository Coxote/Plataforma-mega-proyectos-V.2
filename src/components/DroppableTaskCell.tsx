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

  const assignedUsers = users.filter(u => assignedUserIds.includes(u.id)).slice(0, 2);

  return (
    <div className="relative flex items-center justify-center" id={`task-cell-${taskId}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`min-h-[2.5rem] px-2.5 py-1.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
          isOver
            ? 'border-lime-500 bg-lime-500/10'
            : assignedUsers.length > 0
            ? 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80'
            : 'border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
        }`}
        title="Arrastra un operador o haz clic para gestionar asignaciones (MÃ¡x 2)"
      >
        {assignedUsers.length > 0 ? (
          <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
            {assignedUsers.map((user) => (
              <div key={user.id} className="relative group/avatar">
                <img
                  src={getUserAvatarUrl(user.username)}
                  alt={user.username}
                  title={`${user.username} (${user.puesto || user.role}) - Clic para remover`}
                  className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-2xs hover:scale-110 hover:z-20 transition-transform cursor-pointer"
                  referrerPolicy="no-referrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnassign(taskId, user.id);
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnassign(taskId, user.id);
                  }}
                  className="absolute -top-1 -right-1 bg-slate-900 text-white rounded-full p-0.5 opacity-0 group-hover/avatar:opacity-100 transition-opacity z-30 shadow-xs"
                  title={`Quitar a ${user.username}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

            {assignedUsers.length < 2 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 hover:border-slate-500 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 font-extrabold text-xs ml-1 shadow-2xs transition-all cursor-pointer"
                title="Agregar segundo operador (MÃ¡x 2)"
              >
                +
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold select-none hover:text-slate-600 transition-colors py-0.5">
            <UserPlus className="w-3.5 h-3.5 text-lime-600" />
            <span className="text-xs">Asignar (MÃ¡x 2)</span>
          </div>
        )}
      </div>

      {/* Dropdown for toggling up to 2 operators */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs text-slate-700 max-h-60 overflow-y-auto">
          <div className="px-3 py-1 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
            <span>Asignar Operadores ({assignedUsers.length}/2)</span>
            <button
              type="button"
              onClick={() => setShowDropdown(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {users.map(u => {
            const isAssigned = assignedUserIds.includes(u.id);
            const isFull = !isAssigned && assignedUsers.length >= 2;

            return (
              <button
                key={u.id}
                type="button"
                disabled={isFull}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAssigned) {
                    onUnassign(taskId, u.id);
                  } else {
                    onAssign(taskId, u.id);
                    if (assignedUsers.length >= 1) {
                      setShowDropdown(false);
                    }
                  }
                }}
                className={`w-full text-left px-3 py-1.5 font-semibold flex items-center gap-2 capitalize transition-colors ${
                  isAssigned
                    ? 'bg-slate-100 font-bold text-slate-900'
                    : isFull
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <img
                  src={getUserAvatarUrl(u.username)}
                  alt={u.username}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <span className="truncate">{u.username}</span>
                <span className="text-xs text-slate-400 font-bold ml-auto uppercase tracking-wider">{u.puesto || u.role}</span>
                {isAssigned && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

