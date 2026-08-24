import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { ui } from '../theme';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`w-full py-10 px-4 flex flex-col items-center justify-center text-center bg-white/70 rounded-2xl border border-dashed border-slate-200/90 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={ui.btnPrimary}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
