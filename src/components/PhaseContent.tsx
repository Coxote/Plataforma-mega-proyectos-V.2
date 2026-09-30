import { Phase, Project, DeliverableItem, Role, ClientAnnotation, DecisionLogEntry, UserSession, AuditLogEntry, ChecklistItem, Client, DeliverableHistoryEntry, getUserAvatarUrl } from '../types';
import {
  CheckSquare,
  Square,
  CheckCircle2,
  Save,
  Sparkles,
  User,
  Briefcase,
  AlertTriangle,
  ClipboardList,
  FileCode,
  Link,
  MessageSquare,
  Plus,
  Trash,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  AlertCircle,
  Users,
  TrendingUp,
  RotateCcw,
  DollarSign,
  Calendar,
  Clock,
  Download,
  History,
  BookOpen,
  Check,
  ShieldAlert,
  Edit2,
  Filter,
  Search,
  X,
  Lock,
  FileCheck
} from 'lucide-react';
import React, { useState } from 'react';
import { RaciMatrix } from './RaciMatrix';
import { PerfilGeneral } from './PerfilGeneral';
import { ProjectFinancialOverview } from './ProjectFinancialOverview';
import { StackedHoursBar } from './StackedHoursBar';
import { getRetrabajoStats } from '../dashboardUtils';

interface PhaseContentProps {
  activePhase: Phase;
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onSave: () => void;
  onCompletePhase: () => void;
  showSaveToast: boolean;
  userRole: Role;
  currentUser?: UserSession;
  clients?: Client[];
}

export const getCleanPhaseTitle = (label: string, id: string, index?: number) => {
  if (!label) return `Fase ${index !== undefined ? index + 1 : ''}`.trim();
  let clean = label.replace(/^custom-ph-[^\s]+\s*/i, '').trim();
  if (!clean || clean.startsWith('custom-ph-')) {
    clean = `Fase ${index !== undefined ? index + 1 : ''}`.trim();
  }
  return clean;
};

const getAuditTagInfo = (log: Partial<AuditLogEntry>) => {
  const explicitTag = (log.tag || '').toUpperCase();
  const action = (log.action || '').toUpperCase();
  if (explicitTag === 'ORDEN_VENTA' || action.includes('OV') || action.includes('ORDEN')) {
    return { tag: 'ORDEN_VENTA', label: 'Orden de Venta', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
  if (explicitTag === 'ACUERDO_CLIENTE' || action.includes('ACUERDO') || action.includes('DECISION')) {
    return { tag: 'ACUERDO_CLIENTE', label: 'Acuerdo Cliente', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (explicitTag === 'ENTREGABLE_SUBIDO' || action.includes('ENTREGABLE')) {
    return { tag: explicitTag || 'ENTREGABLE', label: action.includes('VISTO') ? 'Revisión' : 'Entregable', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  }
  if (explicitTag === 'ENTREGABLE_CAMBIOS' || action.includes('MODIFICACION_ENTREGABLE')) {
    return { tag: 'ENTREGABLE_CAMBIOS', label: 'Cambios', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
  }
  if (explicitTag === 'CHECKLIST' || action.includes('PASO') || action.includes('CHECKLIST')) {
    return { tag: 'CHECKLIST', label: 'Checklist', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (explicitTag === 'CRONOGRAMA' || action.includes('FASE')) {
    return { tag: 'CRONOGRAMA', label: 'Cronograma', color: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  if (explicitTag === 'HORAS' || action.includes('HORAS')) {
    return { tag: 'HORAS', label: 'Horas', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
  return { tag: explicitTag || 'SISTEMA', label: explicitTag || 'Sistema', color: 'bg-stone-100 text-stone-700 border-stone-200' };
};

export default function PhaseContent({
  activePhase,
  project,
  onUpdateProject,
  onSave,
  onCompletePhase,
  showSaveToast,
  userRole,
  currentUser,
  clients = [],
}: PhaseContentProps) {
  const [activeTab, setActiveTab] = useState<'phase' | 'project' | 'deliverables' | 'history'>('phase');
  const [govSubTab, setGovSubTab] = useState<'bitacora' | 'raci'>('bitacora');

  // New Deliverable Form States
  const [delivTitle, setDelivTitle] = useState('');
  const [delivDescription, setDelivDescription] = useState('');
  const [delivType, setDelivType] = useState<'video' | 'audio' | 'pdf' | 'word' | 'image' | 'markdown' | 'link'>('link');
  const [delivUrl, setDelivUrl] = useState('');

  // Deliverable Editing States
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<'video' | 'audio' | 'pdf' | 'word' | 'image' | 'markdown' | 'link'>('link');
  const [editUrl, setEditUrl] = useState('');

  // Checklist Task text editing in Tab 1
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState<string>('');

  // Decision Log Form States
  const [decTitle, setDecTitle] = useState('');
  const [decCategory, setDecCategory] = useState<'Alcance' | 'Diseño' | 'Técnico' | 'Presupuesto' | 'Aprobación' | 'Otro'>('Alcance');
  const [decRationale, setDecRationale] = useState('');
  const [decApprovedBy, setDecApprovedBy] = useState('');
  const [auditPhaseFilter, setAuditPhaseFilter] = useState<string>('todos');
  const [auditTagFilter, setAuditTagFilter] = useState<string>('todos');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Phase & Checklist States & Calculations
  const activePhaseIndex = project.phases.findIndex((p) => p.id === activePhase.id);
  const isLastPhase = activePhaseIndex >= 0 && activePhaseIndex === project.phases.length - 1;

  // Calculate total hours logged for active phase
  const phaseTimeEntries = (project.timeEntries || []).filter(
    (entry) =>
      entry.phaseId === activePhase.id ||
      entry.phaseId === activePhase.label ||
      (activePhase.label && entry.phaseId && activePhase.label.toLowerCase().includes(entry.phaseId.toLowerCase()))
  );
  const totalPhaseHoursLogged = phaseTimeEntries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);

  // New task input state for checklist
  const [newPhaseTaskText, setNewPhaseTaskText] = useState('');
  const [delivPhaseId, setDelivPhaseId] = useState<string>(activePhase.id);

  // Handle updating individual checklist item fields (milestones, dates, learnings)
  const handleUpdateChecklistItemField = (
    itemId: string,
    field: keyof ChecklistItem,
    value: string
  ) => {
    if (userRole === 'invitado') return;
    const currentItem = (activePhase.checklist || []).find((c) => c.id === itemId);
    if (!currentItem || currentItem[field] === value) return;

    const updatedPhases = project.phases.map((p) => {
      if (p.id === activePhase.id) {
        const updatedChecklist = (p.checklist || []).map((item) => {
          if (item.id === itemId) {
            return { ...item, [field]: value };
          }
          return item;
        });
        return { ...p, checklist: updatedChecklist };
      }
      return p;
    });

    const fieldLabels: Record<string, string> = {
      milestones: 'Hitos y Avances',
      learnings: 'Lecciones Aprendidas',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Finalización',
      text: 'Texto del Paso'
    };

    const cleanTitle = getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex);
    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      username: currentUser?.username || 'Usuario',
      userRole: (currentUser?.role || userRole) as Role,
      action: 'MODIFICACION_TEXTO',
      entityType: 'Checklist',
      details: `Modificó ${fieldLabels[field] || field} en "${currentItem.text}" (${cleanTitle}): "${value.slice(0, 60)}${value.length > 60 ? '...' : ''}"`,
      phaseId: activePhase.id
    };

    onUpdateProject({
      ...project,
      phases: updatedPhases,
      auditLog: [newAuditEntry, ...(project.auditLog || [])]
    });
  };

  // Save edited task text directly
  const handleSaveEditedTaskText = (taskId: string, originalText: string) => {
    if (userRole === 'invitado') return;
    const newText = editingTaskText.trim();
    if (!newText || newText === originalText) {
      setEditingTaskId(null);
      return;
    }

    const cleanTitle = getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex);
    const updatedPhases = project.phases.map((p) => {
      if (p.id === activePhase.id) {
        const updatedChecklist = (p.checklist || []).map((item) => {
          if (item.id === taskId) {
            return { ...item, text: newText };
          }
          return item;
        });
        return { ...p, checklist: updatedChecklist };
      }
      return p;
    });

    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      username: currentUser?.username || 'Usuario',
      userRole: (currentUser?.role || userRole) as Role,
      action: 'MODIFICACION_TEXTO',
      entityType: 'Checklist',
      details: `Modificó el texto del paso en ${cleanTitle}: de "${originalText}" a "${newText}".`,
      phaseId: activePhase.id
    };

    onUpdateProject({
      ...project,
      phases: updatedPhases,
      auditLog: [newAuditEntry, ...(project.auditLog || [])]
    });
    setEditingTaskId(null);
    setEditingTaskText('');
    onSave();
  };

  // Add a new checklist step to current phase
  const handleAddChecklistTask = () => {
    if (!newPhaseTaskText.trim() || userRole === 'invitado') return;
    const cleanText = newPhaseTaskText.trim();
    const newItem: ChecklistItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: cleanText,
      completed: false,
      startDate: activePhase.startDate || new Date().toISOString().split('T')[0],
      endDate: activePhase.endDate || '',
      milestones: '',
      learnings: ''
    };

    const cleanTitle = getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex);
    const updatedPhases = project.phases.map((p) => {
      if (p.id === activePhase.id) {
        return { ...p, checklist: [...(p.checklist || []), newItem] };
      }
      return p;
    });

    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      username: currentUser?.username || 'Usuario',
      userRole: (currentUser?.role || userRole) as Role,
      action: 'NUEVO_PASO',
      entityType: 'Checklist',
      details: `Agregó nuevo paso al checklist de ${cleanTitle}: "${cleanText}".`,
      phaseId: activePhase.id
    };

    onUpdateProject({
      ...project,
      phases: updatedPhases,
      auditLog: [newAuditEntry, ...(project.auditLog || [])]
    });
    setNewPhaseTaskText('');
    onSave();
  };

  // Mark phase as completed
  const handleMarkPhaseCompleted = () => {
    if (userRole === 'invitado') return;
    const cleanTitle = getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex);
    const updatedPhases = project.phases.map((p) => {
      if (p.id === activePhase.id) {
        return {
          ...p,
          status: 'completed' as const,
          completedAt: new Date().toISOString()
        };
      }
      return p;
    });

    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      username: currentUser?.username || 'Usuario',
      userRole: userRole || 'coordinador',
      action: 'COMPLETAR_FASE',
      entityType: 'Fase',
      details: `Fase "${cleanTitle}" marcada como finalizada.`,
      phaseId: activePhase.id
    };

    onUpdateProject({
      ...project,
      phases: updatedPhases,
      auditLog: [newAuditEntry, ...(project.auditLog || [])]
    });
  };

  // Download single phase report (.md document)
  const handleDownloadPhase = (phase: Phase) => {
    const cleanTitle = getCleanPhaseTitle(phase.label, phase.id, project.phases.findIndex(p => p.id === phase.id));
    const phaseEntries = (project.timeEntries || []).filter(t => t.phaseId === phase.id || t.phaseId === phase.label);
    const phaseHours = phaseEntries.reduce((s, t) => s + (Number(t.hours) || 0), 0);

    let md = `# Expediente de Fase: ${cleanTitle}\n`;
    md += `**Proyecto:** ${project.name}\n`;
    md += `**Cliente:** ${project.clientName}\n`;
    md += `**Estado de la Fase:** ${phase.status === 'completed' ? 'Completada' : 'En Progreso'}\n`;
    md += `**Fecha de Finalización:** ${phase.completedAt ? new Date(phase.completedAt).toLocaleDateString('es-CL') : 'En curso'}\n`;
    md += `**Tiempo Total Consumido:** ${phaseHours} horas\n\n`;

    md += `## Checklist, Hitos, Avances y Aprendizajes\n\n`;
    if (phase.checklist && phase.checklist.length > 0) {
      phase.checklist.forEach((item, idx) => {
        md += `### ${idx + 1}. [${item.completed ? 'X' : ' '}] ${item.text}\n`;
        if (item.startDate) md += `- **Fecha Inicio:** ${item.startDate}\n`;
        if (item.endDate) md += `- **Fecha Finalización:** ${item.endDate}\n`;
        if (item.milestones) md += `- **Hitos y Avances:** ${item.milestones}\n`;
        if (item.learnings) md += `- **Aprendizaje / Lecciones:** ${item.learnings}\n`;
        md += `\n`;
      });
    } else {
      md += `*Sin tareas en el checklist.*\n\n`;
    }

    if (phase.fields && Object.keys(phase.fields).length > 0) {
      md += `## Campos Específicos de la Fase\n\n`;
      Object.entries(phase.fields).forEach(([key, val]) => {
        if (val) {
          md += `- **${key.toUpperCase()}:** ${val}\n`;
        }
      });
      md += `\n`;
    }

    md += `---\n*Documentación de Fase descargada el ${new Date().toLocaleDateString('es-CL')}*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expediente_Fase_${cleanTitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download complete project document with all phases & movement history
  const handleDownloadFullProject = () => {
    let md = `# Expediente Completo del Proyecto: ${project.name}\n`;
    md += `**Cliente:** ${project.clientName}\n`;
    md += `**Fecha de Inicio:** ${project.startDate || 'N/A'}\n`;
    md += `**Fecha de Término:** ${project.endDate || 'N/A'}\n`;
    md += `**Horas Presupuestadas:** ${project.hoursTotal || 0} hrs\n`;
    md += `**Monto Presupuesto:** $${(project.totalIncome || 0).toLocaleString('es-CL')} ${project.currency || 'USD'}\n\n`;

    md += `## 1. Documentación de Todas las Fases y Checklists\n\n`;
    project.phases.forEach((p, idx) => {
      const cleanTitle = getCleanPhaseTitle(p.label, p.id, idx);
      const pEntries = (project.timeEntries || []).filter(t => t.phaseId === p.id || t.phaseId === p.label);
      const pHours = pEntries.reduce((s, t) => s + (Number(t.hours) || 0), 0);

      md += `### Fase ${idx + 1}: ${cleanTitle}\n`;
      md += `- **Estatus:** ${p.status === 'completed' ? 'Completada' : 'En Progreso'}\n`;
      md += `- **Horas Consumidas:** ${pHours}h\n`;
      md += `- **Fecha de Cierre:** ${p.completedAt ? new Date(p.completedAt).toLocaleDateString('es-CL') : 'Pendiente'}\n\n`;

      if (p.checklist && p.checklist.length > 0) {
        md += `#### Checklist de Actividades, Hitos y Aprendizajes:\n`;
        p.checklist.forEach((item, itemIdx) => {
          md += `${itemIdx + 1}. [${item.completed ? 'X' : ' '}] ${item.text}\n`;
          if (item.startDate) md += `   - Fecha Inicio: ${item.startDate}\n`;
          if (item.endDate) md += `   - Fecha Término: ${item.endDate}\n`;
          if (item.milestones) md += `   - Hitos y Avances: ${item.milestones}\n`;
          if (item.learnings) md += `   - Aprendizaje: ${item.learnings}\n`;
        });
        md += `\n`;
      }

      if (p.fields && Object.keys(p.fields).length > 0) {
        md += `#### Campos de Fase:\n`;
        Object.entries(p.fields).forEach(([k, v]) => {
          if (v) md += `- **${k}:** ${v}\n`;
        });
        md += `\n`;
      }
    });

    md += `## 2. Historial de Todos los Movimientos del Proyecto\n\n`;
    const fullLog = (project.auditLog && project.auditLog.length > 0)
      ? project.auditLog
      : (project.timeEntries || []).map(te => ({
          id: `te-${te.id}`,
          timestamp: te.createdAt || te.date || new Date().toISOString(),
          userId: te.userId,
          username: te.username,
          userRole: te.role,
          action: 'REGISTRO_HORAS',
          entityType: 'Horas',
          details: `Registro de ${te.hours}h: "${te.description || 'Avance en proyecto'}"`,
          phaseId: te.phaseId
        }));

    if (fullLog.length > 0) {
      fullLog.forEach((log) => {
        md += `- [${new Date(log.timestamp).toLocaleString('es-CL')}] **${log.username}** (${log.userRole}): ${log.action} - ${log.details}\n`;
      });
    } else {
      md += `- Proyecto iniciado el ${new Date(project.createdAt || Date.now()).toLocaleDateString('es-CL')}\n`;
    }

    md += `\n---\n*Expediente completo descargado el ${new Date().toLocaleDateString('es-CL')}*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expediente_Proyecto_Completo_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildHistoryRecords = (): AuditLogEntry[] => [
    ...(project.auditLog || []),
    ...(project.timeEntries || []).map((te) => ({
      id: `te-${te.id}`,
      timestamp: te.createdAt || te.date || new Date().toISOString(),
      userId: te.userId,
      username: te.username || 'Colaborador',
      userRole: te.role as Role,
      action: 'REGISTRO_HORAS',
      entityType: 'Horas',
      details: `Registro de ${te.hours}h: "${te.description || 'Avance de trabajo'}"`,
      phaseId: te.phaseId,
      tag: 'HORAS'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const buildHistoryMarkdown = (records: AuditLogEntry[]) => {
    let md = `# Historial / Bitácora del Proyecto: ${project.name}\n\n`;
    md += `**Cliente:** ${project.clientName || 'N/A'}\n`;
    md += `**Exportado:** ${new Date().toLocaleString('es-CL')}\n`;
    md += `**Registros:** ${records.length}\n\n`;
    records.forEach((log) => {
      const tagInfo = getAuditTagInfo(log);
      md += `## ${new Date(log.timestamp).toLocaleString('es-CL')} - ${log.action}\n`;
      md += `- **Tag:** ${tagInfo.label}\n`;
      md += `- **Usuario:** ${log.username || 'Sistema'} (${log.userRole || 'N/A'})\n`;
      md += `- **Entidad:** ${log.entityType || 'Registro'}\n`;
      if (log.phaseId) md += `- **Fase:** ${log.phaseId}\n`;
      md += `- **Detalle:** ${log.details || ''}\n\n`;
    });
    return md;
  };

  const handleDownloadHistoryMD = () => {
    const records = buildHistoryRecords();
    const blob = new Blob([buildHistoryMarkdown(records)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bitacora_Historial_${(project.name || 'Proyecto').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHistoryPDF = () => {
    const records = buildHistoryRecords();
    const rows = records.map((log) => {
      const tagInfo = getAuditTagInfo(log);
      return `
        <article style="border-bottom:1px solid #e2e8f0;padding:14px 0;">
          <div style="font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.08em;">${tagInfo.label} · ${log.entityType || 'Registro'}</div>
          <h2 style="font-size:15px;margin:4px 0;color:#0f172a;">${log.action}</h2>
          <p style="font-size:12px;color:#334155;margin:0 0 8px;">${log.details || ''}</p>
          <div style="font-size:11px;color:#64748b;">${log.username || 'Sistema'} · ${new Date(log.timestamp).toLocaleString('es-CL')}${log.phaseId ? ` · Fase: ${log.phaseId}` : ''}</div>
        </article>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Historial ${project.name}</title></head>
        <body style="font-family:Inter,Segoe UI,sans-serif;padding:32px;color:#0f172a;">
          <h1 style="margin:0 0 4px;">Historial / Bitácora del Proyecto</h1>
          <p style="margin:0 0 24px;color:#64748b;">${project.name} · ${project.clientName || 'Cliente no especificado'} · ${records.length} registros</p>
          ${rows || '<p>Sin registros.</p>'}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const isGeneralDisabled = userRole === 'contents' || userRole === 'contentd' || userRole === 'invitado';
  const isPhaseDisabled = userRole === 'invitado';

  // Handle general project text changes
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isGeneralDisabled) return;
    const { name, value } = e.target;
    onUpdateProject({
      ...project,
      [name]: value,
    });
  };

  // Handle phase-specific custom field changes
  const handleSpecificFieldChange = (fieldName: string, value: string) => {
    if (isPhaseDisabled) return;
    const updatedPhases = project.phases.map((p) => {
      if (p.id === activePhase.id) {
        return {
          ...p,
          fields: {
            ...p.fields,
            [fieldName]: value,
          },
        };
      }
      return p;
    });

    onUpdateProject({
      ...project,
      phases: updatedPhases,
    });
  };

  // Handle checklist toggles
  const handleToggleChecklist = (itemId: string) => {
    if (userRole === 'invitado') return;
    const currentItem = (activePhase.checklist || []).find((c) => c.id === itemId);
    const newCompleted = !currentItem?.completed;

    const updatedPhases = project.phases.map((p) => {
      if (p.id === activePhase.id) {
        const updatedChecklist = p.checklist.map((item) => {
          if (item.id === itemId) {
            return { ...item, completed: newCompleted };
          }
          return item;
        });
        return { ...p, checklist: updatedChecklist };
      }
      return p;
    });

    const cleanTitle = getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex);
    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      username: currentUser?.username || 'Usuario',
      userRole: (currentUser?.role || userRole) as Role,
      action: newCompleted ? 'PASO_COMPLETADO' : 'PASO_REABIERTO',
      entityType: 'Checklist',
      details: `${newCompleted ? 'Completó' : 'Reabrió'} el paso "${currentItem?.text || 'Paso'}" en ${cleanTitle}.`,
      phaseId: activePhase.id
    };

    onUpdateProject({
      ...project,
      phases: updatedPhases,
      auditLog: [newAuditEntry, ...(project.auditLog || [])]
    });
    onSave();
  };

  // Add a new deliverable (uploaded by design or social media, pending internal review check)
  const handleAddDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivTitle.trim()) return;

    const nowIso = new Date().toISOString();
    const uploader = currentUser?.username || (userRole === 'coordinador' ? 'Coordinador de Proyectos' : 'Diseño / Social Media');
    const uploaderRole = currentUser?.role || userRole || 'contentd';
    const targetPhaseId = delivPhaseId || activePhase.id;
    const targetPhase = project.phases.find(p => p.id === targetPhaseId);
    const cleanPTitle = targetPhase ? getCleanPhaseTitle(targetPhase.label, targetPhase.id) : activePhase.label;

    const initialHistoryEntry: DeliverableHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: nowIso,
      action: 'subido',
      username: uploader,
      userRole: uploaderRole,
      details: `Subió el entregable inicial "${delivTitle.trim()}" (${delivType}) para revisión interna.`
    };

    const newItem: DeliverableItem = {
      id: `deliv-${Date.now()}`,
      title: delivTitle.trim(),
      description: delivDescription.trim() || undefined,
      type: delivType,
      externalUrl: delivUrl.trim() || undefined,
      uploadedBy: uploader,
      uploadedByRole: uploaderRole,
      createdAt: nowIso,
      phaseId: targetPhaseId,
      status: 'en_revision',
      internalCheckPassed: false, // Inicia sin visto bueno
      isVisibleToClient: false,    // No visible al cliente hasta visto bueno interno
      history: [initialHistoryEntry],
      annotations: [],
    };

    const updatedDeliverables = [...(project.deliverables || []), newItem];
    const newAuditLog: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: nowIso,
      userId: currentUser?.id || 'internal',
      username: uploader,
      userRole: uploaderRole as Role,
      action: 'NUEVO_ENTREGABLE',
      entityType: 'Entregable',
      details: `Subió arte/entregable "${delivTitle.trim()}" (${delivType}) en fase ${cleanPTitle}. Pendiente de visto bueno interno.`,
      phaseId: targetPhaseId
    };

    onUpdateProject({
      ...project,
      deliverables: updatedDeliverables,
      auditLog: [newAuditLog, ...(project.auditLog || [])],
    });

    setDelivTitle('');
    setDelivDescription('');
    setDelivUrl('');
    onSave();
  };

  // Visto bueno interno (check de revisado internamente para hacer visible al cliente automáticamente)
  const handleInternalReviewCheck = (deliverableId: string) => {
    if (userRole === 'invitado') return;
    const target = (project.deliverables || []).find((d) => d.id === deliverableId);
    if (!target) return;

    const reviewerName = currentUser?.username || 'Coordinador';
    const reviewerRole = currentUser?.role || userRole || 'coordinador';
    const nowIso = new Date().toISOString();
    const nextCheckState = !target.internalCheckPassed;

    const reviewHistEntry: DeliverableHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: nowIso,
      action: nextCheckState ? 'revision_interna_aprobada' : 'modificado',
      username: reviewerName,
      userRole: reviewerRole,
      details: nextCheckState
        ? `Revisado y aprobado internamente con visto bueno. Se habilitó automáticamente para el cliente.`
        : `Se desmarcó el visto bueno interno. Entregable vuelve a estar oculto para el cliente.`
    };

    const updatedDeliverables = (project.deliverables || []).map((d) => {
      if (d.id === deliverableId) {
        return {
          ...d,
          internalCheckPassed: nextCheckState,
          reviewedBy: nextCheckState ? reviewerName : undefined,
          reviewedAt: nextCheckState ? nowIso : undefined,
          isVisibleToClient: nextCheckState, // Automáticamente visible para el cliente al dar check
          history: [...(d.history || []), reviewHistEntry]
        };
      }
      return d;
    });

    const newAuditLog: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: nowIso,
      userId: currentUser?.id || 'sys',
      username: reviewerName,
      userRole: reviewerRole as Role,
      action: nextCheckState ? 'VISTO_BUENO_ENTREGABLE' : 'REVOCAR_VISTO_BUENO',
      entityType: 'Entregable',
      details: nextCheckState
        ? `Dio check de visto bueno interno a "${target.title}". Ahora es visible automáticamente para el cliente.`
        : `Desmarcó visto bueno interno a "${target.title}". Ahora es oculto para el cliente.`,
      phaseId: target.phaseId || activePhase.id
    };

    onUpdateProject({
      ...project,
      deliverables: updatedDeliverables,
      auditLog: [newAuditLog, ...(project.auditLog || [])]
    });
    onSave();
  };

  // Guardar edición de entregable (modificación de texto, link, descripción)
  const handleSaveEditedDeliverable = (deliverableId: string) => {
    if (userRole === 'invitado') return;
    const target = (project.deliverables || []).find((d) => d.id === deliverableId);
    if (!target) return;

    const editorName = currentUser?.username || 'Usuario';
    const editorRole = currentUser?.role || userRole;
    const nowIso = new Date().toISOString();

    const editHistEntry: DeliverableHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: nowIso,
      action: 'modificado',
      username: editorName,
      userRole: editorRole,
      details: `Modificó datos del entregable: título, descripción o enlace.`
    };

    const updatedDeliverables = (project.deliverables || []).map((d) => {
      if (d.id === deliverableId) {
        return {
          ...d,
          title: editTitle.trim() || d.title,
          description: editDescription.trim(),
          type: editType,
          externalUrl: editUrl.trim() || undefined,
          history: [...(d.history || []), editHistEntry]
        };
      }
      return d;
    });

    const newAuditLog: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: nowIso,
      userId: currentUser?.id || 'sys',
      username: editorName,
      userRole: editorRole as Role,
      action: 'MODIFICACION_ENTREGABLE',
      entityType: 'Entregable',
      details: `Modificó el entregable "${editTitle.trim() || target.title}" (${editType}).`,
      phaseId: target.phaseId || activePhase.id
    };

    onUpdateProject({
      ...project,
      deliverables: updatedDeliverables,
      auditLog: [newAuditLog, ...(project.auditLog || [])]
    });
    setEditingDeliverableId(null);
    onSave();
  };

  // Delete deliverable
  const handleDeleteDeliverable = (id: string) => {
    const updated = (project.deliverables || []).filter((d) => d.id !== id);
    onUpdateProject({ ...project, deliverables: updated });
    onSave();
  };

  // Toggle visibility of deliverable to client manually
  const handleToggleVisibility = (id: string) => {
    const updated = (project.deliverables || []).map((d) => {
      if (d.id === id) {
        return { ...d, isVisibleToClient: !d.isVisibleToClient };
      }
      return d;
    });
    onUpdateProject({ ...project, deliverables: updated });
    onSave();
  };

  // Toggle status of client feedback annotations (resolved / pending)
  const handleToggleAnnotationStatus = (deliverableId: string, annotationId: string) => {
    const updatedDeliverables = (project.deliverables || []).map((d) => {
      if (d.id === deliverableId) {
        const updatedAnn = (d.annotations || []).map((ann) => {
          if (ann.id === annotationId) {
            return {
              ...ann,
              status: ann.status === 'resuelto' ? ('pendiente' as const) : ('resuelto' as const),
            };
          }
          return ann;
        });
        return { ...d, annotations: updatedAnn };
      }
      return d;
    });
    onUpdateProject({ ...project, deliverables: updatedDeliverables });
    onSave();
  };

  // Update deliverable status (Aprobado, Rechazado, En Revision, Pendiente)
  const handleUpdateDeliverableStatus = (deliverableId: string, newStatus: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado') => {
    const target = (project.deliverables || []).find((d) => d.id === deliverableId);
    if (!target) return;

    const updatedDeliverables = (project.deliverables || []).map((d) => {
      if (d.id === deliverableId) {
        return { ...d, status: newStatus };
      }
      return d;
    });

    const actionText = newStatus === 'aprobado' ? 'Aprobó' : newStatus === 'rechazado' ? 'Rechazó/Pidió Corrección' : 'Cambió estado a ' + newStatus;
    const authorName = userRole === 'invitado' ? 'Cliente / Invitado' : 'Equipo Interno';

    const newAuditLog = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'internal',
        username: authorName,
        userRole: userRole,
        action: 'Estado Entregable',
        entityType: 'Entregable',
        details: `${authorName} ${actionText} el entregable "${target.title}".`,
      },
      ...(project.auditLog || [])
    ];

    // If approved by client, also log in DecisionLog
    let updatedDecisionLog: DecisionLogEntry[] = project.decisionLog || [];
    if (newStatus === 'aprobado') {
      const decEntry: DecisionLogEntry = {
        id: `dec-${Date.now()}`,
        timestamp: new Date().toISOString(),
        author: authorName,
        userRole: userRole,
        title: `Aprobación de Entregable: ${target.title}`,
        description: `El cliente (${authorName}) aprobó formalmente el entregable publicado.`,
        category: 'aprobacion',
        rationale: `El cliente (${authorName}) aprobó formalmente el entregable publicado.`,
        approvedBy: authorName,
        phaseId: activePhase.id,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      updatedDecisionLog = [decEntry, ...updatedDecisionLog];
    }

    onUpdateProject({
      ...project,
      deliverables: updatedDeliverables,
      auditLog: newAuditLog,
      decisionLog: updatedDecisionLog,
    });
    onSave();
  };

  // Add new comment/annotation on deliverable
  const handleAddDeliverableAnnotation = (deliverableId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const authorName = userRole === 'invitado' ? 'Cliente / Invitado' : 'Coordinador / Equipo';

    const newAnnotation: ClientAnnotation = {
      id: `ann-${Date.now()}`,
      authorName: authorName,
      date: new Date().toLocaleDateString('es-CL'),
      comment: commentText.trim(),
      status: 'pendiente',
    };

    const updatedDeliverables = (project.deliverables || []).map((d) => {
      if (d.id === deliverableId) {
        return {
          ...d,
          annotations: [...(d.annotations || []), newAnnotation],
        };
      }
      return d;
    });

    onUpdateProject({ ...project, deliverables: updatedDeliverables });
    onSave();
  };

  // Add decision log entry
  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decTitle.trim()) return;

    const newDecision: DecisionLogEntry = {
      id: `dec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: decApprovedBy.trim() || 'Coordinador',
      userRole: userRole,
      title: decTitle.trim(),
      description: decRationale.trim() || decTitle.trim(),
      category: decCategory as any,
      rationale: decRationale.trim(),
      approvedBy: decApprovedBy.trim() || 'Coordinador',
      phaseId: activePhase.id,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const updatedDecisions = [newDecision, ...(project.decisionLog || [])];
    const newAuditLog = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'internal',
        username: 'Coordinador',
        userRole: userRole,
        action: 'Registro de Decisión',
        entityType: 'Decisión',
        details: `Registró acuerdo/decisión: "${decTitle}" en fase ${activePhase.id} (Categoría: ${decCategory}).`,
      },
      ...(project.auditLog || []),
    ];

    onUpdateProject({
      ...project,
      decisionLog: updatedDecisions,
      auditLog: newAuditLog,
    });

    setDecTitle('');
    setDecRationale('');
    setDecApprovedBy('');
    onSave();
  };

  const checklistItems = activePhase.checklist || [];
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
  const checklistTotal = checklistItems.length;
  const checklistPercent = checklistTotal > 0 ? Math.round((completedChecklistCount / checklistTotal) * 100) : 0;

  // Phase Exception Gate States
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionError, setExceptionError] = useState<string | null>(null);

  const timeEntries = project.timeEntries || [];
  const totalConsumedHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalHours = project.hoursTotal || 40;
  const retrabajoStats = getRetrabajoStats(project);

  const activeIndex = activePhaseIndex >= 0 ? activePhaseIndex : 0;
  const expectedMaxPercent = Math.round(((activeIndex + 1) / project.phases.length) * 100);
  const hoursPercent = totalHours > 0 ? Math.round((totalConsumedHours / totalHours) * 100) : 0;

  let calculatedHealth = 100;
  if (hoursPercent > expectedMaxPercent + 10) {
    calculatedHealth -= Math.round((hoursPercent - (expectedMaxPercent + 10)) * 1.5);
  }
  const finalHealth = Math.min(100, Math.max(15, calculatedHealth));

  // Phase Gate Completion Logic (Strict 100% Checklist Gate or Authorized Exception)
  const handleCompletePhaseClick = () => {
    if (activePhase.status === 'completed') {
      onCompletePhase();
      return;
    }

    const isGatePassed = checklistTotal === 0 || checklistPercent === 100;
    if (isGatePassed) {
      onCompletePhase();
    } else {
      setShowExceptionModal(true);
    }
  };

  const handleConfirmExceptionAndComplete = () => {
    if (!exceptionReason.trim()) {
      setExceptionError('Por favor especifica el motivo o justificación de la excepción para finalizar la fase con el checklist incompleto.');
      return;
    }
    setExceptionError(null);

    const exceptionLog: AuditLogEntry = {
      id: `audit-exc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys-coord',
      username: currentUser?.username || 'Coordinador',
      userRole: (currentUser?.role || 'coordinador') as Role,
      action: `EXCEPCION_FASE_GATE`,
      entityType: `Fase`,
      details: `Excepción Autorizada: Finalización de Fase "${activePhase.label}" al ${checklistPercent}% por: ${exceptionReason}`,
      phaseId: activePhase.id,
      tag: 'CRONOGRAMA'
    };

    const updatedAuditLog = [exceptionLog, ...(project.auditLog || [])];
    onUpdateProject({
      ...project,
      auditLog: updatedAuditLog
    });

    setShowExceptionModal(false);
    setExceptionReason('');
    onCompletePhase();
  };

  const isProveedor = userRole === 'proveedor' || currentUser?.role === 'proveedor';
  const visiblePhases = isProveedor
    ? project.phases.filter((p) => {
        if (currentUser?.fasesAsignadas && currentUser.fasesAsignadas.length > 0) {
          return currentUser.fasesAsignadas.some(
            (fa) => fa === p.id || fa.toLowerCase() === p.label?.toLowerCase() || p.id.toLowerCase().includes(fa.toLowerCase())
          );
        }
        const pLabel = (p.label || '').toLowerCase();
        const pId = (p.id || '').toLowerCase();
        return pLabel.includes('sprint') || pLabel.includes('qa') || pLabel.includes('desarrollo') || pId === 'a5' || pId === 'a6' || p.status === 'active';
      })
    : project.phases;

  const historyRecords = buildHistoryRecords();

  const historyTagOptions = Array.from(
    new Set(historyRecords.map((log) => getAuditTagInfo(log).tag).filter(Boolean))
  );

  const filteredHistoryRecords = historyRecords.filter((log) => {
    const tagInfo = getAuditTagInfo(log);
    const phaseLabel = log.phaseId
      ? getCleanPhaseTitle(
          project.phases.find(p => p.id === log.phaseId)?.label || log.phaseId,
          log.phaseId,
          project.phases.findIndex(p => p.id === log.phaseId)
        )
      : '';
    const haystack = `${log.username || ''} ${log.userRole || ''} ${log.action || ''} ${log.entityType || ''} ${log.details || ''} ${log.phaseId || ''} ${phaseLabel} ${tagInfo.label || ''} ${tagInfo.tag || ''}`.toLowerCase();
    const matchesSearch = !auditSearchQuery.trim() || haystack.includes(auditSearchQuery.trim().toLowerCase());
    const matchesTag = auditTagFilter === 'todos' || tagInfo.tag === auditTagFilter;
    const matchesPhase = auditPhaseFilter === 'todos' || log.phaseId === auditPhaseFilter;
    return matchesSearch && matchesTag && matchesPhase;
  });

  return (
    <main className="flex flex-col h-full overflow-hidden bg-white" id="phase-content-wrapper">

      {/* 1. TOP SUB-NAV PHASE PILLS BAR */}
      <div className="bg-[#ECEEE9] px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0" id="phase-pills-bar">
        {visiblePhases.map((p) => {
          const pIdx = project.phases.findIndex((item) => item.id === p.id);
          const isActive = p.id === activePhase.id;
          const cleanPTitle = getCleanPhaseTitle(p.label, p.id, pIdx >= 0 ? pIdx : 0);
          return (
            <button
              key={p.id}
              onClick={() => {
                onUpdateProject({
                  ...project,
                  activePhaseId: p.id,
                });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs font-extrabold'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-stone-50 shadow-2xs'
              }`}
            >
              <span>{cleanPTitle}</span>
            </button>
          );
        })}
      </div>

      {/* 2. MAIN PHASE HEADER */}
      <header className="px-6 py-3.5 border-b border-stone-100 bg-white shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="phase-header">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-xs">
            {project.clientName ? project.clientName.substring(0, 2).toUpperCase() : 'GL'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-700 bg-stone-100 px-2.5 py-0.5 rounded-full">
                {project.clientName || 'GLOBEX S.A.'}
              </span>
              <h2 className="text-base font-semibold text-slate-900 tracking-tight truncate">
                {project.name}
              </h2>
              <span className="px-2.5 py-0.5 text-xs rounded-full font-medium bg-stone-100 text-slate-700">
                • {activePhase.status === 'completed' ? 'Completada' : 'En Progreso'} ({getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex)})
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-xs text-lime-600 font-bold transition-all duration-300 flex items-center gap-1 ${
              showSaveToast ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" /> Cambios Guardados
          </span>

          {userRole !== 'invitado' && (
            <>
              <button
                onClick={onSave}
                className="bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold rounded-xl px-3.5 py-2 text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                id="btn-save-progress"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar
              </button>
              {/* Botón Finalizar Fase Intuitivo */}
              {activePhase.status === 'completed' ? (
                <div
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 shadow-2xs select-none"
                  id="btn-complete-phase"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Fase Finalizada</span>
                </div>
              ) : (checklistTotal === 0 || checklistPercent === 100) ? (
                <button
                  onClick={handleCompletePhaseClick}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-[0.99] cursor-pointer"
                  id="btn-complete-phase"
                  title="Checklist al 100% - Lista para finalizar fase"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Finalizar Fase (100% Listo)</span>
                </button>
              ) : (
                <button
                  onClick={handleCompletePhaseClick}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold rounded-xl px-3.5 py-2 text-xs transition-all flex items-center gap-2 shadow-2xs active:scale-[0.99] cursor-pointer"
                  id="btn-complete-phase"
                  title={`Checklist al ${checklistPercent}%. Requiere 100% o Excepción Autorizada de Coordinación.`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Finalizar Fase</span>
                  <span className="bg-amber-200/80 text-amber-900 font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {checklistPercent}%
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* 3. NAVIGATION TABS (3 Core Hubs) */}
      <div className="px-6 border-b border-stone-100 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 bg-white" id="form-tabs">
        <button
          onClick={() => setActiveTab('phase')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'phase'
              ? 'border-slate-900 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-slate-600" />
          <span>Fase {getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex)} & Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab('project')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'project'
              ? 'border-slate-900 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-slate-600" />
          <span>Perfil del Proyecto</span>
        </button>

        <button
          onClick={() => setActiveTab('deliverables')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'deliverables'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
          <span>Entregables & Feedback</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5 text-indigo-500" />
          <span>Historial & Bitácora</span>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold px-1.5 py-0.5 rounded-full border border-indigo-200/60">
            {historyRecords.length}
          </span>
        </button>
      </div>

      {/* WORKSPACE CONTENT SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#F4F5F0]" id="form-scroll-container">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* TAB 1: PHASE REQUIREMENTS & CHECKLIST */}
          {activeTab === 'phase' && (
            <div className="space-y-6" id="phase-tab-content">

              {/* BANDA DE ESTADO & SALUD GENERAL (ESTILO UNIFICADO DEL DASHBOARD) */}
              <div
                id="phase-unified-kpi-block"
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-stone-200/70"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-100">
                  {/* Columna 1: Salud de la Fase */}
                  <div className="flex flex-col items-center text-center px-2">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                      Salud de Fase
                    </span>
                    <div className="h-10 flex items-center justify-center gap-1 my-1">
                      <span
                        className="leading-none font-bold tracking-tight text-3xl font-display"
                        style={{
                          color: finalHealth >= 80 ? '#10b981' : finalHealth >= 50 ? '#f59e0b' : '#f43f5e'
                        }}
                      >
                        {finalHealth}%
                      </span>
                      <span
                        className="text-sm font-bold leading-none select-none"
                        style={{
                          color: finalHealth >= 80 ? '#10b981' : finalHealth >= 50 ? '#f59e0b' : '#f43f5e'
                        }}
                      >
                        {finalHealth >= 80 ? '▲' : '▼'}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-semibold tracking-tight whitespace-nowrap h-4 flex items-center justify-center"
                      style={{
                        color: finalHealth >= 80 ? '#059669' : finalHealth >= 50 ? '#d97706' : '#e11d48'
                      }}
                    >
                      {finalHealth >= 80 ? 'Óptimo' : finalHealth >= 50 ? 'En riesgo' : 'Crítico'}
                    </span>
                  </div>

                  {/* Columna 2: Consumo de Horas */}
                  <div className="flex flex-col items-center text-center px-2">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                      Consumo de Horas
                    </span>
                    <div className="h-10 flex items-center justify-center my-1">
                      <span className="text-slate-900 leading-none font-bold tracking-tight text-3xl font-display">
                        {totalConsumedHours}h
                      </span>
                      <span className="text-xs font-semibold text-slate-400 ml-1">/ {totalHours}h</span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap h-4 flex items-center justify-center text-slate-500">
                      {totalHours > 0 ? Math.round((totalConsumedHours / totalHours) * 100) : 0}% consumido
                    </span>
                  </div>

                  {/* Columna 3: Retrabajo */}
                  <div className="flex flex-col items-center text-center px-2">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                      Retrabajo
                    </span>
                    <div className="h-10 flex items-center justify-center my-1">
                      <span className="text-slate-900 leading-none font-bold tracking-tight text-3xl font-display">
                        {retrabajoStats.porcentajeRetrabajo.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap h-4 flex items-center justify-center text-slate-500">
                      {retrabajoStats.horasRetrabajo}h ({retrabajoStats.porOrigen.cliente}h cliente)
                    </span>
                  </div>

                  {/* Columna 4: Costo Estimado (o Horas Fase para proveedor) */}
                  <div className="flex flex-col items-center text-center px-2">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                      {isProveedor ? 'Horas Fase' : 'Costo Estimado'}
                    </span>
                    <div className="h-10 flex items-center justify-center my-1">
                      <span className="text-slate-900 leading-none font-bold tracking-tight text-2xl lg:text-3xl font-display">
                        {isProveedor
                          ? `${totalPhaseHoursLogged}h`
                          : `$${(project.totalIncome || 16991).toLocaleString('es-CL')}`}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap h-4 flex items-center justify-center text-slate-500">
                      {isProveedor ? 'Registradas en fase' : 'USD Contratado'}
                    </span>
                  </div>

                  {/* Columna 5: Avance de Checklist */}
                  <div className="flex flex-col items-center text-center px-2 col-span-2 sm:col-span-1">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                      Avance Checklist
                    </span>
                    <div className="h-10 flex items-center justify-center my-1">
                      <span
                        className="leading-none font-bold tracking-tight text-3xl font-display"
                        style={{
                          color: checklistPercent === 100 ? '#10b981' : checklistPercent >= 50 ? '#3b82f6' : '#f59e0b'
                        }}
                      >
                        {checklistPercent}%
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-semibold tracking-tight whitespace-nowrap h-4 flex items-center justify-center"
                      style={{
                        color: checklistPercent === 100 ? '#059669' : '#64748b'
                      }}
                    >
                      {completedChecklistCount} de {checklistTotal} pasos
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION HEADER */}
              <h3 className="text-base font-semibold text-slate-900 tracking-tight pt-2">
                {getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex)}: Checklist y Control de Fase
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Left Column: Checklist of the Phase */}
                <div className="md:col-span-3 space-y-6">
                  <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs space-y-6">
                    {/* Phase Control Header & Metrics */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-slate-800" />
                          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                            Checklist de {getCleanPhaseTitle(activePhase.label, activePhase.id, activePhaseIndex)}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-normal">
                          Control de tareas, hitos, fechas y lecciones aprendidas de la fase.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Total Time Badge */}
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs">
                          <Clock className="w-3.5 h-3.5 text-stone-300" />
                          <span><strong className="text-white font-mono text-sm">{totalPhaseHoursLogged} hrs</strong></span>
                        </div>

                        {/* Download Phase Button */}
                        <button
                          onClick={() => handleDownloadPhase(activePhase)}
                          className="bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Descargar documentación de esta fase en formato Markdown"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          Descargar
                        </button>

                        {/* Mark Completed Button Intuitivo */}
                        {userRole !== 'invitado' && (
                          activePhase.status === 'completed' ? (
                            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs select-none">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Finalizada</span>
                            </div>
                          ) : (checklistTotal === 0 || checklistPercent === 100) ? (
                            <button
                              onClick={handleCompletePhaseClick}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                              title="Checklist al 100% - Lista para finalizar fase"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Finalizar Fase (100% Listo)</span>
                            </button>
                          ) : (
                            <button
                              onClick={handleCompletePhaseClick}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                              title={`Checklist al ${checklistPercent}%. Requiere 100% o Excepción Autorizada.`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Finalizar Fase ({checklistPercent}%)</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Checklist Items List with Milestones, Dates, Learnings */}
                    <div className="space-y-4" id="expanded-checklist-section">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Pasos del Checklist
                        </span>
                        <span className="text-xs font-bold text-lime-700 bg-lime-50 px-2.5 py-0.5 rounded-full">
                          {checklistPercent}% Completado ({completedChecklistCount} de {checklistTotal})
                        </span>
                      </div>

                      <div className="h-2 w-full bg-[#F4F5F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-lime-500 transition-all duration-500 rounded-full"
                          style={{ width: `${checklistPercent}%` }}
                        />
                      </div>

                      {checklistItems.length === 0 ? (
                        <div className="p-6 text-center bg-[#F4F5F0] rounded-2xl">
                          <p className="text-xs text-slate-400 italic">No hay pasos agregados aún a este checklist.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {checklistItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className={`p-4 rounded-2xl transition-all space-y-3 ${
                                item.completed
                                  ? 'bg-[#F4F5F0]/80 opacity-90'
                                  : 'bg-[#F4F5F0]'
                              }`}
                            >
                              {/* Step Header + Checkbox + Edit Task Text */}
                              <div className="flex items-center justify-between gap-3 border-b border-stone-200/60 pb-2">
                                {editingTaskId === item.id ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editingTaskText}
                                      onChange={(e) => setEditingTaskText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEditedTaskText(item.id, item.text);
                                        if (e.key === 'Escape') setEditingTaskId(null);
                                      }}
                                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditedTaskText(item.id, item.text)}
                                      className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                      title="Guardar cambio de texto"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTaskId(null)}
                                      className="p-1 rounded-md bg-stone-200 text-slate-600 hover:bg-stone-300 cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <button
                                      disabled={userRole === 'invitado'}
                                      onClick={() => handleToggleChecklist(item.id)}
                                      className="flex items-center gap-3 text-left group cursor-pointer min-w-0"
                                    >
                                      <span className="shrink-0">
                                        {item.completed ? (
                                          <CheckSquare className="w-5 h-5 text-slate-800" />
                                        ) : (
                                          <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                                        )}
                                      </span>
                                      <span className={`text-xs font-semibold text-slate-900 truncate ${item.completed ? 'line-through text-slate-500' : ''}`}>
                                        Paso {idx + 1}: {item.text}
                                      </span>
                                    </button>
                                    {userRole !== 'invitado' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingTaskId(item.id);
                                          setEditingTaskText(item.text);
                                        }}
                                        className="text-slate-400 hover:text-slate-800 p-1 rounded-md hover:bg-stone-200/80 transition-colors cursor-pointer shrink-0"
                                        title="Modificar texto del paso (se registrará en el historial de auditoría)"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}

                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  item.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {item.completed ? 'Completado' : 'Pendiente'}
                                </span>
                              </div>

                              {/* Detailed Input Grid */}
                              <div className="grid grid-cols-1 gap-3 pt-1">
                                {/* Milestones / Advances */}
                                <div className="space-y-1">
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Hitos y Avances
                                  </label>
                                  <textarea
                                    disabled={userRole === 'invitado'}
                                    rows={2}
                                    value={item.milestones || ''}
                                    onChange={(e) => handleUpdateChecklistItemField(item.id, 'milestones', e.target.value)}
                                    placeholder="Detalla entregas parciales, links de avance, decisiones clave..."
                                    className="w-full bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 outline-none transition-all resize-none shadow-2xs"
                                  />
                                </div>

                                {/* Dates & Learnings */}
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Fecha Inicio
                                      </label>
                                      <input
                                        type="date"
                                        disabled={userRole === 'invitado'}
                                        value={item.startDate || ''}
                                        onChange={(e) => handleUpdateChecklistItemField(item.id, 'startDate', e.target.value)}
                                        className="w-full bg-white rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 outline-none transition-all shadow-2xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Fecha Finalización
                                      </label>
                                      <input
                                        type="date"
                                        disabled={userRole === 'invitado'}
                                        value={item.endDate || ''}
                                        onChange={(e) => handleUpdateChecklistItemField(item.id, 'endDate', e.target.value)}
                                        className="w-full bg-white rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 outline-none transition-all shadow-2xs"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                      <BookOpen className="w-3 h-3 text-indigo-500" />
                                      <span>Aprendizaje / Lecciones Aprendidas</span>
                                    </label>
                                    <textarea
                                      disabled={userRole === 'invitado'}
                                      rows={2}
                                      value={item.learnings || ''}
                                      onChange={(e) => handleUpdateChecklistItemField(item.id, 'learnings', e.target.value)}
                                      placeholder="¿Qué aprendió el equipo en esta tarea o fase?"
                                      className="w-full bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-400/50 outline-none transition-all resize-none shadow-2xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add step to checklist */}
                      {userRole !== 'invitado' && (
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={newPhaseTaskText}
                            onChange={(e) => setNewPhaseTaskText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklistTask(); }}
                            placeholder="Agregar nuevo paso al checklist de la fase..."
                            className="flex-1 bg-[#F4F5F0] rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all"
                          />
                          <button
                            onClick={handleAddChecklistTask}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar Paso
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                {/* Global Download Button Banner (Last Phase / Global Export) */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Sparkles className="w-5 h-5 text-stone-200" />
                    <h4 className="text-sm font-semibold tracking-tight text-white">
                      Expediente Completo e Historial del Proyecto
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 font-normal">
                    Descarga un documento único con todas las fases, checklists, hitos, aprendizajes y el historial completo de movimientos.
                  </p>
                </div>

                <button
                  onClick={handleDownloadFullProject}
                  className="bg-white hover:bg-stone-100 text-slate-900 font-semibold px-5 py-3 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4 text-slate-900" />
                  Descargar Expediente Completo
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PERFIL GENERAL DEL PROYECTO */}
          {activeTab === 'project' && (
            <div className="space-y-6" id="project-profile-tab-content">
              <PerfilGeneral
                project={project}
                onUpdateProject={onUpdateProject}
                userRole={userRole}
                clients={clients}
                currentUser={currentUser}
              />
            </div>
          )}


          {/* TAB 3: HISTORIAL / BITÁCORA DEL PROYECTO */}
          {activeTab === 'history' && (
            <div className="space-y-5" id="history-tab-content">
              <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md overflow-hidden relative">
                <div className="absolute inset-y-0 right-0 w-72 bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-indigo-200 text-xs font-extrabold uppercase tracking-widest">
                      <History className="w-4 h-4" />
                      Bitácora Detallada
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">Historial del Proyecto</h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Cambios de cronograma, checklist, perfil, órdenes de venta, acuerdos con cliente, entregables, feedback y vistos buenos en orden cronológico.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleDownloadHistoryMD}
                      className="bg-white text-slate-950 hover:bg-stone-100 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Descargar MD
                    </button>
                    <button
                      onClick={handleDownloadHistoryPDF}
                      className="bg-indigo-500 hover:bg-indigo-400 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  <div className="lg:col-span-6 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      placeholder="Buscar por usuario, acción, detalle, fase o tag..."
                      className="w-full bg-[#F4F5F0] border border-slate-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:bg-white"
                    />
                  </div>

                  <div className="lg:col-span-3 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={auditTagFilter}
                      onChange={(e) => setAuditTagFilter(e.target.value)}
                      className="w-full bg-[#F4F5F0] border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="todos">Todos los tags</option>
                      {historyTagOptions.map((tag) => (
                        <option key={tag} value={tag}>{getAuditTagInfo({ tag }).label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <select
                      value={auditPhaseFilter}
                      onChange={(e) => setAuditPhaseFilter(e.target.value)}
                      className="w-full bg-[#F4F5F0] border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="todos">Todas las fases</option>
                      {project.phases.map((p, idx) => (
                        <option key={p.id} value={p.id}>
                          {getCleanPhaseTitle(p.label, p.id, idx)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span>{filteredHistoryRecords.length} de {historyRecords.length} registros</span>
                  <span>Ordenado por modificación más reciente</span>
                </div>

                {filteredHistoryRecords.length === 0 ? (
                  <div className="p-8 text-center bg-[#F4F5F0] rounded-3xl">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">No hay registros que coincidan con el filtro.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHistoryRecords.map((log) => {
                      const tagInfo = getAuditTagInfo(log);
                      const phaseIndex = log.phaseId ? project.phases.findIndex(p => p.id === log.phaseId) : -1;
                      const phaseLabel = log.phaseId
                        ? getCleanPhaseTitle(project.phases.find(p => p.id === log.phaseId)?.label || log.phaseId, log.phaseId, phaseIndex)
                        : null;

                      return (
                        <article key={log.id} className="p-4 rounded-3xl bg-[#F4F5F0] border border-slate-200/70 flex gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-900 shrink-0 overflow-hidden border border-white/80">
                            <img
                              src={log.avatarUrl || getUserAvatarUrl(log.username || 'Sistema')}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-sm">{log.username || 'Sistema'}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${tagInfo.color}`}>
                                    {tagInfo.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">{log.userRole || 'rol'} · {log.entityType || 'Registro'}</p>
                              </div>
                              <div className="text-xs text-slate-500 font-mono shrink-0 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(log.timestamp).toLocaleDateString('es-CL', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })} · {new Date(log.timestamp).toLocaleTimeString('es-CL', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{log.action}</h4>
                              <p className="text-xs text-slate-700 leading-relaxed mt-1">{log.details}</p>
                            </div>

                            {phaseLabel && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 border border-slate-200 px-2 py-1 rounded-full font-semibold">
                                <FileCheck className="w-3 h-3" />
                                Fase: {phaseLabel}
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* TAB 4: DELIVERABLES MANAGEMENT & CLIENT FEEDBACK */}
          {activeTab === 'deliverables' && (
            <div className="space-y-6" id="deliverables-tab-content">
              {/* CLIENT PORTAL HEADER & STATUS BANNER */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-4 relative overflow-hidden" id="portal-cliente-banner">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-stone-200 text-xs font-semibold uppercase tracking-widest">
                        Portal de Entregables
                      </span>
                      {userRole === 'invitado' && (
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-stone-200 text-xs font-semibold uppercase">
                          Vista Cliente Activa
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-white tracking-tight">
                      Centro de Revisión & Visto Bueno de Entregables
                    </h2>
                    <p className="text-xs text-slate-300 font-normal leading-relaxed max-w-2xl">
                      Revisa las piezas finales publicadas, deja comentarios o anotaciones puntuales y aprueba formalmente los entregables de cada fase.
                    </p>
                  </div>

                  {/* Summary badges */}
                  <div className="flex items-center gap-3 self-start md:self-auto shrink-0 font-mono text-xs">
                    <div className="bg-slate-800 px-4 py-2.5 rounded-2xl text-center">
                      <div className="text-xl font-semibold font-display text-white">
                        {(project.deliverables || []).filter(d => userRole !== 'invitado' || d.isVisibleToClient).length}
                      </div>
                      <div className="text-2xs uppercase text-slate-400 font-medium">Publicados</div>
                    </div>

                    <div className="bg-slate-800 px-4 py-2.5 rounded-2xl text-center">
                      <div className="text-xl font-semibold font-display text-emerald-300">
                        {(project.deliverables || []).filter(d => (userRole !== 'invitado' || d.isVisibleToClient) && d.status === 'aprobado').length}
                      </div>
                      <div className="text-2xs uppercase text-emerald-300 font-medium">Aprobados</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add New Deliverable Form */}
              {userRole !== 'invitado' && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 border border-stone-200/70">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-slate-800" />
                      <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-700">
                        Subir Archivo / Entregable para Revisión del Cliente
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium bg-[#F4F5F0] px-3 py-1 rounded-full">
                      Subido por: <strong>{currentUser?.username || 'Equipo Creativo'}</strong>
                    </span>
                  </div>

                  <form onSubmit={handleAddDeliverable} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                      <div className="md:col-span-5 space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Título del Archivo / Pieza *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Arte Gráfico Post Carrusel Campaña..."
                          value={delivTitle}
                          onChange={(e) => setDelivTitle(e.target.value)}
                          className="w-full bg-[#F4F5F0] rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-semibold"
                          required
                        />
                      </div>

                      <div className="md:col-span-4 space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Tipo de Entregable *
                        </label>
                        <select
                          value={delivType}
                          onChange={(e: any) => setDelivType(e.target.value)}
                          className="w-full bg-[#F4F5F0] rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-medium cursor-pointer"
                        >
                          <option value="image">Diseño / Arte Gráfico (JPG/PNG)</option>
                          <option value="video">Video / Reel / Audiovisual</option>
                          <option value="word">Social Media Copy / Arte</option>
                          <option value="pdf">Documento PDF / Manual de Marca</option>
                          <option value="link">Enlace Web / Figma / Canva / Prototipo</option>
                          <option value="audio">Archivo de Audio / Spot</option>
                          <option value="markdown">Documentación Markdown</option>
                        </select>
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Fase Asociada
                        </label>
                        <select
                          value={delivPhaseId}
                          onChange={(e) => setDelivPhaseId(e.target.value)}
                          className="w-full bg-[#F4F5F0] rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-medium cursor-pointer"
                        >
                          {project.phases.map((p, idx) => (
                            <option key={p.id} value={p.id}>
                              {getCleanPhaseTitle(p.label, p.id, idx)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-12 space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Link del Entregable (Figma, Google Drive, Canva, Dropbox, Loom, etc.) *
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://www.figma.com/... o https://drive.google.com/..."
                          value={delivUrl}
                          onChange={(e) => setDelivUrl(e.target.value)}
                          className="w-full bg-[#F4F5F0] rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-normal font-mono"
                        />
                      </div>

                      <div className="md:col-span-12 space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Descripción del Entregable & Contexto para el Cliente
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Describe la propuesta, copys recomendados, variantes de color o especificaciones para el visto bueno..."
                          value={delivDescription}
                          onChange={(e) => setDelivDescription(e.target.value)}
                          className="w-full bg-[#F4F5F0] rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-normal resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
                      <p className="text-xs text-slate-500 font-normal flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Quedará en <strong>revisión interna</strong>. Tras el check de visto bueno interno, se activará automáticamente para el cliente.</span>
                      </p>

                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-full text-xs transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 self-end sm:self-auto flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Publicar para Revisión Interna</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Deliverables List and Customer Annotations Review */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-500">
                    Historial de Entregables Publicados y Feedback Recibido
                  </h3>
                  <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-stone-200">
                    {(project.deliverables || []).filter((item) => userRole !== 'invitado' || item.isVisibleToClient).length} entregables
                  </span>
                </div>

                {(() => {
                  const visibleList = (project.deliverables || []).filter(
                    (item) => userRole !== 'invitado' || item.isVisibleToClient
                  );

                  if (visibleList.length === 0) {
                    return (
                      <div className="bg-white rounded-3xl p-10 text-center shadow-xs text-slate-400 text-xs font-normal border border-stone-200/70">
                        No hay entregables visibles para mostrar en este momento.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-5">
                      {visibleList.map((item) => {
                        const statusColor =
                          item.status === 'aprobado'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.status === 'rechazado'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : item.status === 'en_revision'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-stone-100 text-slate-700 border border-stone-200';

                        const statusLabel =
                          item.status === 'aprobado'
                            ? '✔ Aprobado por Cliente'
                            : item.status === 'rechazado'
                            ? '✖ Requiere Corrección'
                            : item.status === 'en_revision'
                            ? '⏳ En Revisión'
                            : '○ Pendiente';

                        const isEditingThis = editingDeliverableId === item.id;
                        const phaseName = project.phases.find(p => p.id === item.phaseId);
                        const cleanPTitle = phaseName ? getCleanPhaseTitle(phaseName.label, phaseName.id) : null;

                        return (
                          <div key={item.id} className="bg-white rounded-3xl p-6 shadow-xs space-y-4 border border-stone-200/70">
                            {/* Header de la tarjeta */}
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
                              <div className="space-y-1.5 flex-1 min-w-[240px]">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-[#F4F5F0] text-slate-700 rounded-md tracking-wider">
                                    {item.type}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                  {cleanPTitle && (
                                    <span className="text-[10px] font-semibold text-slate-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                      {cleanPTitle}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400 font-mono">
                                    Subido el {new Date(item.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>

                                <h4 className="font-bold text-base text-slate-900 leading-snug">{item.title}</h4>

                                {item.description && (
                                  <p className="text-xs text-slate-600 leading-relaxed font-normal bg-[#F4F5F0] p-3 rounded-xl border border-stone-200/60">
                                    {item.description}
                                  </p>
                                )}

                                {item.externalUrl && (
                                  <a
                                    href={item.externalUrl}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1.5 inline-flex mt-1 underline"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Abrir enlace del recurso ({item.externalUrl.slice(0, 45)}...)</span>
                                  </a>
                                )}
                              </div>

                              {/* Acciones principales (Aprobar Cliente, Editar, Borrar) */}
                              <div className="flex items-center gap-2 flex-wrap shrink-0">
                                {/* Status change actions por parte del cliente o equipo */}
                                <div className="flex items-center gap-1 bg-[#F4F5F0] p-1 rounded-full border border-stone-200/70">
                                  <button
                                    onClick={() => handleUpdateDeliverableStatus(item.id, 'aprobado')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                                      item.status === 'aprobado'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                                    }`}
                                    title="Aprobar entregable formalmente"
                                  >
                                    Aprobar
                                  </button>

                                  <button
                                    onClick={() => handleUpdateDeliverableStatus(item.id, 'rechazado')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                                      item.status === 'rechazado'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-rose-100 hover:text-rose-800'
                                    }`}
                                    title="Solicitar correcciones o cambios"
                                  >
                                    Pedir Ajuste
                                  </button>

                                  <button
                                    onClick={() => handleUpdateDeliverableStatus(item.id, 'en_revision')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                                      item.status === 'en_revision'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                                    }`}
                                    title="Marcar en revisión"
                                  >
                                    En Revisión
                                  </button>
                                </div>

                                {userRole !== 'invitado' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isEditingThis) {
                                          setEditingDeliverableId(null);
                                        } else {
                                          setEditingDeliverableId(item.id);
                                          setEditTitle(item.title);
                                          setEditDescription(item.description || '');
                                          setEditType(item.type);
                                          setEditUrl(item.externalUrl || '');
                                        }
                                      }}
                                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-stone-100 rounded-full transition-all cursor-pointer border border-stone-200"
                                      title="Modificar entregable"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    {userRole === 'coordinador' && (
                                      <button
                                        onClick={() => handleDeleteDeliverable(item.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all cursor-pointer border border-stone-200"
                                        title="Eliminar entregable"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Formulario de edición si está activo */}
                            {isEditingThis && (
                              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Edit2 className="w-3.5 h-3.5 text-sky-700" /> Modificar Datos del Entregable
                                  </span>
                                  <button
                                    onClick={() => setEditingDeliverableId(null)}
                                    className="text-slate-400 hover:text-slate-700"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Título</label>
                                    <input
                                      type="text"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-1.5 outline-none font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Tipo</label>
                                    <select
                                      value={editType}
                                      onChange={(e: any) => setEditType(e.target.value)}
                                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                                    >
                                      <option value="image">Diseño / Arte Gráfico</option>
                                      <option value="video">Video / Reel</option>
                                      <option value="word">Social Media Copy / Arte</option>
                                      <option value="pdf">Documento PDF</option>
                                      <option value="link">Enlace Web / Figma</option>
                                      <option value="audio">Audio / Spot</option>
                                    </select>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block font-semibold text-slate-700 mb-1">Link del Entregable</label>
                                    <input
                                      type="url"
                                      value={editUrl}
                                      onChange={(e) => setEditUrl(e.target.value)}
                                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-1.5 outline-none font-mono"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block font-semibold text-slate-700 mb-1">Descripción</label>
                                    <textarea
                                      rows={2}
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-1.5 outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setEditingDeliverableId(null)}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-stone-200 cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditedDeliverable(item.id)}
                                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-xs"
                                  >
                                    Guardar Modificación
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* BANDA DE VISTO BUENO INTERNO (CHECK DE REVISADO PARA VISIBILIDAD AUTOMÁTICA) */}
                            <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              item.internalCheckPassed
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : 'bg-amber-50/70 border-amber-200 text-amber-900'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  item.internalCheckPassed ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                  {item.internalCheckPassed ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Clock className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs">
                                      {item.internalCheckPassed
                                        ? 'Visto Bueno Interno Aprobado'
                                        : 'Pendiente de Revisión Interna'}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      item.internalCheckPassed
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {item.internalCheckPassed ? 'Visible para Cliente' : 'Oculto al Cliente'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] opacity-90 mt-0.5">
                                    {item.internalCheckPassed
                                      ? `Revisado y aprobado por ${item.reviewedBy || 'Coordinador'} el ${item.reviewedAt ? new Date(item.reviewedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'recientemente'}.`
                                      : 'Normalmente el equipo de diseño o social media sube el arte. Requiere check de revisado internamente para ser visible automáticamente para el cliente.'}
                                  </p>
                                </div>
                              </div>

                              {userRole !== 'invitado' && (
                                <button
                                  type="button"
                                  onClick={() => handleInternalReviewCheck(item.id)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto ${
                                    item.internalCheckPassed
                                      ? 'bg-white hover:bg-stone-100 text-slate-700 border border-stone-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{item.internalCheckPassed ? 'Desmarcar Check' : 'Dar Check de Revisado Interno'}</span>
                                </button>
                              )}
                            </div>

                            {/* HISTORIAL COMPLETO DE ENTREGAS & TRAZABILIDAD (QUIEN SUBIÓ, QUÉ DÍA, MODIFICACIONES Y CHECK) */}
                            <div className="p-4 bg-[#F4F5F0] rounded-2xl border border-stone-200/60 space-y-2.5">
                              <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5 text-indigo-600" />
                                  Historial de Entregas & Trazabilidad
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.history?.length || 1} eventos registrados
                                </span>
                              </div>

                              <div className="space-y-2 text-xs">
                                {/* 1. Quien subió el arte */}
                                <div className="flex items-start gap-2 text-slate-700">
                                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                    ↑
                                  </span>
                                  <div>
                                    <p className="leading-snug">
                                      <strong>Subido por:</strong> <span className="font-semibold text-slate-900">{item.uploadedBy || 'Equipo Creativo'}</span> ({item.uploadedByRole || 'Diseño / Social Media'})
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Fecha y hora: {new Date(item.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(item.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                  </div>
                                </div>

                                {/* 2. Quien lo revisó y dio check */}
                                <div className="flex items-start gap-2 text-slate-700">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                    item.internalCheckPassed ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-slate-600'
                                  }`}>
                                    ✓
                                  </span>
                                  <div>
                                    <p className="leading-snug">
                                      <strong>Visto Bueno Interno:</strong>{' '}
                                      {item.internalCheckPassed ? (
                                        <span className="font-semibold text-emerald-800">
                                          Revisado y con check otorgado por {item.reviewedBy || 'Coordinador'}
                                        </span>
                                      ) : (
                                        <span className="text-amber-800 font-medium">
                                          Pendiente de revisado interno
                                        </span>
                                      )}
                                    </p>
                                    {item.reviewedAt && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        Fecha y hora del check: {new Date(item.reviewedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(item.reviewedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 3. Modificaciones si hubo */}
                                {item.history && item.history.filter(h => h.action === 'modificado').length > 0 && (
                                  <div className="pt-1 space-y-1.5 border-t border-stone-200/60">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Modificaciones registradas:</span>
                                    {item.history.filter(h => h.action === 'modificado').map((h, hIdx) => (
                                      <div key={h.id || hIdx} className="flex items-start gap-2 bg-white p-2 rounded-xl border border-stone-200/60">
                                        <Edit2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                                        <div className="text-[11px] leading-snug">
                                          <p>
                                            <strong>{h.username}</strong> ({h.userRole || 'colaborador'}) {h.details}
                                          </p>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            {new Date(h.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(h.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Annotations / Client Feedback History */}
                            <div className="bg-[#F4F5F0] rounded-2xl p-4 sm:p-5 space-y-3">
                              <h5 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-800" />
                                Observaciones / Comentarios del Cliente ({item.annotations?.length || 0})
                              </h5>

                              {(!item.annotations || item.annotations.length === 0) ? (
                                <p className="text-xs text-slate-400 font-normal italic">No se han ingresado observaciones todavía.</p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {item.annotations.map((ann) => (
                                    <div key={ann.id} className="bg-white p-3.5 rounded-2xl flex items-start justify-between gap-4 shadow-2xs">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 font-normal">
                                          <span className="font-semibold text-slate-800">{ann.authorName}</span>
                                          <span>•</span>
                                          <span className="font-mono text-2xs">{ann.date}</span>
                                          <span>•</span>
                                          <span className={`text-2xs font-semibold uppercase px-2 py-0.5 rounded-full ${ann.status === 'resuelto' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {ann.status}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-700 font-normal leading-relaxed whitespace-pre-wrap">{ann.comment}</p>
                                      </div>

                                      {/* Resolve toggle */}
                                      {userRole !== 'invitado' && (
                                        <button
                                          onClick={() => handleToggleAnnotationStatus(item.id, ann.id)}
                                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 cursor-pointer ${
                                            ann.status === 'resuelto'
                                              ? 'bg-stone-100 text-slate-500 hover:bg-stone-200 hover:text-slate-700'
                                              : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xs'
                                          }`}
                                        >
                                          {ann.status === 'resuelto' ? 'Marcar Pendiente' : '✔ Marcar Resuelto'}
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Form to submit new comment on this deliverable */}
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const form = e.currentTarget;
                                  const input = form.elements.namedItem(`comment-${item.id}`) as HTMLInputElement;
                                  if (input && input.value.trim()) {
                                    handleAddDeliverableAnnotation(item.id, input.value);
                                    input.value = '';
                                  }
                                }}
                                className="flex gap-2 pt-2 border-t border-stone-200/60"
                              >
                                <input
                                  type="text"
                                  name={`comment-${item.id}`}
                                  placeholder={userRole === 'invitado' ? "Escribe un comentario o ajuste para el equipo..." : "Agregar respuesta u observación interna..."}
                                  className="flex-1 bg-white rounded-2xl px-4 py-2 text-xs text-slate-800 font-normal outline-none focus:ring-2 focus:ring-slate-900"
                                />
                                <button
                                  type="submit"
                                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-full transition-all cursor-pointer shrink-0 shadow-xs"
                                >
                                  Enviar
                                </button>
                              </form>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODAL DE EXCEPCIÓN AUTORIZADA PARA FINALIZAR FASE INCOMPLETA */}
      {showExceptionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 text-slate-800 flex items-center justify-center font-semibold">
                  <ShieldAlert className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-slate-900">
                    Control de Fase Gate: Checklist Incompleto
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Checklist actual: {checklistPercent}% completado
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExceptionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-stone-100 cursor-pointer text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-normal">
              <p className="bg-stone-100 p-4 rounded-2xl text-slate-800 font-normal">
                <strong className="font-semibold">Atención:</strong> Para dar por completada la fase <strong>"{activePhase.label}"</strong> sin haber alcanzado el 100% en el checklist ({completedChecklistCount} de {checklistTotal} ítems), se requiere registrar un <strong>Motivo de Excepción Autorizada</strong> en la Bitácora de Auditoría del proyecto.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Motivo de la Excepción Autorizada *
                </label>
                <textarea
                  rows={3}
                  value={exceptionReason}
                  onChange={(e) => {
                    setExceptionReason(e.target.value);
                    if (exceptionError) setExceptionError(null);
                  }}
                  placeholder="Ej: Aprobado por cliente según adenda v2, o pospuesto para fase posterior..."
                  className="w-full bg-[#F4F5F0] rounded-2xl p-3.5 text-xs font-normal text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all"
                />
                {exceptionError && (
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    {exceptionError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowExceptionModal(false)}
                className="px-5 py-2.5 rounded-full text-xs font-medium text-slate-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmExceptionAndComplete}
                className="px-6 py-2.5 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                Autorizar Excepción & Completar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
