import React, { useState } from 'react';
import { Project, UserSession, UserLeave, getUserAvatarUrl } from '../types';
import {
  User,
  Clock,
  CheckCircle2,
  Briefcase,
  RotateCcw,
  FolderKanban,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Check,
  X,
  Wrench,
  Zap,
  BarChart3,
  Calendar,
  Plane,
  GraduationCap,
  HeartPulse,
  Pencil,
  Trash2,
  HelpCircle,
  FileText,
  Building2,
  ShieldCheck,
  CalendarRange,
  Plus,
  Award,
  Laptop
} from 'lucide-react';
import { EFFECTIVE_MONTHLY_CAPACITY } from '../dashboardUtils';
import { CustomModal } from './CustomModal';

interface MyProfileViewProps {
  currentUser: UserSession;
  projects: Project[];
  onOpenOnboarding?: () => void;
}

const DEFAULT_LEAVES: UserLeave[] = [
  {
    id: 'leave-1',
    motivo: 'Feriado',
    fechaDesde: '2026-06-29',
    fechaHasta: '2026-06-29',
    todoElDia: true,
    horaInicio: '00:00',
    horaFin: '23:59',
  },
  {
    id: 'leave-2',
    motivo: 'Vacaciones',
    fechaDesde: '2026-06-24',
    fechaHasta: '2026-06-26',
    todoElDia: true,
    horaInicio: '00:00',
    horaFin: '23:59',
  },
  {
    id: 'leave-3',
    motivo: 'Vacaciones',
    fechaDesde: '2026-06-04',
    fechaHasta: '2026-06-04',
    todoElDia: true,
    horaInicio: '00:00',
    horaFin: '23:59',
  },
  {
    id: 'leave-4',
    motivo: 'Vacaciones',
    fechaDesde: '2026-04-17',
    fechaHasta: '2026-04-17',
    todoElDia: true,
    horaInicio: '00:00',
    horaFin: '23:59',
  },
  {
    id: 'leave-5',
    motivo: 'Feriado',
    fechaDesde: '2026-04-02',
    fechaHasta: '2026-04-03',
    todoElDia: true,
    horaInicio: '00:00',
    horaFin: '23:59',
  },
  {
    id: 'leave-6',
    motivo: 'Feriado',
    fechaDesde: '2026-04-01',
    fechaHasta: '2026-04-01',
    todoElDia: false,
    horaInicio: '12:00',
    horaFin: '17:00',
  },
];

export const MyProfileView: React.FC<MyProfileViewProps> = ({ currentUser, projects, onOpenOnboarding }) => {
  const [activeTab, setActiveTab] = useState<'generales' | 'empleado' | 'adicionales' | 'vacaciones' | 'integraciones'>('vacaciones');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Custom Avatar State with LocalStorage persistence
  const [customAvatar, setCustomAvatar] = useState<string>(() => {
    return localStorage.getItem(`user_avatar_${currentUser.id}`) || '';
  });
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');

  // Vacaciones y Licencias State with LocalStorage persistence
  const [leaves, setLeaves] = useState<UserLeave[]>(() => {
    const saved = localStorage.getItem(`user_leaves_${currentUser.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default
      }
    }
    return DEFAULT_LEAVES;
  });

  const updateLeaves = (newLeaves: UserLeave[]) => {
    setLeaves(newLeaves);
    localStorage.setItem(`user_leaves_${currentUser.id}`, JSON.stringify(newLeaves));
  };

  // Modal State for Nueva / Editar Licencia
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<UserLeave | null>(null);
  const [formMotivo, setFormMotivo] = useState<string>('Conferencias/Talleres');
  const [formFechaDesde, setFormFechaDesde] = useState<string>('');
  const [formFechaHasta, setFormFechaHasta] = useState<string>('');
  const [formTodoElDia, setFormTodoElDia] = useState<boolean>(true);
  const [formHoraInicio, setFormHoraInicio] = useState<string>('09:00');
  const [formHoraFin, setFormHoraFin] = useState<string>('18:00');

  const displayAvatar = customAvatar || getUserAvatarUrl(currentUser.username);

  // Collect all time entries logged by currentUser across all projects
  const userEntries: Array<{
    id: string;
    projectId: string;
    projectName: string;
    clientName: string;
    hours: number;
    date: string;
    description: string;
    type?: string;
    retrabajoOrigen?: string;
    retrabajoMotivo?: string;
    phaseId?: string;
  }> = [];

  const assignedProjects = projects.filter(p => {
    if (currentUser.role === 'coordinador') return true;
    if (currentUser.role === 'proveedor') {
      const isAssigned = currentUser.proyectosAsignados && currentUser.proyectosAsignados.length > 0
        ? currentUser.proyectosAsignados.includes(p.id)
        : false;
      const isMember = p.members?.some(
        m => m.id === currentUser.id || m.userId === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase()
      );
      return isAssigned || isMember;
    }
    return p.members?.some(m => m.id === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase());
  });

  projects.forEach(p => {
    (p.timeEntries || []).forEach(e => {
      if (e.userId === currentUser.id || e.username?.toLowerCase() === currentUser.username.toLowerCase()) {
        userEntries.push({
          id: e.id,
          projectId: p.id,
          projectName: p.name,
          clientName: p.clientName,
          hours: e.hours || 0,
          date: e.date || new Date().toISOString().split('T')[0],
          description: e.description || '',
          type: e.type || 'normal',
          retrabajoOrigen: e.retrabajoOrigen,
          retrabajoMotivo: e.retrabajoMotivo,
          phaseId: e.phaseId
        });
      }
    });
  });

  // Calculate totals for currentUser
  const totalLoggedHours = userEntries.reduce((sum, e) => sum + e.hours, 0);
  const retrabajoEntries = userEntries.filter(e => e.type === 'retrabajo');
  const totalRetrabajoHours = retrabajoEntries.reduce((sum, e) => sum + e.hours, 0);
  const retrabajoPercentage = totalLoggedHours > 0 ? (totalRetrabajoHours / totalLoggedHours) * 100 : 0;

  const targetCapacity = currentUser.capacidadMensualHoras || EFFECTIVE_MONTHLY_CAPACITY;
  const loadPercentage = Math.min(100, Math.round((totalLoggedHours / targetCapacity) * 100));

  // Derived Skills based on worked projects
  const derivedSkills: string[] = React.useMemo(() => {
    const skillsSet = new Set<string>();

    if (assignedProjects.length > 0) {
      assignedProjects.forEach(p => {
        p.phases.forEach(ph => {
          if (ph.status === 'completed' || ph.status === 'in_progress') {
            const cleanLabel = ph.label.replace(/^Fase\s+\d+:\s*/i, '').trim();
            if (cleanLabel) skillsSet.add(cleanLabel);
          }
        });
      });
    }

    if (skillsSet.size < 3) {
      if (currentUser.role === 'coordinador' || currentUser.puesto?.toLowerCase().includes('coordin')) {
        skillsSet.add('Gestión de Proyectos');
        skillsSet.add('Control de Fases');
        skillsSet.add('QA & Entregables');
        skillsSet.add('Estimación de Horas');
      } else {
        skillsSet.add('Diseño UI/UX');
        skillsSet.add('Desarrollo Web');
        skillsSet.add('Control de Entregables');
        skillsSet.add('Optimización de Tiempos');
      }
    }

    return Array.from(skillsSet);
  }, [assignedProjects, currentUser]);

  // Save Avatar Handler
  const handleSaveAvatar = () => {
    if (tempPhotoUrl.trim()) {
      setCustomAvatar(tempPhotoUrl.trim());
      localStorage.setItem(`user_avatar_${currentUser.id}`, tempPhotoUrl.trim());
    }
    setIsChangingPhoto(false);
    setTempPhotoUrl('');
  };

  const handleResetAvatar = () => {
    setCustomAvatar('');
    localStorage.removeItem(`user_avatar_${currentUser.id}`);
    setIsChangingPhoto(false);
  };

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800',
  ];

  const filteredEntries = userEntries.filter(e => {
    if (filterProject !== 'all' && e.projectId !== filterProject) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  // Handlers for Vacaciones y Licencias Modal
  const handleOpenNewModal = () => {
    setEditingLeave(null);
    setFormMotivo('Conferencias/Talleres');
    const today = new Date().toISOString().split('T')[0];
    setFormFechaDesde(today);
    setFormFechaHasta(today);
    setFormTodoElDia(true);
    setFormHoraInicio('09:00');
    setFormHoraFin('18:00');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (leave: UserLeave) => {
    setEditingLeave(leave);
    setFormMotivo(leave.motivo);
    setFormFechaDesde(leave.fechaDesde);
    setFormFechaHasta(leave.fechaHasta);
    setFormTodoElDia(leave.todoElDia);
    setFormHoraInicio(leave.horaInicio || '09:00');
    setFormHoraFin(leave.horaFin || '18:00');
    setIsModalOpen(true);
  };

  const handleSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFechaDesde || !formFechaHasta) return;

    if (editingLeave) {
      const updated = leaves.map(l => l.id === editingLeave.id ? {
        ...l,
        motivo: formMotivo,
        fechaDesde: formFechaDesde,
        fechaHasta: formFechaHasta,
        todoElDia: formTodoElDia,
        horaInicio: formTodoElDia ? '00:00' : formHoraInicio,
        horaFin: formTodoElDia ? '23:59' : formHoraFin,
      } : l);
      updateLeaves(updated);
    } else {
      const newLeave: UserLeave = {
        id: `leave-${Date.now()}`,
        userId: currentUser.id,
        motivo: formMotivo,
        fechaDesde: formFechaDesde,
        fechaHasta: formFechaHasta,
        todoElDia: formTodoElDia,
        horaInicio: formTodoElDia ? '00:00' : formHoraInicio,
        horaFin: formTodoElDia ? '23:59' : formHoraFin,
      };
      updateLeaves([newLeave, ...leaves]);
    }
    setIsModalOpen(false);
  };

  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);

  const handleDeleteLeave = (id: string) => {
    setLeaveToDelete(id);
  };

  // Helper for formatting date-time range matching Image 1
  const formatLeaveDateRange = (leave: UserLeave) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    };

    const formatTime = (timeStr?: string, isStart?: boolean) => {
      if (leave.todoElDia) {
        return isStart ? '12:00 AM' : '11:59 PM';
      }
      if (!timeStr) return isStart ? '12:00 AM' : '11:59 PM';
      const [h, m] = timeStr.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const formattedH = displayH < 10 ? `0${displayH}` : `${displayH}`;
      const formattedM = m < 10 ? `0${m}` : `${m}`;
      return `${formattedH}:${formattedM} ${period}`;
    };

    const dDesde = formatDate(leave.fechaDesde);
    const dHasta = formatDate(leave.fechaHasta);
    const tInicio = formatTime(leave.horaInicio, true);
    const tFin = formatTime(leave.horaFin, false);

    return `${dDesde} ${tInicio} - ${dHasta} ${tFin}`;
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-[#F4F5F0]" id="my-profile-view">

      {/* SUB-TABS NAVIGATION BAR (WARM CANVAS) */}
      <div className="bg-white px-4 sm:px-8 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('generales')}
          className={`px-4 py-2 text-xs sm:text-sm rounded-full transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'generales'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
          }`}
        >
          Datos generales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('empleado')}
          className={`px-4 py-2 text-xs sm:text-sm rounded-full transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'empleado'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
          }`}
        >
          Datos de empleado
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('adicionales')}
          className={`px-4 py-2 text-xs sm:text-sm rounded-full transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'adicionales'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
          }`}
        >
          Datos adicionales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vacaciones')}
          className={`px-4 py-2 text-xs sm:text-sm rounded-full transition-all cursor-pointer whitespace-nowrap relative ${
            activeTab === 'vacaciones'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
          }`}
        >
          <span>Vacaciones y Licencias</span>
          {leaves.length > 0 && (
            <span className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${
              activeTab === 'vacaciones' ? 'bg-slate-800 text-white' : 'bg-stone-200 text-slate-800'
            }`}>
              {leaves.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('integraciones')}
          className={`px-4 py-2 text-xs sm:text-sm rounded-full transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'integraciones'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
          }`}
        >
          Integraciones
        </button>
      </div>

      <div className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto">

        {/* TAB 1: VACACIONES Y LICENCIAS */}
        {activeTab === 'vacaciones' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Vacaciones y Licencias
                </h2>
                <button
                  type="button"
                  title="Ayuda sobre licencias y permisos"
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-slate-800" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenNewModal}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Licencia</span>
              </button>
            </div>

            {/* List of Leaves */}
            {leaves.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-medium bg-[#F4F5F0] rounded-2xl">
                No tienes licencias o vacaciones registradas. Haz clic en "Agregar Licencia" para registrar una nueva.
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((leave) => {
                  const isVacaciones = leave.motivo.toLowerCase().includes('vacacion');
                  const isFeriado = leave.motivo.toLowerCase().includes('feriado');
                  const isConferencia = leave.motivo.toLowerCase().includes('conferencia') || leave.motivo.toLowerCase().includes('taller');
                  const isMedica = leave.motivo.toLowerCase().includes('médic') || leave.motivo.toLowerCase().includes('salud');

                  return (
                    <div
                      key={leave.id}
                      className="bg-[#F4F5F0] hover:bg-stone-200/70 rounded-2xl p-4 flex items-center justify-between transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                          {isVacaciones ? (
                            <Plane className="w-5 h-5 text-indigo-600" />
                          ) : isFeriado ? (
                            <Calendar className="w-5 h-5 text-amber-600" />
                          ) : isConferencia ? (
                            <GraduationCap className="w-5 h-5 text-sky-600" />
                          ) : isMedica ? (
                            <HeartPulse className="w-5 h-5 text-rose-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-600" />
                          )}
                        </div>

                        <div className="space-y-0.5 truncate">
                          <h4 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                            {leave.motivo}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {formatLeaveDateRange(leave)}
                          </p>
                        </div>
                      </div>

                      {/* Action Icons */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(leave)}
                          title="Editar licencia"
                          className="p-2 text-slate-400 hover:text-slate-800 bg-white hover:bg-stone-100 rounded-full transition-colors cursor-pointer shadow-2xs"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLeave(leave.id)}
                          title="Eliminar licencia"
                          className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-full transition-colors cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DATOS GENERALES (EXISTING HERO, KPIS & HISTORY) */}
        {activeTab === 'generales' && (
          <div className="space-y-8 animate-in fade-in">
            {/* HERO PROFILE & PROYECTOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

              {/* LEFT COLUMN: PHOTO CARD */}
              <div className="lg:col-span-5 relative rounded-3xl overflow-hidden shadow-xs bg-white min-h-[520px] flex flex-col justify-between group">

                {/* Top Floating Actions */}
                <div className="relative z-20 p-5 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-slate-800 text-xs font-semibold uppercase tracking-wider shadow-xs">
                    <User className="w-3.5 h-3.5 text-slate-800" />
                    <span>{currentUser.puesto || currentUser.role}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenOnboarding && (
                      <button
                        onClick={onOpenOnboarding}
                        className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Configurar preferencias de perfil"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>Onboarding / Preferencias</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsChangingPhoto(!isChangingPhoto)}
                      className="px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Cambiar foto de perfil"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                      <span>{isChangingPhoto ? 'Cerrar' : 'Cambiar Foto'}</span>
                    </button>
                  </div>
                </div>

                {/* Change Photo Drawer */}
                {isChangingPhoto && (
                  <div className="absolute inset-x-4 top-16 z-30 bg-white/95 backdrop-blur-xs p-5 rounded-3xl shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                        Cambiar Foto de Perfil
                      </span>
                      <button
                        onClick={() => setIsChangingPhoto(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-stone-100"
                      >
                        <X className="w-4 h-4 text-slate-800" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        URL de Imagen Personalizada
                      </label>
                      <input
                        type="url"
                        value={tempPhotoUrl}
                        onChange={(e) => setTempPhotoUrl(e.target.value)}
                        placeholder="https://ejemplo.com/mi-foto.jpg"
                        className="w-full bg-[#F4F5F0] rounded-2xl px-4 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        O Selecciona una Foto Preestablecida
                      </span>
                      <div className="flex items-center gap-2 pt-1">
                        {presetAvatars.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setTempPhotoUrl(url)}
                            className="w-10 h-10 rounded-full overflow-hidden border-2 border-stone-200 hover:border-indigo-500 transition-all shrink-0 cursor-pointer shadow-2xs"
                          >
                            <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <button
                        onClick={handleResetAvatar}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Restaurar Original
                      </button>
                      <button
                        onClick={handleSaveAvatar}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Guardar Foto
                      </button>
                    </div>
                  </div>
                )}

                {/* Clean Portrait Image */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={displayAvatar}
                    alt={currentUser.username}
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Floating Summary Card */}
                <div className="relative z-10 m-4 p-5 rounded-2xl bg-white/95 backdrop-blur-xs shadow-xs space-y-3 text-slate-800">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 tracking-tight capitalize leading-tight">
                        {currentUser.username}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium capitalize">
                        {currentUser.puesto || currentUser.role}
                      </p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full">
                      • Activo
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-800" /> Horas del Mes
                      </span>
                      <span className="font-mono text-slate-900 font-semibold text-xs">
                        {totalLoggedHours}h / {targetCapacity}h ({loadPercentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#F4F5F0] rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          loadPercentage > 100 ? 'bg-rose-500' : loadPercentage > 85 ? 'bg-amber-500' : 'bg-slate-900'
                        }`}
                        style={{ width: `${Math.min(100, loadPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      <Wrench className="w-3 h-3 text-slate-800" /> Habilidades por Proyectos
                    </span>
                    <div className="flex items-center gap-1.5 whitespace-nowrap overflow-x-auto scrollbar-none py-1">
                      {derivedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1 rounded-full bg-[#F4F5F0] text-xs font-medium text-slate-700 shrink-0"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: MAIN KPI CARDS & PROYECTOS ASIGNADOS */}
              <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">

                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Métricas Clave de Desempeño
                      </h3>
                      <p className="text-base font-semibold text-slate-900 tracking-tight">
                        Resumen Mensual de Mi Trabajo
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 bg-stone-100 text-slate-800 rounded-full text-xs font-semibold">
                      {currentUser.username}
                    </span>
                  </div>

                  {currentUser.role === 'proveedor' && (
                    <div className="p-4 bg-stone-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-slate-900 text-white font-semibold text-xs uppercase rounded-full tracking-wider">
                            Proveedor Externo
                          </span>
                          {currentUser.empresaProveedor && (
                            <span className="text-xs font-semibold text-slate-800">
                              {currentUser.empresaProveedor}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-normal">
                          Tarifa acordada por hora: <strong className="font-mono text-slate-900">${currentUser.tarifaHoraProveedor || 0} USD/h</strong>
                        </p>
                      </div>

                      <div className="bg-white px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Facturable Acumulado</div>
                          <div className="text-xl font-mono font-semibold font-display text-slate-900">
                            ${((currentUser.tarifaHoraProveedor || 0) * totalLoggedHours).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Horas Registradas</span>
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-3xl font-semibold font-display text-white">{totalLoggedHours}h</div>
                      <div className="text-xs text-slate-400 font-normal">
                        {loadPercentage}% de la meta ({targetCapacity}h)
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl space-y-1.5 shadow-xs ${
                      retrabajoPercentage > 15
                        ? 'bg-rose-50 text-rose-900'
                        : retrabajoPercentage > 5
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-stone-100 text-slate-900'
                    }`}>
                      <div className="flex items-center justify-between opacity-80">
                        <span className="text-xs font-semibold uppercase tracking-wider">Retrabajo Imputado</span>
                        <RotateCcw className="w-4 h-4 text-slate-800" />
                      </div>
                      <div className="text-3xl font-semibold font-display text-slate-900">{totalRetrabajoHours}h</div>
                      <div className="text-xs font-medium text-slate-600">
                        {retrabajoPercentage.toFixed(1)}% de tus horas registradas
                      </div>
                    </div>

                    <div className="bg-stone-100 p-4 rounded-2xl text-slate-900 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-slate-800">
                        <span className="text-xs font-semibold uppercase tracking-wider">Proyectos Activos</span>
                        <Briefcase className="w-4 h-4 text-slate-800" />
                      </div>
                      <div className="text-3xl font-semibold font-display text-slate-900">{assignedProjects.length}</div>
                      <div className="text-xs text-slate-600 font-normal">
                        Asignaciones activas
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROYECTOS ASIGNADOS DETALLADOS */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs space-y-4 flex-1">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-5 h-5 text-slate-800" />
                      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Proyectos Asignados ({assignedProjects.length})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      Carga de horas por proyecto
                    </span>
                  </div>

                  {assignedProjects.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 italic bg-[#F4F5F0] rounded-2xl">
                      No tienes proyectos asignados actualmente en tu perfil.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                      {assignedProjects.map(p => {
                        const myProjEntries = userEntries.filter(e => e.projectId === p.id);
                        const myProjHours = myProjEntries.reduce((s, e) => s + e.hours, 0);
                        const myRetrabajoHours = myProjEntries.filter(e => e.type === 'retrabajo').reduce((s, e) => s + e.hours, 0);
                        const currentPhase = p.phases.find(ph => ph.status === 'in_progress') || p.phases[0];

                        const completedPhases = p.phases.filter(ph => ph.status === 'completed').length;
                        const phaseProgress = Math.round((completedPhases / (p.phases.length || 1)) * 100);

                        return (
                          <div
                            key={p.id}
                            className="p-4 rounded-2xl bg-[#F4F5F0] hover:bg-stone-200/70 transition-all space-y-3 shadow-2xs group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                              <div className="space-y-0.5">
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                                  {p.name}
                                </h4>
                                <p className="text-xs text-slate-500 font-normal">
                                  Cliente: <strong className="text-slate-700">{p.clientName}</strong>
                                </p>
                              </div>

                              {currentPhase && (
                                <span className="px-3 py-1 rounded-full bg-white text-slate-800 text-xs font-semibold self-start sm:self-auto shadow-2xs">
                                  • Fase: {currentPhase.label}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-white p-3 rounded-2xl text-center shadow-2xs">
                                <span className="text-xs font-semibold text-slate-400 uppercase block">Mis Horas</span>
                                <span className="text-base font-semibold font-display text-slate-900">{myProjHours}h</span>
                              </div>

                              <div className="bg-white p-3 rounded-2xl text-center shadow-2xs">
                                <span className="text-xs font-semibold text-slate-400 uppercase block">Mi Retrabajo</span>
                                <span className="text-base font-semibold font-display text-slate-900">
                                  {myRetrabajoHours}h
                                </span>
                              </div>

                              <div className="bg-white p-3 rounded-2xl text-center shadow-2xs">
                                <span className="text-xs font-semibold text-slate-400 uppercase block">Avance Fases</span>
                                <span className="text-base font-semibold font-display text-slate-900">{phaseProgress}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* HISTORIAL DETALLADO DE REGISTROS DE HORAS IMPUTADAS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-800" /> Historial de Horas Imputadas ({filteredEntries.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">Listado cronológico de tus registros de tiempo en todos tus proyectos</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="px-3.5 py-2 bg-[#F4F5F0] rounded-full text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">Todos los proyectos</option>
                    {assignedProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3.5 py-2 bg-[#F4F5F0] rounded-full text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="normal">Normal</option>
                    <option value="retrabajo">Retrabajo</option>
                    <option value="no_facturable">No Facturable</option>
                  </select>
                </div>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium bg-[#F4F5F0] rounded-2xl">
                  No hay registros de horas guardados con los filtros seleccionados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-[#F4F5F0]">
                        <th className="py-3 px-4 rounded-l-2xl">Fecha</th>
                        <th className="py-3 px-4">Proyecto</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Descripción / Motivo</th>
                        <th className="py-3 px-4 text-right rounded-r-2xl">Horas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-[#F4F5F0]/60 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500 text-xs whitespace-nowrap">
                            {entry.date}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            {entry.projectName}
                            <span className="block text-xs font-normal text-slate-400">{entry.clientName}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {entry.type === 'retrabajo' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-xs">
                                ⚠️ Retrabajo ({entry.retrabajoOrigen || 'cliente'})
                              </span>
                            ) : entry.type === 'no_facturable' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F4F5F0] text-slate-700 font-medium text-xs">
                                No Facturable
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium text-xs">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-normal max-w-md">
                            {entry.description}
                            {entry.retrabajoMotivo && entry.retrabajoMotivo !== entry.description && (
                              <span className="block text-xs text-amber-700 font-semibold italic mt-0.5">
                                Motivo: {entry.retrabajoMotivo}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 text-sm whitespace-nowrap">
                            {entry.hours}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DATOS DE EMPLEADO */}
        {activeTab === 'empleado' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-800" /> Información Contractual y de Empleado
              </h3>
              <p className="text-xs text-slate-500 font-normal">Parámetros operativos de tu perfil profesional en el Hub</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre de Usuario</span>
                  <p className="text-sm font-semibold text-slate-800 capitalize">{currentUser.username}</p>
                </div>

                <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Puesto / Cargo</span>
                  <p className="text-sm font-semibold text-slate-800">{currentUser.puesto || currentUser.role}</p>
                </div>

                <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol de Sistema</span>
                  <p className="text-sm font-semibold text-slate-800 uppercase tracking-wider">{currentUser.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacidad Mensual</span>
                  <p className="text-sm font-semibold text-slate-800">{currentUser.capacidadMensualHoras || EFFECTIVE_MONTHLY_CAPACITY} horas / mes</p>
                </div>

                {currentUser.role === 'proveedor' && (
                  <>
                    <div className="bg-stone-100 p-4 rounded-2xl space-y-1">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tarifa por Hora</span>
                      <p className="text-sm font-semibold text-slate-900">${currentUser.tarifaHoraProveedor || 0} USD/h</p>
                    </div>

                    <div className="bg-stone-100 p-4 rounded-2xl space-y-1">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Empresa / Agencia</span>
                      <p className="text-sm font-semibold text-slate-800">{currentUser.empresaProveedor || 'No especificada'}</p>
                    </div>
                  </>
                )}

                <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado de Cuenta</span>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full">
                    Activo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATOS ADICIONALES */}
        {activeTab === 'adicionales' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Habilidades y Preferencias Personalizadas
              </h3>
              <p className="text-xs text-slate-500">Configuración avanzada de tu perfil de usuario</p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Habilidades Activas
                </span>
                <div className="flex flex-wrap gap-2">
                  {derivedSkills.map((skill, idx) => (
                    <span key={idx} className="px-3.5 py-1.5 bg-white rounded-full text-xs font-bold text-slate-700 shadow-2xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#F4F5F0] p-4 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Preferencias de Notificación
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Notificaciones automáticas por correo para alertas de entregables, asignación de nuevas fases y vencimiento de hitos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INTEGRACIONES */}
        {activeTab === 'integraciones' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Laptop className="w-5 h-5 text-sky-600" /> Conexiones e Integraciones Externas
              </h3>
              <p className="text-xs text-slate-500">Vincula tu calendario y servicios de colaboración</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#F4F5F0] flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Google Calendar</h4>
                  <p className="text-xs text-slate-500">Sincroniza tus vacaciones y licencias registradas.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">Conectado</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#F4F5F0] flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Google Drive</h4>
                  <p className="text-xs text-slate-500">Acceso a entregables y carpetas de proyecto.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">Conectado</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: NUEVA LICENCIA / EDITAR LICENCIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingLeave ? 'Editar licencia' : 'Nueva licencia'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveLeave} className="p-6 space-y-5">
              {/* Field 1: MOTIVO */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  MOTIVO
                </label>
                <div className="relative">
                  <select
                    value={formMotivo}
                    onChange={(e) => setFormMotivo(e.target.value)}
                    className="w-full bg-[#F4F5F0] rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="Conferencias/Talleres">🎓 Conferencias/Talleres</option>
                    <option value="Vacaciones">✈️ Vacaciones</option>
                    <option value="Feriado">📅 Feriado</option>
                    <option value="Licencia Médica">🏥 Licencia Médica</option>
                    <option value="Permiso Personal">👤 Permiso Personal</option>
                    <option value="Otro">📝 Otro</option>
                  </select>
                  <span className="absolute right-4 top-3 text-slate-400 pointer-events-none text-xs">▼</span>
                </div>
              </div>

              {/* Field 2: DESDE & HASTA (2 Cols) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    DESDE
                  </label>
                  <input
                    type="date"
                    value={formFechaDesde}
                    onChange={(e) => setFormFechaDesde(e.target.value)}
                    className="w-full bg-[#F4F5F0] rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    HASTA
                  </label>
                  <input
                    type="date"
                    value={formFechaHasta}
                    onChange={(e) => setFormFechaHasta(e.target.value)}
                    className="w-full bg-[#F4F5F0] rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Switch: Todo el día */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formTodoElDia}
                  onClick={() => setFormTodoElDia(!formTodoElDia)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formTodoElDia ? 'bg-sky-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formTodoElDia ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs font-medium text-slate-700 select-none">
                  Todo el día
                </span>
              </div>

              {/* Field 3: INICIO & FIN (Time inputs) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    INICIO
                  </label>
                  <input
                    type="time"
                    value={formHoraInicio}
                    onChange={(e) => setFormHoraInicio(e.target.value)}
                    disabled={formTodoElDia}
                    className={`w-full rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      formTodoElDia ? 'bg-stone-200 text-slate-400 cursor-not-allowed' : 'bg-[#F4F5F0]'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    FIN
                  </label>
                  <input
                    type="time"
                    value={formHoraFin}
                    onChange={(e) => setFormHoraFin(e.target.value)}
                    disabled={formTodoElDia}
                    className={`w-full rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      formTodoElDia ? 'bg-stone-200 text-slate-400 cursor-not-allowed' : 'bg-[#F4F5F0]'
                    }`}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-[#F4F5F0] hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-full transition-colors cursor-pointer shadow-xs"
                >
                  {editingLeave ? 'Guardar Cambios' : 'Agregar Licencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminación Licencia */}
      <CustomModal
        isOpen={!!leaveToDelete}
        onClose={() => setLeaveToDelete(null)}
        type="danger"
        isDestructive={true}
        title="¿Eliminar registro de licencia o vacación?"
        description="Esta acción eliminará permanentemente este registro del calendario. No se puede deshacer."
        confirmLabel="Eliminar registro"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (leaveToDelete) {
            updateLeaves(leaves.filter(l => l.id !== leaveToDelete));
            setLeaveToDelete(null);
          }
        }}
      />
    </div>
  );
};
