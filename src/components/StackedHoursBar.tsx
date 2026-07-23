import React from 'react';
import { TimeEntry } from '../types';

interface StackedHoursBarProps {
  timeEntries: TimeEntry[];
  hoursTotal: number;
}

export const StackedHoursBar: React.FC<StackedHoursBarProps> = ({ timeEntries = [], hoursTotal }) => {
  const totalUsed = timeEntries.reduce((acc, curr) => acc + curr.hours, 0);

  // Agrupar horas por rol
  const hoursByRole = timeEntries.reduce((acc, entry) => {
    acc[entry.role] = (acc[entry.role] || 0) + entry.hours;
    return acc;
  }, {} as Record<string, number>);

  const getPercent = (hours: number) => {
    if (!hoursTotal) return 0;
    return Math.min(100, (hours / hoursTotal) * 100);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">⏱ Consumo de horas proyecto</span>
        <span className="font-bold text-slate-900">
          {totalUsed}h <span className="text-slate-400 font-normal">/ {hoursTotal}h</span>
        </span>
      </div>

      {/* Barra Apilada */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
        {hoursByRole['sac'] && hoursByRole['sac'] > 0 ? (
          <div
            style={{ width: `${getPercent(hoursByRole['sac'])}%` }}
            className="bg-sky-400 h-full transition-all"
            title={`SAC: ${hoursByRole['sac']}h`}
          />
        ) : null}
        {hoursByRole['contents'] && hoursByRole['contents'] > 0 ? (
          <div
            style={{ width: `${getPercent(hoursByRole['contents'])}%` }}
            className="bg-amber-400 h-full transition-all"
            title={`ContentS: ${hoursByRole['contents']}h`}
          />
        ) : null}
        {hoursByRole['contentd'] && hoursByRole['contentd'] > 0 ? (
          <div
            style={{ width: `${getPercent(hoursByRole['contentd'])}%` }}
            className="bg-indigo-400 h-full transition-all"
            title={`ContentD: ${hoursByRole['contentd']}h`}
          />
        ) : null}
        {hoursByRole['coordinador'] && hoursByRole['coordinador'] > 0 ? (
          <div
            style={{ width: `${getPercent(hoursByRole['coordinador'])}%` }}
            className="bg-lime-400 h-full transition-all"
            title={`Coordinación: ${hoursByRole['coordinador']}h`}
          />
        ) : null}
      </div>

      {/* Leyenda */}
      <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-slate-500 pt-1">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
          <span>SAC ({hoursByRole['sac'] || 0}h)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span>ContentS ({hoursByRole['contents'] || 0}h)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
          <span>ContentD ({hoursByRole['contentd'] || 0}h)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-lime-400 inline-block" />
          <span>Coord. ({hoursByRole['coordinador'] || 0}h)</span>
        </div>
      </div>
    </div>
  );
};
