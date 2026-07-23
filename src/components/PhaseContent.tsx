import { Phase, Project, DeliverableItem, Role } from '../types';
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
  TrendingUp
} from 'lucide-react';
import React, { useState } from 'react';
import { analyzeBriefWithGemini } from '../geminiService';
import { RaciMatrix } from './RaciMatrix';
import { PerfilGeneral } from './PerfilGeneral';
import { ProjectFinancialOverview } from './ProjectFinancialOverview';

interface PhaseContentProps {
  activePhase: Phase;
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onSave: () => void;
  onCompletePhase: () => void;
  showSaveToast: boolean;
  userRole: Role;
}

export default function PhaseContent({
  activePhase,
  project,
  onUpdateProject,
  onSave,
  onCompletePhase,
  showSaveToast,
  userRole,
}: PhaseContentProps) {
  const [activeTab, setActiveTab] = useState<'phase' | 'project' | 'brandbible' | 'deliverables' | 'raci' | 'financials'>('phase');

  // AI Brief Form States
  const [briefInput, setBriefInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // New Deliverable Form States
  const [delivTitle, setDelivTitle] = useState('');
  const [delivType, setDelivType] = useState<'video' | 'audio' | 'pdf' | 'word' | 'image' | 'markdown' | 'link'>('link');
  const [delivUrl, setDelivUrl] = useState('');
  const [delivVisible, setDelivVisible] = useState(true);

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

  const checklistItems = activePhase.checklist || [];
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
  const checklistTotal = checklistItems.length;
  const checklistPercent = checklistTotal > 0 ? Math.round((completedChecklistCount / checklistTotal) * 100) : 0;

  // Safe reference to Brand Bible
  const bb = project.brandBible || {};

  return (
    <main className="flex flex-col h-full overflow-hidden bg-white" id="phase-content-wrapper">
      {/* PHASE HEADER */}
      <header className="px-8 py-5 border-b border-slate-200 flex flex-wrap items-center justify-between bg-white shrink-0 gap-4" id="phase-header">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Fase {activePhase.id} — {activePhase.label}
            </h2>
            <span
              className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold border ${
                activePhase.status === 'completed'
                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                  : 'bg-lime-50 border-lime-200 text-lime-700 animate-pulse'
              }`}
            >
              {activePhase.status === 'completed' ? 'Completada' : 'En Progreso'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Administra requerimientos específicos, configura entregables del cliente e impulsa el proyecto con IA.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <span
            className={`text-xs text-lime-600 font-bold transition-all duration-300 flex items-center gap-1 ${
              showSaveToast ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" /> ✔ Cambios Guardados
          </span>
          {userRole !== 'invitado' && (
            <>
              <button
                onClick={onSave}
                className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg px-4 py-2 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-save-progress"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar
              </button>
              <button
                onClick={onCompletePhase}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg px-4 py-2 text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                id="btn-complete-phase"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                Completar Fase
              </button>
            </>
          )}
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="px-8 border-b border-slate-200 flex gap-6 shrink-0 bg-white" id="form-tabs">
        <button
          onClick={() => setActiveTab('phase')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'phase'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Checklist y Campos ({activePhase.id})
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'project'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Perfil General
        </button>
        <button
          onClick={() => setActiveTab('brandbible')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'brandbible'
              ? 'border-purple-600 text-purple-700 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          Brand Bible (Gemini IA)
        </button>
        <button
          onClick={() => setActiveTab('deliverables')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'deliverables'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
          Entregables & Feedback
        </button>
        <button
          onClick={() => setActiveTab('raci')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'raci'
              ? 'border-lime-600 text-lime-700 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-lime-500" />
          Matriz RACI
        </button>
        {userRole !== 'invitado' && (
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'financials'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            Finanzas y Horas
          </button>
        )}
      </div>

      {/* WORKSPACE CONTENT SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50" id="form-scroll-container">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* TAB 1: PHASE REQUIREMENTS & CHECKLIST */}
          {activeTab === 'phase' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6" id="phase-tab-content">
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
                </fieldset>
              </div>

              {/* Checklist Column */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-lime-600" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">
                        Checklist
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
          )}

          {/* TAB 2: GENERAL PROJECT PROFILE */}
          {activeTab === 'project' && (
            <PerfilGeneral
              project={project}
              onUpdateProject={onUpdateProject}
              userRole={userRole}
            />
          )}

          {/* TAB 3: BRAND BIBLE GENERATED WITH GEMINI IA */}
          {activeTab === 'brandbible' && (
            <div className="space-y-6" id="brand-bible-tab-content">
              
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
            </div>
          )}

          {/* TAB 4: DELIVERABLES MANAGEMENT & CLIENT FEEDBACK */}
          {activeTab === 'deliverables' && (
            <div className="space-y-6" id="deliverables-tab-content">
              
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

                {(!project.deliverables || project.deliverables.length === 0) ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs text-slate-400 text-xs font-medium">
                    No hay entregables creados todavía en este proyecto.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {project.deliverables.map((item) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {item.type}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(item.createdAt).toLocaleDateString()}
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

                          {/* Controls (Visibility, Delete) */}
                          {userRole !== 'invitado' && (
                            <div className="flex items-center gap-3">
                              {/* Visibility control */}
                              <button
                                onClick={() => handleToggleVisibility(item.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

                              {/* Delete option */}
                              {userRole === 'coordinador' && (
                                <button
                                  onClick={() => handleDeleteDeliverable(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                  title="Eliminar entregable"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Annotations / Client Feedback History */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                          <h5 className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Anotaciones del Cliente / Feedback ({item.annotations?.length || 0})
                          </h5>

                          {(!item.annotations || item.annotations.length === 0) ? (
                            <p className="text-xs text-slate-400 italic">No se han recibido comentarios todavía.</p>
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
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all shrink-0 active:scale-95 ${
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
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: MATRIZ RACI */}
          {activeTab === 'raci' && (
            <div className="space-y-6" id="raci-tab-content">
              <RaciMatrix
                project={project}
                currentUser={{ id: 'current', username: 'Usuario', role: userRole, puesto: '' }}
                onUpdateRaci={(newMatrix) => {
                  onUpdateProject({
                    ...project,
                    raciMatrix: newMatrix,
                  });
                }}
              />
            </div>
          )}

          {/* TAB 6: FINANCIAL OVERVIEW */}
          {activeTab === 'financials' && userRole !== 'invitado' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="financials-tab-content">
              <ProjectFinancialOverview project={project} />
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
