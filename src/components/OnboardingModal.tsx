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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-all duration-300 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] text-slate-800">

        {/* Modal Top Header */}
        <div className="px-6 py-5 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-stone-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base tracking-tight text-white">
                  Configuración de Perfil Premium
                </h2>
                <span className="text-2xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-stone-300">
                  Onboarding
                </span>
              </div>
              <p className="text-xs text-slate-300 font-normal">
                Personaliza tu espacio de trabajo en TPP HUB DIGITAL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Modal Main Content: 2-Column Layout */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#F4F5F0]">

          {/* LEFT COLUMN: Interactive Form (7 Cols) */}
          <div className="md:col-span-7 space-y-5 flex flex-col justify-between">

            {/* STEP 1: Datos Operativos y Perfil */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                    Paso 1 de 3 • Perfil Operativo
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 tracking-tight mt-0.5">
                    ¿Cómo quieres que te identifique el equipo?
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Tu nombre y rol se mostrarán en la asignación de tareas, bitácora de auditoría y reportes.
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
                        className="w-full bg-white rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30 transition-all shadow-2xs"
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
                        className="w-full bg-white rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50/90 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
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

            {/* STEP 2: Selección de Vista de Planner */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                    Paso 2 de 3 • Modalidad de Trabajo
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 tracking-tight mt-0.5">
                    ¿Cómo quieres ver tu trabajo por defecto?
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    No te preocupes, podrás cambiar entre modalidades en cualquier momento desde el Planner.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Lista */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('list')}
                    className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                      selectedView === 'list'
                        ? 'bg-white shadow-md ring-2 ring-slate-900'
                        : 'bg-white hover:bg-stone-50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'list' ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-800'}`}>
                        <List className="w-4 h-4" />
                      </div>
                      {selectedView === 'list' && (
                        <CheckCircle2 className="w-4 h-4 text-slate-900" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900">Tabla / Lista</h4>
                      <p className="text-xs text-slate-500 font-normal line-clamp-1">Vista detallada fila a fila</p>
                    </div>
                  </button>

                  {/* Option 2: Kanban */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('kanban')}
                    className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                      selectedView === 'kanban'
                        ? 'bg-white shadow-md ring-2 ring-slate-900'
                        : 'bg-white hover:bg-stone-50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'kanban' ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-800'}`}>
                        <Kanban className="w-4 h-4" />
                      </div>
                      {selectedView === 'kanban' && (
                        <CheckCircle2 className="w-4 h-4 text-slate-900" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900">Tablero Kanban</h4>
                      <p className="text-xs text-slate-500 font-normal line-clamp-1">Flujo por columnas de estado</p>
                    </div>
                  </button>

                  {/* Option 3: Calendario */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('calendar')}
                    className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                      selectedView === 'calendar'
                        ? 'bg-white shadow-md ring-2 ring-slate-900'
                        : 'bg-white hover:bg-stone-50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'calendar' ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-800'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      {selectedView === 'calendar' && (
                        <CheckCircle2 className="w-4 h-4 text-slate-900" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900">Calendario</h4>
                      <p className="text-xs text-slate-500 font-normal line-clamp-1">Matriz temporal por semanas</p>
                    </div>
                  </button>

                  {/* Option 4: Tarjetas */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('cards')}
                    className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                      selectedView === 'cards'
                        ? 'bg-white shadow-md ring-2 ring-slate-900'
                        : 'bg-white hover:bg-stone-50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'cards' ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-800'}`}>
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      {selectedView === 'cards' && (
                        <CheckCircle2 className="w-4 h-4 text-slate-900" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900">Tarjetas Cards</h4>
                      <p className="text-xs text-slate-500 font-normal line-clamp-1">Resumen ejecutivo visual</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Proyectos de Alta Prioridad */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                    Paso 3 de 3 • Proyectos de Interés
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                      Proyectos Seguidos
                    </h3>
                    <button
                      type="button"
                      onClick={handleSelectAllProjects}
                      className="text-xs font-semibold text-slate-800 hover:underline cursor-pointer"
                    >
                      {selectedProjectIds.length === projects.length ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    Los proyectos marcados se destacarán en tu selector rápido con una estrella.
                  </p>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {projects.map((proj) => {
                    const isSelected = selectedProjectIds.includes(proj.id);
                    const completedPhases = proj.phases.filter((p) => p.status === 'completado').length;
                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleToggleProject(proj.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                            : 'bg-white/80 border-stone-200/80 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-400'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-white' : ''}`} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-semibold text-xs text-slate-900 truncate">{proj.name}</h5>
                            <p className="text-xs text-slate-500 font-normal truncate">{proj.clientName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F4F5F0] text-slate-600">
                            Fases: {completedPhases}/{proj.phases.length}
                          </span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent container click
                            className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Navigation Buttons */}
            <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as any)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 font-medium rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-800" />
                    Anterior
                  </button>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Paso 1 de 3</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s + 1) as any)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Guardar & Comenzar</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Light Schematic / Dynamic Preview (5 Cols) */}
          <div className="md:col-span-5 bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Vista Previa en Vivo
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                  Configuración
                </span>
              </div>

              {/* PREVIEW STEP 1: Tarjeta de Perfil Estática */}
              {step === 1 && (
                <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                  <div className="bg-slate-800/80 rounded-2xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-800 shrink-0 shadow-xs">
                        <img
                          src={getUserAvatarUrl(displayName || currentUser.username)}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm text-white truncate">
                          {displayName || currentUser.username}
                        </h4>
                        <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-700 text-stone-200 inline-block mt-0.5">
                          {displayPuesto}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-xs uppercase font-medium">Capacidad</span>
                        <span className="font-semibold text-stone-200">{currentUser.capacidadMensualHoras || 176}h / mes</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-xs uppercase font-medium">Estado</span>
                        <span className="font-semibold text-stone-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-stone-200" /> Activo
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60 font-normal">
                    "Los proyectos y horas registradas por este usuario serán rastreados con sellos de auditoría de alta precisión."
                  </p>
                </div>
              )}

              {/* PREVIEW STEP 2: Ilustración Ligera de la Vista Seleccionada */}
              {step === 2 && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-300">
                  <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-4 min-h-[200px] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
                      <span className="capitalize font-semibold text-stone-200">
                        Modalidad: {selectedView}
                      </span>
                      <span className="text-xs text-slate-500 font-normal">Esquema Gráfico</span>
                    </div>

                    {/* Schematics per view */}
                    {selectedView === 'list' && (
                      <div className="space-y-2 py-3">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-stone-400" />
                            <span className="font-medium text-slate-200">Fase 1: Descubrimiento</span>
                          </div>
                          <span className="text-xs bg-slate-800 text-stone-300 px-2 py-0.5 rounded-full font-medium">100%</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-stone-400" />
                            <span className="font-medium text-slate-200">Fase 2: Diseño UX</span>
                          </div>
                          <span className="text-xs bg-slate-800 text-stone-300 px-2 py-0.5 rounded-full font-medium">65%</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                            <span className="font-medium text-slate-400">Fase 3: Desarrollo</span>
                          </div>
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">0%</span>
                        </div>
                      </div>
                    )}

                    {selectedView === 'kanban' && (
                      <div className="grid grid-cols-3 gap-2 py-3">
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Pendiente</span>
                          <div className="bg-slate-800 p-1.5 rounded-lg text-xs font-medium text-slate-300">Briefing</div>
                          <div className="bg-slate-800 p-1.5 rounded-lg text-xs font-medium text-slate-300">Wireframes</div>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-xs font-semibold text-slate-300 uppercase">En Proceso</span>
                          <div className="bg-slate-800 border border-slate-700 p-1.5 rounded-lg text-xs font-medium text-stone-200">
                            UI Design
                          </div>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-xs font-semibold text-slate-300 uppercase">Completado</span>
                          <div className="bg-slate-800 p-1.5 rounded-lg text-xs font-medium text-stone-300">Research</div>
                        </div>
                      </div>
                    )}

                    {selectedView === 'calendar' && (
                      <div className="py-2">
                        <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-medium text-slate-400 uppercase mb-2">
                          <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                            <div className="bg-slate-800 text-stone-300 rounded px-1 text-xs truncate">Sprint 1</div>
                          </div>
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                            <div className="bg-slate-800 text-stone-300 rounded px-1 text-xs truncate">Entrega</div>
                          </div>
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs" />
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                            <div className="bg-slate-800 text-stone-300 rounded px-1 text-xs truncate">Review</div>
                          </div>
                          <div className="h-10 bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs" />
                        </div>
                      </div>
                    )}

                    {selectedView === 'cards' && (
                      <div className="grid grid-cols-2 gap-2 py-3">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-xs font-semibold text-white block truncate">Proyecto Famosa</span>
                          <span className="text-xs text-stone-300 font-medium block">80% Completado</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-xs font-semibold text-white block truncate">Proyecto ADOC</span>
                          <span className="text-xs text-stone-300 font-medium block">45% En Proceso</span>
                        </div>
                      </div>
                    )}

                    <span className="text-xs text-slate-400 text-center block pt-1 font-normal">
                      Optimizada para rendimiento instantáneo
                    </span>
                  </div>
                </div>
              )}

              {/* PREVIEW STEP 3: Resumen Final antes de Confirmar */}
              {step === 3 && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-300">
                  <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-stone-300 tracking-wider">
                      Resumen de Preferencias
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-normal">Usuario:</span>
                        <span className="font-semibold text-white">{displayName || currentUser.username}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-normal">Vista Planner:</span>
                        <span className="font-semibold text-stone-200 uppercase">{selectedView}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-normal">Proyectos Seguidos:</span>
                        <span className="font-semibold text-stone-200">{selectedProjectIds.length} proyectos</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-stone-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-stone-200 shrink-0" />
                    <span>¡Tu cuenta está lista para operar con máxima eficiencia!</span>
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
                    step === 1 ? 'w-6 bg-stone-200' : 'w-2 bg-slate-700'
                  }`}
                />
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === 2 ? 'w-6 bg-stone-200' : 'w-2 bg-slate-700'
                  }`}
                />
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === 3 ? 'w-6 bg-stone-200' : 'w-2 bg-slate-700'
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
