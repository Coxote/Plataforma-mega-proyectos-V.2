import React, { useState } from 'react';
import { Project, UserSession, TimeEntryType } from '../types';
import { Clock, AlertTriangle, Plus, X, FolderKanban, Layers, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

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
    }, 1100);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* HEADER UNIFICADO DE LA PLATAFORMA */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
              <Clock className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#F4F5F0] text-slate-700 border border-stone-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c6ef4e]" />
                  Acción Rápida • Carga de Horas
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Registrar Horas de Trabajo
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Imputación de tiempo productivo o retrabajo al expediente del proyecto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-900 bg-[#F4F5F0] hover:bg-stone-200 rounded-full transition-all cursor-pointer"
            title="Cerrar ventana (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMULARIO DE CARGA */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1 bg-white">

            {/* TOAST DE ÉXITO */}
            {isSuccessToast && (
              <div className="p-4 bg-[#edf9c7]/80 text-slate-900 rounded-2xl border border-[#c6ef4e] flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>¡Horas registradas y sincronizadas exitosamente en el expediente!</span>
              </div>
            )}

            {/* SELECTOR DE PROYECTO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-slate-600" />
                <span>Proyecto Asignado *</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={handleProjectChange}
                className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all cursor-pointer"
                required
              >
                {userProjects.length === 0 ? (
                  <option value="">No tienes proyectos asignados actualmente</option>
                ) : (
                  userProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.clientName}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* SELECTOR DE FASE */}
            {phases.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>Fase de Ejecución *</span>
                </label>
                <select
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all cursor-pointer"
                >
                  {phases.map(ph => (
                    <option key={ph.id} value={ph.id}>
                      {ph.label || ph.id} · {ph.name} ({ph.loggedHours}h / {ph.allocatedHours}h)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* TIPO DE REGISTRO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tipo de Imputación
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryType('normal')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                    entryType === 'normal'
                      ? 'bg-[#edf9c7] text-slate-900 border-[#c6ef4e] shadow-2xs font-extrabold ring-1 ring-[#c6ef4e]'
                      : 'bg-[#F4F5F0] text-slate-600 border-stone-200/60 hover:bg-stone-100/80'
                  }`}
                >
                  Horas Normales
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('retrabajo')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                    entryType === 'retrabajo'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs font-extrabold ring-1 ring-amber-400'
                      : 'bg-[#F4F5F0] text-slate-600 border-stone-200/60 hover:bg-stone-100/80'
                  }`}
                >
                  ⚠️ Retrabajo
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('no_facturable')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                    entryType === 'no_facturable'
                      ? 'bg-slate-200 text-slate-900 border-slate-300 shadow-2xs font-extrabold ring-1 ring-slate-400'
                      : 'bg-[#F4F5F0] text-slate-600 border-stone-200/60 hover:bg-stone-100/80'
                  }`}
                >
                  No Facturable
                </button>
              </div>
            </div>

            {/* CAMPOS DE RETRABAJO */}
            {entryType === 'retrabajo' && (
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Detalle de Retrabajo Requerido</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase mb-1.5">
                    Origen del Retrabajo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cliente', 'interno', 'proveedor'] as const).map(orig => (
                      <button
                        key={orig}
                        type="button"
                        onClick={() => setRetrabajoOrigen(orig)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border capitalize cursor-pointer transition-all ${
                          retrabajoOrigen === orig
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-amber-200/80 hover:bg-amber-100/60'
                        }`}
                      >
                        {orig}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase mb-1.5">
                    Causa Raíz / Justificación *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Modificación de diseño solicitada por el cliente tras aprobación previa"
                    value={retrabajoMotivo}
                    onChange={(e) => setRetrabajoMotivo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    required={entryType === 'retrabajo'}
                  />
                </div>
              </div>
            )}

            {/* HORAS Y DESCRIPCIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Horas a Cargar *
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  placeholder="Ej: 3.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {entryType === 'retrabajo' ? 'Descripción de la Corrección' : 'Descripción de la Tarea Realizada *'}
                </label>
                <input
                  type="text"
                  placeholder="Ej: Maquetación de pantallas en Figma y entrega a desarrollo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all"
                  required={entryType !== 'retrabajo' || !retrabajoMotivo}
                />
              </div>
            </div>

          </div>

          {/* FOOTER UNIFICADO DE LA PLATAFORMA */}
          <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-stone-100 bg-[#FAFAF8] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hours || Number(hours) <= 0 || (!description.trim() && !retrabajoMotivo.trim())}
              className="px-8 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-900" />
              <span>Registrar Horas</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
