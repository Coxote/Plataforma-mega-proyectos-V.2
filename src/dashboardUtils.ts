import { Project, UserSession, ROLE_HOURLY_RATES, Role } from './types';

// Dynamic capacity in hours per month based on role
export const ROLE_CAPACITIES: Record<Role, number> = {
  coordinador: 160,
  sac: 160,
  contents: 140,
  contentd: 140,
  invitado: 0
};

// 1. Cálculos Financieros Globales
export const calculateGlobalFinancials = (projects: Project[]) => {
  let totalSoldHours = 0;
  let totalConsumedHours = 0;
  let totalEstimatedCost = 0;
  let totalRealCost = 0;

  projects.forEach(p => {
    // Usamos hoursTotal como las horas vendidas / presupuestadas globales del proyecto
    totalSoldHours += p.hoursTotal || 0;
    
    // Costo estimado y real basados en el desglose de presupuesto de roles
    if (p.budget) {
      Object.keys(p.budget).forEach((roleKey) => {
        const role = roleKey as Role;
        const allocated = p.budget[role]?.allocated || 0;
        const consumed = p.budget[role]?.consumed || 0;
        const rate = ROLE_HOURLY_RATES[role] || 0;

        totalEstimatedCost += allocated * rate;
        totalRealCost += consumed * rate;
        totalConsumedHours += consumed;
      });
    }
  });

  const costDeviation = totalEstimatedCost > 0 
    ? ((totalRealCost - totalEstimatedCost) / totalEstimatedCost) * 100 
    : 0;

  return { 
    totalSoldHours, 
    totalConsumedHours, 
    totalEstimatedCost, 
    totalRealCost, 
    costDeviation 
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
    const saturation = assignedHours > 0 ? (consumedHours / assignedHours) * 100 : 0;

    return {
      ...user,
      assignedHours: Number(assignedHours.toFixed(1)),
      consumedHours: Number(consumedHours.toFixed(1)),
      saturation: Number(saturation.toFixed(1)),
      activeProjectsCount: userActiveProjectsCount
    };
  });
};

