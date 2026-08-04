import { Project, UserSession, ROLE_HOURLY_RATES, Role, TimeEntry } from './types';

// Dynamic capacity in hours per month based on role (192h disponiles al mes, 20% ocio/margen)
export const GROSS_MONTHLY_CAPACITY = 192;
export const IDLE_TIME_PERCENT = 20; // 20% de margen para horas de ocio / tiempos muertos
export const IDLE_TIME_HOURS = GROSS_MONTHLY_CAPACITY * (IDLE_TIME_PERCENT / 100); // 38.4 horas
export const EFFECTIVE_MONTHLY_CAPACITY = GROSS_MONTHLY_CAPACITY - IDLE_TIME_HOURS; // 153.6 horas efectivas

export const ROLE_CAPACITIES: Record<Role, number> = {
  supervisor: 192,
  coordinador: 192,
  sac: 192,
  contents: 192,
  contentd: 192,
  proveedor: 160,
  invitado: 0
};

// 1. Cálculos Financieros y Rentabilidad Global (Fase 5)
export interface ProjectProfitabilityItem {
  id: string;
  name: string;
  clientName: string;
  income: number;
  soldHours: number;
  consumedHours: number;
  estimatedCost: number;
  realCost: number;
  grossProfit: number;
  marginPercent: number;
  hourlyYield: number;
  status: 'alta' | 'optima' | 'ajustada' | 'perdida';
}

export const calculateGlobalFinancials = (projects: Project[]) => {
  let totalSoldHours = 0;
  let totalConsumedHours = 0;
  let totalEstimatedCost = 0;
  let totalRealCost = 0;
  let totalIncome = 0;

  const projectProfitabilityList: ProjectProfitabilityItem[] = [];

  projects.forEach(p => {
    // Calcular ingreso real del proyecto a través de sus OVs o totalIncome
    let projIncome = p.totalIncome || 0;
    if (!projIncome && p.ordenesVenta && p.ordenesVenta.length > 0) {
      projIncome = p.ordenesVenta
        .reduce((sum, ov) => sum + (ov.monto || 0), 0);
    }

    const projSoldHours = p.hoursTotal || 0;
    let projConsumedHours = 0;
    let projEstimatedCost = 0;
    let projRealCost = 0;

    // Costo estimado y real basados en el desglose de presupuesto de roles
    if (p.budget) {
      Object.keys(p.budget).forEach((roleKey) => {
        const role = roleKey as Role;
        const allocated = p.budget[role]?.allocated || 0;
        const consumed = p.budget[role]?.consumed || 0;
        const rate = ROLE_HOURLY_RATES[role] || 0;

        projEstimatedCost += allocated * rate;
        projRealCost += consumed * rate;
        projConsumedHours += consumed;
      });
    }

    // Fallback de ingreso si no tiene registrado
    if (projIncome === 0 && projEstimatedCost > 0) {
      projIncome = projEstimatedCost * 1.5; // Estimado con un 33% margen base si no hay OV
    }

    totalSoldHours += projSoldHours;
    totalConsumedHours += projConsumedHours;
    totalEstimatedCost += projEstimatedCost;
    totalRealCost += projRealCost;
    totalIncome += projIncome;

    const grossProfit = projIncome - projRealCost;
    const marginPercent = projIncome > 0 ? (grossProfit / projIncome) * 100 : 0;
    const hourlyYield = projConsumedHours > 0 ? projIncome / projConsumedHours : 0;

    let status: 'alta' | 'optima' | 'ajustada' | 'perdida' = 'optima';
    if (marginPercent >= 40) status = 'alta';
    else if (marginPercent >= 20) status = 'optima';
    else if (marginPercent >= 0) status = 'ajustada';
    else status = 'perdida';

    projectProfitabilityList.push({
      id: p.id,
      name: p.name,
      clientName: p.clientName || 'Sin Cliente',
      income: projIncome,
      soldHours: projSoldHours,
      consumedHours: projConsumedHours,
      estimatedCost: projEstimatedCost,
      realCost: projRealCost,
      grossProfit,
      marginPercent: Number(marginPercent.toFixed(1)),
      hourlyYield: Number(hourlyYield.toFixed(0)),
      status
    });
  });

  const totalGrossProfit = totalIncome - totalRealCost;
  const grossMarginPercent = totalIncome > 0 ? (totalGrossProfit / totalIncome) * 100 : 0;
  const realHourlyYield = totalConsumedHours > 0 ? totalIncome / totalConsumedHours : 0;
  const targetHourlyYield = totalSoldHours > 0 ? totalIncome / totalSoldHours : 0;

  const costDeviation = totalEstimatedCost > 0 
    ? ((totalRealCost - totalEstimatedCost) / totalEstimatedCost) * 100 
    : 0;

  return { 
    totalSoldHours, 
    totalConsumedHours, 
    totalEstimatedCost, 
    totalRealCost, 
    costDeviation,
    totalIncome,
    totalGrossProfit,
    grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
    realHourlyYield: Number(realHourlyYield.toFixed(0)),
    targetHourlyYield: Number(targetHourlyYield.toFixed(0)),
    projectProfitabilityList
  };
};

// 2. Cálculo de Carga por Usuario (Casos de borde cubiertos: case-insensitivity, división por cero, duplicidad)
export const calculateTeamWorkload = (users: UserSession[], projects: Project[]) => {
  // Filtramos staff activo
  const activeStaff = users.filter(u => u.role !== 'invitado');

  return activeStaff.map(user => {
    let assignedHours = 0;
    let consumedHours = 0;
    let userActiveProjectsCount = 0;

    // Calcular cuántos colaboradores comparten el mismo rol para dividir el presupuesto asignado
    const peersWithSameRole = activeStaff.filter(u => u.role === user.role);
    const roleShareFactor = peersWithSameRole.length > 0 ? peersWithSameRole.length : 1;

    projects.forEach(p => {
      const isActive = p.phases && !p.phases.every(ph => ph.status === 'completed');
      
      // Filtrar entradas individuales de forma insensible a mayúsculas
      const userEntries = p.timeEntries?.filter(entry => 
        (entry.userId && entry.userId === user.id) || 
        (entry.username && entry.username.toLowerCase() === user.username.toLowerCase())
      ) || [];

      const individualConsumed = userEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      const roleBudget = p.budget ? p.budget[user.role] : null;

      if (isActive) {
        if (roleBudget && roleBudget.allocated > 0) {
          assignedHours += roleBudget.allocated / roleShareFactor;
        }

        if (individualConsumed > 0) {
          consumedHours += individualConsumed;
        } else if (roleBudget && roleBudget.consumed > 0) {
          // Si no tiene registros directos por nombre, dividimos proporcionalmente la porción de rol consumida
          consumedHours += roleBudget.consumed / roleShareFactor;
        }

        // Si tiene asignación de horas o ha consumido en este proyecto, se cuenta como activo para él
        if ((roleBudget && roleBudget.allocated > 0) || individualConsumed > 0) {
          userActiveProjectsCount++;
        }
      }
    });

    // Seguridad total contra divisiones por cero
    const grossCapacity = ROLE_CAPACITIES[user.role] || GROSS_MONTHLY_CAPACITY;
    const idleBuffer = grossCapacity * (IDLE_TIME_PERCENT / 100); // 38.4h
    const effectiveCapacity = grossCapacity - idleBuffer; // 153.6h
    
    const saturation = assignedHours > 0 ? (consumedHours / assignedHours) * 100 : 0;
    const effectiveSaturation = effectiveCapacity > 0 ? (consumedHours / effectiveCapacity) * 100 : 0;

    return {
      ...user,
      assignedHours: Number(assignedHours.toFixed(1)),
      consumedHours: Number(consumedHours.toFixed(1)),
      grossCapacity,
      idleBuffer,
      effectiveCapacity,
      saturation: Number(saturation.toFixed(1)),
      effectiveSaturation: Number(effectiveSaturation.toFixed(1)),
      activeProjectsCount: userActiveProjectsCount
    };
  });
};

// 3. Métricas de Retrabajo (Fase 1)
export interface RetrabajoStats {
  totalHoras: number;
  horasRetrabajo: number;
  porcentajeRetrabajo: number;
  porUsuario: Record<string, { username: string; role: string; horasRetrabajo: number; totalHoras: number }>;
  porOrigen: { cliente: number; interno: number; proveedor: number };
  entriesRetrabajo: TimeEntry[];
}

export function getRetrabajoStats(project: Project): RetrabajoStats {
  const entries = project.timeEntries || [];
  const totalHoras = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const entriesRetrabajo = entries.filter(e => e.type === 'retrabajo');
  const horasRetrabajo = entriesRetrabajo.reduce((sum, e) => sum + (e.hours || 0), 0);

  const porUsuario: Record<string, { username: string; role: string; horasRetrabajo: number; totalHoras: number }> = {};
  const porOrigen = { cliente: 0, interno: 0, proveedor: 0 };

  entries.forEach(e => {
    const key = e.userId || e.username || 'desconocido';
    if (!porUsuario[key]) {
      porUsuario[key] = { username: e.username || key, role: e.role || 'staff', horasRetrabajo: 0, totalHoras: 0 };
    }
    porUsuario[key].totalHoras += e.hours || 0;
    if (e.type === 'retrabajo') {
      porUsuario[key].horasRetrabajo += e.hours || 0;
      if (e.retrabajoOrigen && porOrigen[e.retrabajoOrigen] !== undefined) {
        porOrigen[e.retrabajoOrigen] += e.hours || 0;
      } else {
        porOrigen.interno += e.hours || 0;
      }
    }
  });

  return {
    totalHoras,
    horasRetrabajo,
    porcentajeRetrabajo: totalHoras > 0 ? (horasRetrabajo / totalHoras) * 100 : 0,
    porUsuario,
    porOrigen,
    entriesRetrabajo
  };
}

export function getGlobalRetrabajoStats(projects: Project[], users: UserSession[]) {
  let totalHorasGlobal = 0;
  let totalRetrabajoGlobal = 0;
  const porProyecto: { projectId: string; projectName: string; clientName: string; horasRetrabajo: number; totalHoras: number; porcentaje: number }[] = [];
  
  const porUsuario: Record<string, { userId: string; username: string; puesto: string; role: string; horasRetrabajo: number; totalHoras: number; porcentaje: number }> = {};

  users.forEach(u => {
    if (u.role !== 'invitado') {
      porUsuario[u.id] = {
        userId: u.id,
        username: u.username,
        puesto: u.puesto || u.role,
        role: u.role,
        horasRetrabajo: 0,
        totalHoras: 0,
        porcentaje: 0
      };
    }
  });

  projects.forEach(p => {
    const stats = getRetrabajoStats(p);
    totalHorasGlobal += stats.totalHoras;
    totalRetrabajoGlobal += stats.horasRetrabajo;

    if (stats.totalHoras > 0) {
      porProyecto.push({
        projectId: p.id,
        projectName: p.name,
        clientName: p.clientName,
        horasRetrabajo: stats.horasRetrabajo,
        totalHoras: stats.totalHoras,
        porcentaje: stats.porcentajeRetrabajo
      });
    }

    (p.timeEntries || []).forEach(e => {
      let uId = e.userId;
      if (!uId) {
        const found = users.find(u => u.username.toLowerCase() === e.username?.toLowerCase());
        if (found) uId = found.id;
      }
      if (uId && porUsuario[uId]) {
        porUsuario[uId].totalHoras += e.hours || 0;
        if (e.type === 'retrabajo') {
          porUsuario[uId].horasRetrabajo += e.hours || 0;
        }
      }
    });
  });

  Object.values(porUsuario).forEach(u => {
    u.porcentaje = u.totalHoras > 0 ? (u.horasRetrabajo / u.totalHoras) * 100 : 0;
  });

  porProyecto.sort((a, b) => b.horasRetrabajo - a.horasRetrabajo);
  const usuariosList = Object.values(porUsuario).sort((a, b) => b.horasRetrabajo - a.horasRetrabajo);

  return {
    totalHorasGlobal,
    totalRetrabajoGlobal,
    porcentajeGlobal: totalHorasGlobal > 0 ? (totalRetrabajoGlobal / totalHorasGlobal) * 100 : 0,
    porProyecto,
    usuariosList
  };
}

export function getRetrabajoBadgeStyle(percent: number) {
  if (percent < 10) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Bajo (<10%)' };
  }
  if (percent <= 20) {
    return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Moderado (10-20%)' };
  }
  return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Crítico (>20%)' };
}


