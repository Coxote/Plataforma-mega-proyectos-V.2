import React, { useState, useMemo } from 'react';
import { Project, UserSession, getUserAvatarUrl, ROLE_LABELS } from '../types';
import {
  Trophy,
  Medal,
  Clock,
  FolderKanban,
  ShieldCheck,
  Zap,
  Heart,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import {
  LeaderboardCategory,
  TimeFilterPeriod,
  UserGamificationStats,
  calculateAllUserGamificationStats,
  getSortedLeaderboard,
  sendKudoToUser
} from '../utils/gamification';
import { subscribeKudos } from '../services/firebaseDb';

interface GamificationViewProps {
  projects: Project[];
  users: UserSession[];
  currentUser: UserSession;
  onSelectProject?: (projectId: string) => void;
  onNavigateToView?: (view: any) => void;
}

export const GamificationView: React.FC<GamificationViewProps> = ({
  projects,
  users,
  currentUser,
}) => {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('xp');
  const [period, setPeriod] = useState<TimeFilterPeriod>('month');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserGamificationStats | null>(null);
  const [kudosFeedback, setKudosFeedback] = useState<{ userId: string; message: string } | null>(null);
  const [liveKudosMap, setLiveKudosMap] = useState<Record<string, { count: number; users: string[] }>>({});

  // Sincronización en tiempo real de reconocimientos / kudos en la nube
  React.useEffect(() => {
    const unsub = subscribeKudos((map) => {
      setLiveKudosMap(map);
    });
    return () => unsub();
  }, []);

  // 1. Calcular métricas completas de gamificación con kudos en vivo
  const allUserStats = useMemo(() => {
    return calculateAllUserGamificationStats(users, projects, period, liveKudosMap);
  }, [users, projects, period, liveKudosMap]);

  // 2. Filtrar por rol si aplica
  const filteredUserStats = useMemo(() => {
    if (selectedRole === 'all') return allUserStats;
    return allUserStats.filter((u) => u.role === selectedRole);
  }, [allUserStats, selectedRole]);

  // 3. Ordenar ranking para la categoría activa
  const sortedLeaderboard = useMemo(() => {
    return getSortedLeaderboard(filteredUserStats, activeCategory);
  }, [filteredUserStats, activeCategory]);

  // Identificar usuario actual en el ranking
  const currentUserStats = useMemo(() => {
    return allUserStats.find(
      (u) =>
        u.userId === currentUser.id ||
        u.username.toLowerCase() === currentUser.username.toLowerCase()
    );
  }, [allUserStats, currentUser]);

  // Primeros tres para el podio sobrio
  const firstPlace = sortedLeaderboard[0];
  const secondPlace = sortedLeaderboard[1];
  const thirdPlace = sortedLeaderboard[2];

  // Lista visible: Primeros 5 (Top 5) o todos si está desplegado
  const visibleUsers = useMemo(() => {
    return isExpanded ? sortedLeaderboard : sortedLeaderboard.slice(0, 5);
  }, [sortedLeaderboard, isExpanded]);

  // Acción de Kudos
  const handleGiveKudo = (targetUser: UserGamificationStats) => {
    if (targetUser.userId === currentUser.id) {
      setKudosFeedback({
        userId: targetUser.userId,
        message: 'No puedes otorgarte un reconocimiento a ti mismo.',
      });
      setTimeout(() => setKudosFeedback(null), 3000);
      return;
    }

    const res = sendKudoToUser(targetUser.userId, currentUser.username);
    if (res.success) {
      setKudosFeedback({
        userId: targetUser.userId,
        message: `¡Reconocimiento enviado a ${targetUser.username}! +20 XP sumados.`,
      });
    } else {
      setKudosFeedback({
        userId: targetUser.userId,
        message: `Ya enviaste tu reconocimiento a ${targetUser.username} en esta ronda.`,
      });
    }
    setTimeout(() => setKudosFeedback(null), 3000);
  };

  const getMetricDisplay = (stat: UserGamificationStats) => {
    switch (activeCategory) {
      case 'xp':
        return {
          primary: `${stat.xpScore} XP`,
          secondary: `Nv. ${stat.level} · ${stat.levelTitle}`,
          highlight: 'text-amber-600 font-bold',
        };
      case 'projects':
        return {
          primary: `${stat.activeProjectsCount} Proyectos`,
          secondary: `${stat.totalProjectsInvolved} asignados`,
          highlight: 'text-slate-800 font-bold',
        };
      case 'hours':
        return {
          primary: `${stat.totalHours} hrs`,
          secondary: `${stat.timeEntriesCount} registros`,
          highlight: 'text-slate-800 font-bold',
        };
      case 'rework':
        return {
          primary: `${stat.reworkRatePct}%`,
          secondary: stat.totalHours > 0 ? `${(stat.totalHours - stat.reworkHours).toFixed(1)}h limpias` : 'Sin horas',
          highlight: stat.reworkRatePct <= 5 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold',
        };
      default:
        return {
          primary: `${stat.xpScore} XP`,
          secondary: stat.levelTitle,
          highlight: 'text-amber-600 font-bold',
        };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-[#F4F5F0]" id="gamification-view">
      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* 1. HEADER DE LA SECCIÓN (MISMA LÍNEA GRÁFICA DE LA PLATAFORMA) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-2xs border border-stone-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Rendimiento & Reconocimiento
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Top 5 del Equipo</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Reconoce a los colaboradores más comprometidos con la carga de horas, proyectos y calidad.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRulesModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-[#F4F5F0] hover:bg-stone-200/80 rounded-full transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Criterios de puntos</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST DE KUDOS */}
        {kudosFeedback && (
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-full flex items-center justify-between text-xs font-medium shadow-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#c6ef4e]" />
              <span>{kudosFeedback.message}</span>
            </div>
            <button
              onClick={() => setKudosFeedback(null)}
              className="text-slate-400 hover:text-white ml-3 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. BARRA DE CONTROL Y FILTROS SOBRIOS */}
        <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Píldoras de Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveCategory('xp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'xp'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Puntaje XP</span>
            </button>

            <button
              onClick={() => setActiveCategory('hours')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'hours'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Horas Registradas</span>
            </button>

            <button
              onClick={() => setActiveCategory('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'projects'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Proyectos Activos</span>
            </button>

            <button
              onClick={() => setActiveCategory('rework')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'rework'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4F5F0] font-medium'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Calidad (Menor Retrabajo)</span>
            </button>
          </div>

          {/* Filtros de Selección */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as TimeFilterPeriod)}
              className="text-xs bg-[#F4F5F0] border-none rounded-full px-3 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="month">Este Mes</option>
              <option value="quarter">Este Trimestre</option>
              <option value="all">Histórico Completo</option>
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs bg-[#F4F5F0] border-none rounded-full px-3 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Roles</option>
              <option value="coordinador">Coordinación PM</option>
              <option value="contents">Social Media / Contents</option>
              <option value="contentd">Diseñador</option>
              <option value="sac">SAC / Consultores</option>
              <option value="supervisor">Supervisión</option>
            </select>
          </div>
        </div>

        {/* 3. PODIO VISUAL TOP 3 (SOBRIO Y ELEGANTE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Segundo Lugar (Plata) */}
          {secondPlace ? (
            <div className="order-2 md:order-1 bg-white rounded-3xl border border-stone-200/80 p-5 shadow-2xs flex flex-col items-center text-center">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-600 bg-slate-100 mb-3">
                🥈 2º Lugar
              </span>
              <img
                src={getUserAvatarUrl(secondPlace.username)}
                alt={secondPlace.username}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-200 mb-2 shadow-2xs"
              />
              <h3 className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                {secondPlace.username}
              </h3>
              <span className="text-xs text-slate-500">
                {ROLE_LABELS[secondPlace.role] || secondPlace.puesto}
              </span>

              <div className="mt-3 pt-3 border-t border-stone-100 w-full">
                <div className={`text-base font-bold ${getMetricDisplay(secondPlace).highlight}`}>
                  {getMetricDisplay(secondPlace).primary}
                </div>
                <span className="text-[11px] text-slate-400">
                  {secondPlace.totalHours} hrs · {secondPlace.activeProjectsCount} proy.
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 w-full">
                <button
                  onClick={() => setSelectedUserForDetail(secondPlace)}
                  className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-[#F4F5F0] hover:bg-stone-200/80 rounded-full transition-colors cursor-pointer"
                >
                  Detalle
                </button>
                <button
                  onClick={() => handleGiveKudo(secondPlace)}
                  title="Felicitar (+20 XP)"
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="order-2 md:order-1 border border-dashed border-stone-200 rounded-3xl p-6 text-center text-slate-400 text-xs">
              Puesto vacante
            </div>
          )}

          {/* Primer Lugar (Oro - Tarjeta Principal) */}
          {firstPlace ? (
            <div className="order-1 md:order-2 bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-xs flex flex-col items-center text-center relative -translate-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold text-amber-900 bg-amber-100 mb-3 flex items-center gap-1 shadow-2xs">
                <span>🥇</span>
                <span>1º Lugar</span>
              </span>
              <img
                src={getUserAvatarUrl(firstPlace.username)}
                alt={firstPlace.username}
                className="w-16 h-16 rounded-full object-cover ring-3 ring-amber-300 mb-2 shadow-xs"
              />
              <h3 className="font-extrabold text-slate-900 text-base truncate max-w-[200px]">
                {firstPlace.username}
              </h3>
              <span className="text-xs font-medium text-slate-500">
                {ROLE_LABELS[firstPlace.role] || firstPlace.puesto}
              </span>

              <div className="mt-3 pt-3 border-t border-stone-100 w-full">
                <div className={`text-xl font-extrabold ${getMetricDisplay(firstPlace).highlight}`}>
                  {getMetricDisplay(firstPlace).primary}
                </div>
                <span className="text-xs text-slate-400">
                  {firstPlace.totalHours} hrs · {firstPlace.activeProjectsCount} proy.
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 w-full">
                <button
                  onClick={() => setSelectedUserForDetail(firstPlace)}
                  className="flex-1 py-2 text-xs font-bold text-black bg-[#c6ef4e] hover:bg-[#b4df3b] rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  Ver Perfil
                </button>
                <button
                  onClick={() => handleGiveKudo(firstPlace)}
                  title="Felicitar (+20 XP)"
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="order-1 md:order-2 border border-dashed border-stone-200 rounded-3xl p-6 text-center text-slate-400 text-xs">
              Sin datos
            </div>
          )}

          {/* Tercer Lugar (Bronce) */}
          {thirdPlace ? (
            <div className="order-3 bg-white rounded-3xl border border-stone-200/80 p-5 shadow-2xs flex flex-col items-center text-center">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-900 bg-amber-50 mb-3">
                🥉 3º Lugar
              </span>
              <img
                src={getUserAvatarUrl(thirdPlace.username)}
                alt={thirdPlace.username}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-200 mb-2 shadow-2xs"
              />
              <h3 className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                {thirdPlace.username}
              </h3>
              <span className="text-xs text-slate-500">
                {ROLE_LABELS[thirdPlace.role] || thirdPlace.puesto}
              </span>

              <div className="mt-3 pt-3 border-t border-stone-100 w-full">
                <div className={`text-base font-bold ${getMetricDisplay(thirdPlace).highlight}`}>
                  {getMetricDisplay(thirdPlace).primary}
                </div>
                <span className="text-[11px] text-slate-400">
                  {thirdPlace.totalHours} hrs · {thirdPlace.activeProjectsCount} proy.
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 w-full">
                <button
                  onClick={() => setSelectedUserForDetail(thirdPlace)}
                  className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-[#F4F5F0] hover:bg-stone-200/80 rounded-full transition-colors cursor-pointer"
                >
                  Detalle
                </button>
                <button
                  onClick={() => handleGiveKudo(thirdPlace)}
                  title="Felicitar (+20 XP)"
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="order-3 border border-dashed border-stone-200 rounded-3xl p-6 text-center text-slate-400 text-xs">
              Puesto vacante
            </div>
          )}
        </div>

        {/* 4. LISTA DEL TOP 5 Y DESPLEGABLE PARA VER A TODOS */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Medal className="w-4 h-4 text-slate-400" />
                <span>Clasificación del Top 5</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isExpanded
                  ? `Mostrando a los ${sortedLeaderboard.length} colaboradores del equipo`
                  : 'Mostrando los primeros 5 puestos'}
              </p>
            </div>

            {/* BOTÓN DESPLEGABLE PARA VER A TODOS */}
            {sortedLeaderboard.length > 5 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F4F5F0] hover:bg-stone-200/80 text-slate-700 text-xs font-semibold rounded-full transition-all cursor-pointer shadow-2xs"
              >
                <span>
                  {isExpanded ? 'Ver solo Top 5' : `Ver todos (${sortedLeaderboard.length})`}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F5F0] text-slate-500 font-semibold border-b border-stone-200/80">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">Pos</th>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Rol / Puesto</th>
                  <th className="py-3 px-4 text-right">Horas</th>
                  <th className="py-3 px-4 text-center">Proyectos</th>
                  <th className="py-3 px-4 text-center">% Retrabajo</th>
                  <th className="py-3 px-4 text-right font-bold">Puntaje XP</th>
                  <th className="py-3 px-4 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visibleUsers.map((item, index) => {
                  const rankNumber = index + 1;
                  const isCurrentUser =
                    item.userId === currentUser.id ||
                    item.username.toLowerCase() === currentUser.username.toLowerCase();
                  const isTopFive = rankNumber <= 5;

                  return (
                    <tr
                      key={item.userId}
                      className={`hover:bg-stone-50 transition-colors ${
                        isCurrentUser ? 'bg-amber-50/40 font-medium' : ''
                      }`}
                    >
                      {/* Posición */}
                      <td className="py-3 px-4 text-center">
                        {rankNumber === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                            🥇
                          </span>
                        ) : rankNumber === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                            🥈
                          </span>
                        ) : rankNumber === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-900 font-bold text-xs">
                            🥉
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                              isTopFive
                                ? 'bg-slate-100 text-slate-800 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            #{rankNumber}
                          </span>
                        )}
                      </td>

                      {/* Colaborador */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getUserAvatarUrl(item.username)}
                            alt={item.username}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 truncate">
                                {item.username}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded-full font-semibold">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Nv.{item.level} · {item.levelTitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-3 px-4 text-slate-600">
                        {ROLE_LABELS[item.role] || item.puesto}
                      </td>

                      {/* Horas */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-slate-900">
                          {item.totalHours} hrs
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.timeEntriesCount} registros
                        </span>
                      </td>

                      {/* Proyectos */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-slate-800 font-semibold">
                          {item.activeProjectsCount}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          de {item.totalProjectsInvolved}
                        </span>
                      </td>

                      {/* % Retrabajo */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            item.reworkRatePct <= 5
                              ? 'text-emerald-600'
                              : item.reworkRatePct <= 15
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {item.reworkRatePct}%
                        </span>
                      </td>

                      {/* XP */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-amber-600 text-sm">
                          {item.xpScore}
                        </span>
                        <span className="text-[10px] text-slate-400 block">XP</span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedUserForDetail(item)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 rounded-full transition-colors cursor-pointer"
                          >
                            Detalle
                          </button>
                          <button
                            onClick={() => handleGiveKudo(item)}
                            title="Felicitar a este compañero (+20 XP)"
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer del listado con botón para ver todos si está colapsado */}
          {!isExpanded && sortedLeaderboard.length > 5 && (
            <div className="p-3 bg-[#F4F5F0]/60 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer py-1"
              >
                <span>Mostrar los {sortedLeaderboard.length - 5} colaboradores restantes</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CRITERIOS DE PUNTUACIÓN */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <span>Criterios de Puntuación XP</span>
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Los puntos de experiencia (XP) reconocen la puntualidad, carga consistente de horas y trabajo de calidad en proyectos:
              </p>

              <div className="space-y-2 bg-[#F4F5F0] p-3.5 rounded-2xl">
                <div className="flex justify-between items-center">
                  <span>Hora regular de trabajo registrada</span>
                  <span className="font-bold text-emerald-600">+10 XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Proyecto activo asignado</span>
                  <span className="font-bold text-slate-800">+25 XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Proyecto finalizado con éxito</span>
                  <span className="font-bold text-amber-600">+50 XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Día en racha activa de trabajo</span>
                  <span className="font-bold text-orange-600">+15 XP / día</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Reconocimiento (Kudo) de un compañero</span>
                  <span className="font-bold text-purple-600">+20 XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bono de Calidad (&gt;20h y ≤5% retrabajo)</span>
                  <span className="font-bold text-emerald-600">+150 XP</span>
                </div>
                <div className="flex justify-between items-center border-t border-stone-200/80 pt-1 text-rose-600">
                  <span>Hora registrada como Retrabajo</span>
                  <span className="font-bold">-8 XP</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full cursor-pointer transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DEL USUARIO */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={getUserAvatarUrl(selectedUserForDetail.username)}
                  alt={selectedUserForDetail.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedUserForDetail.username}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {ROLE_LABELS[selectedUserForDetail.role] || selectedUserForDetail.puesto}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-[#F4F5F0] rounded-2xl">
                <span className="text-slate-400 font-medium block">Horas Totales</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedUserForDetail.totalHours} hrs
                </span>
              </div>
              <div className="p-3 bg-[#F4F5F0] rounded-2xl">
                <span className="text-slate-400 font-medium block">Score XP</span>
                <span className="text-sm font-bold text-amber-600">
                  {selectedUserForDetail.xpScore} XP
                </span>
              </div>
              <div className="p-3 bg-[#F4F5F0] rounded-2xl">
                <span className="text-slate-400 font-medium block">Racha Activa</span>
                <span className="text-sm font-bold text-orange-600">
                  {selectedUserForDetail.currentStreakDays} días
                </span>
              </div>
              <div className="p-3 bg-[#F4F5F0] rounded-2xl">
                <span className="text-slate-400 font-medium block">Tasa Retrabajo</span>
                <span className="text-sm font-bold text-emerald-600">
                  {selectedUserForDetail.reworkRatePct}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Proyectos asignados ({selectedUserForDetail.projectNames.length})
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                {selectedUserForDetail.projectNames.length > 0 ? (
                  selectedUserForDetail.projectNames.map((name, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-[#F4F5F0] rounded-xl text-slate-700 flex items-center justify-between"
                    >
                      <span className="truncate">{name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">Sin proyectos asignados</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  handleGiveKudo(selectedUserForDetail);
                  setSelectedUserForDetail(null);
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Enviar Reconocimiento (+20 XP)</span>
              </button>

              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="py-2.5 px-4 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 text-xs font-semibold rounded-full cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
