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
  FolderKanban,
  ArrowRight,
  ArrowLeft
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* HEADER UNIFICADO DE LA PLATAFORMA */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#F4F5F0] text-slate-700 border border-stone-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c6ef4e]" />
                  Paso {step} de 3 • Configuración Inicial
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Personalización de tu Espacio de Trabajo
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Adapta tu identidad visual, vista por defecto del Planner y proyectos destacados.
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

        {/* STEPPER BAR UNIFICADO */}
        <div className="bg-[#F4F5F0] p-1.5 rounded-2xl mx-6 sm:mx-8 my-4 shrink-0 border border-stone-200/40 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all ${
              step === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 1 ? 'bg-[#c6ef4e] text-slate-900' : 'bg-emerald-500 text-white'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </span>
            <span className="truncate">1. Perfil & Puesto</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all ${
              step === 2 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 2 ? 'bg-[#c6ef4e] text-slate-900' : step > 2 ? 'bg-emerald-500 text-white' : 'bg-stone-300 text-slate-600'
              }`}
            >
              {step > 2 ? '✓' : '2'}
            </span>
            <span className="truncate">2. Modalidad Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all ${
              step === 3 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 3 ? 'bg-[#c6ef4e] text-slate-900' : 'bg-stone-300 text-slate-600'
              }`}
            >
              3
            </span>
            <span className="truncate">3. Proyectos Seguidos</span>
          </button>
        </div>

        {/* CUERPO PRINCIPAL DEL WIZARD (GRID DE 2 COLUMNAS) */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 bg-white">

          {/* COLUMNA IZQUIERDA: FORMULARIO INTERACTIVO (7 COLS) */}
          <div className="md:col-span-7 space-y-5 flex flex-col justify-between">

            {/* PASO 1: PERFIL */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    ¿Cómo quieres que te identifique el equipo?
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Tu nombre y rol se mostrarán en la asignación de tareas, bitácora y tableros.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Nombre a mostrar *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ej: Rodrigo Valenzuela"
                        className="w-full pl-11 pr-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Puesto Operativo / Cargo *
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={displayPuesto}
                        onChange={(e) => setDisplayPuesto(e.target.value)}
                        placeholder="Ej: Supervisor de Cuentas / PM"
                        className="w-full pl-11 pr-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#F4F5F0] rounded-2xl border border-stone-200/50 text-xs text-slate-700 flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Nivel de Acceso Asignado: {roleLabel}</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tu rol principal es <strong>{currentUser.role}</strong> con capacidad mensual efectiva de <strong>{currentUser.capacidadMensualHoras || 176}h</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: VISTA PLANNER */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    ¿Cómo prefieres visualizar tu Planner de trabajo?
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Podrás alternar de modalidad cuando quieras con los conmutadores de la barra superior.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Lista */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('list')}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-30 border ${
                      selectedView === 'list'
                        ? 'bg-[#edf9c7]/30 border-[#c6ef4e] shadow-xs ring-1 ring-[#c6ef4e]'
                        : 'bg-[#F4F5F0] border-stone-200/60 hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'list' ? 'bg-[#c6ef4e] text-slate-900' : 'bg-white text-slate-800'}`}>
                        <List className="w-4 h-4" />
                      </div>
                      {selectedView === 'list' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Tabla / Lista</h4>
                      <p className="text-[11px] text-slate-500 font-normal">Fila por fila con métricas</p>
                    </div>
                  </button>

                  {/* Kanban */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('kanban')}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-30 border ${
                      selectedView === 'kanban'
                        ? 'bg-[#edf9c7]/30 border-[#c6ef4e] shadow-xs ring-1 ring-[#c6ef4e]'
                        : 'bg-[#F4F5F0] border-stone-200/60 hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'kanban' ? 'bg-[#c6ef4e] text-slate-900' : 'bg-white text-slate-800'}`}>
                        <Kanban className="w-4 h-4" />
                      </div>
                      {selectedView === 'kanban' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Tablero Kanban</h4>
                      <p className="text-[11px] text-slate-500 font-normal">Columnas de flujo ágil</p>
                    </div>
                  </button>

                  {/* Calendario */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('calendar')}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-30 border ${
                      selectedView === 'calendar'
                        ? 'bg-[#edf9c7]/30 border-[#c6ef4e] shadow-xs ring-1 ring-[#c6ef4e]'
                        : 'bg-[#F4F5F0] border-stone-200/60 hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'calendar' ? 'bg-[#c6ef4e] text-slate-900' : 'bg-white text-slate-800'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      {selectedView === 'calendar' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Calendario</h4>
                      <p className="text-[11px] text-slate-500 font-normal">Matriz temporal por semanas</p>
                    </div>
                  </button>

                  {/* Cards */}
                  <button
                    type="button"
                    onClick={() => setSelectedView('cards')}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-30 border ${
                      selectedView === 'cards'
                        ? 'bg-[#edf9c7]/30 border-[#c6ef4e] shadow-xs ring-1 ring-[#c6ef4e]'
                        : 'bg-[#F4F5F0] border-stone-200/60 hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${selectedView === 'cards' ? 'bg-[#c6ef4e] text-slate-900' : 'bg-white text-slate-800'}`}>
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      {selectedView === 'cards' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Tarjetas Cards</h4>
                      <p className="text-[11px] text-slate-500 font-normal">Resumen ejecutivo visual</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: PROYECTOS SEGUIDOS */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Proyectos Seguidos & Destacados
                    </h3>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Los proyectos marcados se destacarán en tu selector rápido con una estrella.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllProjects}
                    className="text-xs font-bold text-slate-700 hover:text-black underline cursor-pointer"
                  >
                    {selectedProjectIds.length === projects.length ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {projects.map((proj) => {
                    const isSelected = selectedProjectIds.includes(proj.id);
                    const completedPhases = proj.phases.filter((p) => p.status === 'completado').length;
                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleToggleProject(proj.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#edf9c7]/30 border-[#c6ef4e] shadow-2xs'
                            : 'bg-[#F4F5F0] border-stone-200/60 hover:bg-stone-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#c6ef4e] text-slate-900' : 'bg-white text-slate-400'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-slate-900' : ''}`} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-900 truncate">{proj.name}</h5>
                            <p className="text-[11px] text-slate-500 font-normal truncate">{proj.clientName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-stone-200/50">
                            Fases: {completedPhases}/{proj.phases.length}
                          </span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 accent-[#c6ef4e] rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* COLUMNA DERECHA: PREVIEW EJECUTIVA (5 COLS) */}
          <div className="md:col-span-5 bg-[#F4F5F0] rounded-3xl p-5 border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ficha de Vista Previa
                </span>
                <span className="w-2 h-2 rounded-full bg-[#c6ef4e]" />
              </div>

              {/* Avatar e identidad */}
              <div className="flex items-center gap-3 my-4">
                <img
                  src={currentUser.avatarUrl || getUserAvatarUrl(currentUser.username)}
                  alt={displayName}
                  className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shadow-2xs"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">
                    {displayName || currentUser.username}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{displayPuesto}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-2xl border border-stone-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Modalidad Principal:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedView}</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-stone-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Proyectos en Seguimiento:</span>
                  <span className="font-bold text-slate-900">{selectedProjectIds.length} activos</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-stone-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Capacidad Mensual:</span>
                  <span className="font-bold text-slate-900">{currentUser.capacidadMensualHoras || 176}h / mes</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#edf9c7]/40 rounded-2xl border border-[#c6ef4e]/60 text-xs text-slate-800 flex items-center gap-2 mt-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Configuración sincronizada con tu cuenta en la nube.</span>
            </div>
          </div>

        </div>

        {/* FOOTER UNIFICADO DE LA PLATAFORMA */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-stone-100 bg-[#FAFAF8] flex items-center justify-between shrink-0">
          <div>
            {step === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
              >
                Omitir
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                <span>Anterior</span>
              </button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="px-7 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-2"
              >
                <span>Siguiente Paso</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-8 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-slate-900" />
                <span>Guardar Preferencias</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
