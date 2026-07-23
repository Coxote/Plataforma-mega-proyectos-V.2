import { Phase, Project, TimeEntry, UserSession } from '../types';
import { 
  Heart, 
  Clock, 
  TrendingUp, 
  Copy, 
  X, 
  FileText, 
  Plus, 
  Minus,
  CheckCircle2,
  Download,
  Calendar,
  Layers,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import React, { useState } from 'react';
import { StackedHoursBar } from './StackedHoursBar';
import { generateObsidianMarkdownBundle, downloadObsidianFile } from '../obsidianExporter';
import { RoleTimeTracker } from './RoleTimeTracker';
import { exportProjectToZip } from '../projectArchiver';

interface RightPanelProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  activePhase: Phase;
  currentUser: UserSession;
}

export default function RightPanel({
  project,
  onUpdateProject,
  activePhase,
  currentUser,
}: RightPanelProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const userRole = currentUser.role;

  // Calculate phase counts and percentages
  const completedCount = project.phases.filter((p) => p.status === 'completed').length;
  const progressPercent = Math.round((completedCount / project.phases.length) * 100);

  // Hours calculations
  const timeEntries = project.timeEntries || [];
  const hoursUsed = timeEntries.reduce((acc, t) => acc + t.hours, 0);
  const hoursTotal = project.hoursTotal || 40;
  const hoursPercent = hoursTotal > 0 ? Math.round((hoursUsed / hoursTotal) * 100) : 0;

  // Automatic Health Calculation:
  // Base health is 100%. 
  // It degrades if the hours consumed exceed the expected hours limit for the active phase.
  const activePhaseIndex = project.phases.findIndex((p) => p.id === project.activePhaseId);
  const activeIndex = activePhaseIndex >= 0 ? activePhaseIndex : 0;
  
  // Phase expected max percentage of hours
  const expectedMaxPercent = Math.round(((activeIndex + 1) / project.phases.length) * 100);
  
  let calculatedHealth = 100;
  if (hoursPercent > expectedMaxPercent + 10) {
    const excess = hoursPercent - (expectedMaxPercent + 10);
    calculatedHealth -= Math.round(excess * 1.5);
  }

  // Penalty if checklist is lagging
  const currentPhaseObj = project.phases[activeIndex] || project.phases[0];
  const checklist = currentPhaseObj?.checklist || [];
  const totalCheck = checklist.length;
  if (totalCheck > 0) {
    const completedCheck = checklist.filter((item) => item.completed).length;
    const checkPercent = (completedCheck / totalCheck) * 100;
    // If we've consumed more hours than checklist progress, subtract up to 20 points
    if (hoursPercent > checkPercent && hoursPercent > 20) {
      calculatedHealth -= Math.round(Math.min(20, (hoursPercent - checkPercent) * 0.4));
    }
  }
  
  const finalHealth = Math.min(100, Math.max(15, calculatedHealth));

  // Determine health style & advice
  let healthColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
  let healthProgressColor = 'bg-emerald-500';
  let healthAdvice = '🟢 Excelente: El proyecto avanza conforme al cronograma establecido y sin impedimentos graves.';

  if (finalHealth < 50) {
    healthColor = 'text-red-700 bg-red-50 border-red-100';
    healthProgressColor = 'bg-red-500';
    healthAdvice = '⚠️ Alerta Crítica: El proyecto requiere atención inmediata. Se sugieren reuniones de contención.';
  } else if (finalHealth < 75) {
    healthColor = 'text-amber-700 bg-amber-50 border-amber-100';
    healthProgressColor = 'bg-amber-500';
    healthAdvice = '⚠️ Riesgo Moderado: Revisar cuellos de botella y asegurar las firmas de alcance pendientes.';
  }

  // Generate copyable markdown report
  const generateMarkdownReport = () => {
    const phaseListStr = project.phases
      .map((p) => `- [${p.status === 'completed' ? 'X' : ' '}] Phase ${p.id} — ${p.label} (${p.status})`)
      .join('\n');

    return `### 📊 Reporte de Proyecto: ${project.name}
**Cliente:** ${project.clientName} (${project.clientContact})
**Fecha de Creación:** ${new Date(project.createdAt).toLocaleDateString()}
**Salud del Proyecto:** ${finalHealth}%
**Horas Logueadas:** ${hoursUsed}h / ${hoursTotal}h (${hoursPercent}%)
**Progreso Global:** ${progressPercent}% (${completedCount}/7 fases completas)

#### 🗺️ Resumen por Fases:
${phaseListStr}

#### 📋 Detalles del Negocio:
- **Objetivo:** ${project.objective || 'Pendiente de registrar.'}
- **Alcance:** ${project.alcance || 'Pendiente de registrar.'}
- **Riesgos:** ${project.riesgos || 'Ninguno registrado.'}

*Generado automáticamente mediante Sistema de Fases SaaS.*`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportToObsidian = () => {
    const files = generateObsidianMarkdownBundle(project);
    files.forEach((f) => downloadObsidianFile(f.fileName, f.content));
  };

  const handleExportToZip = async () => {
    await exportProjectToZip(project);
  };

  return (
    <aside className="bg-slate-50 border-l border-slate-200 p-5 h-full overflow-y-auto flex flex-col justify-between space-y-6" id="right-panel">
      <div className="space-y-6">
        <div>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Métricas de Salud & Esfuerzo
          </h2>

          {/* BLOCK 1: SALUD DEL PROYECTO */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                Salud del Proyecto (Automática)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthColor}`}>
                {finalHealth}%
              </span>
            </div>
            
            {/* Read-only health status bar */}
            <div className="pt-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${healthProgressColor}`}
                  style={{ width: `${finalHealth}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              {healthAdvice}
            </p>
          </div>
        </div>

        {/* BLOCK 2: STACKED HOURS BAR & LOGS */}
        {userRole !== 'invitado' ? (
          <div className="space-y-3">
            <StackedHoursBar timeEntries={timeEntries} hoursTotal={hoursTotal} />

            {/* Hours Logger Section (Role Budget Tracker) */}
            <RoleTimeTracker
              project={project}
              currentUser={currentUser}
              onLogTime={(hours, description) => {
                const role = currentUser.role;
                const newEntry: TimeEntry = {
                  id: `time-${Date.now()}`,
                  userId: currentUser.id,
                  username: currentUser.username,
                  role: role,
                  hours: hours,
                  date: new Date().toISOString().split('T')[0],
                  description: description,
                  phaseId: activePhase.id,
                };

                const updatedEntries = [...timeEntries, newEntry];

                // Update role consumption
                const updatedBudget = { ...project.budget };
                if (updatedBudget[role]) {
                  updatedBudget[role] = {
                    ...updatedBudget[role],
                    consumed: (updatedBudget[role].consumed || 0) + hours,
                  };
                }

                const newAuditLog = [
                  {
                    id: `audit-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    userId: currentUser.id,
                    username: currentUser.username,
                    userRole: currentUser.role,
                    action: 'Registro Horas',
                    entityType: 'Horas',
                    details: `Cargó ${hours}h en fase ${activePhase.id}: "${description}"`,
                  },
                  ...(project.auditLog || []),
                ];

                onUpdateProject({
                  ...project,
                  timeEntries: updatedEntries,
                  budget: updatedBudget,
                  auditLog: newAuditLog,
                });
              }}
              onUpdateBudget={(newBudget) => {
                const newAuditLog = [
                  {
                    id: `audit-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    userId: currentUser.id,
                    username: currentUser.username,
                    userRole: currentUser.role,
                    action: 'Ajuste Presupuesto',
                    entityType: 'Presupuesto',
                    details: `Reasignó presupuestos de roles. Nuevo total: ${
                      (newBudget.coordinador?.allocated || 0) +
                      (newBudget.sac?.allocated || 0) +
                      (newBudget.content?.allocated || 0)
                    }h`,
                  },
                  ...(project.auditLog || []),
                ];

                onUpdateProject({
                  ...project,
                  budget: newBudget,
                  auditLog: newAuditLog,
                });
              }}
            />
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center space-y-2">
            <Clock className="w-5 h-5 text-rose-500 mx-auto" />
            <h4 className="text-xs font-bold text-rose-800">Presupuesto de Horas</h4>
            <p className="text-[10px] text-rose-600 font-semibold leading-normal">
              Acceso Restringido: El perfil de Cliente no visualiza métricas de tiempos internas.
            </p>
          </div>
        )}

        {/* BLOCK 3: RESUMEN DE PROGRESO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-lime-600" />
              Progreso General
            </span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              {progressPercent}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Fase Actual:</span>
              <span className="font-bold text-slate-950">{activePhase.id}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Fases Completas:</span>
              <span className="font-bold text-slate-950">{completedCount} de 7</span>
            </div>
            
            {/* Visual Steps representation */}
            <div className="flex items-center gap-1 pt-2">
              {project.phases.map((p) => {
                const isComp = p.status === 'completed';
                const isAct = p.id === activePhase.id;
                return (
                  <div
                    key={p.id}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      isComp 
                        ? 'bg-lime-500' 
                        : isAct 
                        ? 'bg-slate-900 animate-pulse' 
                        : 'bg-slate-200'
                    }`}
                    title={`${p.id}: ${p.label} (${p.status})`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* BLOCK 4: OBSIDIAN SECOND BRAIN INTEGRATION */}
        <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-purple-900">Vault de Obsidian</h4>
          </div>
          <p className="text-[10px] text-purple-700 leading-relaxed font-semibold">
            Exporta toda la Brand Bible procesada por IA y las horas consolidadas del proyecto en un bundle Markdown listo para arrastrar a tu base de conocimiento.
          </p>
          <button
            onClick={handleExportToObsidian}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-purple-100 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Vault Obsidian</span>
          </button>
        </div>

        {/* BLOCK 5: ZIP EXPORT (PROYECTO COMPLETO Y AUDITORIA) */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-emerald-900">Empaquetar Cierre ZIP</h4>
          </div>
          <p className="text-[10px] text-emerald-700 leading-relaxed font-semibold">
            Genera un archivo ZIP que incluye el historial de auditoría completo, reporte de feedback con anotaciones y el respaldo en JSON.
          </p>
          <button
            onClick={handleExportToZip}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-lime-100" />
            <span>Descargar Cierre ZIP</span>
          </button>
        </div>
      </div>

      {/* FOOTER ACTIONS: EXPORT REPORT */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={() => setIsReportOpen(true)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          id="btn-generate-report"
        >
          <FileText className="w-3.5 h-3.5 text-lime-400" />
          Generar Informe Sync
        </button>
      </div>

      {/* REPORT MODAL */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-lime-600" />
                <h3 className="font-bold text-slate-900 text-sm">Resumen de Entrega & Sync</h3>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="text-slate-400 hover:text-slate-500 p-1 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Usa este informe estructurado para compartir con el equipo cliente, incluir en la minuta del Sprint o enviar por canales de mensajería:
              </p>
              
              <div className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-[11px] text-slate-700 whitespace-pre-wrap select-all leading-relaxed max-h-[45vh] overflow-y-auto shadow-inner">
                {generateMarkdownReport()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Presiona copiar o haz click dentro del recuadro</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-lime-400" />
                  {copied ? '¡Copiado!' : 'Copiar Informe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
