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
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 hover:shadow-md transition-all select-none border-2 border-white overflow-hidden ${color}`}
      title={`${user.username} - ${user.puesto || user.role}`}
    >
      <img 
        src={getUserAvatarUrl(user.username)} 
        alt={user.username} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
