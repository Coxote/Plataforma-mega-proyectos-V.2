import React, { useState } from 'react';
import { Project, UserSession, TimeEntryType } from '../types';
import { Clock, AlertTriangle, Plus, X, FolderKanban, Layers, FileText, CheckCircle2 } from 'lucide-react';

interface GlobalLogTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  projects: Project[];
  onLogTime: (
    projectId: string,
    phaseId: string,
    hours: number,
    description: string,
    type: TimeEntryType,
    retrabajoOrigen?: 'cliente' | 'interno' | 'proveedor',
    retrabajoMotivo?: string
  ) => void;
}

export const GlobalLogTimeModal: React.FC<GlobalLogTimeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  projects,
  onLogTime
}) => {
  if (!isOpen) return null;

  // Filter projects where current user is a member or assigned proveedor
  const userProjects = projects.filter(p => {
    if (currentUser.role === 'coordinador') return true;
    if (currentUser.role === 'proveedor') {
      const isAssigned = currentUser.proyectosAsignados && currentUser.proyectosAsignados.length > 0
        ? currentUser.proyectosAsignados.includes(p.id)
        : false;
      const isMember = p.members?.some(m => m.id === currentUser.id || m.userId === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase());
      return isAssigned || isMember;
    }
    return p.members?.some(m => m.id === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase());
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    userProjects[0]?.id || projects[0]?.id || ''
  );

  const selectedProject = projects.find(p => p.id === selectedProjectId) || userProjects[0] || projects[0];
  const phases = selectedProject?.phases || [];

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(phases[0]?.id || 'A1');
  const [hours, setHours] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [entryType, setEntryType] = useState<TimeEntryType>('normal');
  const [retrabajoOrigen, setRetrabajoOrigen] = useState<'cliente' | 'interno' | 'proveedor'>('cliente');
  const [retrabajoMotivo, setRetrabajoMotivo] = useState<string>('');
  const [isSuccessToast, setIsSuccessToast] = useState<boolean>(false);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    const p = projects.find(proj => proj.id === pId);
    if (p && p.phases && p.phases.length > 0) {
      setSelectedPhaseId(p.phases[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numHours = Number(hours);
    const finalDesc = description.trim() || retrabajoMotivo.trim();
    const finalMotivo = retrabajoMotivo.trim() || description.trim();

    if (!selectedProjectId || !numHours || numHours <= 0 || !finalDesc) return;

    if (entryType === 'retrabajo' && !finalMotivo) return;

    onLogTime(
      selectedProjectId,
      selectedPhaseId || phases[0]?.id || 'A1',
      numHours,
      finalDesc,
      entryType,
      entryType === 'retrabajo' ? retrabajoOrigen : undefined,
      entryType === 'retrabajo' ? finalMotivo : undefined
    );

    setIsSuccessToast(true);
    setTimeout(() => {
      setIsSuccessToast(false);
      setHours('');
      setDescription('');
      setRetrabajoMotivo('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full shadow-2xl border border-white/80 overflow-hidden space-y-0">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 relative overflow-hidden">
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-9 h-9 bg-gradient-to-br from-[#FF5500] to-[#E04B00] rounded-2xl flex items-center justify-center text-white font-black shadow-md shadow-orange-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">Registrar Horas de Trabajo</h3>
              <p className="text-[11px] text-slate-400">Acción global de carga de horas y retrabajo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMULARIO DE CARGA */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* TOAST EXITOSO */}
          {isSuccessToast && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ¡Horas registradas exitosamente en el expediente!
            </div>
          )}

          {/* SELECTOR DE PROYECTO */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-500" /> Proyecto Asignado *
            </label>
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              {userProjects.length === 0 ? (
                <option value="">No tienes proyectos asignados</option>
              ) : (
                userProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.clientName})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* SELECTOR DE FASE DEL PROYECTO */}
          {phases.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-500" /> Fase de Ejecución
              </label>
              <select
                value={selectedPhaseId}
                onChange={(e) => setSelectedPhaseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                {phases.map(ph => (
                  <option key={ph.id} value={ph.id}>
                    {ph.label || ph.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TIPO DE REGISTRO (NORMAL / RETRABAJO) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Tipo de Carga de Horas
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEntryType('normal')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                  entryType === 'normal'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setEntryType('retrabajo')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                  entryType === 'retrabajo'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ⚠️ Retrabajo
              </button>
              <button
                type="button"
                onClick={() => setEntryType('no_facturable')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                  entryType === 'no_facturable'
                    ? 'bg-slate-800 text-white border-slate-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                No Facturable
              </button>
            </div>
          </div>

          {/* CAMPOS ESPECÍFICOS DE RETRABAJO */}
          {entryType === 'retrabajo' && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Detalle de Retrabajo Requerido
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Origen del Retrabajo</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cliente', 'interno', 'proveedor'] as const).map(orig => (
                    <button
                      key={orig}
                      type="button"
                      onClick={() => setRetrabajoOrigen(orig)}
                      className={`py-1.5 px-2 text-[10px] font-extrabold rounded-xl border capitalize cursor-pointer transition-all ${
                        retrabajoOrigen === orig
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {orig}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Motivo / Causa Raíz *</label>
                <input
                  type="text"
                  placeholder="Ej: Cambio de requerimiento del cliente sin nuevo fee"
                  value={retrabajoMotivo}
                  onChange={(e) => setRetrabajoMotivo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  required={entryType === 'retrabajo'}
                />
              </div>
            </div>
          )}

          {/* CANTIDAD DE HORAS Y DESCRIPCIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horas a Cargar *</label>
              <input
                type="number"
                step="0.5"
                placeholder="Ej: 3.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                {entryType === 'retrabajo' ? 'Descripción Breve' : 'Descripción de la Tarea *'}
              </label>
              <input
                type="text"
                placeholder="Ej: Ajuste de diseño de piezas gráficas"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none"
                required={entryType !== 'retrabajo' || !retrabajoMotivo}
              />
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hours || Number(hours) <= 0 || (!description.trim() && !retrabajoMotivo.trim())}
              className="px-5 py-2 bg-[#FF4500] hover:bg-[#e03d00] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-40"
            >
              Guardar Horas
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
