import { Phase, Project, TimeEntry, TimeEntryType, UserSession } from '../types';
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
  AlertTriangle,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import React, { useState } from 'react';
import { StackedHoursBar } from './StackedHoursBar';
import { generateObsidianMarkdownBundle, downloadObsidianFile } from '../obsidianExporter';
import { RoleTimeTracker } from './RoleTimeTracker';
import { exportProjectToZip } from '../projectArchiver';
import { getRetrabajoStats, getRetrabajoBadgeStyle } from '../dashboardUtils';

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
  let healthAdvice = 'ðŸŸ¢ Excelente: El proyecto avanza conforme al cronograma establecido y sin impedimentos graves.';

  if (finalHealth < 50) {
    healthColor = 'text-red-700 bg-red-50 border-red-100';
    healthProgressColor = 'bg-red-500';
    healthAdvice = 'âš ï¸ Alerta CrÃ­tica: El proyecto requiere atenciÃ³n inmediata. Se sugieren reuniones de contenciÃ³n.';
  } else if (finalHealth < 75) {
    healthColor = 'text-amber-700 bg-amber-50 border-amber-100';
    healthProgressColor = 'bg-amber-500';
    healthAdvice = 'âš ï¸ Riesgo Moderado: Revisar cuellos de botella y asegurar las firmas de alcance pendientes.';
  }

  // Generate copyable markdown report
  const generateMarkdownReport = () => {
    const phaseListStr = project.phases
      .map((p) => `- [${p.status === 'completed' ? 'X' : ' '}] Phase ${p.id} â€” ${p.label} (${p.status})`)
      .join('\n');

    return `### ðŸ“Š Reporte de Proyecto: ${project.name}
**Cliente:** ${project.clientName} (${project.clientContact})
**Fecha de CreaciÃ³n:** ${new Date(project.createdAt).toLocaleDateString()}
**Salud del Proyecto:** ${finalHealth}%
**Horas Logueadas:** ${hoursUsed}h / ${hoursTotal}h (${hoursPercent}%)
**Progreso Global:** ${progressPercent}% (${completedCount}/7 fases completas)

#### ðŸ—ºï¸ Resumen por Fases:
${phaseListStr}

#### ðŸ“‹ Detalles del Negocio:
- **Objetivo:** ${project.objective || 'Pendiente de registrar.'}
- **Alcance:** ${project.alcance || 'Pendiente de registrar.'}
- **Riesgos:** ${project.riesgos || 'Ninguno registrado.'}

*Generado automÃ¡ticamente mediante Sistema de Fases SaaS.*`;
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
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            MÃ©tricas de Salud & Esfuerzo
          </h2>

          {/* BLOCK 1: SALUD DEL PROYECTO */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                Salud del Proyecto (AutomÃ¡tica)
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${healthColor}`}>
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

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {healthAdvice}
            </p>
          </div>
        </div>

        {/* BLOCK 2: STACKED HOURS BAR & LOGS */}
        {userRole !== 'invitado' ? (
          <div className="space-y-3">
            <StackedHoursBar timeEntries={timeEntries} hoursTotal={hoursTotal} />

            {/* BLOCK 2B: ANÃLISIS DE RETRABAJOS (FASE 1) */}
            {(() => {
              const retrabajoStats = getRetrabajoStats(project);
              const retrabajoBadge = getRetrabajoBadgeStyle(retrabajoStats.porcentajeRetrabajo);
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                      Retrabajo del Proyecto
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${retrabajoBadge.bg} ${retrabajoBadge.text} ${retrabajoBadge.border}`}>
                      {retrabajoStats.porcentajeRetrabajo.toFixed(1)}% ({retrabajoStats.horasRetrabajo}h / {retrabajoStats.totalHoras}h)
                    </span>
                  </div>

                  {retrabajoStats.totalHoras > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                        <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-1.5">
                          <span className="text-slate-500 block">Cliente</span>
                          <strong className="text-amber-900 font-bold">{retrabajoStats.porOrigen.cliente}h</strong>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5">
                          <span className="text-slate-500 block">Interno</span>
                          <strong className="text-slate-800 font-bold">{retrabajoStats.porOrigen.interno}h</strong>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5">
                          <span className="text-slate-500 block">Proveedor</span>
                          <strong className="text-slate-800 font-bold">{retrabajoStats.porOrigen.proveedor}h</strong>
                        </div>
                      </div>

                      {retrabajoStats.entriesRetrabajo.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Ãšltimos Retrabajos</span>
                          <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
                            {retrabajoStats.entriesRetrabajo.slice(-3).reverse().map(e => (
                              <div key={e.id} className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-bold text-slate-800">{e.username}</span>
                                  <span className="text-xs text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md ml-1 font-medium capitalize">
                                    {e.retrabajoOrigen || 'interno'}
                                  </span>
                                  <p className="text-slate-600 text-xs mt-0.5 leading-snug">{e.retrabajoMotivo || e.description}</p>
                                </div>
                                <span className="font-mono text-amber-800 font-bold text-xs shrink-0 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {e.hours}h
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">Sin registro de horas todavÃ­a.</p>
                  )}
                </div>
              );
            })()}

            {/* Hours Logger Section (Role Budget Tracker) */}
            <RoleTimeTracker
              project={project}
              currentUser={currentUser}
              onLogTime={(hours, description, type: TimeEntryType = 'normal', retrabajoOrigen, retrabajoMotivo, deliverableId) => {
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
                  projectId: project.id,
                  type: type,
                  retrabajoOrigen: retrabajoOrigen,
                  retrabajoMotivo: retrabajoMotivo,
                  deliverableId: deliverableId,
                  createdAt: new Date().toISOString(),
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

                const actionText = type === 'retrabajo' ? 'Registro Retrabajo' : 'Registro Horas';
                const detailText = type === 'retrabajo'
                  ? `CargÃ³ ${hours}h de retrabajo [Origen: ${retrabajoOrigen}] en fase ${activePhase.id}: "${retrabajoMotivo || description}"`
                  : `CargÃ³ ${hours}h en fase ${activePhase.id}: "${description}"`;

                const newAuditLog = [
                  {
                    id: `audit-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    userId: currentUser.id,
                    username: currentUser.username,
                    userRole: currentUser.role,
                    action: actionText,
                    entityType: 'Horas',
                    details: detailText,
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
                    details: `ReasignÃ³ presupuestos de roles. Nuevo total: ${
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
            <p className="text-xs text-rose-600 font-semibold leading-normal">
              Acceso Restringido: El perfil de Cliente no visualiza mÃ©tricas de tiempos internas.
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
          <p className="text-xs text-purple-700 leading-relaxed font-semibold">
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
          <p className="text-xs text-emerald-700 leading-relaxed font-semibold">
            Genera un archivo ZIP que incluye el historial de auditorÃ­a completo, reporte de feedback con anotaciones y el respaldo en JSON.
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
                Usa este informe estructurado para compartir con el equipo cliente, incluir en la minuta del Sprint o enviar por canales de mensajerÃ­a:
              </p>

              <div className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-700 whitespace-pre-wrap select-all leading-relaxed max-h-[45vh] overflow-y-auto shadow-inner">
                {generateMarkdownReport()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Presiona copiar o haz click dentro del recuadro</span>
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
                  {copied ? 'Â¡Copiado!' : 'Copiar Informe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
