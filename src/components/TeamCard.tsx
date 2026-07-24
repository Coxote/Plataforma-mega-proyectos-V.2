import React from 'react';
import { UserSession, getUserAvatarUrl } from '../types';
import { Clock, AlertCircle, CheckCircle, Flame } from 'lucide-react';

export interface VitaminizedMember {
  id: string;
  username: string;
  role: string;
  puesto?: string;
  monthlyCapacity: number; // 192h gross
  effectiveCapacity?: number; // 153.6h (80% target)
  idleBuffer?: number; // 38.4h (20% margin)
  loadedHours: number;     // consumed hours
  assignedHours: number;
  saturation: number;
  effectiveSaturation?: number;
  skills: string[];        // Autocalculated or customized tags
  activeProjectsCount: number;
}

interface TeamCardProps {
  member: VitaminizedMember;
  onSelect: (member: VitaminizedMember) => void;
  getUserColor: (role: string) => string;
}

export const TeamCard: React.FC<TeamCardProps> = ({ member, onSelect, getUserColor }) => {
  const saturation = member.saturation;
  
  // Custom states based on saturation - Operations Atelier Style Chips (no emojis, neat design)
  const getStatusConfig = (sat: number) => {
    if (sat > 95) {
      return {
        label: 'Sobre-saturado',
        bg: 'bg-rose-50',
        text: 'text-rose-750',
        border: 'border-rose-200',
        bullet: 'bg-rose-500',
      };
    }
    if (sat > 75) {
      return {
        label: 'Carga Elevada',
        bg: 'bg-amber-50',
        text: 'text-amber-750',
        border: 'border-amber-200',
        bullet: 'bg-amber-500',
      };
    }
    return {
      label: 'Óptimo',
      bg: 'bg-emerald-50',
      text: 'text-emerald-750',
      border: 'border-emerald-200',
      bullet: 'bg-emerald-500',
    };
  };

  const status = getStatusConfig(saturation);

  return (
    <div 
      onClick={() => onSelect(member)}
      className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all duration-200 flex flex-col justify-between group h-full relative"
      id={`team-card-${member.id}`}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            {/* Elegant profile image avatar matching shared style */}
            <div className="w-10 h-10 rounded-full border border-slate-200 shadow-xs overflow-hidden relative transition-transform duration-200 group-hover:scale-105 shrink-0 bg-slate-100 flex items-center justify-center">
              <img 
                src={getUserAvatarUrl(member.username)} 
                alt={member.username} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 capitalize transition-colors text-sm">
                {member.username}
              </h3>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                {member.puesto || member.role}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${status.bg} ${status.text} ${status.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.bullet}`} />
            <span>{status.label} ({saturation.toFixed(0)}%)</span>
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 mt-2 space-y-1.5">
        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Consumo / Asignado</span>
          </span>
          <span className="text-slate-900 font-bold tabular-nums">{member.loadedHours}h / {member.assignedHours}h</span>
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Capacidad Bruta: <strong className="text-slate-700">{member.monthlyCapacity || 192}h</strong></span>
          <span>Target Neta (80%): <strong className="text-indigo-600">{member.effectiveCapacity || 153.6}h</strong></span>
        </div>

        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              saturation > 95 ? 'bg-rose-500' : saturation > 75 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(saturation, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
