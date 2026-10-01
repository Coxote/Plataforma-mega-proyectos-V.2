import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, UserSession, TimeEntryType } from '../types';
import { saveCompletedTimeEntryToFirestore } from '../services/firebaseDb';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  FolderKanban,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Layers,
  AlertTriangle,
  FileText,
  Zap,
  Calendar,
  Send,
  Plus
} from 'lucide-react';

interface MiniWidgetStandaloneProps {
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

export const MiniWidgetStandalone: React.FC<MiniWidgetStandaloneProps> = ({
  projects,
  currentUser,
  onLogTime
}) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'manual'>('timer');

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedProjectId) return parsed.selectedProjectId;
      }
    } catch {}
    return projects[0]?.id || '';
  });

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const availablePhases = useMemo(() => {
    return selectedProject?.phases || [];
  }, [selectedProject]);

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedPhaseId) return parsed.selectedPhaseId;
      }
    } catch {}
    return availablePhases[0]?.id || 'A1';
  });

  const [description, setDescription] = useState<string>('');
  const [entryType, setEntryType] = useState<TimeEntryType>('normal');
  const [retrabajoOrigen, setRetrabajoOrigen] = useState<'cliente' | 'interno' | 'proveedor'>('cliente');
  const [retrabajoMotivo, setRetrabajoMotivo] = useState<string>('');

  // Estados del cronómetro
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [displaySeconds, setDisplaySeconds] = useState<number>(0);

  // Estados del modo manual
  const [manualHours, setManualHours] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });

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
        if (data.selectedProjectId) setSelectedProjectId(data.selectedProjectId);
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
    } catch {}
  }, []);

  // Guardar estado en localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        isCollapsed: false,
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

  // Timer Tick Interval y Actualización del Título de la Ventana (Para ver el tiempo en la barra de tareas)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && startedAt) {
      interval = setInterval(() => {
        const currentElapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        const total = accumulatedSeconds + currentElapsed;
        setDisplaySeconds(total);
        document.title = `⏱️ ${formatTime(total)} · ${selectedProject?.name || 'MegaPR'}`;
      }, 1000);
    } else {
      setDisplaySeconds(accumulatedSeconds);
      if (accumulatedSeconds > 0) {
        document.title = `❚❚ ${formatTime(accumulatedSeconds)} (Pausa) · ${selectedProject?.name || 'MegaPR'}`;
      } else {
        document.title = `MegaPR · Medidor de Horas`;
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startedAt, accumulatedSeconds, selectedProject]);

  const handleStart = () => {
    const now = Date.now();
    setStartedAt(now);
    setIsRunning(true);
  };

  const handlePause = () => {
    if (isRunning && startedAt) {
      const additional = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const total = accumulatedSeconds + additional;
      setAccumulatedSeconds(total);
      setDisplaySeconds(total);
      setIsRunning(false);
      setStartedAt(null);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartedAt(null);
    setAccumulatedSeconds(0);
    setDisplaySeconds(0);
  };

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopAndSave = () => {
    let finalSeconds = accumulatedSeconds;
    if (isRunning && startedAt) {
      finalSeconds += Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    }

    if (finalSeconds < 5) {
      alert('El tiempo registrado debe ser mayor a 5 segundos para poder guardarse.');
      return;
    }

    const decimalHours = Math.max(0.05, Math.round((finalSeconds / 3600) * 100) / 100);
    const finalDesc = description.trim() || `Sesión de trabajo (${formatTime(finalSeconds)})`;
    const finalMotivo = retrabajoMotivo.trim() || finalDesc;

    saveCompletedTimeEntryToFirestore({
      projectId: selectedProjectId,
      phaseId: selectedPhaseId || availablePhases[0]?.id || 'A1',
      hours: decimalHours,
      description: finalDesc,
      type: entryType,
      retrabajoOrigen: entryType === 'retrabajo' ? retrabajoOrigen : undefined,
      retrabajoMotivo: entryType === 'retrabajo' ? finalMotivo : undefined,
      currentUser
    }).catch((err) => console.warn('Firestore sync note:', err));

    onLogTime(
      selectedProjectId,
      selectedPhaseId || availablePhases[0]?.id || 'A1',
      decimalHours,
      finalDesc,
      entryType,
      entryType === 'retrabajo' ? retrabajoOrigen : undefined,
      entryType === 'retrabajo' ? finalMotivo : undefined
    );

    setSuccessToast({
      show: true,
      message: `¡${decimalHours}h guardadas en Firestore para ${selectedProject?.name}!`
    });

    handleReset();
    setDescription('');
    setRetrabajoMotivo('');

    setTimeout(() => {
      setSuccessToast({ show: false, message: '' });
    }, 3500);
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(manualHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Ingresa una cantidad válida de horas.');
      return;
    }

    const finalDesc = description.trim() || `Carga manual de horas`;
    const finalMotivo = retrabajoMotivo.trim() || finalDesc;

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
    }).catch((err) => console.warn('Firestore sync note:', err));

    onLogTime(
      selectedProjectId,
      selectedPhaseId || availablePhases[0]?.id || 'A1',
      hoursNum,
      finalDesc,
      entryType,
      entryType === 'retrabajo' ? retrabajoOrigen : undefined,
      entryType === 'retrabajo' ? finalMotivo : undefined
    );

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

  return (
    <div className="w-screen h-screen bg-[#F4F5F0] flex items-center justify-center p-3 select-none font-sans overflow-y-auto">
      {/* TARJETA BLANCA IDÉNTICA AL WIDGET DE LA PLATAFORMA */}
      <div className="w-full max-w-[390px] bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col">
        {/* HEADER OSCURO ELEGANTE */}
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
                <h2 className="text-xs font-bold text-white tracking-wide uppercase">Medidor de Horas</h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-semibold border border-emerald-500/30">
                  <Cloud className="w-2.5 h-2.5" /> Firestore
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Ventana Flotante de Escritorio</p>
            </div>
          </div>

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
        </div>

        {/* TOAST DE ÉXITO */}
        {successToast.show && (
          <div className="bg-emerald-50 text-emerald-800 px-4 py-2.5 border-b border-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{successToast.message}</span>
          </div>
        )}

        {/* CUERPO DEL CONTADOR BLANCO */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
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
                {projects.map((p) => (
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
                className="w-full pl-9 pr-8 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs font-semibold text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer appearance-none"
              >
                {availablePhases.map((phase, idx) => (
                  <option key={phase.id} value={phase.id}>
                    Fase {idx + 1}: {phase.label || (phase as any).title || phase.id} ({phase.status === 'completed' ? 'Completada' : 'En progreso'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* PESTAÑA 1: CRONÓMETRO EN VIVO */}
          {activeTab === 'timer' && (
            <div className="space-y-3.5 pt-1">
              {/* DISPLAY DIGITAL GRANDE (LÍNEA DEL CONTADOR BLANCO / NEUTRO) */}
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

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={displaySeconds === 0}
                    className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                      displaySeconds > 0
                        ? 'bg-white text-slate-700 hover:bg-stone-100 border border-stone-200 shadow-2xs'
                        : 'bg-stone-100 text-slate-400 border border-transparent cursor-not-allowed opacity-40'
                    }`}
                    title="Reiniciar cronómetro"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TIPO DE TIEMPO & RETRABAJO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Clasificación
                  </span>
                  <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200/60">
                    <button
                      type="button"
                      onClick={() => setEntryType('normal')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        entryType === 'normal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryType('retrabajo')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        entryType === 'retrabajo' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Retrabajo
                    </button>
                  </div>
                </div>

                {/* CAMPO DE DESCRIPCIÓN */}
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción de la tarea ejecutada..."
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* MOTIVO DE RETRABAJO SI APLICA */}
                {entryType === 'retrabajo' && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Origen del Retrabajo</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {(['cliente', 'interno', 'proveedor'] as const).map((orig) => (
                        <button
                          key={orig}
                          type="button"
                          onClick={() => setRetrabajoOrigen(orig)}
                          className={`py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer capitalize ${
                            retrabajoOrigen === orig
                              ? 'bg-amber-500 text-black shadow-2xs'
                              : 'bg-white text-amber-900 border border-amber-200/60'
                          }`}
                        >
                          {orig}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={retrabajoMotivo}
                      onChange={(e) => setRetrabajoMotivo(e.target.value)}
                      placeholder="Motivo puntual del ajuste o cambio..."
                      className="w-full px-2.5 py-1.5 bg-white text-xs text-amber-900 rounded-xl border border-amber-300 focus:outline-hidden placeholder:text-amber-400"
                    />
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
          )}

          {/* PESTAÑA 2: CARGA MANUAL DE HORAS */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSaveManual} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Horas a Imputar</span>
                  <span className="text-[10px] text-slate-400">Ej: 1.5 = 1h 30m</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-sm font-bold text-slate-900 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all"
                    required
                  />
                </div>

                {/* Chips rápidos */}
                <div className="flex items-center gap-1.5 mt-2">
                  {['0.25', '0.5', '1', '2', '4'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setManualHours(chip)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                        manualHours === chip
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-600 border-stone-200/80 hover:bg-stone-100'
                      }`}
                    >
                      +{chip}h
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Fecha de Ejecución
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs font-semibold text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Descripción del Trabajo
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalle de actividades realizadas..."
                  className="w-full px-3 py-2 bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs text-slate-800 rounded-2xl border border-stone-200/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>

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
    </div>
  );
};
