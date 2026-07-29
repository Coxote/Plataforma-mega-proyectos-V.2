import React, { useState } from 'react';
import { Project, UserSession, getUserAvatarUrl } from '../types';
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
  BarChart3
} from 'lucide-react';
import { EFFECTIVE_MONTHLY_CAPACITY } from '../dashboardUtils';

interface MyProfileViewProps {
  currentUser: UserSession;
  projects: Project[];
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({ currentUser, projects }) => {
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Custom Avatar State with LocalStorage persistence
  const [customAvatar, setCustomAvatar] = useState<string>(() => {
    return localStorage.getItem(`user_avatar_${currentUser.id}`) || '';
  });
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');

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

  const assignedProjects = projects.filter(p => 
    currentUser.role === 'coordinador' || p.members?.some(m => m.id === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase())
  );

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

  // Automatically derive Skills / Habilidades based on worked projects and phases
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

    // Default fallbacks based on role if project phases are few
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

  // Preset Avatar options
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800',
  ];

  // Filter userEntries for history table
  const filteredEntries = userEntries.filter(e => {
    if (filterProject !== 'all' && e.projectId !== filterProject) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-50/80" id="my-profile-view">
      
      {/* SECTION 1: ASYMMETRIC USER PROFILE HERO (CLEAN PHOTO CARD LEFT + SUMMARY & PROJECTS RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: CLEAN PHOTO CARD WITH NO OVERLAY COVERING FACE (4 cols on lg) */}
        <div className="lg:col-span-5 relative rounded-[32px] overflow-hidden shadow-lg border border-slate-200/90 bg-teal-50/20 min-h-[520px] flex flex-col justify-between group">
          
          {/* Top Floating Actions: Change Photo Trigger & Active Badge */}
          <div className="relative z-20 p-5 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-800 text-xs font-black uppercase tracking-wider shadow-xs">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>{currentUser.puesto || currentUser.role}</span>
            </div>

            <button
              onClick={() => setIsChangingPhoto(!isChangingPhoto)}
              className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white font-extrabold text-[11px] backdrop-blur-md shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5 text-lime-400" />
              <span>{isChangingPhoto ? 'Cerrar' : 'Cambiar Foto'}</span>
            </button>
          </div>

          {/* Change Photo Modal / Form Drawer */}
          {isChangingPhoto && (
            <div className="absolute inset-x-4 top-16 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Cambiar Foto de Perfil
                </span>
                <button
                  onClick={() => setIsChangingPhoto(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  URL de Imagen Personalizada
                </label>
                <input
                  type="url"
                  value={tempPhotoUrl}
                  onChange={(e) => setTempPhotoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/mi-foto.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  O Selecciona una Foto Preestablecida
                </span>
                <div className="flex items-center gap-2 pt-1">
                  {presetAvatars.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setTempPhotoUrl(url)}
                      className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all shrink-0 cursor-pointer"
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={handleResetAvatar}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Restaurar Original
                </button>
                <button
                  onClick={handleSaveAvatar}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5" /> Guardar Foto
                </button>
              </div>
            </div>
          )}

          {/* Clean Portrait Image - Exactly like Reference Photo (100% visible, no color tint) */}
          <div className="absolute inset-0 z-0">
            <img
              src={displayAvatar}
              alt={currentUser.username}
              className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Floating Glassmorphic Summary Card at the Bottom (Minimalist: Horas del Mes & Habilidades en una sola línea) */}
          <div className="relative z-10 m-4 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-xl space-y-3 text-slate-800">
            
            {/* User Name */}
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight capitalize leading-tight">
                  {currentUser.username}
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold capitalize">
                  {currentUser.puesto || currentUser.role}
                </p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                • Activo
              </span>
            </div>

            {/* MINIMALIST METRIC 1: HORAS DEL MES */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Horas del Mes
                </span>
                <span className="font-mono text-slate-900 font-extrabold text-xs">
                  {totalLoggedHours}h / {targetCapacity}h ({loadPercentage}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    loadPercentage > 100 ? 'bg-rose-500' : loadPercentage > 85 ? 'bg-amber-500' : 'bg-lime-500'
                  }`}
                  style={{ width: `${Math.min(100, loadPercentage)}%` }}
                />
              </div>
            </div>

            {/* MINIMALIST METRIC 2: HABILIDADES (EN UNA SOLA LÍNEA, DETERMINADAS POR PROYECTOS) */}
            <div className="space-y-1 pt-1">
              <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Wrench className="w-3 h-3 text-amber-500" /> Habilidades por Proyectos
              </span>

              {/* Single Line Scrollable Chips Container */}
              <div className="flex items-center gap-1.5 whitespace-nowrap overflow-x-auto scrollbar-none py-1">
                {derivedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 shrink-0"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: MAIN KPI CARDS & PROYECTOS ASIGNADOS (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          
          {/* TOP 3 HIGHLIGHT METRICS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Métricas Clave de Desempeño
                </h3>
                <p className="text-base font-black text-slate-900 tracking-tight">
                  Resumen Mensual de Mi Trabajo
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
                {currentUser.username}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Horas Registradas */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Horas Registradas</span>
                  <Clock className="w-4 h-4 text-lime-400" />
                </div>
                <div className="text-2xl font-black text-white">{totalLoggedHours}h</div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {loadPercentage}% de la meta ({targetCapacity}h)
                </div>
              </div>

              {/* Metric 2: Retrabajo Personal */}
              <div className={`p-4 rounded-2xl border space-y-1.5 shadow-xs ${
                retrabajoPercentage > 15
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : retrabajoPercentage > 5
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center justify-between opacity-80">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Retrabajo Imputado</span>
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black">{totalRetrabajoHours}h</div>
                <div className="text-[10px] font-extrabold">
                  {retrabajoPercentage.toFixed(1)}% de tus horas registradas
                </div>
              </div>

              {/* Metric 3: Proyectos Activos */}
              <div className="bg-indigo-50 border border-indigo-200/80 p-4 rounded-2xl text-indigo-950 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-indigo-600">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Proyectos Activos</span>
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-900">{assignedProjects.length}</div>
                <div className="text-[10px] text-indigo-700 font-medium">
                  Asignaciones activas
                </div>
              </div>
            </div>
          </div>

          {/* MAIN SECTION: PROYECTOS ASIGNADOS DETALLADOS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Proyectos Asignados ({assignedProjects.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-bold">
                Carga de horas por proyecto
              </span>
            </div>

            {assignedProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
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
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-3 shadow-2xs group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {p.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Cliente: <strong className="text-slate-700">{p.clientName}</strong>
                          </p>
                        </div>

                        {currentPhase && (
                          <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold self-start sm:self-auto">
                            • Fase: {currentPhase.label}
                          </span>
                        )}
                      </div>

                      {/* Project Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Mis Horas</span>
                          <span className="text-sm font-black text-slate-900">{myProjHours}h</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Mi Retrabajo</span>
                          <span className={`text-sm font-black ${myRetrabajoHours > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {myRetrabajoHours}h
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Avance Fases</span>
                          <span className="text-sm font-black text-indigo-700">{phaseProgress}%</span>
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

      {/* SECTION 2: HISTORIAL DETALLADO DE REGISTROS DE HORAS IMPUTADAS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-lime-600" /> Historial de Horas Imputadas ({filteredEntries.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Listado cronológico de tus registros de tiempo en todos tus proyectos</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por Proyecto */}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">Todos los proyectos</option>
              {assignedProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Filtro por Tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">Todos los tipos</option>
              <option value="normal">Normal</option>
              <option value="retrabajo">Retrabajo</option>
              <option value="no_facturable">No Facturable</option>
            </select>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            No hay registros de horas guardados con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Proyecto</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Descripción / Motivo</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {entry.projectName}
                      <span className="block text-[10px] font-normal text-slate-400">{entry.clientName}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {entry.type === 'retrabajo' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                          ⚠️ Retrabajo ({entry.retrabajoOrigen || 'cliente'})
                        </span>
                      ) : entry.type === 'no_facturable' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          No Facturable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium max-w-md">
                      {entry.description}
                      {entry.retrabajoMotivo && entry.retrabajoMotivo !== entry.description && (
                        <span className="block text-[10px] text-amber-700 font-semibold italic mt-0.5">
                          Motivo: {entry.retrabajoMotivo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm whitespace-nowrap">
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
  );
};
