import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, UserSession, TimeEntryType } from '../types';
import { logTimeEntryToFirestore, saveCompletedTimeEntryToFirestore } from '../services/firebaseDb';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  FolderKanban,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Plus,
  Send,
  Zap,
  ExternalLink,
  Cloud,
  Monitor
} from 'lucide-react';

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
      window?: Window;
    };
  }
}

interface TimeTrackerWidgetProps {
  projects: Project[];
  currentUser: UserSession;
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

const STORAGE_KEY = 'saas_floating_timetracker_state_v1';

// Reproductor de tonos sutiles con Web Audio API nativa
const playChime = (type: 'start' | 'pause' | 'save') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'start') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'pause') {
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'save') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Silencioso en caso de no estar permitido por directiva de autoplay
  }
};

export const TimeTrackerWidget: React.FC<TimeTrackerWidgetProps> = ({
  projects,
  currentUser,
  onLogTime
}) => {
  // Filtrar proyectos accesibles según rol
  const accessibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (currentUser.role === 'coordinador') return true;
      if (currentUser.role === 'proveedor') {
        const isAssigned = currentUser.proyectosAsignados?.includes(p.id);
        const isMember = p.members?.some(
          (m) => m.id === currentUser.id || m.userId === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase()
        );
        return isAssigned || isMember;
      }
      return p.members?.some(
        (m) => m.id === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase()
      );
    });
  }, [projects, currentUser]);

  const defaultProjectId = accessibleProjects[0]?.id || projects[0]?.id || '';

  // Estado del widget
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.isCollapsed ?? true;
      }
    } catch {}
    return true; // Minimizado por defecto para no invadir
  });

  const [activeTab, setActiveTab] = useState<'timer' | 'manual'>('timer');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [entryType, setEntryType] = useState<TimeEntryType>('normal');
  const [retrabajoOrigen, setRetrabajoOrigen] = useState<'cliente' | 'interno' | 'proveedor'>('cliente');
  const [retrabajoMotivo, setRetrabajoMotivo] = useState<string>('');

  // Estados de tiempo del cronómetro
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState<number>(0);

  // Estados del modo manual
  const [manualHours, setManualHours] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Toast de confirmación
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });

  // Estado para Document Picture-in-Picture
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Proyecto y fases activas seleccionadas
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || accessibleProjects[0] || projects[0];
  }, [projects, selectedProjectId, accessibleProjects]);

  const availablePhases = useMemo(() => {
    return selectedProject?.phases || [];
  }, [selectedProject]);

  // Sincronizar fase por defecto al cambiar proyecto
  useEffect(() => {
    if (availablePhases.length > 0) {
      const exists = availablePhases.some((ph) => ph.id === selectedPhaseId);
      if (!exists) {
        const activeOrFirst = availablePhases.find((ph) => ph.id === selectedProject?.activePhaseId) || availablePhases[0];
        setSelectedPhaseId(activeOrFirst.id);
      }
    }
  }, [availablePhases, selectedPhaseId, selectedProject]);

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.selectedProjectId && projects.some((p) => p.id === data.selectedProjectId)) {
          setSelectedProjectId(data.selectedProjectId);
        }
        if (data.selectedPhaseId) setSelectedPhaseId(data.selectedPhaseId);
        if (data.description) setDescription(data.description);
        if (data.entryType) setEntryType(data.entryType);
        if (data.retrabajoOrigen) setRetrabajoOrigen(data.retrabajoOrigen);
        if (data.retrabajoMotivo) setRetrabajoMotivo(data.retrabajoMotivo);
        if (data.activeTab) setActiveTab(data.activeTab);

        const savedAcc = Number(data.accumulatedSeconds) || 0;
        setAccumulatedSeconds(savedAcc);

        if (data.isRunning && data.startedAt) {
          const diff = Math.max(0, Math.floor((Date.now() - Number(data.startedAt)) / 1000));
          setIsRunning(true);
          setStartedAt(Number(data.startedAt));
          setDisplaySeconds(savedAcc + diff);
        } else {
          setIsRunning(false);
          setStartedAt(null);
          setDisplaySeconds(savedAcc);
        }
      }
    } catch (e) {
      console.error('Error al restaurar estado del cronómetro', e);
    }
  }, [projects]);

  // Guardar estado en localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        isCollapsed,
        activeTab,
        selectedProjectId,
        selectedPhaseId,
        description,
        entryType,
        retrabajoOrigen,
        retrabajoMotivo,
        isRunning,
        startedAt,
        accumulatedSeconds
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {}
  }, [
    isCollapsed,
    activeTab,
    selectedProjectId,
    selectedPhaseId,
    description,
    entryType,
    retrabajoOrigen,
    retrabajoMotivo,
    isRunning,
    startedAt,
    accumulatedSeconds
  ]);

  // Timer Tick Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && startedAt) {
      interval = setInterval(() => {
        const currentElapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        setDisplaySeconds(accumulatedSeconds + currentElapsed);
      }, 1000);
    } else {
      setDisplaySeconds(accumulatedSeconds);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startedAt, accumulatedSeconds]);

  // Acciones del cronómetro
  const handleStart = () => {
    const now = Date.now();
    setStartedAt(now);
    setIsRunning(true);
    playChime('start');
  };

  const handlePause = () => {
    if (isRunning && startedAt) {
      const additional = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const total = accumulatedSeconds + additional;
      setAccumulatedSeconds(total);
      setDisplaySeconds(total);
      setIsRunning(false);
      setStartedAt(null);
      playChime('pause');
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartedAt(null);
    setAccumulatedSeconds(0);
    setDisplaySeconds(0);
  };

  // Detener y Guardar Tiempo del Cronómetro
  const handleStopAndSave = () => {
    let finalSeconds = accumulatedSeconds;
    if (isRunning && startedAt) {
      finalSeconds += Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    }

    if (finalSeconds < 5) {
      alert('El tiempo registrado debe ser mayor a unos segundos para poder imputarse.');
      return;
    }

    if (!selectedProjectId) {
      alert('Selecciona un proyecto antes de guardar.');
      return;
    }

    // Convertir segundos a horas decimales (mínimo 0.05h ~ 3min)
    const decimalHours = Math.max(0.05, Math.round((finalSeconds / 3600) * 100) / 100);
    const finalDesc = description.trim() || `Sesión de trabajo (${formatTime(finalSeconds)})`;
    const finalMotivo = retrabajoMotivo.trim() || finalDesc;

    // 1. Guardar directamente en Cloud Firestore vinculando usuario autenticado, proyecto y fase
    saveCompletedTimeEntryToFirestore({
      projectId: selectedProjectId,
      phaseId: selectedPhaseId || availablePhases[0]?.id || 'A1',
      hours: decimalHours,
      description: finalDesc,
      type: entryType,
      retrabajoOrigen: entryType === 'retrabajo' ? retrabajoOrigen : undefined,
      retrabajoMotivo: entryType === 'retrabajo' ? finalMotivo : undefined,
      currentUser
    }).catch((err) => console.warn('Cloud Firestore time sync note:', err));

    // 2. Notificar al gestor de estado de la aplicación
    onLogTime(
      selectedProjectId,
      selectedPhaseId || availablePhases[0]?.id || 'A1',
      decimalHours,
      finalDesc,
      entryType,
      entryType === 'retrabajo' ? retrabajoOrigen : undefined,
      entryType === 'retrabajo' ? finalMotivo : undefined
    );

    playChime('save');
    setSuccessToast({
      show: true,
      message: `¡${decimalHours}h (${formatTime(finalSeconds)}) guardadas en Firestore para ${selectedProject?.name}!`
    });

    handleReset();
    setDescription('');
    setRetrabajoMotivo('');

    setTimeout(() => {
      setSuccessToast({ show: false, message: '' });
    }, 3500);
  };

  // Guardar Horas Manuales
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(manualHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Ingresa una cantidad válida de horas.');
      return;
    }

    if (!selectedProjectId) {
      alert('Selecciona un proyecto.');
      return;
    }

    const finalDesc = description.trim() || `Carga manual de horas`;
    const finalMotivo = retrabajoMotivo.trim() || finalDesc;

    // 1. Guardar directamente en Cloud Firestore vinculando usuario autenticado, proyecto y fase
    saveCompletedTimeEntryToFirestore({
      projectId: selectedProjectId,
      phaseId: selectedPhaseId || availablePhases[0]?.id || 'A1',
      hours: hoursNum,
      description: finalDesc,
      type: entryType,
      retrabajoOrigen: entryType === 'retrabajo' ? retrabajoOrigen : undefined,
      retrabajoMotivo: entryType === 'retrabajo' ? finalMotivo : undefined,
      currentUser,
      date: manualDate
    }).catch((err) => console.warn('Cloud Firestore manual time sync note:', err));

    // 2. Notificar al gestor de estado de la aplicación
    onLogTime(
      selectedProjectId,
      selectedPhaseId || availablePhases[0]?.id || 'A1',
      hoursNum,
      finalDesc,
      entryType,
      entryType === 'retrabajo' ? retrabajoOrigen : undefined,
      entryType === 'retrabajo' ? finalMotivo : undefined
    );

    playChime('save');
    setSuccessToast({
      show: true,
      message: `¡${hoursNum}h manuales guardadas en Firestore para ${selectedProject?.name}!`
    });

    setManualHours('');
    setDescription('');
    setRetrabajoMotivo('');

    setTimeout(() => {
      setSuccessToast({ show: false, message: '' });
    }, 3500);
  };

  // Formato HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Nombre de fase seleccionada
  const currentPhaseName =
    availablePhases.find((ph) => ph.id === selectedPhaseId)?.label ||
    (availablePhases.find((ph) => ph.id === selectedPhaseId) as any)?.title ||
    'Fase activa';

  // Control de Ventana Flotante Desacoplada (Document PiP o Mini-Ventana Independiente)
  const handleTogglePip = async () => {
    // 1. Si Document PiP está activo, cerrarlo
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    // 2. Intentar Document Picture-in-Picture nativo (HTML real interactivo, sin video)
    if ('documentPictureInPicture' in window && window.documentPictureInPicture) {
      try {
        const pip = await window.documentPictureInPicture.requestWindow({
          width: 390,
          height: 380,
        });

        // Copiar estilos de la aplicación para que Tailwind y el diseño blanco se vean idénticos
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            const cssRules = Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join('');
            const style = pip.document.createElement('style');
            style.textContent = cssRules;
            pip.document.head.appendChild(style);
          } catch {
            if (styleSheet.href) {
              const link = pip.document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              pip.document.head.appendChild(link);
            }
          }
        });

        pip.document.title = 'MegaPR · Medidor de Horas';
        pip.document.body.className = 'bg-[#F4F5F0] text-slate-800 m-0 p-0 font-sans select-none overflow-hidden';

        pip.addEventListener('pagehide', () => {
          setPipWindow(null);
        });

        setPipWindow(pip);
        return;
      } catch (err) {
        console.warn('Document PiP no disponible en este contexto, abriendo ventana independiente:', err);
      }
    }

    // 3. Ventana Flotante de Escritorio (Carga EXCLUSIVAMENTE el contador blanco sin la plataforma)
    const popupUrl = `${window.location.origin}${window.location.pathname}?mini_widget=true`;
    window.open(
      popupUrl,
      'MegaPR_TimeTracker_Overlay',
      'width=410,height=600,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
  };

  return (
    <aside
      aria-label="Cronómetro y Registro de Horas"
      className="fixed bottom-4 right-4 z-40 select-none font-sans transition-all duration-300 pointer-events-auto"
      id="persistent-time-tracker-widget"
    >
      {/* ========================================================= */}
      {/* 🟢 MODO MINIMIZADO: PÍLDORA FLOTANTE ELEGANTE */}
      {/* ========================================================= */}
      {isCollapsed ? (
        <div
          onClick={() => setIsCollapsed(false)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer shadow-2xl transition-all duration-200 border group ${
            isRunning
              ? 'bg-slate-950 text-white border-emerald-500/60 shadow-emerald-950/40 ring-2 ring-emerald-500/20'
              : displaySeconds > 0
              ? 'bg-slate-900 text-white border-amber-500/50 shadow-slate-950/40'
              : 'bg-white/95 text-slate-800 border-stone-200/80 shadow-slate-900/10 hover:border-slate-300'
          }`}
          title="Click para expandir el cronómetro y registro de horas"
        >
          {/* Indicador de pulso activo */}
          <div className="relative flex items-center justify-center">
            {isRunning ? (
              <>
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </>
            ) : displaySeconds > 0 ? (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            ) : (
              <Clock className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            )}
          </div>

          {/* Información y Reloj */}
          <div className="flex flex-col text-left">
            <span
              className={`font-mono text-xs font-bold tracking-tight ${
                isRunning ? 'text-emerald-400' : displaySeconds > 0 ? 'text-amber-300' : 'text-slate-800'
              }`}
            >
              {displaySeconds > 0 ? formatTime(displaySeconds) : '00:00:00'}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[130px] font-medium leading-none mt-0.5">
              {selectedProject?.name || 'Seleccionar Proyecto'}
            </span>
          </div>

          {/* Botón rápido Play/Pause sin abrir */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-700/60">
            {isRunning ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePause();
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Pausar cronómetro"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStart();
                }}
                className="w-7 h-7 rounded-full bg-[#c6ef4e] hover:bg-[#b4df3b] text-black flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Iniciar cronómetro"
              >
                <Play className="w-3.5 h-3.5 ml-0.5 fill-black" />
              </button>
            )}

            {/* Desacoplar a ventana independiente */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePip();
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                pipWindow
                  ? 'bg-amber-400 text-black shadow-xs'
                  : 'hover:bg-white/10 text-slate-400 hover:text-amber-300'
              }`}
              title="Abrir el contador blanco en una ventana flotante independiente"
            >
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(false);
              }}
              className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Expandir panel completo"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 📋 MODO EXPANDIDO: PANEL DE CONTROL DE MEDICIÓN Y CARGA  */
        /* ========================================================= */
        <div className="w-[360px] sm:w-[390px] bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 flex flex-col">
          {/* HEADER PRINCIPAL */}
          <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  isRunning ? 'bg-emerald-500 text-black shadow-xs' : 'bg-white/10 text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-wide uppercase">Medidor de Horas</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-semibold border border-emerald-500/30">
                    <Cloud className="w-2.5 h-2.5" /> Firestore
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">Widget Flotante & Sincronizado</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Selector de pestañas */}
              <div className="bg-slate-900 rounded-xl p-0.5 flex items-center border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('timer')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    activeTab === 'timer' ? 'bg-[#c6ef4e] text-black shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cronómetro
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    activeTab === 'manual' ? 'bg-[#c6ef4e] text-black shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manual
                </button>
              </div>

              {/* Botón Ventana Flotante Independiente */}
              <button
                type="button"
                onClick={handleTogglePip}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors cursor-pointer ml-1 ${
                  pipWindow
                    ? 'bg-amber-400 text-black shadow-xs'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                }`}
                title="Abrir el contador blanco en una ventana flotante independiente de escritorio"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Botón Minimizar */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="w-7 h-7 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Minimizar a píldora flotante"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TOAST DE ÉXITO */}
          {successToast.show && (
            <div className="bg-emerald-50 text-emerald-800 px-4 py-2.5 border-b border-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{successToast.message}</span>
            </div>
          )}

          {/* CUERPO DEL WIDGET */}
          <div className="p-4 space-y-3.5 max-h-[72vh] overflow-y-auto">
            {/* SELECTOR DE PROYECTO */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Proyecto</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {selectedProject?.clientName || 'Cliente'}
                </span>
              </label>
              <div className="relative">
                <FolderKanban className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedProjectId(newId);
                    const proj = projects.find((p) => p.id === newId);
                    if (proj?.phases && proj.phases.length > 0) {
                      setSelectedPhaseId(proj.phases[0].id);
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs font-semibold text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer appearance-none"
                >
                  {accessibleProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.clientName || 'Cliente'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* SELECTOR DE FASE */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Fase del Proyecto</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {availablePhases.length} fases disponibles
                </span>
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs font-medium text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer appearance-none"
                >
                  {availablePhases.map((phase, idx) => (
                    <option key={phase.id} value={phase.id}>
                      Fase {idx + 1}: {phase.title} ({phase.status === 'completed' ? 'Completada' : 'En progreso'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* PESTAÑA 1: CRONÓMETRO EN VIVO */}
            {activeTab === 'timer' && (
              <div className="space-y-3.5 pt-1">
                {/* BANNER MODO VENTANA FLOTANTE DESACOPLADA */}
                <div className="bg-slate-900 text-white rounded-2xl p-2.5 flex items-center justify-between border border-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-[11px] font-bold text-white block leading-tight truncate">
                        Ventana Flotante de Escritorio
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-tight truncate">
                        Abre el contador en ventana independiente
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePip}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                      pipWindow
                        ? 'bg-amber-400 text-black shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{pipWindow ? 'Ventana Activa' : 'Abrir'}</span>
                  </button>
                </div>

                {/* DISPLAY DIGITAL GRANDE */}
                <div
                  className={`p-4 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
                    isRunning
                      ? 'bg-slate-950 text-white shadow-xl ring-2 ring-emerald-500/30'
                      : 'bg-[#F4F5F0] text-slate-900 border border-stone-200/60'
                  }`}
                >
                  {isRunning && (
                    <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
                      <span className="animate-ping inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">EN VIVO</span>
                    </div>
                  )}

                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">
                    Tiempo Transcurrido
                  </span>
                  <div
                    className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight ${
                      isRunning ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {formatTime(displaySeconds)}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    ≈ {(Math.max(0, displaySeconds / 3600)).toFixed(2)} hrs decimales
                  </span>

                  {/* CONTROLES DEL CRONÓMETRO */}
                  <div className="flex items-center gap-2 mt-3 w-full justify-center">
                    {!isRunning ? (
                      <button
                        type="button"
                        onClick={handleStart}
                        className="flex-1 py-2 px-4 bg-[#c6ef4e] hover:bg-[#b4df3b] text-black rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>{displaySeconds > 0 ? 'Reanudar' : 'Iniciar'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePause}
                        className="flex-1 py-2 px-4 bg-amber-400 hover:bg-amber-500 text-black rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Pause className="w-3.5 h-3.5 fill-black" />
                        <span>Pausar</span>
                      </button>
                    )}

                    {displaySeconds > 0 && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="py-2 px-3 bg-stone-200/80 hover:bg-stone-300 text-slate-700 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center cursor-pointer"
                        title="Reiniciar contador a 0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* DETALLES DE LA TAREA */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Descripción de la tarea
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej. Diseño de UI / Revisión de wireframes..."
                      className="w-full px-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* TOGGLE TIPO DE HORA: NORMAL VS RETRABAJO */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEntryType('normal')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          entryType === 'normal'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Hora Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryType('retrabajo')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          entryType === 'retrabajo'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Retrabajo
                      </button>
                    </div>

                    {/* CAUSA DE RETRABAJO (SI APLICA) */}
                    {entryType === 'retrabajo' && (
                      <div className="mt-2.5 p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Auditoría de Retrabajo</span>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-amber-800 uppercase mb-1">
                            Causa raíz del retrabajo
                          </label>
                          <select
                            value={retrabajoOrigen}
                            onChange={(e) => setRetrabajoOrigen(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-white text-xs text-amber-900 rounded-xl border border-amber-300 focus:outline-hidden text-xs"
                          >
                            <option value="cliente">Cliente (Cambio de alcance / Feedback tardío)</option>
                            <option value="interno">Interno (Error de diseño / Ajuste de equipo)</option>
                            <option value="proveedor">Proveedor (Inconsistencia técnica externa)</option>
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={retrabajoMotivo}
                            onChange={(e) => setRetrabajoMotivo(e.target.value)}
                            placeholder="Motivo puntual del ajuste o cambio..."
                            className="w-full px-2.5 py-1.5 bg-white text-xs text-amber-900 rounded-xl border border-amber-300 focus:outline-hidden placeholder:text-amber-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTÓN FINAL DETENER Y GUARDAR */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={displaySeconds < 5}
                      onClick={handleStopAndSave}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                        displaySeconds >= 5
                          ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                          : 'bg-stone-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Detener y Guardar Tiempo ({formatTime(displaySeconds)})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: CARGA MANUAL DE HORAS */}
            {activeTab === 'manual' && (
              <form onSubmit={handleSaveManual} className="space-y-3 pt-1">
                {/* CANTIDAD DE HORAS & CHIPS RÁPIDOS */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Horas a Imputar</span>
                    <span className="text-[10px] text-slate-400 font-normal">Decimales (ej. 1.5 = 1h 30m)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="24"
                    required
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    placeholder="Cantidad de horas (ej. 2.5)"
                    className="w-full px-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-base font-bold text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                  />

                  {/* Botones de sugerencia rápida */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {[
                      { label: '+15m', val: '0.25' },
                      { label: '+30m', val: '0.5' },
                      { label: '+1h', val: '1.0' },
                      { label: '+2h', val: '2.0' },
                      { label: '+4h', val: '4.0' }
                    ].map((chip) => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => {
                          const current = parseFloat(manualHours) || 0;
                          setManualHours((current + parseFloat(chip.val)).toFixed(2).replace(/\.00$/, ''));
                        }}
                        className="px-2 py-1 bg-[#F4F5F0] hover:bg-stone-200 text-[11px] font-semibold text-slate-700 rounded-xl transition-colors cursor-pointer border border-stone-200/60"
                      >
                        {chip.label}
                      </button>
                    ))}
                    {manualHours && (
                      <button
                        type="button"
                        onClick={() => setManualHours('')}
                        className="px-2 py-1 text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer ml-auto"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* FECHA */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Fecha de ejecución
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs font-semibold text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
                  />
                </div>

                {/* DESCRIPCIÓN */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Descripción del trabajo realizado
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalle de actividades desarrolladas..."
                    className="w-full px-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* TIPO: NORMAL VS RETRABAJO */}
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEntryType('normal')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        entryType === 'normal'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Hora Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryType('retrabajo')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        entryType === 'retrabajo'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Retrabajo
                    </button>
                  </div>

                  {entryType === 'retrabajo' && (
                    <div className="mt-2.5 p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[10px] font-semibold text-amber-800 uppercase mb-1">
                          Causa raíz del retrabajo
                        </label>
                        <select
                          value={retrabajoOrigen}
                          onChange={(e) => setRetrabajoOrigen(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-white text-xs text-amber-900 rounded-xl border border-amber-300 focus:outline-hidden"
                        >
                          <option value="cliente">Cliente (Cambio de alcance / Feedback tardío)</option>
                          <option value="interno">Interno (Error de diseño / Ajuste de equipo)</option>
                          <option value="proveedor">Proveedor (Inconsistencia técnica externa)</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={retrabajoMotivo}
                          onChange={(e) => setRetrabajoMotivo(e.target.value)}
                          placeholder="Motivo del retrabajo..."
                          className="w-full px-2.5 py-1.5 bg-white text-xs text-amber-900 rounded-xl border border-amber-300 focus:outline-hidden placeholder:text-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTÓN ENVIAR CARGA MANUAL */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#c6ef4e] hover:bg-[#b4df3b] text-black rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5 fill-black" />
                    <span>Cargar {manualHours ? `${manualHours}h` : 'Horas'} Manualmente</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PORTAL PARA DOCUMENT PICTURE-IN-PICTURE (VENTANA FLOTANTE CON EL CONTADOR BLANCO) */}
      {pipWindow &&
        createPortal(
          <div className="w-full h-full bg-[#F4F5F0] p-3 flex flex-col justify-between font-sans select-none">
            <div className="bg-white rounded-2xl p-4 shadow-md border border-stone-200/90 flex-1 flex flex-col justify-between">
              {/* Header de la tarjeta */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isRunning ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                      {selectedProject?.name || 'Proyecto'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                    {selectedProject?.clientName || 'Cliente'} · {currentPhaseName}
                  </span>
                </div>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    isRunning
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-stone-100 text-slate-600 border border-stone-200'
                  }`}
                >
                  {isRunning ? 'En curso' : 'Pausa'}
                </span>
              </div>

              {/* Display Digital con la línea del contador blanco / neutro */}
              <div className="py-3 px-4 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 my-2 text-center">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5 block">
                  Tiempo Transcurrido
                </span>
                <div className={`font-mono text-3xl font-extrabold tracking-tight ${isRunning ? 'text-slate-900' : 'text-slate-800'}`}>
                  {formatTime(displaySeconds)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  ≈ {(Math.max(0, displaySeconds / 3600)).toFixed(2)} hrs decimales
                </span>
              </div>

              {/* Botones de control rápido con estilo original */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                {isRunning ? (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <Pause className="w-3.5 h-3.5 fill-black" /> Pausar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStart}
                    className="flex-1 py-2 bg-[#c6ef4e] hover:bg-[#b4df3b] text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" /> {displaySeconds > 0 ? 'Reanudar' : 'Iniciar'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStopAndSave}
                  disabled={displaySeconds < 5}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs ${
                    displaySeconds >= 5
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-stone-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Guardar horas en Firestore"
                >
                  <Square className="w-3 h-3 fill-current" /> Guardar
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={displaySeconds === 0}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    displaySeconds > 0
                      ? 'bg-white hover:bg-stone-100 text-slate-600 border border-stone-200 shadow-2xs'
                      : 'bg-stone-100 text-slate-300 border border-transparent cursor-not-allowed'
                  }`}
                  title="Reiniciar a cero"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>,
          pipWindow.document.body
        )}
    </aside>
  );
};
