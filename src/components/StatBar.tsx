import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export interface StatItem {
  id?: string;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value?: string;
    text?: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    sentiment?: 'positive' | 'warning' | 'critical' | 'neutral';
  };
  icon?: LucideIcon | React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
  onClick?: () => void;
}

interface StatBarProps {
  stats: StatItem[];
  className?: string;
}

export const StatBar: React.FC<StatBarProps> = ({ stats, className = '' }) => {
  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-100/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] px-4 py-3 sm:px-6 sm:py-3.5 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-y-3 md:gap-y-0">
        {stats.map((stat, idx) => {
          const rawIcon = stat.icon;
          
          let iconColor = 'text-[#FF5500] bg-orange-50';
          if (stat.status === 'success') iconColor = 'text-emerald-600 bg-emerald-50';
          if (stat.status === 'warning') iconColor = 'text-amber-600 bg-amber-50';
          if (stat.status === 'danger') iconColor = 'text-rose-600 bg-rose-50';
          if (stat.status === 'info') iconColor = 'text-blue-600 bg-blue-50';
          if (stat.status === 'neutral') iconColor = 'text-slate-600 bg-slate-100';

          const trendText = stat.trend?.value || stat.trend?.text;
          const isPositive = stat.trend?.sentiment === 'positive' || stat.trend?.isPositive === true;
          const isWarning = stat.trend?.sentiment === 'warning';
          const isCritical = stat.trend?.sentiment === 'critical' || (stat.trend?.isPositive === false && !stat.trend?.isNeutral && !isWarning);
          const isNeutral = stat.trend?.sentiment === 'neutral' || stat.trend?.isNeutral === true;

          return (
            <div 
              key={stat.id || idx}
              onClick={stat.onClick}
              className={`flex items-center gap-3 px-3 py-1.5 ${stat.onClick ? 'cursor-pointer hover:bg-slate-50/70 rounded-xl transition-colors' : ''}`}
            >
              {rawIcon && (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                  {React.isValidElement(rawIcon) ? (
                    rawIcon
                  ) : typeof rawIcon === 'function' ? (
                    React.createElement(rawIcon as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' })
                  ) : null}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 font-medium truncate">
                  {stat.label}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-bold text-slate-900 tracking-tight">
                    {stat.value}
                  </span>
                  {trendText && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                      isNeutral
                        ? 'text-slate-500'
                        : isPositive
                        ? 'text-emerald-600'
                        : isWarning
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}>
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isWarning && <AlertTriangle className="w-3 h-3" />}
                      {isCritical && <TrendingDown className="w-3 h-3" />}
                      {trendText}
                    </span>
                  )}
                  {stat.subValue && !stat.trend && (
                    <span className="text-xs text-slate-400 font-normal truncate">
                      {stat.subValue}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
