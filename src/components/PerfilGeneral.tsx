import React from 'react';
import { Project } from '../types';
import { User, Hash, Clock, Briefcase, Target, ShieldAlert } from 'lucide-react';

interface PerfilGeneralProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  userRole?: string;
}

export const PerfilGeneral: React.FC<PerfilGeneralProps> = ({ project, onUpdateProject, userRole }) => {
  const roleHours = project.roleHours || { coordinador: 0, sac: 0, contents: 0, contentd: 0 };
  const totalHours = project.hoursTotal || 0;

  const handleInputChange = (field: keyof Project, value: any) => {
    onUpdateProject({
      ...project,
      [field]: value
    });
  };

  const handleRoleHourChange = (role: string, val: number) => {
    const newRoleHours = { ...roleHours, [role]: val };
    const newTotal = 
      Number(newRoleHours.coordinador || 0) + 
      Number(newRoleHours.sac || 0) + 
      Number(newRoleHours.contents || 0) + 
      Number(newRoleHours.contentd || 0);

    // Also update budget allocated to reflect these hours if budget exists
    const updatedBudget = { ...project.budget };
    if (updatedBudget && updatedBudget[role as keyof typeof updatedBudget]) {
      updatedBudget[role as keyof typeof updatedBudget] = {
        ...updatedBudget[role as keyof typeof updatedBudget],
        allocated: val
      };
    }

    onUpdateProject({
      ...project,
      roleHours: newRoleHours,
      hoursTotal: newTotal,
      budget: updatedBudget
    });
  };

  const isCoordinador = userRole === 'coordinador';

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-white rounded-3xl border border-slate-200 shadow-xs my-4" id="project-perfil-general">
      
      {/* 🟢 SECCIÓN 1: INFORMACIÓN DEL CLIENTE Y ORDEN DE VENTA */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-900" /> Información del Cliente & Orden Comercial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Nombre Cliente */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Cliente</label>
            <input
              type="text"
              disabled={!isCoordinador}
              value={project.clientName || ''}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none disabled:text-slate-500"
            />
          </div>

          {/* Contacto Principal */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contacto Principal / Teléfono</label>
            <input
              type="text"
              disabled={!isCoordinador}
              value={project.clientContact || ''}
              onChange={(e) => handleInputChange('clientContact', e.target.value)}
              placeholder="Ej: Ricardo Toro (CTO)"
              className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none disabled:text-slate-500"
            />
          </div>

          {/* No. de Orden de Venta (OV) */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl">
            <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> No. Orden de Venta (OV)
            </label>
            <input
              type="text"
              disabled={!isCoordinador}
              value={project.saleOrderNumber || project.ovNumber || ''}
              onChange={(e) => {
                onUpdateProject({
                  ...project,
                  saleOrderNumber: e.target.value,
                  ovNumber: e.target.value
                });
              }}
              placeholder="00000"
              className="w-full bg-transparent font-black text-emerald-400 text-lg focus:outline-none disabled:opacity-80"
            />
          </div>

        </div>
      </div>

      {/* 🟢 SECCIÓN 2: DETALLE DEL PROYECTO */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-900" /> Detalle del Proyecto
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Proyecto</label>
            <input
              type="text"
              disabled={!isCoordinador}
              value={project.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 text-base focus:outline-none disabled:text-slate-500"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción General</label>
            <textarea
              rows={2}
              disabled={!isCoordinador}
              value={project.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full bg-transparent text-slate-700 text-sm focus:outline-none resize-none disabled:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* 🟢 SECCIÓN 3: DESGLOSE DE HORAS VENDIDAS POR ROL */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-900" /> Horas Vendidas (Presupuestas)
          </h3>
          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            Total Vendido: {totalHours} hrs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Coordinador</span>
            <input
              type="number"
              disabled={!isCoordinador}
              value={roleHours.coordinador}
              onChange={(e) => handleRoleHourChange('coordinador', parseInt(e.target.value, 10) || 0)}
              className="text-xl font-black text-slate-900 w-full bg-transparent focus:outline-none disabled:text-slate-500"
            />
            <span className="text-[10px] text-slate-400">horas asignadas</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SAC</span>
            <input
              type="number"
              disabled={!isCoordinador}
              value={roleHours.sac}
              onChange={(e) => handleRoleHourChange('sac', parseInt(e.target.value, 10) || 0)}
              className="text-xl font-black text-slate-900 w-full bg-transparent focus:outline-none disabled:text-slate-500"
            />
            <span className="text-[10px] text-slate-400">horas asignadas</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ContentS</span>
            <input
              type="number"
              disabled={!isCoordinador}
              value={roleHours.contents}
              onChange={(e) => handleRoleHourChange('contents', parseInt(e.target.value, 10) || 0)}
              className="text-xl font-black text-slate-900 w-full bg-transparent focus:outline-none disabled:text-slate-500"
            />
            <span className="text-[10px] text-slate-400">horas asignadas</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ContentD</span>
            <input
              type="number"
              disabled={!isCoordinador}
              value={roleHours.contentd}
              onChange={(e) => handleRoleHourChange('contentd', parseInt(e.target.value, 10) || 0)}
              className="text-xl font-black text-slate-900 w-full bg-transparent focus:outline-none disabled:text-slate-500"
            />
            <span className="text-[10px] text-slate-400">horas asignadas</span>
          </div>

        </div>
      </div>

      {/* 🟢 SECCIÓN 4: OBJETIVO Y ALCANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="text-xs font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-600" /> Objetivo de Negocio
          </label>
          <textarea
            rows={3}
            disabled={!isCoordinador}
            value={project.objective || ''}
            onChange={(e) => handleInputChange('objective', e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none resize-none disabled:text-slate-500"
            placeholder="Escribe el objetivo principal del proyecto para el negocio..."
          />
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="text-xs font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" /> Alcance (Scope Lock)
          </label>
          <textarea
            rows={3}
            disabled={!isCoordinador}
            value={project.alcance || ''}
            onChange={(e) => handleInputChange('alcance', e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none resize-none disabled:text-slate-500"
            placeholder="Especifica los límites del alcance del proyecto..."
          />
        </div>
      </div>

    </div>
  );
};
