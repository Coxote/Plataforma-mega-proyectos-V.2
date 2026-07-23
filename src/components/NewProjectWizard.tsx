import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Plus, Trash2, FileText, Users, TrendingUp, ArrowLeft, ArrowRight, 
  FolderPlus, Tag, Sparkles, FileCode2, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { RoleHoursAllocation, ProjectMember, UserSession } from '../types';
import { PROJECT_TEMPLATES, generatePhasesForTemplate } from '../projectTemplates';

const PREDEFINED_TAGS = {
  'Entregable': ['#RedesSociales', '#Branding', '#UI/UX', '#VideoMotion', '#PixelArt', '#GameDev', '#DesarrolloWeb'],
  'Modelo': ['#SuscripcionMensual', '#ProyectoFijo', '#OneShot', '#Auditoria'],
  'Prioridad': ['#Urgente', '#Lanzamiento', '#Mantenimiento']
};

interface NewProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: any) => void;
  users: UserSession[];
}

export const NewProjectWizard: React.FC<NewProjectWizardProps> = ({ isOpen, onClose, onCreateProject, users }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<'general' | 'fases' | 'integrantes' | 'rentabilidad'>('general');
  const [clients, setClients] = useState<any[]>([]);

  // Búsqueda de integrantes
  const [rosterSearch, setRosterSearch] = useState('');

  // Drag & drop state
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('saas_phase_system_clients');
        if (stored) {
          setClients(JSON.parse(stored));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [isOpen]);

  // --- ESTADO UNIFICADO DE BORRADOR (DRAFT) DE PROYECTO ---
  interface ProjectDraft {
    projectName: string;
    clientName: string;
    projectMode: 'blank' | 'template';
    selectedTemplate: string;
    startDate: string;
    endDate: string;
    saleOrderNumber: string;
    deliverablesCount: number | '';
    description: string;
    tags: string[];
    customPhases: any[];
    members: any[];
    currency: string;
    totalIncome: number | '';
    roleHours: RoleHoursAllocation;
  }

  const DEFAULT_DRAFT: ProjectDraft = {
    projectName: '',
    clientName: '',
    projectMode: 'blank',
    selectedTemplate: 'redes',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    saleOrderNumber: '',
    deliverablesCount: '',
    description: '',
    tags: [],
    customPhases: [],
    members: [],
    currency: 'USD',
    totalIncome: '',
    roleHours: { 
      coordinador: 0, 
      sac: 0, 
      contents: 0, 
      contentd: 0 
    }
  };

  const [draft, setDraft] = useState<ProjectDraft>(() => {
    try {
      const saved = localStorage.getItem('saas_phase_system_project_draft');
      return saved ? JSON.parse(saved) : DEFAULT_DRAFT;
    } catch {
      return DEFAULT_DRAFT;
    }
  });

  // Guardar automáticamente el borrador cuando cambia
  useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem('saas_phase_system_project_draft', JSON.stringify(draft));
      } catch (err) {
        console.error('Error saving project draft to localStorage:', err);
      }
    }
  }, [draft, isOpen]);

  // --- TRANSICIONES Y ESTADOS DE INTERFAZ TRANSITORIOS ---
  const [isGeneratingPhases, setIsGeneratingPhases] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  if (!isOpen) return null;

  const totalHoursCalculated = 
    Number(draft.roleHours.coordinador || 0) + 
    Number(draft.roleHours.sac || 0) + 
    Number(draft.roleHours.contents || 0) + 
    Number(draft.roleHours.contentd || 0);

  // Funciones de Etiquetas
  const toggleTag = (tag: string) => {
    setDraft(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  // Drag and Drop para Integrantes
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMemberId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropToRole = (e: React.DragEvent, newRole: 'Principal' | 'Apoyo' | 'Observador') => {
    e.preventDefault();
    if (draggedMemberId) {
      setDraft(prev => ({
        ...prev,
        members: prev.members.map(m => m.id === draggedMemberId ? { ...m, participationRole: newRole } : m)
      }));
      setDraggedMemberId(null);
    }
  };

  // Agregar al hacer clic
  const handleAddMemberClick = (user: any) => {
    if (!draft.members.some(m => m.id === user.id)) {
      setDraft(prev => ({
        ...prev,
        members: [...prev.members, { 
          id: user.id, 
          name: user.name, 
          role: user.roleBase, 
          participationRole: 'Principal',
          avatar: user.avatar 
        }]
      }));
    }
  };

  const handleRemoveMember = (id: string) => {
    setDraft(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id)
    }));
  };

  // Funciones de Fases (IA y Markdown)
  const handleGeneratePhasesWithAI = () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingPhases(true);
    
    setTimeout(() => {
      let generated: { name: string, tasks: { title: string }[] }[] = [];
      const promptLower = aiPrompt.toLowerCase();
      
      if (promptLower.includes('web') || promptLower.includes('pagina') || promptLower.includes('sitio')) {
        generated = [
          { name: 'Wireframing & UX', tasks: [{title: 'Sitemap funcional'}, {title: 'Wireframes de baja fidelidad'}] },
          { name: 'UI & Diseño Visual', tasks: [{title: 'Figma Design System'}, {title: 'Prototipo interactivo final'}] },
          { name: 'Desarrollo Front/Back', tasks: [{title: 'Setup entorno Vite'}, {title: 'Maquetado Tailwind CSS'}] }
        ];
      } else if (promptLower.includes('juego') || promptLower.includes('pixel') || promptLower.includes('game')) {
        generated = [
          { name: 'Game Design Document', tasks: [{title: 'Mecánicas básicas'}, {title: 'Reglas y Balance'}] },
          { name: 'Sprites & Arte Pixel', tasks: [{title: 'Animaciones personaje'}, {title: 'Tilemap de escenarios'}] },
          { name: 'Motor & QA', tasks: [{title: 'Programación de colisiones'}, {title: 'Playtesting alfa'}] }
        ];
      } else if (promptLower.includes('redes') || promptLower.includes('social') || promptLower.includes('marketing')) {
        generated = [
          { name: 'Estrategia de Redes', tasks: [{title: 'Definir Brief'}, {title: 'Benchmarking de competencia'}] },
          { name: 'Diseño de Copys & Grillas', tasks: [{title: 'Redacción de copys'}, {title: 'Aprobación de Grilla Semanal'}] },
          { name: 'Diseño de Recursos', tasks: [{title: 'Postales de marca'}, {title: 'Edición de Reels'}] }
        ];
      } else {
        generated = [
          { name: 'Fase 1: Onboarding & Setup', tasks: [{title: 'Reunión de Kickoff'}, {title: 'Setup accesos y tableros'}] },
          { name: 'Fase 2: Ejecución', tasks: [{title: 'Desarrollo de entregables'}, {title: 'Iteración según feedback'}] },
          { name: 'Fase 3: Cierre', tasks: [{title: 'Puesta en marcha'}, {title: 'Cierre de proyecto'}] }
        ];
      }

      const formatted = generated.map((ph, idx) => ({
        id: `ph-${idx + 1}-${Date.now()}`,
        label: `A${idx + 1}. ${ph.name}`,
        status: idx === 0 ? ('active' as const) : ('pending' as const),
        completedAt: null,
        checklist: ph.tasks.map((task, tidx) => ({
          id: `t-${idx + 1}-${tidx + 1}-${Date.now()}`,
          text: task.title,
          completed: false
        })),
        fields: {}
      }));

      setDraft(prev => ({ ...prev, customPhases: formatted }));
      setIsGeneratingPhases(false);
      setAiPrompt('');
    }, 2000);
  };

  const handleFileUploadMD = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        let parsedPhases: any[] = [];
        let currentPhase: any = null;

        lines.forEach((line) => {
          if (line.startsWith('# ')) {
            if (currentPhase) parsedPhases.push(currentPhase);
            currentPhase = { 
              id: `md-${Date.now()}-${Math.random()}`, 
              label: line.replace('# ', '').trim(), 
              status: parsedPhases.length === 0 ? 'active' : 'pending', 
              completedAt: null,
              checklist: [], 
              fields: {} 
            };
          } else if (line.startsWith('- [ ]') && currentPhase) {
            currentPhase.checklist.push({ 
              id: `t-${Date.now()}-${Math.random()}`, 
              text: line.replace('- [ ]', '').trim(), 
              completed: false 
            });
          }
        });
        if (currentPhase) parsedPhases.push(currentPhase);
        setDraft(prev => ({
          ...prev,
          customPhases: parsedPhases.length ? parsedPhases : [{ id: '1', label: 'A1. Fase Importada', status: 'active', completedAt: null, checklist: [], fields: {} }]
        }));
      };
      reader.readAsText(file);
    }
  };

  const handleRoleHourChange = (role: keyof RoleHoursAllocation, val: string) => {
    setDraft(prev => ({
      ...prev,
      roleHours: {
        ...prev.roleHours,
        [role]: parseInt(val, 10) || 0
      }
    }));
  };

  // Resetear estados y borrar borrador temporal de localStorage
  const handleResetAndClose = () => {
    setStep(1);
    setActiveTab('general');
    setDraft(DEFAULT_DRAFT);
    setAiPrompt('');
    try {
      localStorage.removeItem('saas_phase_system_project_draft');
    } catch (err) {
      console.error(err);
    }
    onClose();
  };

  // Guardar proyecto
  const handleFinish = () => {
    const finalPhases = draft.projectMode === 'template' 
      ? generatePhasesForTemplate(draft.selectedTemplate) 
      : (draft.customPhases.length > 0 ? draft.customPhases : [
          { id: 'A1', label: 'A1. Fase Inicial', status: 'active', completedAt: null, checklist: [], fields: {} }
        ]);

    onCreateProject({
      name: draft.projectName,
      clientName: draft.clientName,
      templateType: draft.projectMode === 'template' ? draft.selectedTemplate : 'custom',
      startDate: draft.startDate, 
      endDate: draft.endDate, 
      saleOrderNumber: draft.saleOrderNumber, 
      deliverablesCount: Number(draft.deliverablesCount) || 0, 
      description: draft.description, 
      tags: draft.tags, 
      members: draft.members.map(m => ({ id: m.id, name: m.name, role: m.role, participationRole: m.participationRole })), 
      currency: draft.currency, 
      totalIncome: Number(draft.totalIncome) || 0, 
      roleHours: draft.roleHours, 
      hoursTotal: totalHoursCalculated, 
      phases: finalPhases
    });

    handleResetAndClose();
  };

  const rosterUsers = (users || [])
    .filter(u => u.role !== 'invitado')
    .map(u => ({
      id: u.id,
      name: u.username.charAt(0).toUpperCase() + u.username.slice(1),
      roleBase: u.puesto || 'Colaborador',
      avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.username}`
    }));

  const filteredRoster = rosterUsers.filter(member => 
    member.name.toLowerCase().includes(rosterSearch.toLowerCase()) || 
    member.roleBase.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in duration-200">
        
        {/* ======================= PASO 1 ======================= */}
        {step === 1 && (
          <div className="p-8 space-y-8 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">Configuración Inicial del Proyecto</h2>
              <button onClick={handleResetAndClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del proyecto *</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Rediseño Portal Clientes"
                    value={draft.projectName} 
                    onChange={(e) => setDraft(prev => ({ ...prev, projectName: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-cyan-500 bg-slate-50" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cliente *</label>
                  <input
                    type="text"
                    list="clients-list-suggestions"
                    placeholder="Introduce o selecciona cliente *"
                    value={draft.clientName}
                    onChange={(e) => setDraft(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-cyan-500 bg-slate-50"
                  />
                  <datalist id="clients-list-suggestions">
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.nombreComercial} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de proyecto *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setDraft(prev => ({ ...prev, projectMode: 'blank' }))} 
                    className={`cursor-pointer p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center h-32 transition-all ${
                      draft.projectMode === 'blank' 
                        ? 'border-cyan-500 bg-cyan-50/30 text-cyan-700' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-500'
                    }`}
                  >
                    <FolderPlus className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">En blanco / Builder</span>
                  </div>
                  <div 
                    onClick={() => setDraft(prev => ({ ...prev, projectMode: 'template' }))} 
                    className={`cursor-pointer p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center h-32 transition-all ${
                      draft.projectMode === 'template' 
                        ? 'border-cyan-500 bg-cyan-50/30 text-cyan-700' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-500'
                    }`}
                  >
                    <FileText className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">Plantilla</span>
                  </div>
                </div>
                {draft.projectMode === 'template' && (
                  <select 
                    value={draft.selectedTemplate} 
                    onChange={(e) => setDraft(prev => ({ ...prev, selectedTemplate: e.target.value }))} 
                    className="mt-4 w-full px-4 py-2.5 rounded-xl border border-cyan-200 text-xs font-bold bg-cyan-50 text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {PROJECT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                disabled={!draft.projectName.trim() || !draft.clientName.trim()} 
                onClick={() => setStep(2)} 
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* ======================= PASO 2 ======================= */}
        {step === 2 && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto shrink-0">
              <button 
                onClick={() => setActiveTab('general')} 
                className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-all ${
                  activeTab === 'general' ? 'border-cyan-500 text-cyan-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                ⚙️ General
              </button>
              
              {draft.projectMode === 'blank' && (
                <button 
                  onClick={() => setActiveTab('fases')} 
                  className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-all ${
                    activeTab === 'fases' ? 'border-cyan-500 text-cyan-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🏗️ Fases (Builder)
                </button>
              )}
              
              <button 
                onClick={() => setActiveTab('integrantes')} 
                className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-all ${
                  activeTab === 'integrantes' ? 'border-cyan-500 text-cyan-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                👥 Integrantes
              </button>
              <button 
                onClick={() => setActiveTab('rentabilidad')} 
                className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-all ${
                  activeTab === 'rentabilidad' ? 'border-cyan-500 text-cyan-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📊 Rentabilidad
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-white">
              
              {/* TAB GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Inicio</label>
                      <input 
                        type="date" 
                        value={draft.startDate} 
                        onChange={(e) => setDraft(prev => ({ ...prev, startDate: e.target.value }))} 
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Final *</label>
                      <input 
                        type="date" 
                        value={draft.endDate} 
                        onChange={(e) => setDraft(prev => ({ ...prev, endDate: e.target.value }))} 
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">ID / Orden de Venta</label>
                      <input 
                        type="text" 
                        placeholder="OV-104" 
                        value={draft.saleOrderNumber} 
                        onChange={(e) => setDraft(prev => ({ ...prev, saleOrderNumber: e.target.value }))} 
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Cantidad de entregables esperados</label>
                      <input 
                        type="number" 
                        placeholder="Ej: 5" 
                        value={draft.deliverablesCount} 
                        onChange={(e) => setDraft(prev => ({ ...prev, deliverablesCount: e.target.value ? Number(e.target.value) : '' }))} 
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Descripción / Brief</label>
                      <textarea 
                        rows={1} 
                        value={draft.description} 
                        onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))} 
                        placeholder="Breve explicación de las metas acordadas..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none font-medium focus:outline-none" 
                      />
                    </div>
                  </div>

                  {/* Etiquetas Predefinidas */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-3">Etiquetas del Proyecto</label>
                    <div className="space-y-3">
                      {Object.entries(PREDEFINED_TAGS).map(([category, tagList]) => (
                        <div key={category} className="flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase w-20">{category}:</span>
                          {tagList.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                                draft.tags.includes(tag) 
                                  ? 'bg-cyan-500 text-white border-cyan-600 shadow-xs' 
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB FASES (CUSTOM BUILDER) */}
              {activeTab === 'fases' && draft.projectMode === 'blank' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Generador IA */}
                    <div className="bg-slate-900 p-5 rounded-2xl text-white space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <h4 className="text-sm font-bold">Generador IA de Fases y Tareas</h4>
                      </div>
                      <textarea 
                        placeholder="Ej: Es un minijuego de futbol pixel art para web..." 
                        value={aiPrompt} 
                        onChange={(e) => setAiPrompt(e.target.value)} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white resize-none outline-none focus:border-cyan-500 placeholder:text-slate-500" 
                        rows={3}
                      />
                      <button 
                        onClick={handleGeneratePhasesWithAI} 
                        disabled={isGeneratingPhases} 
                        className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingPhases ? 'IA Generando Estructura Inteligente...' : '✨ Autogenerar con IA'}
                      </button>
                    </div>

                    {/* Importador Markdown */}
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 flex flex-col justify-center items-center text-center">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCode2 className="w-5 h-5 text-slate-600" />
                        <h4 className="text-sm font-bold text-slate-800">Importar Markdown (.md)</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal max-w-xs">
                        Carga tu brief. Las líneas con H1 (#) se cargan como Fases y los checklist (- [ ]) como tareas internas de la fase.
                      </p>
                      <label className="cursor-pointer bg-white border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                        Subir archivo .md
                        <input type="file" accept=".md" className="hidden" onChange={handleFileUploadMD} />
                      </label>
                    </div>
                  </div>

                  {/* Lista de Fases Generadas */}
                  {draft.customPhases.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Fases Estructuradas en el Builder ({draft.customPhases.length}):
                      </h4>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto">
                        {draft.customPhases.map(ph => (
                          <div key={ph.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold flex justify-between items-center shadow-xs">
                            <span className="text-slate-800">{ph.label}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">
                              {ph.checklist?.length || 0} tareas identificadas
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB INTEGRANTES: FIGMA/TRELLO INTERACTIVE DRAG AND DROP */}
              {activeTab === 'integrantes' && (
                <div className="space-y-6 h-full flex flex-col">
                  <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full min-h-[350px]">
                    
                    {/* ROSTER LATERAL IZQUIERDO */}
                    <div className="w-full lg:w-1/3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col">
                      <div className="mb-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Roster de Integrantes</span>
                        <input 
                           type="text" 
                           placeholder="Buscar por nombre o rol..."
                           value={rosterSearch}
                           onChange={(e) => setRosterSearch(e.target.value)}
                           className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px]">
                        {filteredRoster.map(member => {
                          const isAssigned = draft.members.some(m => m.id === member.id);
                          return (
                            <div 
                              key={member.id} 
                              onClick={() => !isAssigned && handleAddMemberClick(member)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                isAssigned 
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-65' 
                                  : 'bg-white border-slate-200/60 hover:bg-slate-100 hover:border-slate-300 cursor-pointer shadow-xs'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <img src={member.avatar} className="w-7 h-7 rounded-full border border-slate-100 shadow-inner" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{member.name}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{member.roleBase}</span>
                                </div>
                              </div>
                              {!isAssigned && (
                                <span className="text-[10px] text-cyan-600 bg-cyan-50 font-bold px-2 py-0.5 rounded-lg border border-cyan-100">
                                  Añadir
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* DRAG AND DROP COLUMNS */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* COLUMNA 1: PRINCIPAL */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropToRole(e, 'Principal')}
                        className="bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-2xl flex flex-col min-h-[180px] transition-colors hover:bg-amber-50"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
                          <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                            👑 Principal ({draft.members.filter(m => m.participationRole === 'Principal').length})
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {draft.members.filter(m => m.participationRole === 'Principal').map(m => (
                            <div 
                              key={m.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, m.id)}
                              className="group flex items-center justify-between p-2 bg-white rounded-xl border border-amber-200/70 shadow-xs cursor-grab active:cursor-grabbing transition-all hover:border-amber-300"
                            >
                              <div className="flex items-center gap-2">
                                <img src={m.avatar} className="w-7 h-7 rounded-full shrink-0 shadow-inner" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{m.name}</span>
                                  <span className="text-[9px] text-slate-400 font-bold">{m.role}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* COLUMNA 2: APOYO */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropToRole(e, 'Apoyo')}
                        className="bg-blue-50/50 border border-blue-200/60 p-3.5 rounded-2xl flex flex-col min-h-[180px] transition-colors hover:bg-blue-50"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-blue-200 pb-2">
                          <span className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1">
                            🤝 Apoyo ({draft.members.filter(m => m.participationRole === 'Apoyo').length})
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {draft.members.filter(m => m.participationRole === 'Apoyo').map(m => (
                            <div 
                              key={m.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, m.id)}
                              className="group flex items-center justify-between p-2 bg-white rounded-xl border border-blue-200/70 shadow-xs cursor-grab active:cursor-grabbing transition-all hover:border-blue-300"
                            >
                              <div className="flex items-center gap-2">
                                <img src={m.avatar} className="w-7 h-7 rounded-full shrink-0 shadow-inner" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{m.name}</span>
                                  <span className="text-[9px] text-slate-400 font-bold">{m.role}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* COLUMNA 3: OBSERVADOR */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropToRole(e, 'Observador')}
                        className="bg-slate-100/50 border border-slate-300/60 p-3.5 rounded-2xl flex flex-col min-h-[180px] transition-colors hover:bg-slate-100"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-slate-300 pb-2">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            👁️ Observador ({draft.members.filter(m => m.participationRole === 'Observador').length})
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {draft.members.filter(m => m.participationRole === 'Observador').map(m => (
                            <div 
                              key={m.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, m.id)}
                              className="group flex items-center justify-between p-2 bg-white rounded-xl border border-slate-300/70 shadow-xs cursor-grab active:cursor-grabbing transition-all hover:border-slate-400"
                            >
                              <div className="flex items-center gap-2">
                                <img src={m.avatar} className="w-7 h-7 rounded-full shrink-0 shadow-inner" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{m.name}</span>
                                  <span className="text-[9px] text-slate-400 font-bold">{m.role}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* TAB RENTABILIDAD */}
              {activeTab === 'rentabilidad' && (
                <div className="space-y-6">
                  <h3 className="text-base font-black text-slate-900">Mide la rentabilidad del proyecto</h3>

                  {/* Tipo de Ingreso */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Configuración de Ingreso</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Moneda base</label>
                        <select
                          value={draft.currency}
                          onChange={(e) => setDraft(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="GTQ">GTQ (Q)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ingreso Total (Monto Manual) *</label>
                        <input
                          type="number"
                          placeholder="Ej: 5000"
                          value={draft.totalIncome}
                          onChange={(e) => setDraft(prev => ({ ...prev, totalIncome: e.target.value ? Number(e.target.value) : '' }))}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desglose de Horas Vendidas por Rol */}
                  <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Estimación de Horas Vendidas por Rol</span>
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-black px-3 py-1 rounded-full">
                        Total: {totalHoursCalculated} hrs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coordinador</label>
                        <input
                          type="number"
                          min="0"
                          value={draft.roleHours.coordinador}
                          onChange={(e) => handleRoleHourChange('coordinador', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SAC</label>
                        <input
                          type="number"
                          min="0"
                          value={draft.roleHours.sac}
                          onChange={(e) => handleRoleHourChange('sac', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ContentS</label>
                        <input
                          type="number"
                          min="0"
                          value={draft.roleHours.contents}
                          onChange={(e) => handleRoleHourChange('contents', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ContentD</label>
                        <input
                          type="number"
                          min="0"
                          value={draft.roleHours.contentd}
                          onChange={(e) => handleRoleHourChange('contentd', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Navegación Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
              <button 
                type="button"
                onClick={() => {
                  if (activeTab === 'rentabilidad') {
                    setActiveTab('integrantes');
                  } else if (activeTab === 'integrantes') {
                    if (draft.projectMode === 'blank') {
                      setActiveTab('fases');
                    } else {
                      setActiveTab('general');
                    }
                  } else if (activeTab === 'fases') {
                    setActiveTab('general');
                  } else {
                    setStep(1);
                  }
                }} 
                className="text-xs font-bold text-cyan-600 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>

              {activeTab !== 'rentabilidad' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'general') {
                      if (draft.projectMode === 'blank') {
                        setActiveTab('fases');
                      } else {
                        setActiveTab('integrantes');
                      }
                    } else if (activeTab === 'fases') {
                      setActiveTab('integrantes');
                    } else if (activeTab === 'integrantes') {
                      setActiveTab('rentabilidad');
                    }
                  }}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Siguiente
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleFinish} 
                  disabled={!draft.endDate || draft.totalIncome === ''}
                  className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-40"
                >
                  Crear Proyecto
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
