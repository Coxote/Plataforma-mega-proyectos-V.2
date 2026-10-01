import React, { useState } from 'react';
import { Project } from '../types';
import { TppLogo } from './TppLogo';
import {
  FileText,
  Download,
  X,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [includeFinancials, setIncludeFinancials] = useState<boolean>(true);
  const [includePhases, setIncludePhases] = useState<boolean>(true);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen || !project) return null;

  // Filter phases based on user selection
  const activePhases = selectedPhaseFilter === 'all'
    ? project.phases
    : project.phases.filter(p => p.id === selectedPhaseFilter);

  // Calculate totals
  const totalAllocatedHours = activePhases.reduce((acc, p) => acc + p.allocatedHours, 0);
  const totalLoggedHours = activePhases.reduce((acc, p) => acc + p.loggedHours, 0);
  const totalEstimatedCost = activePhases.reduce((acc, p) => acc + (p.allocatedHours * (p.hourlyRate || 45)), 0);
  const totalActualCost = activePhases.reduce((acc, p) => acc + (p.loggedHours * (p.hourlyRate || 45)), 0);

  const handleExportCSV = () => {
    setIsExporting(true);

    setTimeout(() => {
      // Build CSV rows with BOM for UTF-8 Excel support
      let csvContent = '\uFEFF';
      csvContent += `TPP HUB DIGITAL - INFORME EJECUTIVO DE PROYECTO\n`;
      csvContent += `Proyecto: "${project.name.replace(/"/g, '""')}"\n`;
      csvContent += `Cliente: "${project.clientName.replace(/"/g, '""')}"\n`;
      csvContent += `Estado: "${project.status.toUpperCase()}"\n`;
      csvContent += `Fecha de Generacion: "${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}"\n`;
      csvContent += `Marca de Agua: "${includeWatermark ? 'TPP HUB DIGITAL - OFICIAL' : 'SIN MARCA'}"\n\n`;

      // Section 1: Phase Hours Breakdown
      csvContent += `RESUMEN DE FASES Y HORAS\n`;
      csvContent += `ID Fase,Nombre Fase,Estado,Horas Asignadas,Horas Consumidas,Horas Restantes,Avance (%)\n`;

      activePhases.forEach(phase => {
        const remaining = phase.allocatedHours - phase.loggedHours;
        const progress = phase.allocatedHours > 0 ? Math.round((phase.loggedHours / phase.allocatedHours) * 100) : 0;
        csvContent += `"${phase.id}","${phase.name.replace(/"/g, '""')}","${phase.status}",${phase.allocatedHours},${phase.loggedHours},${remaining},${progress}%\n`;
      });

      csvContent += `TOTALES,,${totalAllocatedHours},${totalLoggedHours},${totalAllocatedHours - totalLoggedHours},${
        totalAllocatedHours > 0 ? Math.round((totalLoggedHours / totalAllocatedHours) * 100) : 0
      }%\n\n`;

      // Section 2: Financial Summary if enabled
      if (includeFinancials) {
        csvContent += `FINANZAS Y COSTOS DE OPERACION\n`;
        csvContent += `ID Fase,Tarifa Hora ($),Costo Presupuestado ($),Costo Ejecutado ($),Variacion ($)\n`;
        activePhases.forEach(phase => {
          const rate = phase.hourlyRate || 45;
          const budgeted = phase.allocatedHours * rate;
          const executed = phase.loggedHours * rate;
          const diff = budgeted - executed;
          csvContent += `"${phase.id}",$${rate},$${budgeted},$${executed},$${diff}\n`;
        });
        csvContent += `TOTALES,,$${totalEstimatedCost},$${totalActualCost},$${totalEstimatedCost - totalActualCost}\n\n`;
      }

      // Trigger Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `TPP_Reporte_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      onClose();
    }, 600);
  };

  const handlePrintPDF = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* HEADER UNIFICADO DE LA PLATAFORMA */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
              <Download className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#F4F5F0] text-slate-700 border border-stone-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c6ef4e]" />
                  Reporte Ejecutivo • Exportación
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Exportar Informe de Proyecto
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {project.name} · {project.clientName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-900 bg-[#F4F5F0] hover:bg-stone-200 rounded-full transition-all cursor-pointer"
            title="Cerrar ventana (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 bg-white">

          {/* SELECCIÓN DE FORMATO */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
              1. Formato de Exportación
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'pdf'
                    ? 'border-[#c6ef4e] bg-[#edf9c7]/30 text-slate-900 font-bold shadow-xs ring-1 ring-[#c6ef4e]'
                    : 'border-stone-200/80 bg-[#F4F5F0] text-slate-600 hover:bg-stone-100/70 font-medium'
                }`}
              >
                <div className={`p-2 rounded-xl ${exportFormat === 'pdf' ? 'bg-[#c6ef4e] text-slate-900' : 'bg-white text-slate-700'}`}>
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">PDF Imprimible</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'border-[#c6ef4e] bg-[#edf9c7]/30 text-slate-900 font-bold shadow-xs ring-1 ring-[#c6ef4e]'
                    : 'border-stone-200/80 bg-[#F4F5F0] text-slate-600 hover:bg-stone-100/70 font-medium'
                }`}
              >
                <div className={`p-2 rounded-xl ${exportFormat === 'csv' ? 'bg-[#c6ef4e] text-slate-900' : 'bg-white text-slate-700'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">CSV Estructurado</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'excel'
                    ? 'border-[#c6ef4e] bg-[#edf9c7]/30 text-slate-900 font-bold shadow-xs ring-1 ring-[#c6ef4e]'
                    : 'border-stone-200/80 bg-[#F4F5F0] text-slate-600 hover:bg-stone-100/70 font-medium'
                }`}
              >
                <div className={`p-2 rounded-xl ${exportFormat === 'excel' ? 'bg-[#c6ef4e] text-slate-900' : 'bg-white text-slate-700'}`}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Excel Matriz</span>
              </button>
            </div>
          </div>

          {/* FILTROS AVANZADOS */}
          <div className="bg-[#F4F5F0] rounded-2xl p-5 border border-stone-200/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-800 tracking-wider">
              <Filter className="w-4 h-4 text-slate-800" />
              <span>2. Parámetros y Alcance del Reporte</span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">
                Filtrar por Fase
              </label>
              <select
                value={selectedPhaseFilter}
                onChange={(e) => setSelectedPhaseFilter(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 cursor-pointer"
              >
                <option value="all">Todas las Fases del Proyecto ({project.phases.length})</option>
                {project.phases.map(p => (
                  <option key={p.id} value={p.id}>{p.label || p.id} · {p.name}</option>
                ))}
              </select>
            </div>

            {/* CHECKBOXES DE OPCIONES */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="w-4 h-4 accent-[#c6ef4e] rounded"
                />
                <span>Incluir costos financieros, tarifas por hora y variaciones presupuestarias</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhases}
                  onChange={(e) => setIncludePhases(e.target.checked)}
                  className="w-4 h-4 accent-[#c6ef4e] rounded"
                />
                <span>Incluir desglose pormenorizado de horas consumidas vs asignadas</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWatermark}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="w-4 h-4 accent-[#c6ef4e] rounded"
                />
                <span>Sello y marca de agua institucional de auditoría</span>
              </label>
            </div>
          </div>

          {/* BANNER INFORMATIVO */}
          <div className="p-4 bg-[#F4F5F0] rounded-2xl border border-stone-200/50 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Fases seleccionadas: <strong>{activePhases.length}</strong> · Horas computadas: <strong>{totalLoggedHours}h / {totalAllocatedHours}h</strong>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {new Date().toLocaleDateString('es-ES')}
            </span>
          </div>

        </div>

        {/* FOOTER UNIFICADO DE LA PLATAFORMA */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-stone-100 bg-[#FAFAF8] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
          >
            Cancelar
          </button>

          {exportFormat === 'pdf' ? (
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-7 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-slate-900" />
              <span>Generar y Vista Previa PDF</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-7 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-2 disabled:opacity-40"
            >
              {isExporting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Generando Archivo...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-900" />
                  <span>Descargar Archivo {exportFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
