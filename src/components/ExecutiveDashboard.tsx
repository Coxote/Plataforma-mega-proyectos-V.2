import React, { useState } from 'react';
import { Project, UserSession } from '../types';
import { TppLogo } from './TppLogo';
import { ExportReportModal } from './ExportReportModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Users, 
  User, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  ExternalLink, 
  Target, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Printer, 
  Download,
  ChevronRight, 
  HelpCircle,
  ShieldAlert,
  Sparkles,
  Info,
  Quote
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

interface Props {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject?: (id: string) => void;
  users?: UserSession[];
}

export const ExecutiveDashboard: React.FC<Props> = ({ 
  projects, 
  activeProjectId, 
  onSelectProject,
  users = []
}) => {
  const selectedProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Calculated metrics or fallback for presentation
  const totalIncome = selectedProject?.ordenesVenta?.reduce((acc, ov) => acc + (ov.monto || 0), 0) || selectedProject?.totalIncome || 504000;
  
  // Calculate completed phases
  const completedPhasesCount = selectedProject?.phases?.filter(p => p.status === 'completed').length || 0;
  const totalPhasesCount = selectedProject?.phases?.length || 5;
  const progressPercent = Math.round((completedPhasesCount / totalPhasesCount) * 100) || 72;
  const plannedProgressPercent = Math.min(100, progressPercent + 3);

  // Financial calculations
  const spentAmount = Math.round(totalIncome * (progressPercent / 100));
  const remainingAmount = totalIncome - spentAmount;

  // SPI & CPI
  const spi = 0.96;
  const cpi = 1.05;

  // Department breakdown data for Donut Chart
  const areaProgressData = [
    { name: 'Negocio', value: 75, color: '#1e3a8a' },      // Dark blue
    { name: 'Tecnología', value: 70, color: '#0284c7' },   // Light blue
    { name: 'Datos', value: 65, color: '#0d9488' },        // Teal/Green
    { name: 'Integraciones', value: 75, color: '#f59e0b' },// Amber
    { name: 'Cambio & Adopción', value: 60, color: '#7c3aed' }, // Purple
  ];

  // SPI vs CPI trend over months
  const trendPerformanceData = [
    { month: 'ENE', SPI: 0.92, CPI: 1.10 },
    { month: 'FEB', SPI: 0.95, CPI: 1.08 },
    { month: 'MAR', SPI: 0.97, CPI: 1.06 },
    { month: 'ABR', SPI: 0.96, CPI: 1.04 },
    { month: 'MAY', SPI: 0.96, CPI: 1.05 },
  ];

  // Risks (RAID log top 5)
  const topRisks = [
    { risk: 'Dependencia de terceros para la API', impact: 'Alto', prob: 'Alta', trend: 'up' },
    { risk: 'Retraso en integraciones con Legacy System', impact: 'Alto', prob: 'Media', trend: 'up' },
    { risk: 'Calidad de datos históricos en migración', impact: 'Medio', prob: 'Media', trend: 'stable' },
    { risk: 'Adopción de usuarios en área operativa', impact: 'Alto', prob: 'Media', trend: 'up' },
    { risk: 'Cambios de alcance en entregables finales', impact: 'Medio', prob: 'Baja', trend: 'down' },
  ];

  // Upcoming milestones
  const upcomingMilestones = [
    { title: 'Entrega Sprint 5 - Funcionalidades Prioritarias', date: '30 MAY 2026', icon: 'flag', color: 'bg-blue-100 text-blue-700' },
    { title: 'UAT Ciclo 1 - Módulos Core', date: '15 JUN 2026', icon: 'check', color: 'bg-emerald-100 text-emerald-700' },
    { title: 'Pruebas de Performance Ambiente de Producción', date: '30 JUN 2026', icon: 'zap', color: 'bg-amber-100 text-amber-700' },
    { title: 'Go / No Go Comité Ejecutivo', date: '15 JUL 2026', icon: 'target', color: 'bg-purple-100 text-purple-700' },
  ];

  // Key decisions needed from steering committee
  const steeringDecisions = [
    { id: 1, text: 'Aprobación de presupuesto adicional para integraciones (USD 25,000).' },
    { id: 2, text: 'Definición sobre cambio de alcance en módulo de reportería ejecutiva.' },
    { id: 3, text: 'Confirmación de fecha objetivo Go Live (30 SEP 2026).' }
  ];

  // Phase timeline milestones
  const phaseTimeline = [
    { name: 'Análisis y Diseño', status: 'COMPLETADO', month: 'FEB', active: false, done: true },
    { name: 'Desarrollo', status: 'EN CURSO', month: 'MAY', active: true, done: false },
    { name: 'Pruebas (QA/UAT)', status: 'PENDIENTE', month: 'JUL', active: false, done: false },
    { name: 'Implementación', status: 'PENDIENTE', month: 'AGO', active: false, done: false },
    { name: 'Go Live', status: 'PENDIENTE', month: 'SEP', active: false, done: false },
  ];

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-full bg-slate-100/50 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 font-sans print:p-0 print:bg-white relative">
      
      {/* 🏷️ WATERMARK OFICIAL TPP HUB DIGITAL EN IMPRESIÓN (PRINT ONLY) */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
        <TppLogo size="md" variant="full" />
        <div className="text-right">
          <p className="text-xs font-black uppercase tracking-widest text-[#FF5500]">INFORME EJECUTIVO OFICIAL DE OPERACIONES</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase">TPP HUB DIGITAL · CONFIDENCIAL Y EXCLUSIVO</p>
          <p className="text-[9px] font-mono text-slate-400">FECHA DE GENERACIÓN: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES')}</p>
        </div>
      </div>

      {/* HEADER PRINCIPAL VISTA EJECUTIVA */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF5500] text-white shadow-xs">
              Executive View
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Dashboard C-Level</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1 uppercase">
            DASHBOARD EJECUTIVO DEL PROYECTO
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Lo que la Dirección necesita saber, en una sola vista.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 print:hidden">
          {projects.length > 1 && onSelectProject && (
            <select
              value={selectedProject?.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-white/80 border border-slate-200/80 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 cursor-pointer shadow-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-orange-500/20 hover:scale-[1.02]"
          >
            <Download className="w-3.5 h-3.5 text-[#84CC16]" />
            Exportar (PDF / CSV)
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-[1.02]"
          >
            <Printer className="w-3.5 h-3.5 text-[#84CC16]" />
            Imprimir
          </button>
        </div>
      </div>

      {/* METADATOS DEL PROYECTO - CARDS HEADER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PROYECTO */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              PROYECTO
            </label>
            <h3 className="text-xs font-black text-slate-900 truncate">
              {selectedProject?.name || 'Transformación Digital Plataforma Cliente'}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold truncate">
              {selectedProject?.clientName || 'Gerencia de Operaciones'}
            </p>
          </div>
        </div>

        {/* FECHA DE CORTE */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              FECHA DE CORTE
            </label>
            <h3 className="text-xs font-black text-slate-900">
              28 de julio de 2026
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold">
              ● En tiempo real
            </p>
          </div>
        </div>

        {/* SPONSOR */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              SPONSOR
            </label>
            <h3 className="text-xs font-black text-slate-900">
              Gerencia General
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              {selectedProject?.clientName || 'Cliente Corporativo'}
            </p>
          </div>
        </div>

        {/* PROJECT MANAGER */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              PROJECT MANAGER
            </label>
            <h3 className="text-xs font-black text-slate-900">
              Karen Ojeda (Coordinadora)
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              Operations Atelier
            </p>
          </div>
        </div>

      </div>

      {/* 6 KPI CARDS EN FILA */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* 1. ESTADO GENERAL */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            ESTADO GENERAL
          </span>
          <div className="my-2 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              EN CONTROL
            </span>
          </div>
          <p className="text-[10px] text-slate-500 text-center font-medium">
            El proyecto avanza según lo planificado
          </p>
        </div>

        {/* 2. % AVANCE */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            % AVANCE
          </span>
          <div className="relative my-1 flex items-center justify-center h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completado', value: progressPercent, fill: '#059669' },
                    { name: 'Restante', value: 100 - progressPercent, fill: '#e2e8f0' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-black text-slate-900">{progressPercent}%</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center font-semibold">
            Planificado: <strong className="text-slate-800">{plannedProgressPercent}%</strong>
          </p>
        </div>

        {/* 3. SPI (Schedule Performance Index) */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              SPI
            </span>
            <span className="text-[9px] font-bold text-slate-400">Cronograma</span>
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-emerald-600">
              {spi.toString().replace('.', ',')}
            </div>
            <p className="text-[9px] text-slate-400 leading-tight mt-1">
              &gt; 1 = Adelantado<br/>
              = 1 = En plan<br/>
              &lt; 1 = Atrasado
            </p>
          </div>
          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-center">
            Levemente en plan
          </div>
        </div>

        {/* 4. CPI (Cost Performance Index) */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              CPI
            </span>
            <span className="text-[9px] font-bold text-slate-400">Costo</span>
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-emerald-600">
              {cpi.toString().replace('.', ',')}
            </div>
            <p className="text-[9px] text-slate-400 leading-tight mt-1">
              &gt; 1 = Bajo presupuesto<br/>
              = 1 = En plan<br/>
              &lt; 1 = Sobre presupuesto
            </p>
          </div>
          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-center">
            Eficiencia positiva
          </div>
        </div>

        {/* 5. PRESUPUESTO */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            PRESUPUESTO
          </span>
          <div className="my-1">
            <div className="text-sm font-black text-slate-900 truncate">
              USD ${(totalIncome / 1000).toFixed(0)}k
            </div>
            <div className="text-[10px] text-slate-500 font-semibold my-1">
              Ejecutado: {progressPercent}%
            </div>
            <div className="w-full bg-slate-100/80 rounded-full h-2 overflow-hidden border border-slate-200/80">
              <div 
                className="bg-emerald-500 h-full rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="text-[9px] text-slate-500 font-semibold flex justify-between pt-1 border-t border-slate-100">
            <span>Gastado: ${(spentAmount / 1000).toFixed(0)}k</span>
            <span>Rest.: ${(remainingAmount / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* 6. FECHA ESTIMADA DE SALIDA */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-md shadow-slate-200/30 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            ESTIMADA GO LIVE
          </span>
          <div className="my-1 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-xs font-black text-slate-900 uppercase">
              30 SEP 2026
            </div>
          </div>
          <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-center">
            En riesgo bajo
          </div>
        </div>

      </div>

      {/* FILA SEGUNDA: LÍNEA DE TIEMPO + DISTRIBUCIÓN DEL AVANCE POR ÁREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LÍNEA DE TIEMPO - HITOS PRINCIPALES (7 COLS) */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-lg shadow-slate-200/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                LÍNEA DE TIEMPO - HITOS PRINCIPALES
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                ENE - SEP 2026
              </span>
            </div>

            {/* Meses Header Axis */}
            <div className="grid grid-cols-9 text-[10px] font-extrabold text-slate-400 text-center mb-6 uppercase tracking-wider">
              <span>ENE</span>
              <span>FEB</span>
              <span>MAR</span>
              <span>ABR</span>
              <span>MAY</span>
              <span>JUN</span>
              <span>JUL</span>
              <span>AGO</span>
              <span>SEP</span>
            </div>

            {/* Phase Milestones Horizontal Tracker */}
            <div className="space-y-5 relative">
              {phaseTimeline.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 text-xs">
                  {/* Phase Label */}
                  <div className="w-36 shrink-0">
                    <span className="font-bold text-slate-800 block text-xs truncate">
                      {item.name}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded inline-block ${
                      item.done 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : item.active 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Horizontal Bar with Milestone node */}
                  <div className="flex-1 relative flex items-center">
                    <div className="w-full bg-slate-100 h-1 rounded-full relative">
                      <div 
                        className={`h-full rounded-full ${item.done ? 'bg-emerald-500' : item.active ? 'bg-blue-500' : 'bg-slate-200'}`}
                        style={{ width: `${(idx + 1) * 20}%` }}
                      />
                    </div>
                    {/* Node Dot */}
                    <div 
                      className={`absolute w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center shadow-xs ${
                        item.done 
                          ? 'border-emerald-500 text-emerald-600' 
                          : item.active 
                          ? 'border-blue-600 text-blue-600 ring-4 ring-blue-100 animate-pulse' 
                          : 'border-slate-300 text-slate-300'
                      }`}
                      style={{ left: `${Math.min(95, (idx + 1) * 20)}%` }}
                    >
                      {item.done ? (
                        <CheckCircle2 className="w-2.5 h-2.5 fill-emerald-500 text-white" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic mt-6 pt-3 border-t border-slate-100">
            * El avance general de la línea de tiempo se sincroniza con los entregables aprobados en la plataforma.
          </p>
        </div>

        {/* DISTRIBUCIÓN DEL AVANCE POR ÁREA (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-600" />
                DISTRIBUCIÓN DEL AVANCE POR ÁREA
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-2">
              {/* Donut Chart with Recharts */}
              <div className="relative w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areaProgressData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {areaProgressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">{progressPercent}%</span>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Avance Promedio
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2 text-xs w-full sm:w-auto">
                {areaProgressData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-slate-700 text-xs">{item.name}</span>
                    </div>
                    <span className="font-black text-slate-900 text-xs">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FILA TERCERA: RIESGOS CRÍTICOS (Top 5) + RAID RESUMEN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIESGOS CRÍTICOS (Top 5) (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                RIESGOS CRÍTICOS (Top 5)
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Matriz de Impacto</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-2">RIESGO</th>
                    <th className="py-2 px-2 text-center">IMPACTO</th>
                    <th className="py-2 px-2 text-center">PROBABILIDAD</th>
                    <th className="py-2 px-2 text-center">TENDENCIA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {topRisks.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-2 font-bold text-slate-800">
                        {r.risk}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          r.impact === 'Alto' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.impact}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          r.prob === 'Alta' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.prob}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {r.trend === 'up' ? (
                          <span className="text-rose-600 font-bold inline-flex items-center gap-0.5">
                            ↗ Alza
                          </span>
                        ) : r.trend === 'down' ? (
                          <span className="text-emerald-600 font-bold inline-flex items-center gap-0.5">
                            ↘ Baja
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold inline-flex items-center gap-0.5">
                            ➔ Estab.
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button className="text-xs font-black text-slate-800 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer">
              Ver detalle en RAID Log <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RAID RESUMEN (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                RAID RESUMEN
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Monitoreo de Gobierno</span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-2">
              
              {/* Riesgos Críticos */}
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                  5
                </div>
                <div>
                  <div className="text-xs font-black text-rose-950 leading-tight">
                    Riesgos Críticos
                  </div>
                  <span className="text-[10px] text-rose-700 font-semibold">Requiere mitigación</span>
                </div>
              </div>

              {/* Asuntos Pendientes */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                  3
                </div>
                <div>
                  <div className="text-xs font-black text-amber-950 leading-tight">
                    Asuntos Pendientes
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold">Issues activos</span>
                </div>
              </div>

              {/* Decisiones Pendientes */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                  2
                </div>
                <div>
                  <div className="text-xs font-black text-blue-950 leading-tight">
                    Decisiones Pendientes
                  </div>
                  <span className="text-[10px] text-blue-700 font-semibold">Comité Ejecutivo</span>
                </div>
              </div>

              {/* Oportunidades Identificadas */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                  4
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-950 leading-tight">
                    Oportunidades
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Mejoras identificadas</span>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button className="text-xs font-black text-slate-800 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer">
              Ver detalle en RAID Log <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* FILA CUARTA: DESEMPEÑO DE COSTO Y CRONOGRAMA + PRÓXIMOS HITOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DESEMPEÑO DE COSTO Y CRONOGRAMA (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                DESEMPEÑO DE COSTO Y CRONOGRAMA (SPI vs CPI)
              </h3>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> SPI (Cronograma)
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> CPI (Costo)
                </span>
              </div>
            </div>

            <div className="h-56 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 2]} ticks={[0, 0.5, 1.0, 1.5, 2.0]} tick={{ fontSize: 10, fontWeight: 700 }} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px', fontWeight: 'bold' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="SPI" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#2563eb' }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="CPI" 
                    stroke="#059669" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#059669' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium">
            * Referencia: Un índice de 1.0 representa el cumplimiento ideal en costo y cronograma.
          </p>
        </div>

        {/* PRÓXIMOS HITOS (PRÓXIMOS 60 DÍAS) (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                PRÓXIMOS HITOS (PRÓXIMOS 60 DÍAS)
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Calendario Clave</span>
            </div>

            <div className="space-y-3 my-1">
              {upcomingMilestones.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${m.color}`}>
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {m.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Entregables vinculados en revisión
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-lg shrink-0 ml-2">
                    {m.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* FILA QUINTA: DECISIONES QUE NECESITAMOS DE LA DIRECCIÓN + CITA EJECUTIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DECISIONES QUE NECESITAMOS DE LA DIRECCIÓN (8 COLS) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            DECISIONES QUE NECESITAMOS DE LA DIRECCIÓN
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steeringDecisions.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {d.id}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Requerimiento C-Level
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  {d.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CITA EJECUTIVA (4 COLS) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <Quote className="w-8 h-8 text-blue-400 opacity-80" />
          <blockquote className="my-3 italic text-sm font-medium text-slate-200 leading-relaxed">
            "Lo que no se mide, no se puede mejorar."
          </blockquote>
          <div className="text-xs font-extrabold text-blue-300 uppercase tracking-wider">
            — Peter Drucker
          </div>
        </div>

      </div>

      {/* EXPORT REPORT MODAL */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={selectedProject}
      />

    </div>
  );
};
