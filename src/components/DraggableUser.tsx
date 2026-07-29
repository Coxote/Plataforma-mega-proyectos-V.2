import React from 'react';
import { UserSession, getUserAvatarUrl } from '../types';

interface DraggableUserProps {
  user: UserSession;
  color: string;
}

export const DraggableUser: React.FC<DraggableUserProps> = ({ user, color }) => {
  // Cuando agarras la ficha, guardamos el ID en la memoria del evento
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', user.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing select-none group shrink-0 py-1 px-1 transition-all"
      title={`${user.username} - ${user.puesto || user.role} (Arrastrar a tarea)`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black shadow-xs group-hover:scale-120 group-hover:shadow-lg group-hover:z-20 transition-transform duration-200 ease-out border-2 border-white overflow-hidden ${color}`}>
        <img 
          src={getUserAvatarUrl(user.username)} 
          alt={user.username} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="text-[10px] font-extrabold text-slate-700 bg-white group-hover:bg-slate-900 group-hover:text-white px-2 py-0.5 rounded-lg max-w-[80px] truncate text-center transition-all border border-slate-200 shadow-2xs">
        {user.username}
      </span>
    </div>
  );
};

