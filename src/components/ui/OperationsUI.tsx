import React from 'react';
import { LucideIcon } from 'lucide-react';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneMap: Record<Tone, string> = {
  brand: 'bg-orange-50 text-[#FF5500] border-orange-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const PageShell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7 ${className}`}>
    <div className="mx-auto flex max-w-[1480px] flex-col gap-5">
      {children}
    </div>
  </div>
);

export const PageHeader: React.FC<{
  title: string;
  description: string;
  meta?: string;
  actions?: React.ReactNode;
}> = ({ title, description, meta, actions }) => (
  <div className="oa-panel rounded-2xl px-5 py-4 sm:px-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        {meta && (
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {meta}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </div>
);

export const SectionPanel: React.FC<{
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, icon: Icon, action, children, className = '' }) => (
  <section className={`oa-panel rounded-2xl ${className}`}>
    <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

export const StatusBadge: React.FC<{
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}> = ({ tone = 'neutral', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${toneMap[tone]} ${className}`}>
    {children}
  </span>
);

export const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  tone?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
  type?: 'button' | 'submit';
  className?: string;
}> = ({ children, onClick, tone = 'secondary', icon: Icon, type = 'button', className = '' }) => {
  const classes = {
    primary: 'bg-[#FF5500] text-white hover:bg-[#E04B00] border-[#FF5500] shadow-sm shadow-orange-500/20',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-orange-500/25 ${classes[tone]} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
};

export const ProgressBar: React.FC<{
  value: number;
  tone?: Tone;
}> = ({ value, tone = 'brand' }) => {
  const safeValue = Math.max(0, Math.min(140, value));
  const barColor = tone === 'danger'
    ? 'bg-rose-500'
    : tone === 'warning'
    ? 'bg-amber-500'
    : tone === 'success'
    ? 'bg-emerald-500'
    : 'bg-[#FF5500]';

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, safeValue)}%` }} />
    </div>
  );
};

export const EmptyBlock: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center">
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>
  </div>
);
