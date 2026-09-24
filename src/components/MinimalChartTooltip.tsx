import React from 'react';

export interface MinimalChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  valueFormatter?: (value: any, name?: string) => string;
}

export const MinimalChartTooltip: React.FC<MinimalChartTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-black text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-2.5 pointer-events-none whitespace-nowrap border border-white/10 z-50">
      {label !== undefined && label !== null && label !== '' && (
        <span className="text-zinc-400 font-normal">{label}:</span>
      )}
      <div className="flex items-center gap-2">
        {payload.map((item, idx) => {
          const val = valueFormatter
            ? valueFormatter(item.value, item.name)
            : typeof item.value === 'number'
            ? item.value.toLocaleString()
            : item.value;

          return (
            <span key={idx} className="flex items-center gap-1">
              {item.name && payload.length > 1 && (
                <span className="text-zinc-400 text-[11px]">{item.name}:</span>
              )}
              <span className="text-[#c6ef4e] font-bold">{val}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
