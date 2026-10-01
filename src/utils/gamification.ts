import { Project, UserSession, TimeEntry, Role } from '../types';
import { sendKudoToFirestore } from '../services/firebaseDb';

export type LeaderboardCategory = 'xp' | 'projects' | 'hours' | 'rework' | 'streak';
export type TimeFilterPeriod = 'month' | 'quarter' | 'all';

export interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  category: 'efficiency' | 'projects' | 'time' | 'streak' | 'team';
  unlocked: boolean;
  progress: number; // 0 to 100
  progressLabel: string;
  unlockedAt?: string;
}

export interface UserGamificationStats {
  userId: string;
  username: string;
  role: Role;
  puesto: string;
  totalHours: number;
  normalHours: number;
  reworkHours: number;
  reworkRatePct: number; // 0 to 100
  activeProjectsCount: number;
  completedProjectsCount: number;
  totalProjectsInvolved: number;
  projectNames: string[];
  timeEntriesCount: number;
  currentStreakDays: number;
  maxStreakDays: number;
  lastEntryDate: string | null;
  xpScore: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  levelProgressPct: number;
  badges: GamificationBadge[];
  kudosReceived: number;
  rankXp?: number;
  rankProjects?: number;
  rankHours?: number;
  rankRework?: number;
  rankStreak?: number;
}

const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Iniciador de Tareas', minXp: 0 },
  { level: 2, title: 'Operador Constante', minXp: 150 },
  { level: 3, title: 'Especialista Ágil', minXp: 400 },
  { level: 4, title: 'Líder de Entregas', minXp: 800 },
  { level: 5, title: 'Maestro de Precisión', minXp: 1400 },
  { level: 6, title: 'Capitán de Proyectos', minXp: 2200 },
  { level: 7, title: 'Estratega Operativo', minXp: 3200 },
  { level: 8, title: 'Guardián del Margen', minXp: 4500 },
  { level: 9, title: 'Mentor de Calidad', minXp: 6000 },
  { level: 10, title: 'Leyenda MegaPR', minXp: 8000 },
];

/**
 * Retorna todos los timeEntries normalizados de los proyectos.
 */
export function getAllProjectTimeEntries(projects: Project[]): TimeEntry[] {
  const list: TimeEntry[] = [];
  projects.forEach((p) => {
    if (Array.isArray(p.timeEntries)) {
      p.timeEntries.forEach((e) => {
        list.push({
          ...e,
          projectId: e.projectId || p.id,
        });
      });
    }
  });
  return list;
}

/**
 * Filtra las entradas de tiempo según el período seleccionado.
 */
export function filterEntriesByPeriod(entries: TimeEntry[], period: TimeFilterPeriod): TimeEntry[] {
  if (period === 'all') return entries;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  return entries.filter((e) => {
    if (!e.date) return false;
    const [y, m] = e.date.split('-').map(Number);
    if (!y || !m) return false;

    if (period === 'month') {
      return y === currentYear && m - 1 === currentMonth;
    }

    if (period === 'quarter') {
      const entryQuarter = Math.floor((m - 1) / 3);
      const currentQuarter = Math.floor(currentMonth / 3);
      return y === currentYear && entryQuarter === currentQuarter;
    }

    return true;
  });
}

/**
 * Calcula la racha activa y máxima de días consecutivos registrando tiempo.
 */
export function calculateStreak(entryDates: string[]): { currentStreak: number; maxStreak: number; lastDate: string | null } {
  if (!entryDates || entryDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0, lastDate: null };
  }

  // Filtrar fechas únicas y ordenar desc
  const uniqueDates = Array.from(new Set(entryDates.filter(Boolean))).sort().reverse();
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0, lastDate: null };
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Ayer
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const mostRecent = uniqueDates[0];
  // Si la fecha más reciente no es hoy ni ayer, la racha actual se reinicia a 0
  const isStreakAlive = mostRecent === todayStr || mostRecent === yesterdayStr;

  let currentStreak = 0;
  if (isStreakAlive) {
    currentStreak = 1;
    let prevDate = new Date(mostRecent);
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const diffMs = prevDate.getTime() - currentDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Si es exactamente el día anterior o saltea fin de semana (viernes a lunes)
      const prevDayOfWeek = prevDate.getDay(); // 1 = lunes
      const isWeekendSkip = prevDayOfWeek === 1 && diffDays <= 3;

      if (diffDays === 1 || isWeekendSkip) {
        currentStreak++;
        prevDate = currentDate;
      } else {
        break;
      }
    }
  }

  // Calcular racha máxima histórica
  let maxStreak = 0;
  let tempStreak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const d1 = new Date(uniqueDates[i]);
    const d2 = new Date(uniqueDates[i + 1]);
    const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    const dayOfWeek = d1.getDay();
    const isWeekendSkip = dayOfWeek === 1 && diffDays <= 3;

    if (diffDays === 1 || isWeekendSkip) {
      tempStreak++;
    } else {
      if (tempStreak > maxStreak) maxStreak = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > maxStreak) maxStreak = tempStreak;
  if (currentStreak > maxStreak) maxStreak = currentStreak;

  return {
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak),
    lastDate: mostRecent
  };
}

/**
 * Obtiene los kudos dados entre compañeros desde localStorage.
 */
export function getKudosMap(): Record<string, { count: number; users: string[] }> {
  try {
    const raw = localStorage.getItem('team_gamification_kudos');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Otorga un kudo/reconocimiento a un compañero sincronizado en la nube.
 */
export function sendKudoToUser(targetUserId: string, fromUsername: string): { success: boolean; newCount: number } {
  // Sincronizar en Cloud Firestore
  sendKudoToFirestore(targetUserId, fromUsername).catch(err => console.warn('Cloud sync note (Kudo):', err));

  try {
    const map = getKudosMap();
    if (!map[targetUserId]) {
      map[targetUserId] = { count: 0, users: [] };
    }
    if (!map[targetUserId].users.includes(fromUsername)) {
      map[targetUserId].users.push(fromUsername);
      map[targetUserId].count += 1;
      localStorage.setItem('team_gamification_kudos', JSON.stringify(map));
      return { success: true, newCount: map[targetUserId].count };
    }
    return { success: false, newCount: map[targetUserId].count };
  } catch {
    return { success: false, newCount: 0 };
  }
}

/**
 * Calcula todas las métricas de gamificación y logros para cada usuario del sistema.
 */
export function calculateAllUserGamificationStats(
  users: UserSession[],
  projects: Project[],
  period: TimeFilterPeriod = 'month',
  overrideKudosMap?: Record<string, { count: number; users: string[] }>
): UserGamificationStats[] {
  const allEntries = getAllProjectTimeEntries(projects);
  const filteredEntries = filterEntriesByPeriod(allEntries, period);
  const kudosMap = overrideKudosMap || getKudosMap();

  return users.map((user) => {
    // 1. Entradas del usuario en el período
    const userEntries = filteredEntries.filter(
      (e) =>
        e.userId === user.id ||
        (e.username && e.username.toLowerCase() === user.username.toLowerCase())
    );

    // Todas las entradas del usuario (para streaks históricos y badges acumulados)
    const allUserEntries = allEntries.filter(
      (e) =>
        e.userId === user.id ||
        (e.username && e.username.toLowerCase() === user.username.toLowerCase())
    );

    const totalHours = Number(
      userEntries.reduce((sum, e) => sum + (e.hours || 0), 0).toFixed(2)
    );
    const normalHours = Number(
      userEntries
        .filter((e) => e.type !== 'retrabajo')
        .reduce((sum, e) => sum + (e.hours || 0), 0)
        .toFixed(2)
    );
    const reworkHours = Number(
      userEntries
        .filter((e) => e.type === 'retrabajo')
        .reduce((sum, e) => sum + (e.hours || 0), 0)
        .toFixed(2)
    );

    const reworkRatePct =
      totalHours > 0 ? Number(((reworkHours / totalHours) * 100).toFixed(1)) : 0;

    // 2. Proyectos asignados o liderados
    const userProjects = projects.filter((p) => {
      const isMember = p.members?.some(
        (m) =>
          m.id === user.id ||
          m.name?.toLowerCase() === user.username.toLowerCase()
      );
      const isAssigned = user.proyectosAsignados?.includes(p.id);
      const hasLogged = p.timeEntries?.some(
        (e) =>
          e.userId === user.id ||
          (e.username && e.username.toLowerCase() === user.username.toLowerCase())
      );
      const hasBudget = p.budget && p.budget[user.role] && (p.budget[user.role]?.allocated || 0) > 0;

      if (user.role === 'coordinador') {
        return isMember || hasLogged || Boolean(hasBudget);
      }
      return isMember || isAssigned || hasLogged;
    });

    const activeProjects = userProjects.filter((p) => {
      if (!p.phases || p.phases.length === 0) return true;
      return !p.phases.every((ph) => ph.status === 'completed');
    });
    const completedProjects = userProjects.filter((p) => {
      if (!p.phases || p.phases.length === 0) return false;
      return p.phases.every((ph) => ph.status === 'completed');
    });

    // 3. Racha de días
    const streakData = calculateStreak(allUserEntries.map((e) => e.date).filter(Boolean));

    // 4. Kudos
    const userKudos = kudosMap[user.id]?.count || 0;

    // 5. XP Score Algorithm (Equilibrado y Motivacional):
    // - 10 XP por cada hora regular trabajada
    // - 25 XP por cada proyecto activo asignado
    // - 50 XP por cada proyecto completado
    // - 15 XP por cada día en la racha activa
    // - 20 XP por cada Kudo recibido de compañeros
    // - Bonus de Calidad: +100 XP si tiene >20h con <= 5% de retrabajo
    // - Penalización moderada: -8 XP por cada hora de retrabajo
    let qualityBonus = 0;
    if (totalHours >= 20 && reworkRatePct <= 5) {
      qualityBonus = 150;
    } else if (totalHours >= 10 && reworkRatePct <= 10) {
      qualityBonus = 75;
    }

    const rawXp =
      normalHours * 10 +
      activeProjects.length * 25 +
      completedProjects.length * 50 +
      streakData.currentStreak * 15 +
      userKudos * 20 +
      qualityBonus -
      reworkHours * 8;

    const xpScore = Math.max(25, Math.round(rawXp));

    // 6. Nivel y Progreso
    let currentLevel = LEVEL_THRESHOLDS[0];
    let nextLevel = LEVEL_THRESHOLDS[1];

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xpScore >= LEVEL_THRESHOLDS[i].minXp) {
        currentLevel = LEVEL_THRESHOLDS[i];
        nextLevel = LEVEL_THRESHOLDS[i + 1] || {
          level: currentLevel.level + 1,
          title: 'Suprema Excelencia',
          minXp: currentLevel.minXp + 2000,
        };
      } else {
        break;
      }
    }

    const levelRange = nextLevel.minXp - currentLevel.minXp;
    const xpInCurrentLevel = xpScore - currentLevel.minXp;
    const levelProgressPct = Math.min(
      100,
      Math.max(0, Math.round((xpInCurrentLevel / (levelRange || 1)) * 100))
    );
    const xpToNextLevel = Math.max(0, nextLevel.minXp - xpScore);

    // 7. Insignias / Badges
    const totalAllTimeHours = allUserEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
    const badges: GamificationBadge[] = [
      {
        id: 'swiss-clock',
        name: 'Reloj Suizo',
        description: 'Registró más de 10 entradas de tiempo en la plataforma.',
        icon: 'Clock',
        category: 'time',
        unlocked: userEntries.length >= 10,
        progress: Math.min(100, Math.round((userEntries.length / 10) * 100)),
        progressLabel: `${userEntries.length} / 10 registros`,
      },
      {
        id: 'zero-rework',
        name: 'Precisión Impecable',
        description: 'Más de 20 horas trabajadas con menos de 3% de retrabajo.',
        icon: 'ShieldCheck',
        category: 'efficiency',
        unlocked: totalHours >= 20 && reworkRatePct <= 3,
        progress: totalHours >= 20 ? (reworkRatePct <= 3 ? 100 : Math.max(0, 100 - reworkRatePct * 5)) : Math.round((totalHours / 20) * 80),
        progressLabel: totalHours < 20 ? `${totalHours}h / 20h requeridas` : `${reworkRatePct}% retrabajo`,
      },
      {
        id: 'multitask-pro',
        name: 'Capitán Multitasking',
        description: 'Lidera o participa activamente en 3 o más proyectos en simultáneo.',
        icon: 'FolderKanban',
        category: 'projects',
        unlocked: activeProjects.length >= 3,
        progress: Math.min(100, Math.round((activeProjects.length / 3) * 100)),
        progressLabel: `${activeProjects.length} / 3 proyectos`,
      },
      {
        id: 'streak-master',
        name: 'Racha Imparable',
        description: 'Registró horas 5 o más días laborales consecutivos sin faltar.',
        icon: 'Flame',
        category: 'streak',
        unlocked: streakData.currentStreak >= 5 || streakData.maxStreak >= 5,
        progress: Math.min(100, Math.round((Math.max(streakData.currentStreak, streakData.maxStreak) / 5) * 100)),
        progressLabel: `${Math.max(streakData.currentStreak, streakData.maxStreak)} / 5 días`,
      },
      {
        id: 'centurion',
        name: 'Centurión del Tiempo',
        description: 'Alcanzó más de 100 horas totales registradas históricamente.',
        icon: 'Award',
        category: 'time',
        unlocked: totalAllTimeHours >= 100,
        progress: Math.min(100, Math.round((totalAllTimeHours / 100) * 100)),
        progressLabel: `${Number(totalAllTimeHours.toFixed(1))}h / 100h`,
      },
      {
        id: 'team-pillar',
        name: 'Pilar del Equipo',
        description: 'Recibió 3 o más reconocimientos (kudos) de sus compañeros.',
        icon: 'Sparkles',
        category: 'team',
        unlocked: userKudos >= 3,
        progress: Math.min(100, Math.round((userKudos / 3) * 100)),
        progressLabel: `${userKudos} / 3 reconocimientos`,
      },
    ];

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      puesto: user.puesto || user.role,
      totalHours,
      normalHours,
      reworkHours,
      reworkRatePct,
      activeProjectsCount: activeProjects.length,
      completedProjectsCount: completedProjects.length,
      totalProjectsInvolved: userProjects.length,
      projectNames: userProjects.map((p) => p.name),
      timeEntriesCount: userEntries.length,
      currentStreakDays: streakData.currentStreak,
      maxStreakDays: streakData.maxStreak,
      lastEntryDate: streakData.lastDate,
      xpScore,
      level: currentLevel.level,
      levelTitle: currentLevel.title,
      xpToNextLevel,
      levelProgressPct,
      badges,
      kudosReceived: userKudos,
    };
  });
}

/**
 * Asigna los rankings numéricos a cada categoría y retorna la lista ordenada por la categoría deseada.
 */
export function getSortedLeaderboard(
  statsList: UserGamificationStats[],
  category: LeaderboardCategory
): UserGamificationStats[] {
  // 1. Rank por XP
  const byXp = [...statsList].sort((a, b) => b.xpScore - a.xpScore);
  byXp.forEach((u, idx) => (u.rankXp = idx + 1));

  // 2. Rank por Proyectos
  const byProjects = [...statsList].sort((a, b) => {
    if (b.activeProjectsCount !== a.activeProjectsCount) {
      return b.activeProjectsCount - a.activeProjectsCount;
    }
    return b.totalProjectsInvolved - a.totalProjectsInvolved;
  });
  byProjects.forEach((u, idx) => (u.rankProjects = idx + 1));

  // 3. Rank por Horas
  const byHours = [...statsList].sort((a, b) => b.totalHours - a.totalHours);
  byHours.forEach((u, idx) => (u.rankHours = idx + 1));

  // 4. Rank por Calidad / Menor Retrabajo (mínimo con horas)
  const byRework = [...statsList].sort((a, b) => {
    // Primero los que tienen horas registradas
    if (a.totalHours > 0 && b.totalHours === 0) return -1;
    if (b.totalHours > 0 && a.totalHours === 0) return 1;
    if (a.reworkRatePct !== b.reworkRatePct) {
      return a.reworkRatePct - b.reworkRatePct; // Menor % es mejor
    }
    return b.totalHours - a.totalHours; // Desempate por más volumen limpio
  });
  byRework.forEach((u, idx) => (u.rankRework = idx + 1));

  // 5. Rank por Racha
  const byStreak = [...statsList].sort((a, b) => {
    if (b.currentStreakDays !== a.currentStreakDays) {
      return b.currentStreakDays - a.currentStreakDays;
    }
    return b.maxStreakDays - a.maxStreakDays;
  });
  byStreak.forEach((u, idx) => (u.rankStreak = idx + 1));

  switch (category) {
    case 'xp':
      return byXp;
    case 'projects':
      return byProjects;
    case 'hours':
      return byHours;
    case 'rework':
      return byRework;
    case 'streak':
      return byStreak;
    default:
      return byXp;
  }
}
