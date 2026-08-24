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
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white/95 backdrop-blur-2xl rounded-2xl max-w-xl w-full shadow-2xl border border-white/80 overflow-hidden flex flex-col">

        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800 relative overflow-hidden shrink-0">
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF5500] to-[#E04B00] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight uppercase">Exportar Reporte Ejecutivo</h3>
                <span className="px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-[#84CC16] text-slate-950">
                  Fase 3
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{project.name} Â· {project.clientName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* FORMAT SELECTION */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2.5">
              1. Formato de ExportaciÃ³n
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'pdf'
                    ? 'border-[#FF5500] bg-orange-500/10 text-[#FF5500] font-black shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Printer className="w-5 h-5" />
                <span className="text-xs">PDF Imprimible</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'border-[#FF5500] bg-orange-500/10 text-[#FF5500] font-black shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs">CSV Formateado</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  exportFormat === 'excel'
                    ? 'border-[#FF5500] bg-orange-500/10 text-[#FF5500] font-black shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-xs">Excel Matrix</span>
              </button>
            </div>
          </div>

          {/* ADVANCED FILTERS */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 tracking-wider">
              <Filter className="w-4 h-4 text-[#FF5500]" />
              2. Filtros de Datos
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Filtrar por Fase
                </label>
                <select
                  value={selectedPhaseFilter}
                  onChange={(e) => setSelectedPhaseFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50"
                >
                  <option value="all">Todas las Fases ({project.phases.length})</option>
                  {project.phases.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Rango de Fechas
                </label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50"
                >
                  <option value="all">Todo el HistÃ³rico</option>
                  <option value="month">Este Mes</option>
                  <option value="quarter">Este Trimestre</option>
                  <option value="year">Este AÃ±o</option>
                </select>
              </div>
            </div>
          </div>

          {/* WATERMARK & OPTIONS */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              3. Opciones de Marca y Secciones
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeWatermark}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="w-4 h-4 accent-[#FF5500] rounded"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-slate-900 block">Marca de Agua TPP Hub Digital</span>
                  <span className="text-xs text-slate-500 font-medium">Incluye sello oficial de confidencialidad en el encabezado y pie</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-[#84CC16] shrink-0" />
              </label>

              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="w-4 h-4 accent-[#FF5500] rounded"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-slate-900 block">Desglose Financiero y Tarifas</span>
                  <span className="text-xs text-slate-500 font-medium">Costos presupuestados vs ejecutados</span>
                </div>
              </label>
            </div>
          </div>

          {/* BRAND WATERMARK PREVIEW BANNER */}
          {includeWatermark && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-3 text-white flex items-center justify-between border border-slate-700">
              <TppLogo size="sm" variant="full" darkMode={true} />
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-widest text-[#84CC16] block">INFORME OFICIAL CONFIDENCIAL</span>
                <span className="text-xs text-slate-400 font-mono">TPP-HUB-REPORT-{new Date().toISOString().slice(0,10)}</span>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {exportFormat === 'pdf' ? (
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-black rounded-2xl transition-all cursor-pointer shadow-lg shadow-orange-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-[#84CC16]" />
              Generar y Vista Previa PDF
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-black rounded-2xl transition-all cursor-pointer shadow-lg shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isExporting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-[#84CC16]" />
                  Generando Archivo...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#84CC16]" />
                  Descargar Archivo {exportFormat.toUpperCase()}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
