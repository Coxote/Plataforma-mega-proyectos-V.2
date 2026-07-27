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
      className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none group shrink-0"
      title={`${user.username} - ${user.puesto || user.role}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all border-2 border-white overflow-hidden ${color}`}>
        <img 
          src={getUserAvatarUrl(user.username)} 
          alt={user.username} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="text-[10px] font-bold text-slate-800 bg-slate-100 group-hover:bg-slate-200 group-hover:text-slate-950 px-2 py-0.5 rounded-lg max-w-[76px] truncate text-center transition-colors shadow-xs">
        {user.username}
      </span>
    </div>
  );
};
