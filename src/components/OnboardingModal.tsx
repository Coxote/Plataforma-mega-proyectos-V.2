import React, { useState } from 'react';
import { Project, UserSession, ROLE_LABELS, getUserAvatarUrl } from '../types';
import {
  Sparkles,
  Check,
  CheckCircle2,
  List,
  Kanban,
  Calendar,
  LayoutGrid,
  Star,
  User,
  Building2,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  X,
  ShieldCheck,
  Sliders,
  FolderKanban
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  projects: Project[];
  onSavePreferences: (updatedUser: UserSession) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  projects,
  onSavePreferences,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states initialized from currentUser or defaults
  const [displayName, setDisplayName] = useState(currentUser.username || '');
  const [displayPuesto, setDisplayPuesto] = useState(currentUser.puesto || 'Coordinador PM');
  const [selectedView, setSelectedView] = useState<'list' | 'kanban' | 'calendar' | 'cards'>(
    currentUser.preferences?.defaultView || 'list'
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    currentUser.preferences?.followedProjectIds || (projects.length > 0 ? [projects[0].id] : [])
  );

  if (!isOpen) return null;

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllProjects = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map((p) => p.id));
    }
  };

  const handleFinish = () => {
    const updatedUser: UserSession = {
      ...currentUser,
      username: displayName.trim() || currentUser.username,
      puesto: displayPuesto.trim() || currentUser.puesto,
      preferences: {
        defaultView: selectedView,
        followedProjectIds: selectedProjectIds,
        onboardingCompletedAt: new Date().toISOString(),
      },
    };
    onSavePreferences(updatedUser);
    onClose();
  };

  const roleLabel = ROLE_LABELS[currentUser.role] || displayPuesto;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-all duration-300 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] text-slate-800">

        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>ConfiguraciÃ³n de Perfil Premium</span>
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-amber-300/30">
                  Onboarding
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Personaliza tu espacio de trabajo en TPP HUB DIGITAL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content: 2-Column Layout */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50">

          {/* LEFT COLUMN: Interactive Form (7 Cols) */}
          <div className="md:col-span-7 space-y-5 flex flex-col justify-between">

            {/* STEP 1: Datos Operativos y Perfil */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#FF5500]">
                    Paso 1 de 3 â€¢ Perfil Operativo
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                    Â¿CÃ³mo quieres que te identifique el equipo?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tu nombre y rol se mostrarÃ¡n en la asignaciÃ³n de tareas, bitÃ¡cora de auditorÃ­a y reportes.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Nombre a mostrar *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ej: Rodrigo Valenzuela"
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Puesto Operativo / Cargo *
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={displayPuesto}
                        onChange={(e) => setDisplayPuesto(e.target.value)}
                        placeholder="Ej: Supervisor de Cuentas / PM"
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-950">Nivel de Acceso Asignado: {roleLabel}</span>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Tu rol principal de sistema es <strong>{currentUser.role}</strong> con capacidad mensual de <strong>{currentUser.capacidadMensualHoras || 176}h</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SelecciÃ³n de Vista de Planner */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#FF5500]">
                    Paso 2 de 3 â€¢ Modalidad de Trabajo
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                    Â¿CÃ³mo quieres ver tu trabajo por defecto?
                  </h3>
                  <p className="text-xs text-slate-500">
                    No te preocupes, podrÃ¡s cambiar entre modalidades en cualquier momento desde el Planner.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Lista */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('list')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                      selectedView === 'list'
                        ? 'border-[#FF5500] bg-orange-50/50 shadow-md ring-2 ring-[#FF5500]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'list' ? 'bg-[#FF5500] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <List className="w-4 h-4" />
                      </div>
                      {selectedView === 'list' && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">Tabla / Lista</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">Vista detallada fila a fila</p>
                    </div>
                  </button>

                  {/* Option 2: Kanban */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('kanban')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                      selectedView === 'kanban'
                        ? 'border-[#FF5500] bg-orange-50/50 shadow-md ring-2 ring-[#FF5500]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'kanban' ? 'bg-[#FF5500] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Kanban className="w-4 h-4" />
                      </div>
                      {selectedView === 'kanban' && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">Tablero Kanban</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">Flujo por columnas de estado</p>
                    </div>
                  </button>

                  {/* Option 3: Calendario */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('calendar')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                      selectedView === 'calendar'
                        ? 'border-[#FF5500] bg-orange-50/50 shadow-md ring-2 ring-[#FF5500]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'calendar' ? 'bg-[#FF5500] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      {selectedView === 'calendar' && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">Calendario</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">Matriz temporal por semanas</p>
                    </div>
                  </button>

                  {/* Option 4: Tarjetas */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('cards')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                      selectedView === 'cards'
                        ? 'border-[#FF5500] bg-orange-50/50 shadow-md ring-2 ring-[#FF5500]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'cards' ? 'bg-[#FF5500] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      {selectedView === 'cards' && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">Tarjetas Cards</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">Resumen ejecutivo visual</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Proyectos de Alta Prioridad */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#FF5500]">
                    Paso 3 de 3 â€¢ Proyectos de InterÃ©s
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Proyectos Seguidos
                    </h3>
                    <button
                      type="button"
                      onClick={handleSelectAllProjects}
                      className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
                    >
                      {selectedProjectIds.length === projects.length ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Los proyectos marcados se destacarÃ¡n en tu selector rÃ¡pido con una estrella â­.
                  </p>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {projects.map((proj) => {
                    const isSelected = selectedProjectIds.includes(proj.id);
                    const completedPhases = proj.phases.filter((p) => p.status === 'completed').length;

                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleToggleProject(proj.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-300/80 shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-white' : ''}`} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-xs text-slate-900 truncate">{proj.name}</h5>
                            <p className="text-xs text-slate-500 truncate">{proj.clientName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Fases: {completedPhases}/{proj.phases.length}
                          </span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent container click
                            className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Navigation Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as any)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Paso 1 de 3</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s + 1) as any)}
                    className="px-5 py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white font-black rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar & Comenzar</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Light Schematic / Dynamic Preview (5 Cols) */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden border border-slate-800">
            {/* Ambient Lighting Orbs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF5500]/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Vista Previa en Vivo
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-850 px-2 py-0.5 rounded-md border border-slate-800">
                  Wrike Style
                </span>
              </div>

              {/* PREVIEW STEP 1: Tarjeta de Perfil EstÃ¡tica */}
              {step === 1 && (
                <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                  <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-[#FF5500] overflow-hidden bg-slate-800 shrink-0 shadow-md">
                        <img
                          src={getUserAvatarUrl(displayName || currentUser.username)}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-sm text-white truncate">
                          {displayName || currentUser.username}
                        </h4>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 inline-block mt-0.5">
                          {displayPuesto}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-xs uppercase font-bold">Capacidad</span>
                        <span className="font-extrabold text-amber-400">{currentUser.capacidadMensualHoras || 176}h / mes</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-xs uppercase font-bold">Estado</span>
                        <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Activo
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60">
                    "Los proyectos y horas registradas por este usuario serÃ¡n rastreados con sellos de auditorÃ­a de alta precisiÃ³n."
                  </p>
                </div>
              )}

              {/* PREVIEW STEP 2: IlustraciÃ³n Ligera de la Vista Seleccionada */}
              {step === 2 && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-300">
                  <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 min-h-[200px] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-300 border-b border-slate-800 pb-2">
                      <span className="capitalize font-black text-[#FF5500]">
                        Modalidad: {selectedView}
                      </span>
                      <span className="text-xs text-slate-500">Esquema GrÃ¡fico</span>
                    </div>

                    {/* Schematics per view */}
                    {selectedView === 'list' && (
                      <div className="space-y-2 py-3">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-bold text-slate-200">Fase 1: Descubrimiento</span>
                          </div>
                          <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full">100%</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="font-bold text-slate-200">Fase 2: DiseÃ±o UX</span>
                          </div>
                          <span className="text-xs bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full">65%</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                            <span className="font-bold text-slate-400">Fase 3: Desarrollo</span>
                          </div>
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">0%</span>
                        </div>
                      </div>
                    )}

                    {selectedView === 'kanban' && (
                      <div className="grid grid-cols-3 gap-2 py-3">
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-xs font-black text-slate-400 uppercase">Pendiente</span>
                          <div className="bg-slate-800 p-1.5 rounded-lg text-xs font-bold text-slate-300">Briefing</div>
                          <div className="bg-slate-800 p-1.5 rounded-lg text-xs font-bold text-slate-300">Wireframes</div>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-xs font-black text-amber-400 uppercase">En Proceso</span>
                          <div className="bg-[#FF5500]/20 border border-[#FF5500]/40 p-1.5 rounded-lg text-xs font-bold text-orange-200">
                            UI Design
                          </div>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-xs font-black text-emerald-400 uppercase">Completado</span>
                          <div className="bg-emerald-950/60 p-1.5 rounded-lg text-xs font-bold text-emerald-300">Research</div>
                        </div>
                      </div>
                    )}

                    {selectedView === 'calendar' && (
                      <div className="py-2">
                        <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-bold text-slate-400 uppercase mb-2">
                          <span>Lun</span><span>Mar</span><span>MiÃ©</span><span>Jue</span><span>Vie</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                            <div className="bg-emerald-500/20 text-emerald-300 rounded px-1 text-xs truncate">Sprint 1</div>
                          </div>
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                            <div className="bg-[#FF5500]/30 text-orange-200 rounded px-1 text-xs truncate">Entrega</div>
                          </div>
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs" />
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                            <div className="bg-purple-500/20 text-purple-300 rounded px-1 text-xs truncate">Review</div>
                          </div>
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs" />
                        </div>
                      </div>
                    )}

                    {selectedView === 'cards' && (
                      <div className="grid grid-cols-2 gap-2 py-3">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-xs font-extrabold text-white block truncate">Proyecto Famosa</span>
                          <span className="text-xs text-emerald-400 font-bold block">80% Completado</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-xs font-extrabold text-white block truncate">Proyecto ADOC</span>
                          <span className="text-xs text-amber-400 font-bold block">45% En Proceso</span>
                        </div>
                      </div>
                    )}

                    <span className="text-xs text-slate-400 text-center block pt-1">
                      Optimizada para rendimiento instantÃ¡neo
                    </span>
                  </div>
                </div>
              )}

              {/* PREVIEW STEP 3: Resumen Final antes de Confirmar */}
              {step === 3 && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-300">
                  <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                      Resumen de Preferencias
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Usuario:</span>
                        <span className="font-extrabold text-white">{displayName || currentUser.username}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Vista Planner:</span>
                        <span className="font-extrabold text-[#FF5500] uppercase">{selectedView}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Proyectos Seguidos:</span>
                        <span className="font-extrabold text-amber-400">{selectedProjectIds.length} proyectos</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Â¡Tu cuenta estÃ¡ lista para operar con mÃ¡xima eficiencia!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Dots Indicator */}
            <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Paso {step} de 3</span>
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === 1 ? 'w-6 bg-[#FF5500]' : 'w-2 bg-slate-700'
                  }`}
                />
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === 2 ? 'w-6 bg-[#FF5500]' : 'w-2 bg-slate-700'
                  }`}
                />
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === 3 ? 'w-6 bg-[#FF5500]' : 'w-2 bg-slate-700'
                  }`}
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
