import React from 'react';
import { UserSession } from '../types';

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
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 hover:shadow-md transition-all select-none border border-white/20 ${color}`}
      title={`${user.username} - ${user.puesto || user.role}`}
    >
      <span className="uppercase">{user.username.charAt(0)}</span>
    </div>
  );
};
