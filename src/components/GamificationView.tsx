import React, { useState, useMemo } from 'react';
import { Project, UserSession, getUserAvatarUrl, Role, ROLE_LABELS } from '../types';
import {
  Trophy,
  Medal,
  Flame,
  Award,
  ShieldCheck,
  Clock,
  FolderKanban,
  Sparkles,
  Heart,
  Info,
  Crown,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  Lock,
  ArrowUp,
  Share2
} from 'lucide-react';
import {
  LeaderboardCategory,
  TimeFilterPeriod,
  GamificationBadge,
  UserGamificationStats,
  calculateAllUserGamificationStats,
  getSortedLeaderboard,
  sendKudoToUser
} from '../utils/gamification';

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
  onSelectProject,
}) => {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('xp');
  const [period, setPeriod] = useState<TimeFilterPeriod>('month');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserGamificationStats | null>(null);
  const [kudosFeedback, setKudosFeedback] = useState<{ userId: string; message: string } | null>(null);

  // 1. Calcular métricas completas de gamificación
  const allUserStats = useMemo(() => {
    return calculateAllUserGamificationStats(users, projects, period);
  }, [users, projects, period]);

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

  // Top 5 del ranking
  const topFive = useMemo(() => sortedLeaderboard.slice(0, 5), [sortedLeaderboard]);
  const restOfTeam = useMemo(() => sortedLeaderboard.slice(5), [sortedLeaderboard]);

  // Primeros tres para el podio
  const firstPlace = topFive[0];
  const secondPlace = topFive[1];
  const thirdPlace = topFive[2];

  // Acción de Kudos
  const handleGiveKudo = (targetUser: UserGamificationStats) => {
    if (targetUser.userId === currentUser.id) {
      setKudosFeedback({
        userId: targetUser.userId,
        message: '¡No puedes otorgarte un reconocimiento a ti mismo!',
      });
      setTimeout(() => setKudosFeedback(null), 3000);
      return;
    }

    const res = sendKudoToUser(targetUser.userId, currentUser.username);
    if (res.success) {
      setKudosFeedback({
        userId: targetUser.userId,
        message: `¡Reconocimiento enviado a ${targetUser.username}! +20 XP`,
      });
    } else {
      setKudosFeedback({
        userId: targetUser.userId,
        message: `Ya enviaste tu reconocimiento a ${targetUser.username}.`,
      });
    }
    setTimeout(() => setKudosFeedback(null), 3000);
  };

  const getMetricDisplay = (stat: UserGamificationStats) => {
    switch (activeCategory) {
      case 'xp':
        return {
          primary: `${stat.xpScore} XP`,
          secondary: `Nivel ${stat.level} · ${stat.levelTitle}`,
          highlight: 'text-amber-600 dark:text-amber-400 font-bold',
        };
      case 'projects':
        return {
          primary: `${stat.activeProjectsCount} Proyectos Activos`,
          secondary: `${stat.totalProjectsInvolved} proyectos en total`,
          highlight: 'text-blue-600 dark:text-blue-400 font-bold',
        };
      case 'hours':
        return {
          primary: `${stat.totalHours} hrs`,
          secondary: `${stat.timeEntriesCount} registros ingresados`,
          highlight: 'text-emerald-600 dark:text-emerald-400 font-bold',
        };
      case 'rework':
        return {
          primary: `${stat.reworkRatePct}% Retrabajo`,
          secondary: stat.totalHours > 0 ? `${(stat.totalHours - stat.reworkHours).toFixed(1)}h limpias de ${stat.totalHours}h` : 'Sin horas registradas',
          highlight: stat.reworkRatePct <= 5 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold',
        };
      case 'streak':
        return {
          primary: `${stat.currentStreakDays} días seguidos`,
          secondary: `Récord personal: ${stat.maxStreakDays} días`,
          highlight: 'text-orange-600 dark:text-orange-400 font-bold',
        };
      default:
        return {
          primary: `${stat.xpScore} XP`,
          secondary: stat.levelTitle,
          highlight: 'text-amber-600',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* 1. Header Principal y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Rendimiento & Reconocimiento
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Temporada Activa 2026
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Top 5 y Gamificación del Equipo
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Reconoce a los colaboradores más comprometidos con la puntualidad, carga de horas y calidad de proyectos.
          </p>
        </div>

        {/* Acciones y Modal de Reglas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            ¿Cómo se calculan los puntos?
          </button>
        </div>
      </div>

      {/* 2. Tarjeta del Usuario Actual: "Mi Progreso & Posición" */}
      {currentUserStats && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-amber-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={getUserAvatarUrl(currentUserStats.username)}
                  alt={currentUserStats.username}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-400/60 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
                  Nv.{currentUserStats.level}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {currentUserStats.username}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                    {ROLE_LABELS[currentUserStats.role] || currentUserStats.puesto}
                  </span>
                </div>
                <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                  {currentUserStats.levelTitle}
                </p>

                {/* Barra de Progreso XP */}
                <div className="mt-3 w-64 sm:w-80">
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>{currentUserStats.xpScore} XP acumulados</span>
                    <span className="text-amber-400">+{currentUserStats.xpToNextLevel} XP para Nv.{currentUserStats.level + 1}</span>
                  </div>
                  <div className="w-full bg-slate-700/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${currentUserStats.levelProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas clave en chips sobrios */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-3">
                <span className="text-[11px] text-slate-400 block">Racha Actual</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-base font-bold text-white">{currentUserStats.currentStreakDays} días</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Récord: {currentUserStats.maxStreakDays}d</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-3">
                <span className="text-[11px] text-slate-400 block">Horas Reportadas</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-base font-bold text-white">{currentUserStats.totalHours} hrs</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{currentUserStats.timeEntriesCount} entradas</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-3">
                <span className="text-[11px] text-slate-400 block">Proyectos Activos</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <FolderKanban className="w-4 h-4 text-blue-400" />
                  <span className="text-base font-bold text-white">{currentUserStats.activeProjectsCount}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{currentUserStats.completedProjectsCount} finalizados</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-3">
                <span className="text-[11px] text-slate-400 block">Tasa Retrabajo</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-base font-bold text-white">{currentUserStats.reworkRatePct}%</span>
                </div>
                <span className="text-[10px] text-emerald-400 mt-0.5 block">
                  {currentUserStats.reworkRatePct <= 5 ? 'Excelente calidad' : 'Atención a revisiones'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Barra de Control de Categorías y Período */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Selector de Categorías de Competencia */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveCategory('xp')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeCategory === 'xp'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Top 5 Global XP
          </button>

          <button
            onClick={() => setActiveCategory('projects')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeCategory === 'projects'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Más Proyectos
          </button>

          <button
            onClick={() => setActiveCategory('hours')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeCategory === 'hours'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Más Horas Diligenciadas
          </button>

          <button
            onClick={() => setActiveCategory('rework')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeCategory === 'rework'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Calidad (Cero Retrabajo)
          </button>

          <button
            onClick={() => setActiveCategory('streak')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeCategory === 'streak'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Rachas Activas
          </button>
        </div>

        {/* Filtros de Período y Rol */}
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as TimeFilterPeriod)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="all">Histórico Completo</option>
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* Feedback Toast de Kudos */}
      {kudosFeedback && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{kudosFeedback.message}</span>
          </div>
        </div>
      )}

      {/* 4. PODIO VISUAL TOP 3 (1º, 2º, 3º LUGAR) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
        {/* Segundo Lugar (Plata) */}
        {secondPlace ? (
          <div className="order-2 md:order-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm mb-3">
              🥈 2º
            </div>
            <div className="relative mb-3">
              <img
                src={getUserAvatarUrl(secondPlace.username)}
                alt={secondPlace.username}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-300 dark:ring-slate-700 shadow"
              />
              <span className="absolute -bottom-1 -right-1 bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                #2
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {secondPlace.username}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {ROLE_LABELS[secondPlace.role] || secondPlace.puesto}
            </span>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full">
              <div className={`text-lg font-bold ${getMetricDisplay(secondPlace).highlight}`}>
                {getMetricDisplay(secondPlace).primary}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {getMetricDisplay(secondPlace).secondary}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 w-full">
              <button
                onClick={() => setSelectedUserForDetail(secondPlace)}
                className="flex-1 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md transition-colors"
              >
                Ver Métricas
              </button>
              <button
                onClick={() => handleGiveKudo(secondPlace)}
                title="Dar reconocimiento (+20 XP)"
                className="p-1.5 text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="order-2 md:order-1 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            Puesto vacante
          </div>
        )}

        {/* Primer Lugar (Oro - Podio Prominente) */}
        {firstPlace ? (
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/15 dark:via-slate-900 dark:to-slate-900 rounded-2xl border-2 border-amber-400 dark:border-amber-500/60 p-6 shadow-md relative flex flex-col items-center text-center -translate-y-2">
            <div className="absolute -top-4 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 fill-current" /> Campeón de la Semana
            </div>

            <div className="relative mt-2 mb-3">
              <img
                src={getUserAvatarUrl(firstPlace.username)}
                alt={firstPlace.username}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-400 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full shadow">
                🥇 1º
              </span>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {firstPlace.username}
            </h3>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              {ROLE_LABELS[firstPlace.role] || firstPlace.puesto}
            </span>

            <div className="mt-4 pt-3 border-t border-amber-100 dark:border-slate-800 w-full">
              <div className={`text-2xl font-black ${getMetricDisplay(firstPlace).highlight}`}>
                {getMetricDisplay(firstPlace).primary}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {getMetricDisplay(firstPlace).secondary}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 w-full">
              <button
                onClick={() => setSelectedUserForDetail(firstPlace)}
                className="flex-1 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-sm"
              >
                Ver Expediente & Logros
              </button>
              <button
                onClick={() => handleGiveKudo(firstPlace)}
                title="Dar reconocimiento (+20 XP)"
                className="p-2 text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
              >
                <Heart className="w-5 h-5 fill-amber-500/20 text-amber-500" />
              </button>
            </div>
          </div>
        ) : (
          <div className="order-1 md:order-2 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            Sin datos en el período
          </div>
        )}

        {/* Tercer Lugar (Bronce) */}
        {thirdPlace ? (
          <div className="order-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm mb-3">
              🥉 3º
            </div>
            <div className="relative mb-3">
              <img
                src={getUserAvatarUrl(thirdPlace.username)}
                alt={thirdPlace.username}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-600/40 shadow"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                #3
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {thirdPlace.username}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {ROLE_LABELS[thirdPlace.role] || thirdPlace.puesto}
            </span>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full">
              <div className={`text-lg font-bold ${getMetricDisplay(thirdPlace).highlight}`}>
                {getMetricDisplay(thirdPlace).primary}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {getMetricDisplay(thirdPlace).secondary}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 w-full">
              <button
                onClick={() => setSelectedUserForDetail(thirdPlace)}
                className="flex-1 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md transition-colors"
              >
                Ver Métricas
              </button>
              <button
                onClick={() => handleGiveKudo(thirdPlace)}
                title="Dar reconocimiento (+20 XP)"
                className="p-1.5 text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="order-3 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            Puesto vacante
          </div>
        )}
      </div>

      {/* 5. TABLA COMPLETA: TOP 4º, 5º Y RESTO DEL EQUIPO */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Medal className="w-4 h-4 text-slate-500" />
            Clasificación General del Top 5 y Equipo
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {sortedLeaderboard.length} colaboradores activos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Pos</th>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Rol / Puesto</th>
                <th className="py-3 px-4 text-right">Horas Registradas</th>
                <th className="py-3 px-4 text-center">Racha</th>
                <th className="py-3 px-4 text-center">Proyectos</th>
                <th className="py-3 px-4 text-center">% Retrabajo</th>
                <th className="py-3 px-4 text-right font-bold">Puntaje XP</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedLeaderboard.map((item, index) => {
                const rankNumber = index + 1;
                const isCurrentUser =
                  item.userId === currentUser.id ||
                  item.username.toLowerCase() === currentUser.username.toLowerCase();
                const isTopFive = rankNumber <= 5;

                return (
                  <tr
                    key={item.userId}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isCurrentUser ? 'bg-amber-50/50 dark:bg-amber-950/20 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      {rankNumber === 1 ? (
                        <span className="text-amber-500 font-black">🥇 1</span>
                      ) : rankNumber === 2 ? (
                        <span className="text-slate-400 font-bold">🥈 2</span>
                      ) : rankNumber === 3 ? (
                        <span className="text-amber-700 font-bold">🥉 3</span>
                      ) : isTopFive ? (
                        <span className="font-bold text-blue-600 dark:text-blue-400">#{rankNumber}</span>
                      ) : (
                        <span className="text-slate-400">#{rankNumber}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getUserAvatarUrl(item.username)}
                          alt={item.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.username}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Nv.{item.level} · {item.levelTitle}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {ROLE_LABELS[item.role] || item.puesto}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.totalHours} hrs
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {item.timeEntriesCount} cargas
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Flame className={`w-3.5 h-3.5 ${item.currentStreakDays > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
                        <span>{item.currentStreakDays}d</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="text-slate-900 dark:text-white font-medium">
                        {item.activeProjectsCount}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        de {item.totalProjectsInvolved}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-semibold ${
                          item.reworkRatePct <= 5
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.reworkRatePct <= 15
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.reworkRatePct}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                        {item.xpScore}
                      </span>
                      <span className="text-[10px] text-slate-400 block">XP</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedUserForDetail(item)}
                          className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                        >
                          Detalle
                        </button>
                        <button
                          onClick={() => handleGiveKudo(item)}
                          title="Felicitar / Dar Kudo"
                          className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
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
      </div>

      {/* 6. SECCIÓN DE INSIGNIAS Y LOGROS DEL EQUIPO (HALL OF FAME BADGES) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Insignias & Logros Desbloqueables
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Recompensas otorgadas automáticamente por disciplina, volumen y cero retrabajo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentUserStats?.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border transition-all ${
                badge.unlocked
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    badge.unlocked
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {badge.id === 'swiss-clock' && <Clock className="w-5 h-5" />}
                  {badge.id === 'zero-rework' && <ShieldCheck className="w-5 h-5" />}
                  {badge.id === 'multitask-pro' && <FolderKanban className="w-5 h-5" />}
                  {badge.id === 'streak-master' && <Flame className="w-5 h-5" />}
                  {badge.id === 'centurion' && <Award className="w-5 h-5" />}
                  {badge.id === 'team-pillar' && <Sparkles className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {badge.name}
                    </h3>
                    {badge.unlocked ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Desbloqueado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Lock className="w-3 h-3" /> En progreso
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {badge.description}
                  </p>

                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progreso</span>
                      <span>{badge.progressLabel}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          badge.unlocked ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. MODAL DE REGLAS DE PUNTUACIÓN */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                Reglas del Sistema de Gamificación
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                El sistema de gamificación reconoce el esfuerzo, la consistencia y la exactitud en el registro de horas y gestión de proyectos.
              </p>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="font-medium">Hora regular de trabajo registrada</span>
                  <span className="font-bold text-emerald-600">+10 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Proyecto activo a cargo / asignado</span>
                  <span className="font-bold text-blue-600">+25 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Proyecto entregado / completado con éxito</span>
                  <span className="font-bold text-amber-600">+50 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Día consecutivo en Racha Activa</span>
                  <span className="font-bold text-orange-600">+15 XP / día</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Kudo / Reconocimiento de un compañero</span>
                  <span className="font-bold text-purple-600">+20 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Bono de Calidad (&gt;20h con $\le$5% retrabajo)</span>
                  <span className="font-bold text-emerald-600">+150 XP</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 text-rose-600">
                  <span className="font-medium">Hora imputada como Retrabajo / Corrección</span>
                  <span className="font-bold">-8 XP</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Los rankings se actualizan en tiempo real conforme tú y tus compañeros utilicen el cronómetro flotante o el cargador manual de horas.
              </p>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold rounded-md"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL DE DETALLE DEL USUARIO SELECCIONADO */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={getUserAvatarUrl(selectedUserForDetail.username)}
                  alt={selectedUserForDetail.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedUserForDetail.username}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {ROLE_LABELS[selectedUserForDetail.role] || selectedUserForDetail.puesto}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-500 block">Total Horas</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedUserForDetail.totalHours} hrs
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-500 block">Score XP</span>
                <span className="text-base font-bold text-amber-600">
                  {selectedUserForDetail.xpScore} XP
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-500 block">Racha Activa</span>
                <span className="text-base font-bold text-orange-600">
                  {selectedUserForDetail.currentStreakDays} días
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-500 block">Tasa Retrabajo</span>
                <span className="text-base font-bold text-emerald-600">
                  {selectedUserForDetail.reworkRatePct}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Proyectos en los que participa ({selectedUserForDetail.projectNames.length})
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                {selectedUserForDetail.projectNames.length > 0 ? (
                  selectedUserForDetail.projectNames.map((name, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 flex items-center justify-between"
                    >
                      <span>{name}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">Sin proyectos asignados</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => {
                  handleGiveKudo(selectedUserForDetail);
                  setSelectedUserForDetail(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-md shadow-sm"
              >
                <Heart className="w-4 h-4 fill-current" />
                Dar Reconocimiento (+20 XP)
              </button>

              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md"
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
