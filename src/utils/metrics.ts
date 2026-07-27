import { Project, UserSession, ROLE_HOURLY_RATES, Role, TimeEntry } from '../types';
import { 
  GROSS_MONTHLY_CAPACITY, 
  IDLE_TIME_HOURS, 
  EFFECTIVE_MONTHLY_CAPACITY, 
  calculateGlobalFinancials, 
  calculateTeamWorkload, 
  getGlobalRetrabajoStats, 
  getRetrabajoBadgeStyle,
  ProjectProfitabilityItem
} from '../dashboardUtils';

export interface ProjectProfitabilityRankingItem extends ProjectProfitabilityItem {
  rank: number;
  healthColor: string;
}

export interface TeamPerformanceBenchmark {
  userId: string;
  username: string;
  puesto: string;
  role: Role;
  assignedHours: number;
  consumedHours: number;
  effectiveCapacity: number;
  effectiveSaturation: number; // % of 153.6h
  reworkHours: number;
  reworkPercentage: number;
  activeProjectsCount: number;
  efficiencyRating: 'excelente' | 'optima' | 'alerta' | 'sobrecargado';
  performanceScore: number; // 0 - 100
}

/**
 * Retorna el ranking de proyectos ordenados por rentabilidad (Margen Bruto %) y rendimiento hora.
 */
export function getProjectProfitabilityRanking(projects: Project[]): ProjectProfitabilityRankingItem[] {
  const financials = calculateGlobalFinancials(projects);
  const sorted = [...financials.projectProfitabilityList].sort((a, b) => {
    // Orden principal por Margen %, secundario por utilidad bruta
    if (b.marginPercent !== a.marginPercent) {
      return b.marginPercent - a.marginPercent;
    }
    return b.grossProfit - a.grossProfit;
  });

  return sorted.map((item, index) => {
    let healthColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (item.status === 'optima') healthColor = 'text-blue-600 bg-blue-50 border-blue-200';
    if (item.status === 'ajustada') healthColor = 'text-amber-600 bg-amber-50 border-amber-200';
    if (item.status === 'perdida') healthColor = 'text-rose-600 bg-rose-50 border-rose-200';

    return {
      ...item,
      rank: index + 1,
      healthColor
    };
  });
}

/**
 * Retorna el indicador global de % de retrabajo e indicadores por origen y proyecto.
 */
export function getGlobalReworkIndicator(projects: Project[], users: UserSession[]) {
  const stats = getGlobalRetrabajoStats(projects, users);
  const badgeStyle = getRetrabajoBadgeStyle(stats.porcentajeGlobal);

  return {
    porcentajeGlobal: stats.porcentajeGlobal,
    totalRetrabajoGlobal: stats.totalRetrabajoGlobal,
    totalHorasGlobal: stats.totalHorasGlobal,
    badgeStyle,
    rankingProyectos: stats.porProyecto,
    rankingUsuarios: stats.usuariosList
  };
}

/**
 * Calcula comparativas de desempeño y productividad entre los miembros del equipo.
 */
export function getTeamPerformanceComparisons(users: UserSession[], projects: Project[]): TeamPerformanceBenchmark[] {
  const workloads = calculateTeamWorkload(users, projects);
  const reworkStats = getGlobalRetrabajoStats(projects, users);

  const userReworkMap = new Map<string, { horasRetrabajo: number; totalHoras: number; porcentaje: number }>();
  reworkStats.usuariosList.forEach(u => {
    userReworkMap.set(u.userId, {
      horasRetrabajo: u.horasRetrabajo,
      totalHoras: u.totalHoras,
      porcentaje: u.porcentaje
    });
  });

  return workloads.map(w => {
    const rw = userReworkMap.get(w.id) || { horasRetrabajo: 0, totalHoras: 0, porcentaje: 0 };
    const reworkHours = rw.horasRetrabajo;
    const reworkPercentage = rw.porcentaje;

    // Calculo de Score de Desempeño (0-100)
    // Base 100 - Penalización por retrabajo - Penalización por sobrecarga extrema o inactividad excesiva
    let score = 100;

    // Penalización por retrabajo (>10% resta puntos)
    if (reworkPercentage > 10) {
      score -= Math.min(35, (reworkPercentage - 10) * 1.5);
    }

    // Evaluación de Saturación Efectiva (optimo entre 65% y 95%)
    const sat = w.effectiveSaturation;
    if (sat > 110) {
      score -= Math.min(30, (sat - 110) * 0.8); // Sobrecargado
    } else if (sat < 40 && w.assignedHours > 0) {
      score -= 15; // Capacidad desaprovechada
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let efficiencyRating: 'excelente' | 'optima' | 'alerta' | 'sobrecargado' = 'optima';
    if (sat > 105) {
      efficiencyRating = 'sobrecargado';
    } else if (reworkPercentage > 20 || score < 60) {
      efficiencyRating = 'alerta';
    } else if (score >= 85) {
      efficiencyRating = 'excelente';
    }

    return {
      userId: w.id,
      username: w.username,
      puesto: w.puesto || w.role,
      role: w.role,
      assignedHours: Number((w.assignedHours || 0).toFixed(1)),
      consumedHours: Number((w.consumedHours || 0).toFixed(1)),
      effectiveCapacity: Number((w.effectiveCapacity || EFFECTIVE_MONTHLY_CAPACITY).toFixed(1)),
      effectiveSaturation: Number((w.effectiveSaturation || 0).toFixed(1)),
      reworkHours: Number((reworkHours || 0).toFixed(1)),
      reworkPercentage: Number(reworkPercentage.toFixed(1)),
      activeProjectsCount: w.activeProjectsCount,
      efficiencyRating,
      performanceScore: score
    };
  }).sort((a, b) => b.performanceScore - a.performanceScore);
}

// Re-export core dashboard helpers for unified metric imports
export {
  calculateGlobalFinancials,
  calculateTeamWorkload,
  getGlobalRetrabajoStats,
  getRetrabajoBadgeStyle,
  GROSS_MONTHLY_CAPACITY,
  IDLE_TIME_HOURS,
  EFFECTIVE_MONTHLY_CAPACITY
};
