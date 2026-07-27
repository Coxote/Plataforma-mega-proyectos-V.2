import { Project, SlaAlert, DeliverableItem } from '../types';

/**
 * Motor de Reglas SLA y Vencimientos
 * Compara la fecha actual con los plazos de las fases, proyectos y entregables
 * para proyectos activos, generando alertas clasificadas por severidad.
 */
export function runSlaRuleEngine(projects: Project[], currentDate: Date = new Date()): SlaAlert[] {
  const alerts: SlaAlert[] = [];
  const nowMs = currentDate.getTime();

  projects.forEach((project) => {
    // Evaluar solo proyectos activos (aquellos que tengan al menos una fase sin completar)
    const isProjectActive = project.phases.some((ph) => ph.status !== 'completed');
    if (!isProjectActive) return;

    // 1. Evaluación de Fecha Límite Global del Proyecto
    if (project.endDate) {
      const projEndDate = new Date(project.endDate);
      if (!isNaN(projEndDate.getTime())) {
        projEndDate.setHours(23, 59, 59, 999);
        const diffDays = Math.ceil((projEndDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alerts.push({
            id: `alert-proj-overdue-${project.id}`,
            projectId: project.id,
            projectName: project.name,
            clientName: project.clientName,
            type: 'phase_overdue',
            severity: 'critical',
            targetType: 'proyecto',
            title: `Proyecto Vencido: ${project.name}`,
            message: `El plazo final del proyecto (${project.endDate}) expiró hace ${Math.abs(diffDays)} día(s).`,
            dueDate: project.endDate,
            daysDiff: diffDays
          });
        } else if (diffDays <= 3) {
          alerts.push({
            id: `alert-proj-appr-${project.id}`,
            projectId: project.id,
            projectName: project.name,
            clientName: project.clientName,
            type: 'phase_approaching',
            severity: 'warning',
            targetType: 'proyecto',
            title: `Plazo de Proyecto Próximo a Vencer`,
            message: `Quedan solo ${diffDays} día(s) para la fecha final acordada (${project.endDate}).`,
            dueDate: project.endDate,
            daysDiff: diffDays
          });
        }
      }
    }

    // 2. Evaluación de Fases del Proyecto
    project.phases.forEach((phase) => {
      if (phase.status === 'completed') return;

      // Buscar fecha de entrega en los campos de la fase
      const fechaEntregaStr = phase.fields?.fechaEntrega || phase.fields?.fechaFin;
      let phaseDueDate: Date | null = null;

      if (fechaEntregaStr) {
        const d = new Date(fechaEntregaStr);
        if (!isNaN(d.getTime())) phaseDueDate = d;
      }

      // Si es la fase activa del proyecto y no tiene fecha en campos, usar fecha de fin del proyecto
      if (!phaseDueDate && phase.id === project.activePhaseId && project.endDate) {
        const d = new Date(project.endDate);
        if (!isNaN(d.getTime())) phaseDueDate = d;
      }

      if (phaseDueDate) {
        phaseDueDate.setHours(23, 59, 59, 999);
        const diffDays = Math.ceil((phaseDueDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alerts.push({
            id: `alert-phase-overdue-${project.id}-${phase.id}`,
            projectId: project.id,
            projectName: project.name,
            clientName: project.clientName,
            phaseId: phase.id,
            phaseLabel: phase.label,
            type: 'phase_overdue',
            severity: 'critical',
            targetType: 'fase',
            title: `Fase Vencida (${phase.label}): ${project.name}`,
            message: `La fase "${phase.label}" superó la fecha límite (${phaseDueDate.toISOString().split('T')[0]}) hace ${Math.abs(diffDays)} día(s).`,
            dueDate: phaseDueDate.toISOString().split('T')[0],
            daysDiff: diffDays
          });
        } else if (diffDays <= 3 && phase.status === 'active') {
          alerts.push({
            id: `alert-phase-appr-${project.id}-${phase.id}`,
            projectId: project.id,
            projectName: project.name,
            clientName: project.clientName,
            phaseId: phase.id,
            phaseLabel: phase.label,
            type: 'phase_approaching',
            severity: 'warning',
            targetType: 'fase',
            title: `Fase Próxima a Vencer (${phase.label})`,
            message: `La fase activa "${phase.label}" vence en ${diffDays} día(s) (${phaseDueDate.toISOString().split('T')[0]}).`,
            dueDate: phaseDueDate.toISOString().split('T')[0],
            daysDiff: diffDays
          });
        }
      }
    });

    // 3. Evaluación de Entregables de la Fase (SLA)
    (project.deliverables || []).forEach((deliverable: DeliverableItem) => {
      if (deliverable.status === 'aprobado') return;

      const createdDate = new Date(deliverable.createdAt);
      if (isNaN(createdDate.getTime())) return;

      // SLA estándar: 3 días (72 hrs) desde la creación/subida para aprobación del cliente
      const slaDueDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      slaDueDate.setHours(23, 59, 59, 999);
      const diffDays = Math.ceil((slaDueDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alerts.push({
          id: `alert-deliv-overdue-${project.id}-${deliverable.id}`,
          projectId: project.id,
          projectName: project.name,
          clientName: project.clientName,
          deliverableId: deliverable.id,
          deliverableTitle: deliverable.title,
          phaseId: deliverable.phaseId,
          type: 'deliverable_overdue',
          severity: 'critical',
          targetType: 'entregable',
          title: `Entregable Vencido por SLA: ${deliverable.title}`,
          message: `El entregable "${deliverable.title}" está en estado ${deliverable.status || 'pendiente'} y superó el tiempo máximo de SLA por ${Math.abs(diffDays)} día(s).`,
          dueDate: slaDueDate.toISOString().split('T')[0],
          daysDiff: diffDays
        });
      } else if (diffDays <= 2) {
        alerts.push({
          id: `alert-deliv-appr-${project.id}-${deliverable.id}`,
          projectId: project.id,
          projectName: project.name,
          clientName: project.clientName,
          deliverableId: deliverable.id,
          deliverableTitle: deliverable.title,
          phaseId: deliverable.phaseId,
          type: 'deliverable_approaching',
          severity: 'warning',
          targetType: 'entregable',
          title: `Entregable Próximo a Expirar SLA`,
          message: `El entregable "${deliverable.title}" requiere aprobación o revisión. Expira el SLA en ${diffDays} día(s).`,
          dueDate: slaDueDate.toISOString().split('T')[0],
          daysDiff: diffDays
        });
      }
    });

    // 4. Alerta de Consumo de Horas (Exceso o Riesgo)
    const totalConsumed = project.budget
      ? Object.values(project.budget).reduce((s, r) => s + (r.consumed || 0), 0)
      : 0;
    const totalSold = project.hoursTotal || 40;
    if (totalSold > 0 && totalConsumed >= totalSold * 0.9) {
      alerts.push({
        id: `alert-hours-overflow-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        clientName: project.clientName,
        type: 'hours_overflow',
        severity: totalConsumed >= totalSold ? 'critical' : 'warning',
        targetType: 'proyecto',
        title: totalConsumed >= totalSold ? `Límite de Horas Excedido` : `Alerta de Presupuesto (>90%)`,
        message: `El proyecto consumió ${totalConsumed}h de ${totalSold}h vendidas (${Math.round((totalConsumed / totalSold) * 100)}%).`,
        dueDate: new Date().toISOString().split('T')[0],
        daysDiff: 0
      });
    }
  });

  // Ordenar: Críticos primero, luego por desfase de días
  return alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return a.daysDiff - b.daysDiff;
  });
}
