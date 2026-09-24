import { Phase, Project, DeliverableItem, Role, ClientAnnotation, DecisionLogEntry, UserSession, AuditLogEntry, ChecklistItem } from '../types';
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
  ShieldAlert
} from 'lucide-react';
import React, { useState } from 'react';
import { analyzeBriefWithGemini } from '../geminiService';
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
}

export const getCleanPhaseTitle = (label: string, id: string, index?: number) => {
  if (!label) return `Fase ${index !== undefined ? index + 1 : ''}`.trim();
  let clean = label.replace(/^custom-ph-[^\s]+\s*/i, '').trim();
  if (!clean || clean.startsWith('custom-ph-')) {
    clean = `Fase ${index !== undefined ? index + 1 : ''}`.trim();
  }
  return clean;
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
}: PhaseContentProps) {
  const [activeTab, setActiveTab] = useState<'phase' | 'brandbible' | 'deliverables'>('phase');
  const [brandSubTab, setBrandSubTab] = useState<'brandbible' | 'project'>('brandbible');
  const [govSubTab, setGovSubTab] = useState<'bitacora' | 'raci'>('bitacora');

  // AI Brief Form States
  const [briefInput, setBriefInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // New Deliverable Form States
  const [delivTitle, setDelivTitle] = useState('');
  const [delivType, setDelivType] = useState<'video' | 'audio' | 'pdf' | 'word' | 'image' | 'markdown' | 'link'>('link');
  const [delivUrl, setDelivUrl] = useState('');
  const [delivVisible, setDelivVisible] = useState(true);

  // Decision Log Form States
  const [decTitle, setDecTitle] = useState('');
  const [decCategory, setDecCategory] = useState<'Alcance' | 'Diseño' | 'Técnico' | 'Presupuesto' | 'Aprobación' | 'Otro'>('Alcance');
  const [decRationale, setDecRationale] = useState('');
  const [decApprovedBy, setDecApprovedBy] = useState('');

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

  // Handle updating individual checklist item fields (milestones, dates, learnings)
  const handleUpdateChecklistItemField = (
    itemId: string,
    field: keyof ChecklistItem,
    value: string
  ) => {
    if (userRole === 'invitado') return;
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

    onUpdateProject({
      ...project,
      phases: updatedPhases,
    });
  };

  // Add a new checklist step to current phase
  const handleAddChecklistTask = () => {
    if (!newPhaseTaskText.trim() || userRole === 'invitado') return;
    const newItem: ChecklistItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: newPhaseTaskText.trim(),
      completed: false,
      startDate: activePhase.startDate || new Date().toISOString().split('T')[0],
      endDate: activePhase.endDate || '',
      milestones: '',
      learnings: ''
    };

    const updatedPhases = project.phases.map((p) => {
      if (p.id === activePhase.id) {
        return { ...p, checklist: [...(p.checklist || []), newItem] };
      }
      return p;
    });

    onUpdateProject({
      ...project,
      phases: updatedPhases,
    });
    setNewPhaseTaskText('');
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
    const updatedPhases = project.phases.map((p) => {
      if (p.id === activePhase.id) {
        const updatedChecklist = p.checklist.map((item) => {
          if (item.id === itemId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });
        return { ...p, checklist: updatedChecklist };
      }
      return p;
    });

    onUpdateProject({
      ...project,
      phases: updatedPhases,
    });
  };

  // Handle Brand Bible text edits
  const handleBrandBibleChange = (section: 'onePager' | 'positioning' | 'valuesAndPersonality' | 'targetAudience' | 'visualIdentity' | 'voiceAndTone', field: string, value: string) => {
    if (isGeneralDisabled) return;
    const currentBB = project.brandBible || {};
    const sectionData = currentBB[section] || {};

    const updatedBB = {
      ...currentBB,
      [section]: {
        ...sectionData,
        [field]: value
      }
    };

    onUpdateProject({
      ...project,
      brandBible: updatedBB
    });
  };

  // Trigger Gemini analysis
  const handleAnalyzeBrief = async () => {
    if (!briefInput.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const data = await analyzeBriefWithGemini(briefInput);

      const newAuditLog = [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: 'gemini-ai',
          username: 'Gemini 3.6-Flash',
          userRole: 'coordinador' as const,
          action: 'Extracción Brand Bible',
          entityType: 'BrandBible',
          details: `Analizó brief de ${briefInput.length} caracteres y autogeneró Brand Bible.`,
        },
        ...(project.auditLog || [])
      ];

      onUpdateProject({
        ...project,
        brandBible: data,
        auditLog: newAuditLog
      });

      setBriefInput('');
      onSave();
    } catch (error: any) {
      console.error(error);
      setAnalysisError(error.message || 'Error al conectar con Gemini. Por favor intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add a new deliverable
  const handleAddDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivTitle.trim()) return;

    const newItem: DeliverableItem = {
      id: `deliv-${Date.now()}`,
      title: delivTitle,
      type: delivType,
      externalUrl: delivUrl.trim() || undefined,
      uploadedBy: userRole === 'coordinador' ? 'Coordinador de Proyectos' : 'Content / SAC',
      createdAt: new Date().toISOString(),
      isVisibleToClient: delivVisible,
      annotations: [],
    };

    const updatedDeliverables = [...(project.deliverables || []), newItem];
    const newAuditLog = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'internal',
        username: 'Equipo de Trabajo',
        userRole: userRole,
        action: 'Publicó Entregable',
        entityType: 'Entregable',
        details: `Se publicó "${delivTitle}" (${delivType}). Visibilidad: ${delivVisible ? 'Público' : 'Privado'}.`,
      },
      ...(project.auditLog || [])
    ];

    onUpdateProject({
      ...project,
      deliverables: updatedDeliverables,
      auditLog: newAuditLog,
    });

    setDelivTitle('');
    setDelivUrl('');
    onSave();
  };

  // Delete deliverable
  const handleDeleteDeliverable = (id: string) => {
    const updated = (project.deliverables || []).filter((d) => d.id !== id);
    onUpdateProject({ ...project, deliverables: updated });
    onSave();
  };

  // Toggle visibility of deliverable to client
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

  // Safe reference to Brand Bible
  const bb = project.brandBible || {};

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
      phaseId: activePhase.id
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
              <button
                onClick={handleCompletePhaseClick}
                className={`font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.99] cursor-pointer ${
                  activePhase.status === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : (checklistTotal === 0 || checklistPercent === 100)
                    ? 'bg-[#FF5500] hover:bg-[#E04B00] text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
                id="btn-complete-phase"
                title={
                  activePhase.status === 'completed'
                    ? 'Fase completada'
                    : checklistPercent === 100
                    ? 'Checklist al 100% - Lista para finalizar'
                    : `Checklist al ${checklistPercent}% - Requiere 100% o Excepción Autorizada`
                }
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {activePhase.status === 'completed'
                    ? 'Fase Completada'
                    : (checklistTotal === 0 || checklistPercent === 100)
                    ? 'Finalizar Fase (100%)'
                    : `Finalizar Fase (${checklistPercent}%)`}
                </span>
              </button>
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
          onClick={() => setActiveTab('brandbible')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'brandbible'
              ? 'border-purple-600 text-purple-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Ficha & Marca (IA)</span>
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
      </div>

      {/* WORKSPACE CONTENT SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#F4F5F0]" id="form-scroll-container">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* TAB 1: PHASE REQUIREMENTS & CHECKLIST */}
          {activeTab === 'phase' && (
            <div className="space-y-6" id="phase-tab-content">

              {/* 4 KPI CARDS ROW */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isProveedor ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`} id="kpi-cards-grid">
                {/* Card 1: SALUD DEL PROYECTO */}
                <div className="bg-white rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-slate-800">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        SALUD DEL PROYECTO
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      finalHealth < 50
                        ? 'bg-rose-50 text-rose-700'
                        : finalHealth < 80
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {finalHealth}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-2xl font-semibold font-display text-slate-900 tracking-tight">
                      {finalHealth < 50 ? 'Crítico' : finalHealth < 80 ? 'En riesgo' : 'Óptimo'}
                    </div>
                    <div className="h-2 w-full bg-[#F4F5F0] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          finalHealth < 50 ? 'bg-rose-500' : finalHealth < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${finalHealth}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 font-normal leading-tight">
                      {finalHealth < 50
                        ? 'Requiere atención inmediata. Se sugieren reuniones de contención.'
                        : finalHealth < 80
                        ? 'Desviaciones menores detectadas en los plazos.'
                        : 'Proyecto ejecutándose de acuerdo a lo planificado.'}
                    </p>
                  </div>
                </div>

                {/* Card 2: CONSUMO DE HORAS PROYECTO */}
                <div className="bg-white rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-slate-800">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      CONSUMO DE HORAS
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-semibold font-display text-slate-900 tracking-tight">
                      {totalConsumedHours}h <span className="text-xs text-slate-400 font-medium">/ {totalHours}h</span>
                    </div>
                    <StackedHoursBar timeEntries={timeEntries} hoursTotal={totalHours} showTitle={false} />
                  </div>
                </div>

                {/* Card 3: RETRABAJO DEL PROYECTO */}
                <div className="bg-white rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-slate-800">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      RETRABAJO
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-semibold font-display text-slate-900 tracking-tight">
                      {retrabajoStats.porcentajeRetrabajo.toFixed(1)}%
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs text-center font-normal">
                      <div className="bg-stone-100 p-1.5 rounded-xl">
                        <span className="text-slate-500 block text-xs font-medium">Cliente</span>
                        <strong className="text-slate-900 font-semibold">{retrabajoStats.porOrigen.cliente}h</strong>
                      </div>
                      <div className="bg-[#F4F5F0] p-1.5 rounded-xl">
                        <span className="text-slate-500 block text-xs font-medium">Interno</span>
                        <strong className="text-slate-800 font-semibold">{retrabajoStats.porOrigen.interno}h</strong>
                      </div>
                      <div className="bg-[#F4F5F0] p-1.5 rounded-xl">
                        <span className="text-slate-500 block text-xs font-medium">Proveedor</span>
                        <strong className="text-slate-800 font-semibold">{retrabajoStats.porOrigen.proveedor}h</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: COSTO ESTIMADO (Oculto para proveedor) */}
                {!isProveedor && (
                  <div className="bg-white rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-slate-800">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        COSTO ESTIMADO
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-semibold font-display text-slate-900 tracking-tight">
                        ${(project.totalIncome || 16991).toLocaleString('es-CL')}{' '}
                        <span className="text-xs text-slate-400 font-medium">USD</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium bg-[#F4F5F0] p-2.5 rounded-2xl flex items-center justify-between">
                        <span className="text-slate-400">Presupuesto Base</span>
                        <strong className="text-slate-700 font-semibold">$3.627,20 USD</strong>
                      </div>
                    </div>
                  </div>
                )}
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

                        {/* Mark Completed Button */}
                        {userRole !== 'invitado' && (
                          <button
                            onClick={handleCompletePhaseClick}
                            className={`font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                              activePhase.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                : (checklistTotal === 0 || checklistPercent === 100)
                                ? 'bg-lime-500 hover:bg-lime-600 text-slate-950'
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                            }`}
                            title={
                              activePhase.status === 'completed'
                                ? 'Fase completada'
                                : checklistPercent === 100
                                ? 'Checklist al 100% - Lista para finalizar'
                                : `Checklist al ${checklistPercent}% - Requiere 100% o Excepción Autorizada`
                            }
                          >
                            {activePhase.status === 'completed' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Finalizada
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>
                                  {checklistTotal === 0 || checklistPercent === 100
                                    ? 'Finalizar Fase (100%)'
                                    : `Finalizar Fase (${checklistPercent}%)`}
                                </span>
                              </>
                            )}
                          </button>
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
                              {/* Step Header + Checkbox */}
                              <div className="flex items-center justify-between gap-3 border-b border-stone-200/60 pb-2">
                                <button
                                  disabled={userRole === 'invitado'}
                                  onClick={() => handleToggleChecklist(item.id)}
                                  className="flex items-center gap-3 text-left group cursor-pointer"
                                >
                                  <span className="shrink-0">
                                    {item.completed ? (
                                      <CheckSquare className="w-5 h-5 text-slate-800" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                                    )}
                                  </span>
                                  <span className={`text-xs font-semibold text-slate-900 ${item.completed ? 'line-through text-slate-500' : ''}`}>
                                    Paso {idx + 1}: {item.text}
                                  </span>
                                </button>

                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
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

                {/* Right Column: Historial de Movimientos del Proyecto */}
              <div className="md:col-span-2 space-y-6">
                {/* Exit Criteria Gate Card */}
                <div className="bg-amber-50/80 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-amber-900">
                      Criterios de Salida de Fase
                    </h3>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    {activePhase.exitCriteria || 'Completar el 100% de la checklist obligatoria y contar con el visto bueno del coordinador.'}
                  </p>
                </div>

                {/* Historial de Movimientos del Proyecto */}
                <div className="bg-white p-6 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800">
                        Historial de Movimientos
                      </h3>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-full">
                      {(project.auditLog?.length || project.timeEntries?.length || 0)} registros
                    </span>
                  </div>

                  {(!project.auditLog || project.auditLog.length === 0) && (!project.timeEntries || project.timeEntries.length === 0) ? (
                    <div className="p-4 text-center bg-[#F4F5F0] rounded-2xl">
                      <p className="text-xs text-slate-400 italic">No hay movimientos o registros recientes aún.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                      {(project.auditLog && project.auditLog.length > 0
                        ? project.auditLog
                        : (project.timeEntries || []).map(te => ({
                            id: `te-${te.id}`,
                            timestamp: te.createdAt || te.date || new Date().toISOString(),
                            username: te.username || 'Colaborador',
                            userRole: te.role || 'contents',
                            action: 'REGISTRO_HORAS',
                            details: `Registro de ${te.hours}h: "${te.description || 'Avance de trabajo'}"`,
                            phaseId: te.phaseId
                          }))
                      ).map((log, idx) => (
                        <div key={log.id || idx} className="p-3 bg-[#F4F5F0] rounded-2xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{log.username || 'Sistema'}</span>
                            <span className="text-xs text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleDateString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 leading-snug">
                            {log.details || log.action}
                          </div>
                          {log.phaseId && (
                            <span className="inline-block text-xs bg-stone-200 text-slate-600 px-1.5 py-0.5 rounded-md font-semibold mt-1">
                              Fase: {log.phaseId}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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

          {/* TAB 2: FICHA & MARCA (IA) */}
          {activeTab === 'brandbible' && (
            <div className="space-y-6" id="brand-bible-tab-content">
              {/* Sub-tab pills selector */}
              <div className="flex items-center justify-between bg-white p-2 rounded-3xl shadow-xs">
                <div className="flex items-center gap-1.5 bg-[#F4F5F0] p-1 rounded-2xl">
                  <button
                    onClick={() => setBrandSubTab('brandbible')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      brandSubTab === 'brandbible'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Brand Bible (Gemini IA)
                  </button>
                  <button
                    onClick={() => setBrandSubTab('project')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      brandSubTab === 'project'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Perfil General del Proyecto
                  </button>
                </div>
                <span className="text-xs text-slate-400 font-medium px-3 hidden md:inline">
                  {brandSubTab === 'brandbible' ? 'Guía de Identidad Inteligente' : 'Información técnica y comercial'}
                </span>
              </div>

              {brandSubTab === 'project' ? (
                <PerfilGeneral
                  project={project}
                  onUpdateProject={onUpdateProject}
                  userRole={userRole}
                />
              ) : (
                <>
                  {/* Gemini Brief Parser Card */}
                  <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-widest bg-purple-800/80 px-2.5 py-1 rounded-full border border-purple-700">
                      Gemini 3.6-Flash Engine
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-playfair">Generar Brand Bible Inteligente</h3>
                    <p className="text-xs text-purple-200 mt-1 leading-relaxed">
                      Pega abajo el brief del cliente, transcripción de llamada de inicio o apuntes desestructurados de marca. La Inteligencia Artificial extraerá automáticamente la misión, UVP, personalidad, guía de logo y voz estructurada para el portal.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      value={briefInput}
                      onChange={(e) => setBriefInput(e.target.value)}
                      placeholder="Ej: El cliente es un SaaS de logística llamado Fasty. Su misión es democratizar envíos ultra-rápidos en LATAM. Valoran mucho la simplicidad y la puntualidad (arquetipo el Héroe). Su paleta usa azul marino profundo #1E3A8A y verde vibrante #10B981, tipografía de cabeceras en Playfair..."
                      className="w-full bg-white/10 border border-purple-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-purple-300 outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/15 transition-all resize-y min-h-[100px] leading-relaxed"
                      disabled={isAnalyzing}
                    />

                    {analysisError && (
                      <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-2xl text-xs text-red-300 flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{analysisError}</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleAnalyzeBrief}
                        disabled={isAnalyzing || !briefInput.trim()}
                        className="bg-white hover:bg-purple-100 text-purple-900 disabled:bg-purple-800/50 disabled:text-purple-300 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 shrink-0"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-purple-900 border-t-transparent rounded-full animate-spin"></div>
                            <span>Procesando con IA...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span>Generar Brand Bible</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Structured Brand Bible Presentation */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Estructura de la Brand Bible
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Refina y edita los campos autogenerados por Gemini.</p>
                  </div>
                  {userRole === 'coordinador' && (
                    <span className="text-xs bg-purple-50 text-purple-700 font-extrabold px-2 py-0.5 rounded-md border border-purple-100 uppercase tracking-wider">
                      Editable
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Category 1: Fundamentos */}
                  <div className="p-5 bg-[#F4F5F0] rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-stone-200/60 pb-1.5">
                      1. Fundamentos (One-Pager)
                    </h4>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Misión</label>
                      <textarea
                        value={bb.onePager?.mission || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('onePager', 'mission', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Visión</label>
                      <textarea
                        value={bb.onePager?.vision || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('onePager', 'vision', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Propuesta de Valor (UVP)</label>
                      <textarea
                        value={bb.onePager?.uvp || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('onePager', 'uvp', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Category 2: Posicionamiento */}
                  <div className="p-5 bg-[#F4F5F0] rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-stone-200/60 pb-1.5">
                      2. Posicionamiento Estratégico
                    </h4>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Declaración de Posicionamiento</label>
                      <textarea
                        value={bb.positioning?.statement || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('positioning', 'statement', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Competidores Clave</label>
                      <textarea
                        value={bb.positioning?.competitors || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('positioning', 'competitors', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Category 3: Personalidad y Audiencia */}
                  <div className="p-5 bg-[#F4F5F0] rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-stone-200/60 pb-1.5">
                      3. Personalidad, Valores & Audiencia
                    </h4>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Valores Clave de Marca</label>
                      <textarea
                        value={bb.valuesAndPersonality?.values || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('valuesAndPersonality', 'values', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Arquetipo de Marca</label>
                      <input
                        type="text"
                        value={bb.valuesAndPersonality?.archetype || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('valuesAndPersonality', 'archetype', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Público Objetivo (Personas)</label>
                      <textarea
                        value={bb.targetAudience?.personas || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('targetAudience', 'personas', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Category 4: Identidad Visual */}
                  <div className="p-5 bg-[#F4F5F0] rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-stone-200/60 pb-1.5">
                      4. Identidad Visual (Logo, Colores, Fuentes)
                    </h4>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Guías de Aplicación de Logo</label>
                      <textarea
                        value={bb.visualIdentity?.logoGuidelines || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('visualIdentity', 'logoGuidelines', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Paleta de Colores de Marca</label>
                      <textarea
                        value={bb.visualIdentity?.colorPalette || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('visualIdentity', 'colorPalette', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Sistema Tipográfico</label>
                      <textarea
                        value={bb.visualIdentity?.typographySystem || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('visualIdentity', 'typographySystem', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Category 5: Voz y Tono */}
                  <div className="p-5 bg-[#F4F5F0] rounded-2xl space-y-3 md:col-span-2">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-stone-200/60 pb-1.5">
                      5. Voz, Tono & Vocabulario de Marca
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Lineamientos de Voz y Tono</label>
                        <textarea
                          value={bb.voiceAndTone?.guidelines || ''}
                          disabled={isGeneralDisabled}
                          onChange={(e) => handleBrandBibleChange('voiceAndTone', 'guidelines', e.target.value)}
                          placeholder="N/A"
                          className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Vocabulario Clave (Términos Permitidos / Prohibidos)</label>
                        <textarea
                          value={bb.voiceAndTone?.vocabulary || ''}
                          disabled={isGeneralDisabled}
                          onChange={(e) => handleBrandBibleChange('voiceAndTone', 'vocabulary', e.target.value)}
                          placeholder="N/A"
                          className="w-full bg-white rounded-xl p-3 text-xs text-slate-700 resize-none outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-75 shadow-2xs"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              </>
              )}
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
                <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                    <Plus className="w-4 h-4 text-slate-800" />
                    <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-500">
                      Publicar Nuevo Entregable para el Cliente
                    </h3>
                  </div>

                  <form onSubmit={handleAddDeliverable} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Título del Archivo / Pieza</label>
                      <input
                        type="text"
                        placeholder="Ej: Wireframe Completo de Landing..."
                        value={delivTitle}
                        onChange={(e) => setDelivTitle(e.target.value)}
                        className="w-full bg-[#F4F5F0] rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-normal"
                        required
                      />
                    </div>

                    <div className="md:col-span-3 space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo de Entregable</label>
                      <select
                        value={delivType}
                        onChange={(e: any) => setDelivType(e.target.value)}
                        className="w-full bg-[#F4F5F0] rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-normal"
                      >
                        <option value="link">Enlace Web (Link)</option>
                        <option value="video">Archivo de Video</option>
                        <option value="audio">Archivo de Audio</option>
                        <option value="pdf">Documento PDF</option>
                        <option value="word">Documento Word</option>
                        <option value="image">Fotografía / Imagen</option>
                        <option value="markdown">Formato Markdown</option>
                      </select>
                    </div>

                    <div className="md:col-span-5 space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">URL del Entregable (Figma, Drive, Staging, etc.)</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={delivUrl}
                          onChange={(e) => setDelivUrl(e.target.value)}
                          className="flex-1 bg-[#F4F5F0] rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-normal"
                        />
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 rounded-full text-xs transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                        >
                          Publicar
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-12 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="deliv-visible-check"
                        checked={delivVisible}
                        onChange={(e) => setDelivVisible(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                      />
                      <label htmlFor="deliv-visible-check" className="text-xs font-semibold text-slate-600 cursor-pointer">
                        Hacer visible inmediatamente para el Cliente / Invitado en su Portal
                      </label>
                    </div>
                  </form>
                </div>
              )}

              {/* Deliverables List and Customer Annotations Review */}
              <div className="space-y-4">
                <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-500">
                  Historial de Entregables Publicados y Feedback Recibido
                </h3>

                {(() => {
                  const visibleList = (project.deliverables || []).filter(
                    (item) => userRole !== 'invitado' || item.isVisibleToClient
                  );

                  if (visibleList.length === 0) {
                    return (
                      <div className="bg-white rounded-3xl p-10 text-center shadow-xs text-slate-400 text-xs font-normal">
                        No hay entregables visibles para mostrar en este momento.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {visibleList.map((item) => {
                        const statusColor =
                          item.status === 'aprobado'
                            ? 'bg-emerald-50 text-emerald-800'
                            : item.status === 'rechazado'
                            ? 'bg-rose-50 text-rose-800'
                            : item.status === 'en_revision'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-stone-100 text-slate-700';

                        const statusLabel =
                          item.status === 'aprobado'
                            ? '✔ Aprobado por Cliente'
                            : item.status === 'rechazado'
                            ? '✖ Requiere Corrección'
                            : item.status === 'en_revision'
                            ? '⏳ En Revisión'
                            : '○ Pendiente';

                        return (
                          <div key={item.id} className="bg-white rounded-3xl p-6 shadow-xs space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold uppercase px-3 py-1 bg-[#F4F5F0] text-slate-700 rounded-full tracking-wider">
                                    {item.type}
                                  </span>
                                  <span className={`text-xs font-semibold uppercase px-3 py-1 rounded-full ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                  <span className="text-xs text-slate-400 font-mono">
                                    {new Date(item.createdAt).toLocaleDateString('es-CL')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-base text-slate-900 leading-snug">{item.title}</h4>
                                {item.externalUrl && (
                                  <a
                                    href={item.externalUrl}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    rel="noopener noreferrer"
                                    className="text-xs text-slate-800 hover:text-slate-950 font-semibold flex items-center gap-1.5 inline-flex mt-1 underline"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-800" />
                                    <span>Abrir recurso externo</span>
                                  </a>
                                )}
                              </div>

                              {/* Controls (Approval, Visibility, Delete) */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Status change actions */}
                                <div className="flex items-center gap-1 bg-[#F4F5F0] p-1 rounded-full">
                                  <button
                                    onClick={() => handleUpdateDeliverableStatus(item.id, 'aprobado')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                                      item.status === 'aprobado'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                                    }`}
                                    title="Aprobar entregable"
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
                                    title="Solicitar correcciones"
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
                                    title="En revisión"
                                  >
                                    En Revisión
                                  </button>
                                </div>

                                {userRole !== 'invitado' && (
                                  <>
                                    <button
                                      onClick={() => handleToggleVisibility(item.id)}
                                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                        item.isVisibleToClient
                                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                          : 'bg-stone-100 text-slate-500 hover:bg-stone-200'
                                      }`}
                                      title={item.isVisibleToClient ? 'Ocultar al cliente' : 'Mostrar al cliente'}
                                    >
                                      {item.isVisibleToClient ? (
                                        <>
                                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Público</span>
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                          <span>Oculto</span>
                                        </>
                                      )}
                                    </button>

                                    {userRole === 'coordinador' && (
                                      <button
                                        onClick={() => handleDeleteDeliverable(item.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all cursor-pointer"
                                        title="Eliminar entregable"
                                      >
                                        <Trash className="w-4 h-4 text-slate-600 hover:text-rose-600" />
                                      </button>
                                    )}
                                  </>
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
