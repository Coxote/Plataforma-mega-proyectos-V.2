import React from 'react';

export type ProjectStatusType =
  | 'activo'
  | 'active'
  | 'completado'
  | 'completed'
  | 'en_progreso'
  | 'in_progress'
  | 'en_curso'
  | 'proceso'
  | 'vencido'
  | 'overdue'
  | 'delayed'
  | 'por_vencer'
  | 'approaching'
  | 'en_tiempo'
  | 'on_track'
  | 'bloqueado'
  | 'blocked'
  | 'pendiente'
  | 'en_revision'
  | 'neutral'
  | string;

export interface ProjectStatusBadgeProps {
  status: ProjectStatusType;
  label?: string;
  className?: string;
  showDot?: boolean;
}

/**
 * ProjectStatusBadge: Sistema de etiquetas de estado restrictivo y premium.
 * Cumple con diseño border-none y solo tres variantes basadas en pasteles muy suaves:
 * 1. Neutral / En Progreso: bg-slate-100, texto oscuro (text-slate-800)
 * 2. Éxito / Activo: Fondo acento pastel muy suave (bg-[#edf9c7]), texto oscuro (text-slate-900)
 * 3. Alerta / Vencido: Fondo ámbar muy claro (bg-amber-50), texto oscuro (text-amber-950)
 */
export const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({
  status,
  label,
  className = '',
  showDot = false
}) => {
  const normalized = (status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');

  let variant: 'neutral' | 'success' | 'alert' = 'neutral';
  let defaultText = 'En progreso';

  // Variant resolution
  if (
    normalized === 'activo' ||
    normalized === 'active' ||
    normalized === 'completado' ||
    normalized === 'completed' ||
    normalized === 'en_tiempo' ||
    normalized === 'on_track' ||
    normalized === 'aprobada' ||
    normalized === 'approved' ||
    normalized === 'optima' ||
    normalized === 'exito' ||
    normalized === 'done'
  ) {
    variant = 'success';
    defaultText = normalized === 'completed' || normalized === 'completado' ? 'Completado' : 'Activo';
  } else if (
    normalized === 'vencido' ||
    normalized === 'overdue' ||
    normalized === 'delayed' ||
    normalized === 'atrasado' ||
    normalized === 'bloqueado' ||
    normalized === 'blocked' ||
    normalized === 'por_vencer' ||
    normalized === 'approaching' ||
    normalized === 'alerta' ||
    normalized === 'atencion' ||
    normalized === 'critico'
  ) {
    variant = 'alert';
    defaultText = normalized.includes('venc') ? 'Vencido' : normalized.includes('por_vencer') ? 'Por vencer' : 'Atención';
  } else {
    // Neutral / En progreso / Pendiente
    variant = 'neutral';
    defaultText = normalized === 'pendiente' ? 'Pendiente' : normalized.includes('revision') ? 'En revisión' : 'En progreso';
  }

  // Exact 3 variants requested:
  // - Neutral/En Progreso: Fondo gris claro (bg-slate-100), texto oscuro
  // - Éxito/Activo: Fondo con el color de acento pero en versión muy clara/pastel (bg-[#edf9c7]), texto oscuro
  // - Alerta/Vencido: Fondo amarillo/ámbar muy claro (bg-amber-50), texto oscuro
  const styles = {
    neutral: 'bg-slate-100 text-slate-800 border-none',
    success: 'bg-[#edf9c7] text-slate-900 border-none',
    alert: 'bg-amber-50 text-amber-950 border-none'
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    success: 'bg-[#84cc16]',
    alert: 'bg-amber-500'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-normal border-none shadow-none ${styles[variant]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`} />}
      <span>{label || defaultText}</span>
    </span>
  );
};
