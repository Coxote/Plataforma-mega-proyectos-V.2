import { Phase, Project, DeliverableItem, Role, ClientAnnotation, DecisionLogEntry, UserSession } from '../types';
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
  Clock
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

  // Safe reference to Brand Bible
  const bb = project.brandBible || {};

  const timeEntries = project.timeEntries || [];
  const totalConsumedHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalHours = project.hoursTotal || 40;
  const retrabajoStats = getRetrabajoStats(project);

  const activePhaseIndex = project.phases.findIndex((p) => p.id === activePhase.id);
  const activeIndex = activePhaseIndex >= 0 ? activePhaseIndex : 0;
  const expectedMaxPercent = Math.round(((activeIndex + 1) / project.phases.length) * 100);
  const hoursPercent = totalHours > 0 ? Math.round((totalConsumedHours / totalHours) * 100) : 0;
  
  let calculatedHealth = 100;
  if (hoursPercent > expectedMaxPercent + 10) {
    calculatedHealth -= Math.round((hoursPercent - (expectedMaxPercent + 10)) * 1.5);
  }
  const finalHealth = Math.min(100, Math.max(15, calculatedHealth));

  return (
    <main className="flex flex-col h-full overflow-hidden bg-white" id="phase-content-wrapper">
      
      {/* 1. TOP SUB-NAV PHASE PILLS BAR */}
      <div className="bg-slate-100/90 border-b border-slate-200/80 px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0" id="phase-pills-bar">
        {project.phases.map((p) => {
          const isActive = p.id === activePhase.id;
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
                  ? 'bg-slate-900 text-white shadow-xs font-extrabold border border-slate-800'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>{p.id} {p.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. MAIN PHASE HEADER */}
      <header className="px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="phase-header">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-slate-700/50">
            {project.clientName ? project.clientName.substring(0, 2).toUpperCase() : 'GL'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-200/80">
                {project.clientName || 'GLOBEX S.A.'}
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight truncate">
                {project.name}
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] rounded-full font-bold border bg-blue-50 border-blue-200 text-blue-700">
                • En Progreso ({activePhase.id})
              </span>
            </div>
          </div>
        </div>

        {/* User Info Avatar + Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 overflow-hidden flex items-center justify-center text-white text-[10px] font-bold">
              {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'CV'}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.username || 'Carlos Vega'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium capitalize">
                {currentUser?.puesto || currentUser?.role || 'Senior PM'}
              </div>
            </div>
          </div>

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
                className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl px-3.5 py-2 text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                id="btn-save-progress"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar
              </button>
              <button
                onClick={onCompletePhase}
                className="bg-pink-700 hover:bg-pink-800 text-white font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                id="btn-complete-phase"
              >
                <Plus className="w-3.5 h-3.5" />
                Completar Fase
              </button>
            </>
          )}
        </div>
      </header>

      {/* 3. NAVIGATION TABS (3 Core Hubs) */}
      <div className="px-6 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 bg-white" id="form-tabs">
        <button
          onClick={() => setActiveTab('phase')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'phase'
              ? 'border-slate-900 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-slate-600" />
          <span>Fase {activePhase.id} & Checklist</span>
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
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50" id="form-scroll-container">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* TAB 1: PHASE REQUIREMENTS & CHECKLIST */}
          {activeTab === 'phase' && (
            <div className="space-y-6" id="phase-tab-content">
              
              {/* 4 KPI CARDS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
                {/* Card 1: SALUD DEL PROYECTO */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        SALUD DEL PROYECTO
                      </span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                      finalHealth < 50 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : finalHealth < 80 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {finalHealth}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      {finalHealth < 50 ? 'Crítico' : finalHealth < 80 ? 'En riesgo' : 'Óptimo'}
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          finalHealth < 50 ? 'bg-rose-500' : finalHealth < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${finalHealth}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">
                      {finalHealth < 50 
                        ? '⚠️ Requiere atención inmediata. Se sugieren reuniones de contención.'
                        : finalHealth < 80
                        ? '⚡ Desviaciones menores detectadas en los plazos.'
                        : '✅ Proyecto ejecutándose de acuerdo a lo planificado.'}
                    </p>
                  </div>
                </div>

                {/* Card 2: CONSUMO DE HORAS PROYECTO */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      CONSUMO DE HORAS
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      {totalConsumedHours}h <span className="text-xs text-slate-400 font-bold">/ {totalHours}h</span>
                    </div>
                    <StackedHoursBar timeEntries={timeEntries} hoursTotal={totalHours} showTitle={false} />
                  </div>
                </div>

                {/* Card 3: RETRABAJO DEL PROYECTO */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      RETRABAJO
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      {retrabajoStats.porcentajeRetrabajo.toFixed(1)}%
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-medium">
                      <div className="bg-amber-50/80 border border-amber-100/80 p-1.5 rounded-xl">
                        <span className="text-slate-500 block text-[9px] font-semibold">Cliente</span>
                        <strong className="text-amber-900 font-bold">{retrabajoStats.porOrigen.cliente}h</strong>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl">
                        <span className="text-slate-500 block text-[9px] font-semibold">Interno</span>
                        <strong className="text-slate-800 font-bold">{retrabajoStats.porOrigen.interno}h</strong>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl">
                        <span className="text-slate-500 block text-[9px] font-semibold">Proveedor</span>
                        <strong className="text-slate-800 font-bold">{retrabajoStats.porOrigen.proveedor}h</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: COSTO ESTIMADO */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      COSTO ESTIMADO
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      ${(project.totalIncome || 16991).toLocaleString('es-CL')}{' '}
                      <span className="text-xs text-slate-400 font-bold">USD</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-400">Presupuesto Base</span>
                      <strong className="text-slate-700 font-bold">$3.627,20 USD</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION HEADER */}
              <h3 className="text-base font-black text-slate-900 tracking-tight pt-2">
                Fase {activePhase.id}: Campos y Hitos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Left Form: Phase Specific Fields */}
                <div className="md:col-span-3 space-y-6">
                <fieldset disabled={isPhaseDisabled} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 disabled:opacity-85">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FileCode className="w-4 h-4 text-lime-600" />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">
                      Campos Específicos de la Fase {activePhase.id}
                    </h3>
                  </div>

                  {activePhase.id === 'A1' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Minuta / Acuerdos de Reunión de Inicio</label>
                        <textarea
                          value={activePhase.fields.minuta || ''}
                          onChange={(e) => handleSpecificFieldChange('minuta', e.target.value)}
                          rows={4}
                          placeholder="Tratados principales, expectativas y primeros acuerdos con el cliente..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stakeholders y Equipo Asignado</label>
                        <textarea
                          value={activePhase.fields.stakeholders || ''}
                          onChange={(e) => handleSpecificFieldChange('stakeholders', e.target.value)}
                          rows={3}
                          placeholder="Ej: María López (Product Lead), Carlos Díaz (Dev), etc."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activePhase.id === 'A2' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
                          <input
                            type="date"
                            value={activePhase.fields.fechaInicio || ''}
                            onChange={(e) => handleSpecificFieldChange('fechaInicio', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Estimada Entrega</label>
                          <input
                            type="date"
                            value={activePhase.fields.fechaEntrega || ''}
                            onChange={(e) => handleSpecificFieldChange('fechaEntrega', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calendario de Hitos Clave</label>
                        <textarea
                          value={activePhase.fields.hitosClave || ''}
                          onChange={(e) => handleSpecificFieldChange('hitosClave', e.target.value)}
                          rows={4}
                          placeholder="Hito 1: Entrega Wireframes&#10;Hito 2: Desarrollo Core API&#10;Hito 3: Lanzamiento MVP"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all resize-none font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {activePhase.id === 'A3' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enlace a Prototipos / Wireframes (Figma)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400">
                            <Link className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="url"
                            value={activePhase.fields.linkPrototipo || ''}
                            onChange={(e) => handleSpecificFieldChange('linkPrototipo', e.target.value)}
                            placeholder="https://figma.com/file/..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feedback del Cliente sobre Diseño</label>
                        <textarea
                          value={activePhase.fields.comentariosCliente || ''}
                          onChange={(e) => handleSpecificFieldChange('comentariosCliente', e.target.value)}
                          rows={4}
                          placeholder="Correcciones de UI/UX o flujos solicitados por el cliente antes de la aprobación..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activePhase.id === 'A4' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Aprobador</label>
                        <input
                          type="text"
                          value={activePhase.fields.aprobador || ''}
                          onChange={(e) => handleSpecificFieldChange('aprobador', e.target.value)}
                          placeholder="Ej: María López (Product Lead)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Método de Aprobación Formal</label>
                        <textarea
                          value={activePhase.fields.metodoAprobacion || ''}
                          onChange={(e) => handleSpecificFieldChange('metodoAprobacion', e.target.value)}
                          rows={3}
                          placeholder="Ej: Firmado por DocuSign, Aprobación formal por escrito en minuta..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activePhase.id === 'A5' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enlace del Repositorio de Código</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400">
                            <Link className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="url"
                            value={activePhase.fields.repoUrl || ''}
                            onChange={(e) => handleSpecificFieldChange('repoUrl', e.target.value)}
                            placeholder="https://github.com/organization/repo"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado del Sprint / Reporte de Avance Técnico</label>
                        <textarea
                          value={activePhase.fields.estadoDesarrollo || ''}
                          onChange={(e) => handleSpecificFieldChange('estadoDesarrollo', e.target.value)}
                          rows={4}
                          placeholder="Detalla qué endpoints están listos, base de datos migrada, o componentes implementados..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activePhase.id === 'A6' && (
                    <div className="space-y-4">
                      {/* QA Quality Assurance Banner */}
                      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white p-4 rounded-xl border border-emerald-800 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                              QA & UAT Quality Control Suite
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            100% Pass Rate
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-slate-400 block font-semibold">Casos de Prueba</span>
                            <span className="font-extrabold text-emerald-300 font-mono text-xs">14 / 14 Aprobados</span>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-slate-400 block font-semibold">Bugs Resueltos</span>
                            <span className="font-extrabold text-indigo-300 font-mono text-xs">3 / 3 Solucionados</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enlace a Entorno de Staging</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400">
                            <Link className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="url"
                            value={activePhase.fields.entornoTest || ''}
                            onChange={(e) => handleSpecificFieldChange('entornoTest', e.target.value)}
                            placeholder="https://staging.app.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reporte de Bugs Encontrados / Resueltos</label>
                        <textarea
                          value={activePhase.fields.bugsPendientes || ''}
                          onChange={(e) => handleSpecificFieldChange('bugsPendientes', e.target.value)}
                          rows={4}
                          placeholder="Enumera bugs críticos detectados, prioridades y responsables de QA..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activePhase.id === 'A7' && (
                    <div className="space-y-4">
                      {/* Go-Live & Project Handoff Celebration Banner */}
                      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl border border-indigo-800 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">
                              Go-Live & Acta de Cierre Firmada
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✔ Proyecto Entregado
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-slate-400 block font-semibold">Estado de Garantía</span>
                            <span className="font-extrabold text-emerald-300 font-mono text-xs">SLA 90 Días Activo</span>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-slate-400 block font-semibold">Siguiente Fase</span>
                            <span className="font-extrabold text-indigo-300 font-mono text-xs">Mantenimiento & Retainer</span>
                          </div>
                        </div>

                        {activePhase.fields.urlProduccion && (
                          <div className="pt-1">
                            <a
                              href={activePhase.fields.urlProduccion}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              rel="noopener noreferrer"
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Abrir Sitio en Producción Oficial</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL de Producción Oficial</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400">
                            <Link className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="url"
                            value={activePhase.fields.urlProduccion || ''}
                            onChange={(e) => handleSpecificFieldChange('urlProduccion', e.target.value)}
                            placeholder="https://app.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notas de Entrega y Cierre</label>
                        <textarea
                          value={activePhase.fields.notasEntrega || ''}
                          onChange={(e) => handleSpecificFieldChange('notasEntrega', e.target.value)}
                          rows={4}
                          placeholder="Resumen del despliegue final, manuales de usuario cargados y agradecimientos del cierre..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activePhase.id === 'A8' && (
                    <div className="space-y-4">
                      {/* SLA & Retainer Active Card Banner */}
                      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white p-4 rounded-xl border border-emerald-800/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                              Centro de Control SLA & Retainer Activo
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Uptime 99.98%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-slate-400 block font-semibold">Nivel de SLA</span>
                            <span className="font-extrabold text-amber-300 font-mono text-xs">SLA Oro (&lt; 1h P1)</span>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-slate-400 block font-semibold">Bolsa Retainer Mensual</span>
                            <span className="font-extrabold text-emerald-300 font-mono text-xs">4.5h / 15.0h Consumidas</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acuerdo de Nivel de Servicio (SLA Tier)</label>
                        <input
                          type="text"
                          value={activePhase.fields.slaTier || ''}
                          onChange={(e) => handleSpecificFieldChange('slaTier', e.target.value)}
                          placeholder="SLA Nivel Oro (Respuesta Críticos < 1h | Mantenimiento 15h/mes)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canal Directo de Soporte / Helpdesk</label>
                        <input
                          type="text"
                          value={activePhase.fields.soporteContacto || ''}
                          onChange={(e) => handleSpecificFieldChange('soporteContacto', e.target.value)}
                          placeholder="soporte@agencia.com / Slack: #acme-support"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Métricas de Rendimiento & Uptime</label>
                        <input
                          type="text"
                          value={activePhase.fields.metricasUptime || ''}
                          onChange={(e) => handleSpecificFieldChange('metricasUptime', e.target.value)}
                          placeholder="99.98% Uptime en los últimos 30 días. 0 Incidencias P1."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registro de Bolsa Evolutiva y Mantenimiento</label>
                        <textarea
                          value={activePhase.fields.bolsaEvolutiva || ''}
                          onChange={(e) => handleSpecificFieldChange('bolsaEvolutiva', e.target.value)}
                          rows={3}
                          placeholder="Horas contratadas, horas consumidas del período actual y solicitudes pendientes..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activePhase.id === 'A9' && (
                    <div className="space-y-4">
                      {/* Post-Mortem & Evaluation Banner */}
                      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-4 rounded-xl border border-emerald-800/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                              Evaluación de Proyecto & Retrospectiva Post-Mortem
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            NPS 10/10 • CSAT 98%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-slate-400 block font-semibold">Rentabilidad Final</span>
                            <span className="font-extrabold text-emerald-300 font-mono text-xs">38.2% EBITDA (Ahorro 6.87% hrs)</span>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-slate-400 block font-semibold">Cierre de Proyecto</span>
                            <span className="font-extrabold text-indigo-300 font-mono text-xs">Aprobado al 100% Sin Deuda Técnica</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Satisfacción del Cliente (NPS / CSAT / Testimonio)</label>
                        <textarea
                          value={activePhase.fields.satisfaccionCliente || ''}
                          onChange={(e) => handleSpecificFieldChange('satisfaccionCliente', e.target.value)}
                          rows={2}
                          placeholder="Puntuación NPS, CSAT y testimonio destacado del cliente..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance de Horas & Varianza de Rentabilidad</label>
                        <input
                          type="text"
                          value={activePhase.fields.balanceHorasRentabilidad || ''}
                          onChange={(e) => handleSpecificFieldChange('balanceHorasRentabilidad', e.target.value)}
                          placeholder="Planificadas vs Consumidas, margen bruto y varianza final..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lecciones Aprendidas & Retrospectiva Interna</label>
                        <textarea
                          value={activePhase.fields.aprendizajesPostMortem || ''}
                          onChange={(e) => handleSpecificFieldChange('aprendizajesPostMortem', e.target.value)}
                          rows={3}
                          placeholder="Logros clave, eficiencias identificadas y oportunidades de mejora para futuros proyectos..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Caso de Éxito & Roadmap de Evolutivos Futuros</label>
                        <textarea
                          value={activePhase.fields.casoExitoRoadmap || ''}
                          onChange={(e) => handleSpecificFieldChange('casoExitoRoadmap', e.target.value)}
                          rows={2}
                          placeholder="Publicación de caso de éxito, alcance acordado para fase 2 u oportunidades de venta cruzada..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}
                </fieldset>
              </div>

              {/* Checklist Column */}
              <div className="md:col-span-2 space-y-6">
                {/* Exit Criteria Gate Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
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

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-lime-600" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">
                        Checklist Obligatoria
                      </h3>
                    </div>
                    <span className="text-[10px] bg-lime-50 text-lime-800 font-mono font-bold px-2 py-0.5 rounded-full">
                      {checklistPercent}%
                    </span>
                  </div>

                  {checklistItems.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hay tareas configuradas para esta fase.</p>
                  ) : (
                    <div className="space-y-1" id="checklist-items">
                      {checklistItems.map((item) => (
                        <button
                          key={item.id}
                          disabled={userRole === 'invitado'}
                          onClick={() => handleToggleChecklist(item.id)}
                          className={`w-full flex items-start gap-3 p-2 rounded-xl text-left text-xs transition-colors group ${
                            userRole === 'invitado'
                              ? 'opacity-80 cursor-default'
                              : 'cursor-pointer hover:bg-slate-50'
                          } ${
                            item.completed 
                              ? 'bg-slate-50/50 text-slate-400 font-medium' 
                              : 'text-slate-700 font-medium'
                          }`}
                        >
                          <span className="shrink-0 mt-0.5">
                            {item.completed ? (
                              <CheckSquare className="w-4 h-4 text-lime-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 group-hover:text-lime-500 transition-colors" />
                            )}
                          </span>
                          <span className={`leading-tight ${item.completed ? 'line-through opacity-75' : ''}`}>
                            {item.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-lime-400 transition-all duration-500 rounded-full"
                        style={{ width: `${checklistPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-slate-400 text-right mt-2 font-bold uppercase tracking-wider">
                      {completedChecklistCount} de {checklistTotal} completadas
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Marcar los requerimientos completados actualiza instantáneamente el estatus del proyecto. Al finalizar todo, puedes liberar la fase formalmente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* TAB 2: FICHA & MARCA (IA) */}
          {activeTab === 'brandbible' && (
            <div className="space-y-6" id="brand-bible-tab-content">
              {/* Sub-tab pills selector */}
              <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
                  <button
                    onClick={() => setBrandSubTab('brandbible')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      brandSubTab === 'project'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Perfil General del Proyecto
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 font-medium px-3 hidden md:inline">
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
                  <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-widest bg-purple-800/80 px-2.5 py-1 rounded-md border border-purple-700">
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
                      className="w-full bg-white/10 border border-purple-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder:text-purple-300 outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/15 transition-all resize-y min-h-[100px] leading-relaxed"
                      disabled={isAnalyzing}
                    />
                    
                    {analysisError && (
                      <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-center gap-2 font-medium">
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
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Estructura de la Brand Bible
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Refina y edita los campos autogenerados por Gemini.</p>
                  </div>
                  {userRole === 'coordinador' && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-extrabold px-2 py-0.5 rounded-md border border-purple-100 uppercase tracking-wider">
                      Editable
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Category 1: Fundamentos */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">
                      1. Fundamentos (One-Pager)
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Misión</label>
                      <textarea
                        value={bb.onePager?.mission || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('onePager', 'mission', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Visión</label>
                      <textarea
                        value={bb.onePager?.vision || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('onePager', 'vision', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Propuesta de Valor (UVP)</label>
                      <textarea
                        value={bb.onePager?.uvp || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('onePager', 'uvp', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Category 2: Posicionamiento */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">
                      2. Posicionamiento Estratégico
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Declaración de Posicionamiento</label>
                      <textarea
                        value={bb.positioning?.statement || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('positioning', 'statement', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Competidores Clave</label>
                      <textarea
                        value={bb.positioning?.competitors || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('positioning', 'competitors', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Category 3: Personalidad y Audiencia */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">
                      3. Personalidad, Valores & Audiencia
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Valores Clave de Marca</label>
                      <textarea
                        value={bb.valuesAndPersonality?.values || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('valuesAndPersonality', 'values', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Arquetipo de Marca</label>
                      <input
                        type="text"
                        value={bb.valuesAndPersonality?.archetype || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('valuesAndPersonality', 'archetype', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none focus:border-purple-500 disabled:opacity-75"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Público Objetivo (Personas)</label>
                      <textarea
                        value={bb.targetAudience?.personas || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('targetAudience', 'personas', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Category 4: Identidad Visual */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">
                      4. Identidad Visual (Logo, Colores, Fuentes)
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Guías de Aplicación de Logo</label>
                      <textarea
                        value={bb.visualIdentity?.logoGuidelines || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('visualIdentity', 'logoGuidelines', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Paleta de Colores de Marca</label>
                      <textarea
                        value={bb.visualIdentity?.colorPalette || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('visualIdentity', 'colorPalette', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Sistema Tipográfico</label>
                      <textarea
                        value={bb.visualIdentity?.typographySystem || ''}
                        disabled={isGeneralDisabled}
                        onChange={(e) => handleBrandBibleChange('visualIdentity', 'typographySystem', e.target.value)}
                        placeholder="N/A"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Category 5: Voz y Tono */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 md:col-span-2">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">
                      5. Voz, Tono & Vocabulario de Marca
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Lineamientos de Voz y Tono</label>
                        <textarea
                          value={bb.voiceAndTone?.guidelines || ''}
                          disabled={isGeneralDisabled}
                          onChange={(e) => handleBrandBibleChange('voiceAndTone', 'guidelines', e.target.value)}
                          placeholder="N/A"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Vocabulario Clave (Términos Permitidos / Prohibidos)</label>
                        <textarea
                          value={bb.voiceAndTone?.vocabulary || ''}
                          disabled={isGeneralDisabled}
                          onChange={(e) => handleBrandBibleChange('voiceAndTone', 'vocabulary', e.target.value)}
                          placeholder="N/A"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 resize-none outline-none focus:border-purple-500 disabled:opacity-75"
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
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4" id="portal-cliente-banner">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase tracking-widest">
                        Portal de Entregables
                      </span>
                      {userRole === 'invitado' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                          Vista Cliente Activa
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-black text-white">
                      Centro de Revisión & Visto Bueno de Entregables
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      Revisa las piezas finales publicadas, deja comentarios o anotaciones puntuales y aprueba formalmente los entregables de cada fase.
                    </p>
                  </div>

                  {/* Summary badges */}
                  <div className="flex items-center gap-3 self-start md:self-auto shrink-0 font-mono text-xs">
                    <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10 text-center">
                      <div className="text-lg font-black text-white">
                        {(project.deliverables || []).filter(d => userRole !== 'invitado' || d.isVisibleToClient).length}
                      </div>
                      <div className="text-[9px] uppercase text-slate-300 font-bold">Publicados</div>
                    </div>

                    <div className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 rounded-xl text-center">
                      <div className="text-lg font-black text-emerald-300">
                        {(project.deliverables || []).filter(d => (userRole !== 'invitado' || d.isVisibleToClient) && d.status === 'aprobado').length}
                      </div>
                      <div className="text-[9px] uppercase text-emerald-300 font-bold">Aprobados</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add New Deliverable Form */}
              {userRole !== 'invitado' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">
                      Publicar Nuevo Entregable para el Cliente
                    </h3>
                  </div>

                  <form onSubmit={handleAddDeliverable} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Título del Archivo / Pieza</label>
                      <input
                        type="text"
                        placeholder="Ej: Wireframe Completo de Landing..."
                        value={delivTitle}
                        onChange={(e) => setDelivTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Entregable</label>
                      <select
                        value={delivType}
                        onChange={(e: any) => setDelivType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL del Entregable (Figma, Drive, Staging, etc.)</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={delivUrl}
                          onChange={(e) => setDelivUrl(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm shadow-indigo-100"
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
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
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
                <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">
                  Historial de Entregables Publicados y Feedback Recibido
                </h3>

                {(() => {
                  const visibleList = (project.deliverables || []).filter(
                    (item) => userRole !== 'invitado' || item.isVisibleToClient
                  );

                  if (visibleList.length === 0) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs text-slate-400 text-xs font-medium">
                        No hay entregables visibles para mostrar en este momento.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {visibleList.map((item) => {
                        const statusColor = 
                          item.status === 'aprobado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.status === 'rechazado'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : item.status === 'en_revision'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200';

                        const statusLabel = 
                          item.status === 'aprobado'
                            ? '✔ Aprobado por Cliente'
                            : item.status === 'rechazado'
                            ? '✖ Requiere Corrección'
                            : item.status === 'en_revision'
                            ? '⏳ En Revisión'
                            : '○ Pendiente';

                        return (
                          <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {item.type}
                                  </span>
                                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(item.createdAt).toLocaleDateString('es-CL')}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-800 leading-snug">{item.title}</h4>
                                {item.externalUrl && (
                                  <a
                                    href={item.externalUrl}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 inline-flex mt-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Abrir recurso externo</span>
                                  </a>
                                )}
                              </div>

                              {/* Controls (Approval, Visibility, Delete) */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Status change actions */}
                                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                  <button
                                    onClick={() => handleUpdateDeliverableStatus(item.id, 'aprobado')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                      item.status === 'aprobado'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                                    }`}
                                    title="Aprobar entregable"
                                  >
                                    Aprobar
                                  </button>

                                  <button
                                    onClick={() => handleUpdateDeliverableStatus(item.id, 'rechazado')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                      item.status === 'rechazado'
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:bg-rose-100 hover:text-rose-800'
                                    }`}
                                    title="Solicitar correcciones"
                                  >
                                    Pedir Ajuste
                                  </button>

                                  <button
                                    onClick={() => handleUpdateDeliverableStatus(item.id, 'en_revision')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                      item.status === 'en_revision'
                                        ? 'bg-amber-500 text-white shadow-2xs'
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
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        item.isVisibleToClient
                                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
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
                                          <EyeOff className="w-3.5 h-3.5" />
                                          <span>Oculto</span>
                                        </>
                                      )}
                                    </button>

                                    {userRole === 'coordinador' && (
                                      <button
                                        onClick={() => handleDeleteDeliverable(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                        title="Eliminar entregable"
                                      >
                                        <Trash className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Annotations / Client Feedback History */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                              <h5 className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                                Observaciones / Comentarios del Cliente ({item.annotations?.length || 0})
                              </h5>

                              {(!item.annotations || item.annotations.length === 0) ? (
                                <p className="text-xs text-slate-400 italic">No se han ingresado observaciones todavía.</p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {item.annotations.map((ann) => (
                                    <div key={ann.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-start justify-between gap-4 shadow-2xs">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400">
                                          <span className="font-extrabold text-slate-700">{ann.authorName}</span>
                                          <span>•</span>
                                          <span>{ann.date}</span>
                                          <span>•</span>
                                          <span className={`font-bold uppercase ${ann.status === 'resuelto' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {ann.status}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.comment}</p>
                                      </div>

                                      {/* Resolve toggle */}
                                      {userRole !== 'invitado' && (
                                        <button
                                          onClick={() => handleToggleAnnotationStatus(item.id, ann.id)}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all shrink-0 active:scale-95 cursor-pointer ${
                                            ann.status === 'resuelto'
                                              ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 hover:text-slate-600'
                                              : 'bg-lime-500 text-slate-900 hover:bg-lime-600 hover:shadow-xs'
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
                                className="flex gap-2 pt-2 border-t border-slate-200/60"
                              >
                                <input
                                  type="text"
                                  name={`comment-${item.id}`}
                                  placeholder={userRole === 'invitado' ? "Escribe un comentario o ajuste para el equipo..." : "Agregar respuesta u observación interna..."}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30"
                                />
                                <button
                                  type="submit"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
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
    </main>
  );
}
