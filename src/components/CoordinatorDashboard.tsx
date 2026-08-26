import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, UserSession } from '../types';
import { runSlaRuleEngine } from '../utils/slaRuleEngine';
import {
  calculateGlobalFinancials,
  calculateTeamWorkload,
  getGlobalReworkIndicator,
  getTeamPerformanceComparisons,
} from '../utils/metrics';
import {
  ChevronDown,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Send,
  UserCheck,
  Check,
  ShieldCheck,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  ExternalLink,
  HelpCircle,
  FileCheck2,
  Activity,
  AlertCircle,
  Download,
  Search,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  DollarSign,
  Wallet,
  FileText,
  GitPullRequest,
  TrendingDown,
  Percent,
  PieChart
} from 'lucide-react';
import { TeamCard, VitaminizedMember } from './TeamCard';
import { UserInspectorPanel } from './UserInspectorPanel';

interface Props {
  projects: Project[];
  users: UserSession[];
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
}

interface RiskMatrixItem {
  id: string;
  prob: number; // 1 to 5 (Y axis)
  impact: number; // 1 to 5 (X axis)
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const CoordinatorDashboard: React.FC<Props> = ({
  projects,
  users,
  activeProjectId,
  onSelectProject
}) => {
  // Current active project or fallback to "Campaña Digital" / first project
  const currentProject = useMemo(() => {
    if (activeProjectId) {
      const found = projects.find(p => p.id === activeProjectId);
      if (found) return found;
    }
    const campana = projects.find(p => p.name.toLowerCase().includes('campa') || p.name.toLowerCase().includes('digital'));
    return campana || projects[0];
  }, [projects, activeProjectId]);

  const [selectedMember, setSelectedMember] = useState<VitaminizedMember | null>(null);
  const [activeDecisionTab, setActiveDecisionTab] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{ prob: number; impact: number } | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<{ [key: string]: boolean }>({});
  
  // Custom project selector state
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectDropdownOpen]);

  // Date formatter to 00/00/0000 format
  const formatDeliveryDate = (dateStr?: string): string => {
    if (!dateStr) return '28/07/2026';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '28/07/2026';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '28/07/2026';
    }
  };

  // Download project handler
  const handleDownloadProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(currentProject?.name || 'proyecto').toLowerCase().replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered projects for search
  const filteredProjects = useMemo(() => {
    if (!projectSearchTerm.trim()) return projects;
    const term = projectSearchTerm.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.clientName && p.clientName.toLowerCase().includes(term))
    );
  }, [projects, projectSearchTerm]);

  // Calculations for current project
  const projectSoldHours = currentProject?.hoursTotal || 160;
  const projectConsumedHours = useMemo(() => {
    if (currentProject?.timeEntries && currentProject.timeEntries.length > 0) {
      return currentProject.timeEntries.reduce((acc, t) => acc + (t.hours || 0), 0);
    }
    if (currentProject?.budget) {
      return Object.values(currentProject.budget).reduce((acc: number, b: any) => acc + (b?.consumed || 0), 0);
    }
    return 142;
  }, [currentProject]);

  const hoursProgress = Math.min(100, Math.round((projectConsumedHours / projectSoldHours) * 100));

  // Dynamic health, SPI, CPI calculations for unified card
  const healthScore = useMemo(() => {
    if (!currentProject) return 80;
    if (currentProject.status === 'blocked') return 42;
    if (currentProject.status === 'delayed') return 64;
    if (currentProject.id === 'p1') return 80;
    if (currentProject.id === 'p2') return 85;
    if (currentProject.id === 'p3') return 68;
    return 80;
  }, [currentProject]);

  const healthTrend: 'up' | 'down' = healthScore >= 75 ? 'up' : healthScore >= 50 ? 'up' : 'down';
  const healthColor = healthScore >= 75 ? '#12AB51' : healthScore >= 50 ? '#FF5500' : '#EF4444';

  const spiDisplay = useMemo(() => {
    if (currentProject?.id === 'p1') return '0.96';
    if (currentProject?.id === 'p2') return '1.02';
    if (currentProject?.id === 'p3') return '0.88';
    return '0.96';
  }, [currentProject]);

  const spiSubtitle = parseFloat(spiDisplay) >= 1.0 ? 'Adelantado' : parseFloat(spiDisplay) >= 0.90 ? 'En plan' : 'Con retraso';
  const spiColor = parseFloat(spiDisplay) >= 0.90 ? '#12AB51' : '#FF5500';

  const cpiDisplay = useMemo(() => {
    if (currentProject?.id === 'p1') return '1.0';
    if (currentProject?.id === 'p2') return '1.08';
    if (currentProject?.id === 'p3') return '0.92';
    return '1.0';
  }, [currentProject]);

  const cpiSubtitle = parseFloat(cpiDisplay) >= 1.0 ? '5% eficiencia' : 'Sobre costo';
  const cpiColor = parseFloat(cpiDisplay) >= 1.0 ? '#12AB51' : '#FF5500';

  // Global progress calculation
  const globalProgress = useMemo(() => {
    if (currentProject?.progress !== undefined) return currentProject.progress;
    return 78;
  }, [currentProject]);

  const activePhaseName = useMemo(() => {
    if (currentProject?.phases && currentProject.phases.length > 0) {
      const active = currentProject.phases.find(p => p.status === 'active');
      if (active) return active.label;
      const completed = currentProject.phases.filter(p => p.status === 'completed').length;
      return `${completed}/${currentProject.phases.length} fases`;
    }
    return 'Fase Sprint';
  }, [currentProject]);

  // Financial & Scope Health Calculations (EAC vs BAC, S-Curve, Scope Creep)
  const bacValue = useMemo(() => projectSoldHours * 300, [projectSoldHours]);
  const acValue = useMemo(() => projectConsumedHours * 300, [projectConsumedHours]);
  const evValue = useMemo(() => Math.round(bacValue * (globalProgress / 100)), [bacValue, globalProgress]);
  const cpiNum = useMemo(() => (parseFloat(cpiDisplay) > 0 ? parseFloat(cpiDisplay) : 1.0), [cpiDisplay]);
  const eacValue = useMemo(() => Math.round(bacValue / cpiNum), [bacValue, cpiNum]);
  const vacValue = useMemo(() => bacValue - eacValue, [bacValue, eacValue]);
  const vacPercentage = useMemo(() => ((vacValue / bacValue) * 100).toFixed(1), [vacValue, bacValue]);

  // Gauge needle angle (-160deg to -20deg, -90deg is center at 1.0 ratio)
  const gaugeRatio = eacValue / (bacValue || 1);
  const gaugeAngle = Math.min(-20, Math.max(-160, -90 + (gaugeRatio - 1.0) * 220));

  // Curva S Financiera (Burn Rate Trend)
  const sCurveData = useMemo(() => {
    return [
      { stage: 'Kickoff', PV: 6000, AC: 4200, EV: 5800 },
      { stage: 'Reqs', PV: 14000, AC: 10500, EV: 13200 },
      { stage: 'Diseño', PV: 24000, AC: 18200, EV: 23500 },
      { stage: 'Review', PV: 35000, AC: 25500, EV: 32800 },
      { stage: 'Sprint (Hoy)', PV: 42000, AC: 33000, EV: evValue },
      { stage: 'QA Proj', PV: 46000, AC: 41000, EV: 44000 },
      { stage: 'Cierre', PV: bacValue, AC: eacValue, EV: bacValue },
    ];
  }, [bacValue, eacValue, evValue]);

  // Scope Creep / Volatilidad del Alcance
  const scopeCreepData = useMemo(() => {
    return [
      { sprint: 'Kickoff', base: 160, extra: 0, total: 160 },
      { sprint: 'Reqs', base: 160, extra: 4, total: 164 },
      { sprint: 'Diseño', base: 160, extra: 12, total: 172 },
      { sprint: 'Review', base: 160, extra: 18, total: 178 },
      { sprint: 'Sprint (Hoy)', base: 160, extra: 23, total: 183 },
    ];
  }, []);

  const changeRequestsList = useMemo(() => [
    { id: 'CR-04', title: 'Variaciones 3D e interactivos', hours: '+15h', cost: '$4,500', status: 'Aprobada', type: 'approved' },
    { id: 'CR-05', title: 'Adaptación responsive extra', hours: '+8h', cost: '$2,400', status: 'En revisión', type: 'pending' },
    { id: 'CR-06', title: 'Módulo multilingüe adicional', hours: '+20h', cost: '$6,000', status: 'Propuesta', type: 'draft' },
  ], []);

  // SLA Rule engine alerts
  const slaAlerts = useMemo(() => runSlaRuleEngine(projects), [projects]);
  const financials = useMemo(() => calculateGlobalFinancials(projects), [projects]);
  const teamPerformance = useMemo(() => getTeamPerformanceComparisons(users, projects), [users, projects]);

  // Performance Trend Data (SPI vs CPI & Hours)
  const trendData = [
    { month: 'ENE', SPI: 0.92, CPI: 1.12, horasConsumidas: 24, horasPlan: 28 },
    { month: 'FEB', SPI: 0.95, CPI: 1.10, horasConsumidas: 56, horasPlan: 60 },
    { month: 'MAR', SPI: 0.98, CPI: 1.08, horasConsumidas: 92, horasPlan: 95 },
    { month: 'ABR', SPI: 0.97, CPI: 1.07, horasConsumidas: 120, horasPlan: 125 },
    { month: 'MAY', SPI: 0.98, CPI: 1.08, horasConsumidas: 142, horasPlan: 145 },
  ];

  // Phase Progress Data
  const phaseData = useMemo(() => {
    if (currentProject?.phases && currentProject.phases.length > 0) {
      return currentProject.phases.map(ph => ({
        name: ph.label,
        completado: ph.status === 'completed' ? 100 : ph.status === 'active' ? 70 : 0,
        estado: ph.status
      }));
    }
    return [
      { name: 'Kickoff', completado: 100, estado: 'completed' },
      { name: 'Cronograma', completado: 100, estado: 'completed' },
      { name: 'Revisión', completado: 100, estado: 'completed' },
      { name: 'Aprobación', completado: 100, estado: 'completed' },
      { name: 'Sprint', completado: 75, estado: 'active' },
      { name: 'QA', completado: 15, estado: 'pending' },
    ];
  }, [currentProject]);

  // 5x5 Heatmap Matrix Risk items
  const matrixRisks: RiskMatrixItem[] = [
    { id: 'r1', prob: 4, impact: 4, title: 'Retraso de aprobación por cliente en entregable visual', category: 'Cliente', severity: 'critical' },
    { id: 'r2', prob: 3, impact: 5, title: 'Límite de horas contratadas superado en Fase Sprint', category: 'Horas', severity: 'critical' },
    { id: 'r3', prob: 2, impact: 4, title: 'Disponibilidad de diseñador UI para ajustes finales', category: 'Capacidad', severity: 'medium' },
    { id: 'r4', prob: 2, impact: 2, title: 'Desviación menor en tiempo de pruebas QA', category: 'Calidad', severity: 'low' },
    { id: 'r5', prob: 4, impact: 2, title: 'Feedback adicional fuera del alcance inicial', category: 'Alcance', severity: 'medium' },
    { id: 'r6', prob: 1, impact: 3, title: 'Alineación de canales de comunicación', category: 'Gobierno', severity: 'low' },
  ];

  // Action handlers
  const handleActionNotification = (cardId: string) => {
    setNotificationStatus(prev => ({ ...prev, [cardId]: true }));
    setTimeout(() => {
      setNotificationStatus(prev => ({ ...prev, [cardId]: false }));
    }, 3000);
  };

  // Color helper for roles
  const getUserColor = (role: string): string => {
    switch (role) {
      case 'coordinador': return 'bg-slate-900';
      case 'sac': return 'bg-[#12AB51]';
      case 'contents': return 'bg-purple-600';
      case 'contentd': return 'bg-blue-600';
      case 'invitado': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  // Build Vitaminized Member objects dynamically
  const teamMembers = useMemo<VitaminizedMember[]>(() => {
    const activeStaff = users.filter(u => u.role !== 'invitado');
    const loads = calculateTeamWorkload(activeStaff, projects);

    return loads.map(load => {
      let baseSkills: string[] = ['Operaciones'];
      if (load.role === 'coordinador') baseSkills = ['Gestión', 'Control', 'Finanzas'];
      else if (load.role === 'sac') baseSkills = ['Cuentas', 'Figma Inspect', 'Copywriting'];
      else if (load.role === 'contents') baseSkills = ['Social Media', 'Estrategia', 'SEO'];
      else if (load.role === 'contentd') baseSkills = ['UI/UX', 'Illustrator', 'Branding'];

      return {
        ...load,
        email: `${load.username.toLowerCase()}@operationsatelier.com`,
        status: load.effectiveSaturation > 100 ? 'overloaded' : load.effectiveSaturation > 80 ? 'busy' : 'available',
        skills: baseSkills,
        efficiencyScore: Math.min(100, Math.max(65, Math.round(100 - (load.effectiveSaturation > 100 ? (load.effectiveSaturation - 100) * 1.5 : 0)))),
        historyProjectsCount: load.activeProjectsCount + 3,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${load.username}`,
      };
    });
  }, [users, projects]);

  return (
    <div
      className="min-h-full overflow-y-auto"
      style={{
        background: 'linear-gradient(to bottom right, #F8FAFC, #F1F5F9)',
        padding: '40px 40px 60px 40px'
      }}
      id="project-dashboard-main-view"
    >
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ========================================================================= */}
        {/* BLOQUE 1: HERO & KPIS SUPERIORES                                          */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          {/* LADO IZQUIERDO: SECCIÓN DEL PROYECTO */}
          <div className="flex-1 min-w-0">
            {/* Texto Dashboard Ejecutivo en tipografia light en minusculas solo primeras mayusculas */}
            <div className="text-sm font-light text-[#64748B] tracking-normal mb-0.5">
              Dashboard Ejecutivo
            </div>

            {/* Nombre del proyecto con dropdown desplegable (sin cambio de color en hover) */}
            <div className="relative inline-block" ref={dropdownRef}>
              <button
                id="dashboard-project-name-trigger"
                type="button"
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="project-title text-[#1E293B] font-semibold inline-flex items-center gap-2.5 cursor-pointer focus:outline-none text-left"
                style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.01em', color: '#1E293B' }}
              >
                <span className="text-[#1E293B]">{currentProject?.name || 'Campaña Digital'}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#1E293B] shrink-0 transition-transform duration-300 ease-out ${
                    isProjectDropdownOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  style={{ width: '20px', height: '20px' }}
                />
              </button>

              {/* Desplegable: recuadro blanco sin borde y sin hover, integrado con el chevron, reducido 10% */}
              {isProjectDropdownOpen && (
                <div
                  id="project-selector-dropdown"
                  className="absolute top-0 -left-3 z-50 min-w-[430px] w-[calc(100%+28px)] max-w-[570px] bg-white rounded-xl shadow-2xl p-3.5 border-0"
                  style={{ border: 'none' }}
                >
                  {/* Espacio para escribir el proyecto integrado con el chevron exterior */}
                  <div className="relative flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <input
                      id="search-project-input"
                      type="text"
                      value={projectSearchTerm}
                      onChange={(e) => setProjectSearchTerm(e.target.value)}
                      placeholder="buscar proyecto..."
                      autoFocus
                      className="w-full pr-10 py-1 text-base bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none border-0 font-normal"
                      style={{ border: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsProjectDropdownOpen(false)}
                      className="text-[#1E293B] cursor-pointer p-1 rounded transition-transform duration-300 shrink-0"
                      title="Cerrar lista"
                    >
                      <ChevronDown
                        className="w-5 h-5 text-[#1E293B] rotate-180 transition-transform duration-300 ease-out"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </button>
                  </div>

                  {/* Lista de proyectos filtrada (sin hover de color) */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredProjects.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No se encontraron proyectos
                      </div>
                    ) : (
                      filteredProjects.map((p) => {
                        const isSelected = p.id === currentProject?.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              onSelectProject(p.id);
                              setIsProjectDropdownOpen(false);
                              setProjectSearchTerm('');
                            }}
                            className="py-2.5 px-3 cursor-pointer flex items-center justify-between text-slate-800 text-sm font-medium"
                          >
                            <span>{p.name}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-slate-800 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fecha de entrega bajo el formato 00/00/0000 (sin datos en tiempo real) */}
            <p className="text-sm text-[#64748B] font-normal mt-1 flex flex-wrap items-center gap-2">
              <span>Fecha de entrega: <strong className="text-slate-700 font-medium">{formatDeliveryDate(currentProject?.endDate)}</strong></span>
              <span>•</span>
              <span>Cliente: <strong className="text-slate-700 font-medium">{currentProject?.clientName || 'Famosa'}</strong></span>
            </p>

            {/* Botón con bordes redondeados 6px naranja fd4c06 que diga descargar proyecto */}
            <div className="mt-3">
              <button
                id="btn-download-project"
                type="button"
                onClick={handleDownloadProject}
                className="h-[36px] px-4 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: '#FD4C06',
                  borderRadius: '6px',
                }}
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Descargar proyecto</span>
              </button>
            </div>
          </div>

          {/* LADO DERECHO: BLOQUE ÚNICO CON 5 MÉTRICAS CENTRADAS Y ALINEADAS EN 3 NIVELES */}
          <div
            id="unified-kpi-block"
            className="bg-white rounded-[16px] px-6 py-4 border border-[#E2E8F0] flex flex-wrap lg:flex-nowrap items-center justify-between gap-5 sm:gap-7 shrink-0"
            style={{
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Columna 1: Salud General */}
            <div className="flex flex-col items-center text-center min-w-[95px] flex-1">
              <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                Salud General
              </span>
              <div className="h-10 flex items-center justify-center gap-1 my-1">
                <span
                  className="kpi-value leading-none font-bold tracking-tight"
                  style={{
                    fontSize: '34px',
                    color: healthColor
                  }}
                >
                  {healthScore}%
                </span>
                <span
                  className="text-sm font-bold leading-none select-none"
                  style={{
                    color: healthColor
                  }}
                >
                  {healthTrend === 'up' ? '▲' : '▼'}
                </span>
              </div>
              <span
                className="text-[11px] font-semibold tracking-tight whitespace-nowrap h-4 flex items-center justify-center"
                style={{ color: healthColor }}
              >
                {healthScore >= 75 ? 'Excelente' : healthScore >= 50 ? 'Atención' : 'Crítico'}
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-12 bg-slate-100 shrink-0" />

            {/* Columna 2: SPI (Cronograma) */}
            <div className="flex flex-col items-center text-center min-w-[95px] flex-1">
              <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                SPI (Cronograma)
              </span>
              <div className="h-10 flex items-center justify-center my-1">
                <span
                  className="kpi-value text-slate-900 leading-none font-bold tracking-tight"
                  style={{ fontSize: '34px' }}
                >
                  {spiDisplay}
                </span>
              </div>
              <span
                className="text-[11px] font-semibold tracking-tight whitespace-nowrap h-4 flex items-center justify-center"
                style={{ color: spiColor }}
              >
                {spiSubtitle}
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-12 bg-slate-100 shrink-0" />

            {/* Columna 3: CPI(Costo) */}
            <div className="flex flex-col items-center text-center min-w-[95px] flex-1">
              <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                CPI(Costo)
              </span>
              <div className="h-10 flex items-center justify-center my-1">
                <span
                  className="kpi-value text-slate-900 leading-none font-bold tracking-tight"
                  style={{ fontSize: '34px' }}
                >
                  {cpiDisplay}
                </span>
              </div>
              <span
                className="text-[11px] font-semibold tracking-tight whitespace-nowrap h-4 flex items-center justify-center"
                style={{ color: cpiColor }}
              >
                {cpiSubtitle}
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-12 bg-slate-100 shrink-0" />

            {/* Columna 4: Horas Consumidas */}
            <div className="flex flex-col items-center text-center min-w-[95px] flex-1">
              <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                Horas Consumidas
              </span>
              <div className="h-10 flex items-center justify-center my-1">
                <span
                  className="kpi-value text-slate-900 leading-none font-bold tracking-tight"
                  style={{ fontSize: '34px' }}
                >
                  {projectConsumedHours}h
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 tracking-tight whitespace-nowrap h-4 flex items-center justify-center">
                de {projectSoldHours}h vendidas
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-12 bg-slate-100 shrink-0" />

            {/* Columna 5: Avance Global */}
            <div className="flex flex-col items-center text-center min-w-[95px] flex-1">
              <span className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap h-5 flex items-center justify-center">
                Avance Global
              </span>
              <div className="h-10 flex items-center justify-center my-1">
                <span
                  className="kpi-value text-slate-900 leading-none font-bold tracking-tight"
                  style={{ fontSize: '34px' }}
                >
                  {globalProgress}%
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 tracking-tight whitespace-nowrap h-4 flex items-center justify-center">
                {activePhaseName}
              </span>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 2: SALUD FINANCIERA Y CONTROL DE ALCANCE (FINANZAS & SCOPE)        */}
        {/* ========================================================================= */}
        <div className="space-y-4" id="financial-scope-health-block">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#12AB51]" />
              Salud Financiera y Control de Alcance (Finanzas & Scope)
            </h2>
            <span className="text-xs font-medium text-[#64748B]">
              Supervisión de Presupuesto, Curva S y Pipeline de Cambios
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* TARJETA 1: MÉTRICAS PRESUPUESTARIAS (EAC vs. BAC) (4 COLS) */}
            <div
              id="financial-card-eac-bac"
              className="lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E2E8F0] flex flex-col justify-between"
              style={{
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E2E8F0]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#12AB51]" />
                      Métricas Presupuestarias (EAC vs. BAC)
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Presupuesto Inicial vs. Proyectado al Cierre.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#12AB51] bg-[#12AB51]/10 px-2 py-0.5 rounded">
                    Eficiente
                  </span>
                </div>

                {/* Gauge / Velocímetro semicircular */}
                <div className="relative flex flex-col items-center justify-center my-2">
                  <svg viewBox="0 0 200 120" className="w-52 h-32 overflow-visible">
                    {/* Segmento 1: Verde (Eficiente < 95%) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 88 23"
                      fill="none"
                      stroke="#12AB51"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    {/* Segmento 2: Ámbar (En Plan 95% - 105%) */}
                    <path
                      d="M 94 21 A 80 80 0 0 1 122 25"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="14"
                    />
                    {/* Segmento 3: Rojo (Sobre Costo > 105%) */}
                    <path
                      d="M 128 28 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    {/* Pivot point */}
                    <circle cx="100" cy="100" r="7" fill="#1E293B" />
                    <circle cx="100" cy="100" r="3" fill="#FFFFFF" />

                    {/* Aguja dinámica */}
                    <g transform={`rotate(${gaugeAngle}, 100, 100)`}>
                      <polygon points="98,100 102,100 100,26" fill="#1E293B" />
                    </g>
                  </svg>

                  {/* Valor proyectado central */}
                  <div className="text-center -mt-4">
                    <span className="text-xs text-[#64748B] font-medium block">Proyectado al Cierre (EAC)</span>
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">
                      ${eacValue.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
                    </span>
                  </div>
                </div>

                {/* Grid comparativa de métricas BAC, VAC, AC */}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#E2E8F0] bg-slate-50/70 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[11px] text-[#64748B] block font-medium">Presupuesto Inicial (BAC)</span>
                    <span className="text-sm font-bold text-slate-800">${bacValue.toLocaleString()} USD</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] block font-medium">Varianza al Cierre (VAC)</span>
                    <span className="text-sm font-bold text-[#12AB51]">
                      +${vacValue.toLocaleString()} ({vacPercentage}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                <span>Costo Real (AC): <strong className="text-slate-800">${acValue.toLocaleString()}</strong></span>
                <span>Valor Ganado (EV): <strong className="text-slate-800">${evValue.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* TARJETA 2: CURVA S FINANCIERA (BURN RATE TREND) (4 COLS) */}
            <div
              id="financial-card-s-curve"
              className="lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E2E8F0] flex flex-col justify-between"
              style={{
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E2E8F0]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#FF5500]" />
                      Curva S Financiera (Burn Rate Trend)
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Evolución acumulada de PV, AC y EV.
                    </p>
                  </div>
                </div>

                {/* Leyenda de líneas */}
                <div className="flex items-center justify-between gap-2 text-[11px] font-medium mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#64748B] border-dashed"></span>
                    <span className="text-[#64748B]">PV (Plan)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#FF5500]"></span>
                    <span className="text-[#64748B]">AC (Costo Real)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#12AB51]"></span>
                    <span className="text-[#64748B]">EV (Ganado)</span>
                  </div>
                </div>

                {/* Gráfico de Líneas Recharts */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sCurveData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="stage"
                        tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }}
                        stroke="#E2E8F0"
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }}
                        stroke="#E2E8F0"
                        tickLine={false}
                        tickFormatter={(v) => `$${v / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E1E1E',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          fontSize: '11px',
                          padding: '6px 10px'
                        }}
                        formatter={(val: number) => [`$${val.toLocaleString()} USD`]}
                      />
                      <Line
                        type="monotone"
                        dataKey="PV"
                        name="Presupuesto Planificado"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="AC"
                        name="Costo Real"
                        stroke="#FF5500"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2, fill: '#FF5500' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="EV"
                        name="Valor Ganado"
                        stroke="#12AB51"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2, fill: '#12AB51' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                <span>Burn Rate Promedio: <strong className="text-slate-800">18h/semana</strong></span>
                <span className="text-[#12AB51] font-semibold inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Gasto Bajo Control
                </span>
              </div>
            </div>

            {/* TARJETA 3: VOLATILIDAD DEL ALCANCE (SCOPE CREEP) (4 COLS) */}
            <div
              id="financial-card-scope-creep"
              className="lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E2E8F0] flex flex-col justify-between"
              style={{
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E2E8F0]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                      <GitPullRequest className="w-4 h-4 text-purple-600" />
                      Volatilidad del Alcance (Scope Creep)
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Cambios vs. línea base y pipeline de CRs.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    +14.4% Creep
                  </span>
                </div>

                {/* Pipeline de Solicitudes de Cambio (CRs) */}
                <div className="space-y-2 mb-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Solicitudes de Cambio (CRs) Activas
                  </div>
                  {changeRequestsList.map((cr) => (
                    <div
                      key={cr.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">{cr.id}</span>
                          <span className="text-xs text-slate-600 truncate">{cr.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Impacto: <strong className="text-slate-600">{cr.hours}</strong> • Valor: <strong className="text-slate-600">{cr.cost}</strong>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                          cr.type === 'approved'
                            ? 'text-[#12AB51] bg-[#12AB51]/10'
                            : cr.type === 'pending'
                            ? 'text-amber-700 bg-amber-100'
                            : 'text-blue-700 bg-blue-100'
                        }`}
                      >
                        {cr.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                <span>Línea Base: <strong className="text-slate-800">160h</strong></span>
                <span>Horas Extra Aprobadas: <strong className="text-purple-600">+23h ($6.9k)</strong></span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 3: GRÁFICAS (TENDENCIA SPI VS CPI & PROGRESO DE FASES)             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* GRÁFICA DE TENDENCIA DE DESEMPEÑO SPI vs CPI (7 COLS) */}
          <div
            id="chart-performance-trend"
            className="chart-container lg:col-span-7 bg-white rounded-[16px] p-6 border border-[#E2E8F0] flex flex-col justify-between"
            style={{
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#FF5500]" />
                    Desempeño Operativo (SPI vs CPI)
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Líneas de tendencia de cumplimiento temporal y rentabilidad financiera mensual.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#2563eb]"></span>
                    <span className="text-[#64748B]">SPI (Tiempo)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#12AB51]"></span>
                    <span className="text-[#64748B]">CPI (Costo)</span>
                  </div>
                </div>
              </div>

              {/* CONTENEDOR RECHARTS */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                      stroke="#E2E8F0"
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0.8, 1.3]}
                      ticks={[0.8, 0.9, 1.0, 1.1, 1.2, 1.3]}
                      tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                      stroke="#E2E8F0"
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E1E1E',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        padding: '8px 12px'
                      }}
                      itemStyle={{ color: '#FFFFFF', fontSize: '11px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                    />
                    {/* Líneas de tendencia con strokeWidth=3, dot=false, activeDot con escala y halo blanco */}
                    <Line
                      type="monotone"
                      dataKey="SPI"
                      name="SPI Cronograma"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 6,
                        stroke: '#FFFFFF',
                        strokeWidth: 2,
                        fill: '#2563eb'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="CPI"
                      name="CPI Eficiencia"
                      stroke="#12AB51"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 6,
                        stroke: '#FFFFFF',
                        strokeWidth: 2,
                        fill: '#12AB51'
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span>Índice ideal = 1.0 (en costo y tiempo)</span>
              <span className="font-semibold text-[#12AB51] inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Estado: Proyecto Altamente Rentable
              </span>
            </div>
          </div>

          {/* AVANCE POR FASES DEL PROYECTO (5 COLS) */}
          <div
            id="chart-phase-progress"
            className="chart-container lg:col-span-5 bg-white rounded-[16px] p-6 border border-[#E2E8F0] flex flex-col justify-between"
            style={{
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#12AB51]" />
                    Progreso por Fase
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Hitos y avance porcentual del flujo de trabajo.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#12AB51] bg-[#12AB51]/10 px-2 py-1 rounded">
                  Fase 5 en curso
                </span>
              </div>

              <div className="space-y-3.5">
                {phaseData.map((ph, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1E293B] flex items-center gap-2">
                        {ph.estado === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#12AB51]" />
                        ) : ph.estado === 'active' ? (
                          <Clock className="w-3.5 h-3.5 text-[#FF5500] animate-pulse" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                        )}
                        {ph.name}
                      </span>
                      <span className="font-semibold text-slate-700 font-mono">
                        {ph.completado}%
                      </span>
                    </div>

                    <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${ph.completado}%`,
                          backgroundColor: ph.estado === 'completed' ? '#12AB51' : ph.estado === 'active' ? '#FF5500' : '#CBD5E1'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B] flex items-center justify-between">
              <span>Entrega estimada: 25 de Agosto 2026</span>
              <span className="font-medium text-slate-800">4 de 6 fases completadas</span>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 4: MATRIZ HEATMAP 5X5 & CARGA DE EQUIPO                            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* MATRIZ HEATMAP 5x5 (ASPECT-RATIO 1/1, BORDES BLANCOS INTERNOS) (6 COLS) */}
          <div
            id="heatmap-matrix-card"
            className="chart-container lg:col-span-6 bg-white rounded-[16px] p-6 border border-[#E2E8F0] flex flex-col justify-between"
            style={{
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF5500]" />
                    Matriz de Riesgo y Criticidad (Heatmap 5x5)
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Evaluación de probabilidad vs impacto operativo. Celdas cuadradas con borde blanco interno.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                  {matrixRisks.length} Riesgos mapeados
                </span>
              </div>

              {/* MATRIZ 5X5 */}
              <div className="flex gap-3 items-center justify-center my-2">

                {/* Y-Axis Label */}
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider -rotate-90 origin-center whitespace-nowrap">
                  Probabilidad (1-5)
                </div>

                <div className="flex-1 max-w-[340px]">
                  {/* The 5x5 Grid */}
                  <div className="grid grid-cols-5 bg-white rounded-lg overflow-hidden border border-white">
                    {[5, 4, 3, 2, 1].map((prob) => (
                      <React.Fragment key={`row-${prob}`}>
                        {[1, 2, 3, 4, 5].map((impact) => {
                          const matchingRisks = matrixRisks.filter(r => r.prob === prob && r.impact === impact);
                          const count = matchingRisks.length;
                          const score = prob * impact;

                          // Color logic based on score:
                          // 1-5: #12AB51 (green tones)
                          // 6-10: #84CC16 / #EAB308 (lime / yellow)
                          // 11-16: #F97316 (orange)
                          // 17-25: #FF5500 (deep alert)
                          let cellBg = '#DCFCE7'; // light green
                          let textColor = '#166534';
                          if (score >= 16) {
                            cellBg = '#FF5500';
                            textColor = '#FFFFFF';
                          } else if (score >= 10) {
                            cellBg = '#FB923C';
                            textColor = '#FFFFFF';
                          } else if (score >= 6) {
                            cellBg = '#FEF08A';
                            textColor = '#854D0E';
                          } else if (score >= 3) {
                            cellBg = '#BBF7D0';
                            textColor = '#14532D';
                          }

                          const isHovered = hoveredHeatmapCell?.prob === prob && hoveredHeatmapCell?.impact === impact;

                          return (
                            <div
                              key={`cell-${prob}-${impact}`}
                              onMouseEnter={() => setHoveredHeatmapCell({ prob, impact })}
                              onMouseLeave={() => setHoveredHeatmapCell(null)}
                              className="aspect-square flex items-center justify-center font-bold text-xs cursor-pointer transition-all duration-150 relative group"
                              style={{
                                backgroundColor: cellBg,
                                color: textColor,
                                border: '1px solid #FFFFFF', // Borde blanco interno requerido
                                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                                zIndex: isHovered ? 10 : 1
                              }}
                              title={`Probabilidad ${prob} x Impacto ${impact}: ${count} evento(s)`}
                            >
                              {count > 0 ? (
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${score >= 10 ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-900 text-white'}`}>
                                  {count}
                                </span>
                              ) : (
                                <span className="opacity-40 text-[9px]">{score}</span>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* X-Axis Label */}
                  <div className="text-center text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-2">
                    Impacto Operativo (1-5)
                  </div>
                </div>

              </div>

              {/* Hover detail preview */}
              {hoveredHeatmapCell && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-[#E2E8F0] text-xs">
                  <div className="font-semibold text-slate-800">
                    Cuadrante (P:{hoveredHeatmapCell.prob}, I:{hoveredHeatmapCell.impact}):
                  </div>
                  {matrixRisks.filter(r => r.prob === hoveredHeatmapCell.prob && r.impact === hoveredHeatmapCell.impact).length > 0 ? (
                    <ul className="list-disc list-inside text-slate-600 mt-1">
                      {matrixRisks
                        .filter(r => r.prob === hoveredHeatmapCell.prob && r.impact === hoveredHeatmapCell.impact)
                        .map(r => (
                          <li key={r.id} className="truncate">{r.title}</li>
                        ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 italic">Sin riesgos en este nivel.</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#DCFCE7] border border-slate-200"></span> Bajo
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FEF08A] border border-slate-200"></span> Medio
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FF5500]"></span> Crítico
                </span>
              </div>
              <span className="font-medium text-slate-800">100% Celdas 1:1</span>
            </div>
          </div>

          {/* EQUIPO Y SATURACIÓN EFECTIVA (6 COLS) */}
          <div
            id="team-workload-card"
            className="chart-container lg:col-span-6 bg-white rounded-[16px] p-6 border border-[#E2E8F0] flex flex-col justify-between"
            style={{
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#2563eb]" />
                    Distribución de Capacidad del Equipo
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Horas asignadas en proyecto actual y porcentaje de saturación mensual.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                  {teamMembers.length} Colaboradores
                </span>
              </div>

              <div className="space-y-3">
                {teamMembers.slice(0, 4).map((member) => {
                  const isOver = member.effectiveSaturation > 100;
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="p-3 rounded-xl border border-[#E2E8F0] hover:border-slate-400 bg-white hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getUserColor(member.role)}`}>
                          {member.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-[#1E293B] truncate">
                            {member.username}
                          </h4>
                          <p className="text-[11px] text-[#64748B] capitalize truncate">
                            {member.role} • {member.activeProjectsCount} proyectos
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-semibold text-slate-900 font-mono">
                            {member.consumedHours}h
                          </span>
                          <span
                            className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: isOver ? '#FF550015' : '#12AB5115',
                              color: isOver ? '#FF5500' : '#12AB51'
                            }}
                          >
                            {member.effectiveSaturation}%
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64748B]">
                          {isOver ? 'Sobrecarga' : 'Capacidad Óptima'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span>Capacidad base mensual: 153.6h por recurso</span>
              <span className="font-semibold text-[#12AB51] inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Equipo Sincronizado
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* INSPECTOR DE COLABORADOR */}
      {selectedMember && (
        <UserInspectorPanel
          member={selectedMember}
          projects={projects}
          onClose={() => setSelectedMember(null)}
          getUserColor={getUserColor}
        />
      )}
    </div>
  );
};
