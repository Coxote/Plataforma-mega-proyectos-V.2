import React from 'react';
import { UserSession } from '../types';
import { Clock, AlertCircle, CheckCircle, Flame } from 'lucide-react';

export interface VitaminizedMember {
  id: string;
  username: string;
  role: string;
  puesto?: string;
  monthlyCapacity: number; // e.g. 160h
  loadedHours: number;     // e.g. consumed hours or assigned hours
  assignedHours: number;
  saturation: number;
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
  
  // Custom states based on saturation
  const getStatusConfig = (sat: number) => {
    if (sat > 95) {
      return {
        label: 'Sobre-saturado',
        bg: 'bg-rose-50/70',
        text: 'text-rose-700',
        border: 'border-rose-100',
        bullet: 'bg-rose-500',
        icon: <Flame className="w-3.5 h-3.5 text-rose-500" />
      };
    }
    if (sat > 75) {
      return {
        label: 'Carga Elevada',
        bg: 'bg-amber-50/70',
        text: 'text-amber-700',
        border: 'border-amber-100',
        bullet: 'bg-amber-500',
        icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
      };
    }
    return {
      label: 'Óptimo',
      bg: 'bg-lime-50/70',
      text: 'text-lime-700',
      border: 'border-lime-100',
      bullet: 'bg-lime-500',
      icon: <CheckCircle className="w-3.5 h-3.5 text-lime-600" />
    };
  };

  const status = getStatusConfig(saturation);

  return (
    <div 
      onClick={() => onSelect(member)}
      className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs hover:border-slate-300 hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between group h-full relative overflow-hidden"
      id={`team-card-${member.id}`}
    >
      {/* Decorative hover gradient corner */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-radial from-slate-100/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* Elegant avatar */}
            <div className={`w-11 h-11 ${getUserColor(member.role)} text-white rounded-xl flex items-center justify-center font-bold text-base capitalize shadow-sm transition-transform duration-300 group-hover:scale-105 border border-white/15`}>
              {member.username.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 capitalize transition-colors group-hover:text-slate-900 text-[14px]">
                {member.username}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                {member.puesto || member.role}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
            {status.icon}
            <span>{status.label} ({saturation.toFixed(0)}%)</span>
          </span>
        </div>

        {/* Dynamic Skills Tag List */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {member.skills.map((skill) => (
            <span 
              key={skill} 
              className="text-[9px] bg-slate-50/90 text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-0.5 rounded-md border border-slate-100/85 font-semibold uppercase tracking-wider transition-colors duration-150"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100/80 mt-2">
        <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Horas Cargadas</span>
          </span>
          <span className="text-slate-700 font-bold">{member.loadedHours}h / {member.assignedHours}h</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              saturation > 95 ? 'bg-rose-500' : saturation > 75 ? 'bg-amber-400' : 'bg-lime-500'
            }`}
            style={{ width: `${Math.min(saturation, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
