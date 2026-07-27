import { useMemo } from 'react';
import { Project, SlaAlert } from '../types';
import { runSlaRuleEngine } from '../utils/slaRuleEngine';

export interface DeliverableMonitoringResult {
  alerts: SlaAlert[];
  criticalAlerts: SlaAlert[];
  warningAlerts: SlaAlert[];
  overdueProjectIds: Set<string>;
  approachingProjectIds: Set<string>;
  isProjectOverdue: (projectId: string) => boolean;
  isProjectApproaching: (projectId: string) => boolean;
  getProjectAlertSeverity: (projectId: string) => 'critical' | 'warning' | 'normal';
}

/**
 * Custom Hook: useDeliverableMonitoring
 * Monitorea las fechas límite de entregables, fases y SLA del sistema.
 * Marca en rojo los proyectos con entregables o fases vencidas o críticas.
 */
export function useDeliverableMonitoring(projects: Project[]): DeliverableMonitoringResult {
  const alerts = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    return runSlaRuleEngine(projects);
  }, [projects]);

  const criticalAlerts = useMemo(() => {
    return alerts.filter(a => a.severity === 'critical');
  }, [alerts]);

  const warningAlerts = useMemo(() => {
    return alerts.filter(a => a.severity === 'warning');
  }, [alerts]);

  const overdueProjectIds = useMemo(() => {
    const ids = new Set<string>();
    criticalAlerts.forEach(a => ids.add(a.projectId));
    return ids;
  }, [criticalAlerts]);

  const approachingProjectIds = useMemo(() => {
    const ids = new Set<string>();
    warningAlerts.forEach(a => ids.add(a.projectId));
    return ids;
  }, [warningAlerts]);

  const isProjectOverdue = (projectId: string): boolean => {
    return overdueProjectIds.has(projectId);
  };

  const isProjectApproaching = (projectId: string): boolean => {
    return approachingProjectIds.has(projectId);
  };

  const getProjectAlertSeverity = (projectId: string): 'critical' | 'warning' | 'normal' => {
    if (overdueProjectIds.has(projectId)) return 'critical';
    if (approachingProjectIds.has(projectId)) return 'warning';
    return 'normal';
  };

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    overdueProjectIds,
    approachingProjectIds,
    isProjectOverdue,
    isProjectApproaching,
    getProjectAlertSeverity,
  };
}
