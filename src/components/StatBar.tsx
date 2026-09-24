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
    <div className={`w-full bg-white rounded-3xl shadow-xs px-4 py-3.5 sm:px-6 sm:py-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-stone-100 gap-y-3 md:gap-y-0">
        {stats.map((stat, idx) => {
          const rawIcon = stat.icon;
          
          // Monochromatic icon container conforming to design rules
          const iconColor = 'text-slate-800 bg-stone-100';

          const trendText = stat.trend?.value || stat.trend?.text;
          const isPositive = stat.trend?.sentiment === 'positive' || stat.trend?.isPositive === true;
          const isWarning = stat.trend?.sentiment === 'warning';
          const isCritical = stat.trend?.sentiment === 'critical' || (stat.trend?.isPositive === false && !stat.trend?.isNeutral && !isWarning);
          const isNeutral = stat.trend?.sentiment === 'neutral' || stat.trend?.isNeutral === true;

          return (
            <div 
              key={stat.id || idx}
              onClick={stat.onClick}
              className={`flex items-center gap-3 px-3 py-1.5 ${stat.onClick ? 'cursor-pointer hover:bg-stone-50 rounded-2xl transition-colors' : ''}`}
            >
              {rawIcon && (
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconColor}`}>
                  {React.isValidElement(rawIcon) ? (
                    rawIcon
                  ) : typeof rawIcon === 'function' ? (
                    React.createElement(rawIcon as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4 text-slate-800' })
                  ) : null}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 font-normal truncate">
                  {stat.label}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-semibold text-slate-900 font-display tracking-tight">
                    {stat.value}
                  </span>
                  {trendText && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${
                      isNeutral
                        ? 'text-slate-500'
                        : isPositive
                        ? 'text-slate-700'
                        : isWarning
                        ? 'text-slate-700'
                        : 'text-slate-700'
                    }`}>
                      {isPositive && <TrendingUp className="w-3 h-3 text-slate-700" />}
                      {isWarning && <AlertTriangle className="w-3 h-3 text-slate-700" />}
                      {isCritical && <TrendingDown className="w-3 h-3 text-slate-700" />}
                      {trendText}
                    </span>
                  )}
                  {stat.subValue && !stat.trend && (
                    <span className="text-xs text-slate-500 font-normal truncate">
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
