import React, { useState } from 'react';
import { UserSession, getUserAvatarUrl } from '../types';

interface DraggableUserProps {
  user: UserSession;
  color: string;
}

export const DraggableUser: React.FC<DraggableUserProps> = ({ user, color }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Manejador de arrastre con feedback visual y memoria del evento
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', user.id);
    e.dataTransfer.effectAllowed = 'move';

    // Crear un elemento flotante estilizado para el arrastre
    const dragPreview = document.createElement('div');
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-9999px';
    dragPreview.style.left = '-9999px';
    dragPreview.style.display = 'flex';
    dragPreview.style.alignItems = 'center';
    dragPreview.style.gap = '8px';
    dragPreview.style.padding = '6px 12px';
    dragPreview.style.backgroundColor = '#0F172A';
    dragPreview.style.color = '#FFFFFF';
    dragPreview.style.borderRadius = '9999px';
    dragPreview.style.border = '2px solid #D1F349';
    dragPreview.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
    dragPreview.style.fontSize = '12px';
    dragPreview.style.fontWeight = '700';
    dragPreview.style.pointerEvents = 'none';
    dragPreview.innerHTML = `
      <img src="${getUserAvatarUrl(user.username)}" style="width: 28px; height: 28px; border-radius: 9999px; object-fit: cover; border: 2px solid #D1F349;" />
      <span>${user.username}</span>
    `;
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 20, 20);

    // Limpiar el elemento temporal después de iniciar
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview);
      }
    }, 100);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing select-none group shrink-0 py-1 px-1 transition-all duration-200 ${
        isDragging
          ? 'scale-115 -rotate-3 opacity-90 z-30'
          : 'hover:scale-105'
      }`}
      title={`${user.username} - ${user.puesto || user.role} (Arrastra para asignar a una tarea)`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-200 ease-out border-2 overflow-hidden relative shadow-sm ${
          isDragging
            ? 'ring-4 ring-[#D1F349] ring-offset-2 ring-offset-white border-slate-900 shadow-2xl scale-110'
            : 'border-white group-hover:ring-2 group-hover:ring-[#D1F349] group-hover:shadow-md'
        } ${color}`}
      >
        <img
          src={getUserAvatarUrl(user.username)}
          alt={user.username}
          className="w-full h-full object-cover pointer-events-none transition-transform duration-200 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />

        {/* Indicador de agarre táctil activo */}
        {isDragging && (
          <div className="absolute inset-0 bg-lime-400/20 backdrop-blur-[1px] flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D1F349] animate-ping" />
          </div>
        )}
      </div>

      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-lg max-w-[84px] truncate text-center transition-all border ${
          isDragging
            ? 'bg-slate-950 text-[#D1F349] border-[#D1F349] shadow-md font-bold'
            : 'text-slate-700 bg-white group-hover:bg-slate-900 group-hover:text-white border-slate-200 shadow-2xs'
        }`}
      >
        {isDragging ? 'Asignando...' : user.username}
      </span>
    </div>
  );
};


