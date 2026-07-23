import React, { useState } from 'react';
import { Project, UserSession, Role, ProjectBudget } from '../types';
import { AlertTriangle, Info, AlertCircle, Clock, Settings, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  project: Project;
  currentUser: UserSession;
  onLogTime: (hours: number, description: string) => void;
  onUpdateBudget?: (newBudget: ProjectBudget) => void; 
}

export const RoleTimeTracker: React.FC<Props> = ({ 
  project, 
  currentUser, 
  onLogTime, 
  onUpdateBudget 
}) => {
  const [hoursToLog, setHoursToLog] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);

  // Form states for updating budget
  const [allocatedCoord, setAllocatedCoord] = useState(project.budget?.coordinador?.allocated || 0);
  const [allocatedSac, setAllocatedSac] = useState(project.budget?.sac?.allocated || 0);
  const [allocatedContentS, setAllocatedContentS] = useState(project.budget?.contents?.allocated || 0);
  const [allocatedContentD, setAllocatedContentD] = useState(project.budget?.contentd?.allocated || 0);

  const userBudget = project.budget ? project.budget[currentUser.role] : undefined;
  const isPrivileged = currentUser.role === 'coordinador' || currentUser.role === 'sac';

  if (!userBudget && currentUser.role !== 'invitado') {
    return null;
  }

  // Calculate percentage if they have budget
  const percentage = userBudget ? (userBudget.consumed / userBudget.allocated) * 100 : 0;

  let alertElement = null;
  if (userBudget) {
    if (percentage >= 90) {
      alertElement = (
        <div className="flex items-start gap-2.5 text-xs bg-red-50 text-red-700 p-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 animate-bounce" />
          <div>
            <strong className="font-bold">Consumo Crítico:</strong> Has gastado el {percentage.toFixed(0)}% de tu presupuesto ({userBudget.consumed} de {userBudget.allocated} horas).
          </div>
        </div>
      );
    } else if (percentage >= 75) {
      alertElement = (
        <div className="flex items-start gap-2.5 text-xs bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <strong className="font-bold">Consumo Alto:</strong> Llevas consumido el {percentage.toFixed(0)}% de tus horas asignadas. Considera reportar avances.
          </div>
        </div>
      );
    } else if (percentage >= 50) {
      alertElement = (
        <div className="flex items-start gap-2.5 text-xs bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-200">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600" />
          <div>
            <strong className="font-bold">Aviso de Progreso:</strong> Has superado el 50% de tus horas asignadas para este proyecto.
          </div>
        </div>
      );
    }
  }

  const handleLog = () => {
    if (Number(hoursToLog) > 0 && description.trim()) {
      onLogTime(Number(hoursToLog), description.trim());
      setHoursToLog('');
      setDescription('');
    }
  };

  const handleSaveBudget = () => {
    if (!onUpdateBudget) return;
    const newBudget: ProjectBudget = {
      coordinador: { 
        allocated: allocatedCoord, 
        consumed: project.budget?.coordinador?.consumed || 0 
      },
      sac: { 
        allocated: allocatedSac, 
        consumed: project.budget?.sac?.consumed || 0 
      },
      contents: { 
        allocated: allocatedContentS, 
        consumed: project.budget?.contents?.consumed || 0 
      },
      contentd: { 
        allocated: allocatedContentD, 
        consumed: project.budget?.contentd?.consumed || 0 
      },
      invitado: { 
        allocated: 0, 
        consumed: 0 
      }
    };
    onUpdateBudget(newBudget);
    setShowBudgetEditor(false);
  };

  // Calculate global budget status
  const totalAllocated = 
    (project.budget?.coordinador?.allocated || 0) + 
    (project.budget?.sac?.allocated || 0) + 
    (project.budget?.contents?.allocated || 0) +
    (project.budget?.contentd?.allocated || 0);

  const totalConsumed = 
    (project.budget?.coordinador?.consumed || 0) + 
    (project.budget?.sac?.consumed || 0) + 
    (project.budget?.contents?.consumed || 0) +
    (project.budget?.contentd?.consumed || 0);

  // Cost calculation
  const totalCostAllocated = 
    (project.budget?.coordinador?.allocated || 0) * 40.00 + 
    (project.budget?.sac?.allocated || 0) * 35.50 + 
    (project.budget?.contents?.allocated || 0) * 28.11 +
    (project.budget?.contentd?.allocated || 0) * 33.19;

  const totalCostConsumed = 
    (project.budget?.coordinador?.consumed || 0) * 40.00 + 
    (project.budget?.sac?.consumed || 0) * 35.50 + 
    (project.budget?.contents?.consumed || 0) * 28.11 +
    (project.budget?.contentd?.consumed || 0) * 33.19;

  const globalPercentage = totalAllocated > 0 ? (totalConsumed / totalAllocated) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5" id="role-time-tracker">
      
      {/* Tracker Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Horas por rol
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            {currentUser.role === 'invitado' 
              ? 'Consumo global del equipo de proyecto' 
              : `Presupuesto asignado a tu rol: ${currentUser.role === 'contents' ? 'ContentS' : currentUser.role === 'contentd' ? 'ContentD' : currentUser.role}`}
          </p>
        </div>
        
        {userBudget && (
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
            {userBudget.consumed}h / {userBudget.allocated}h
          </span>
        )}
      </div>

      {/* Progress Bars */}
      {currentUser.role !== 'invitado' && userBudget ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Progreso Personal</span>
            <span>{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-550 ${
                percentage >= 90 ? 'bg-rose-500' : percentage >= 75 ? 'bg-amber-500' : 'bg-lime-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Progreso Global del Equipo</span>
            <span>{globalPercentage.toFixed(0)}% ({totalConsumed}h de {totalAllocated}h)</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-550 ${
                globalPercentage >= 90 ? 'bg-rose-500' : globalPercentage >= 75 ? 'bg-amber-500' : 'bg-lime-500'
              }`}
              style={{ width: `${Math.min(globalPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Small Cost Summary Display */}
      {totalAllocated > 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] text-slate-500 flex items-center justify-between font-medium">
          <span>Costo estimado total:</span>
          <span>
            <strong className="text-slate-800 font-bold">${totalCostConsumed.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong> de ${totalCostAllocated.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD presupuestados
          </span>
        </div>
      )}

      {/* Alerts */}
      {alertElement}

      {/* Log Time Form (Only if user has budget and is not guest) */}
      {currentUser.role !== 'invitado' && userBudget && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <span className="text-xs font-bold text-slate-700 block">Cargar Horas de Trabajo</span>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="number" 
              placeholder="Horas" 
              className="w-full sm:w-20 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-medium"
              value={hoursToLog}
              min="0.5"
              step="0.5"
              onChange={(e) => {
                const val = e.target.value;
                setHoursToLog(val === '' ? '' : Number(val));
              }}
            />
            <input 
              type="text" 
              placeholder="¿Qué actividades realizaste?" 
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-lime-400 focus:border-lime-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button 
              onClick={handleLog}
              disabled={!hoursToLog || !description.trim()}
              className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0"
            >
              Cargar
            </button>
          </div>
        </div>
      )}

      {/* Privileged Budget Configuration */}
      {isPrivileged && onUpdateBudget && (
        <div className="border-t border-slate-100 pt-4">
          {!showBudgetEditor ? (
            <button
              onClick={() => {
                setAllocatedCoord(project.budget?.coordinador?.allocated || 0);
                setAllocatedSac(project.budget?.sac?.allocated || 0);
                setAllocatedContentS(project.budget?.contents?.allocated || 0);
                setAllocatedContentD(project.budget?.contentd?.allocated || 0);
                setShowBudgetEditor(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              Reasignar Presupuestos por Rol
            </button>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-lime-600" />
                  Presupuestos Asignados
                </span>
                <button
                  onClick={() => setShowBudgetEditor(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Coord (h) - $40/h</label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs outline-none bg-white font-semibold text-center"
                    value={allocatedCoord}
                    onChange={(e) => setAllocatedCoord(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="text-[9px] text-slate-400 block text-center mt-0.5">
                    Gasto: {project.budget?.coordinador?.consumed || 0}h
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">SAC (h) - $35.50/h</label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs outline-none bg-white font-semibold text-center"
                    value={allocatedSac}
                    onChange={(e) => setAllocatedSac(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="text-[9px] text-slate-400 block text-center mt-0.5">
                    Gasto: {project.budget?.sac?.consumed || 0}h
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">ContentS (h) - $28.11/h</label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs outline-none bg-white font-semibold text-center"
                    value={allocatedContentS}
                    onChange={(e) => setAllocatedContentS(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="text-[9px] text-slate-400 block text-center mt-0.5">
                    Gasto: {project.budget?.contents?.consumed || 0}h
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">ContentD (h) - $33.19/h</label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs outline-none bg-white font-semibold text-center"
                    value={allocatedContentD}
                    onChange={(e) => setAllocatedContentD(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="text-[9px] text-slate-400 block text-center mt-0.5">
                    Gasto: {project.budget?.contentd?.consumed || 0}h
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[10px]">
                <span className="font-medium text-slate-500">
                  Nuevo total: <strong className="font-bold text-slate-800">{allocatedCoord + allocatedSac + allocatedContentS + allocatedContentD}h</strong>
                </span>
                <button
                  onClick={handleSaveBudget}
                  className="bg-slate-900 text-white font-bold px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 text-lime-400" />
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
