import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  X, 
  AlertCircle,
  Hash,
  Calendar,
  Layers,
  Sparkles,
  Upload,
  Loader2
} from 'lucide-react';
import { Project, OrdenVenta, EstadoOV } from '../types';

interface MultiOVManagerProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  isCoordinador?: boolean;
}

export const MultiOVManager: React.FC<MultiOVManagerProps> = ({
  project,
  onUpdateProject,
  isCoordinador = true
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOV, setEditingOV] = useState<OrdenVenta | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Form State
  const [numero, setNumero] = useState('');
  const [subtotal, setSubtotal] = useState<number | ''>('');
  const [impuestos, setImpuestos] = useState<number | ''>('');
  const [comisiones, setComisiones] = useState<number | ''>('');
  const [monto, setMonto] = useState<number | ''>('');
  const [moneda, setMoneda] = useState('CLP');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<EstadoOV>('creada');
  const [horasPorRol, setHorasPorRol] = useState<{
    supervisor?: number | '';
    coordinador?: number | '';
    sac?: number | '';
    contents?: number | '';
    contentd?: number | '';
  }>({
    supervisor: 0,
    coordinador: 0,
    sac: 0,
    contents: 0,
    contentd: 0,
  });

  // Calculate total hours from role breakdown automatically
  const totalHorasAuto = (Number(horasPorRol.supervisor) || 0) +
    (Number(horasPorRol.coordinador) || 0) +
    (Number(horasPorRol.sac) || 0) +
    (Number(horasPorRol.contents) || 0) +
    (Number(horasPorRol.contentd) || 0);

  // List of OVs with fallback to single OV if empty
  const ordenesVenta: OrdenVenta[] = project.ordenesVenta && project.ordenesVenta.length > 0
    ? project.ordenesVenta
    : [{
        id: `ov-${project.id}-default`,
        numero: String(project.saleOrderNumber || project.ovNumber || 'OV-001'),
        monto: project.totalIncome || 0,
        moneda: project.currency || 'CLP',
        horasAsociadas: project.hoursTotal || 0,
        fechaEmision: project.startDate || new Date().toISOString().split('T')[0],
        descripcion: 'Orden de Venta Principal',
        estado: 'creada'
      }];

  // Totals calculations
  const totalMonto = ordenesVenta.reduce((sum, ov) => sum + (ov.monto || 0), 0);
  const totalHoras = ordenesVenta.reduce((sum, ov) => sum + (ov.horasAsociadas || 0), 0);
  const countCreadas = ordenesVenta.filter(ov => ov.estado === 'creada' || !ov.estado).length;
  const countEnviadas = ordenesVenta.filter(ov => ov.estado === 'enviada').length;
  const countBloqueadas = ordenesVenta.filter(ov => ov.estado === 'bloqueada').length;
  const countFacturadas = ordenesVenta.filter(ov => ov.estado === 'facturada').length;

  const handleOpenAdd = () => {
    setEditingOV(null);
    setNumero(`OV-${String(ordenesVenta.length + 1).padStart(3, '0')}`);
    setSubtotal('');
    setImpuestos('');
    setComisiones('');
    setMonto('');
    setMoneda(project.currency || 'CLP');
    setFechaEmision(new Date().toISOString().split('T')[0]);
    setDescripcion('');
    setEstado('creada');
    setHorasPorRol({ supervisor: 0, coordinador: 0, sac: 0, contents: 0, contentd: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ov: OrdenVenta) => {
    setEditingOV(ov);
    setNumero(ov.numero);
    setSubtotal(typeof ov.subtotal === 'number' ? ov.subtotal : '');
    setImpuestos(typeof ov.impuestos === 'number' ? ov.impuestos : '');
    setComisiones(typeof ov.comisiones === 'number' ? ov.comisiones : '');
    setMonto(ov.monto);
    setMoneda(ov.moneda || 'CLP');
    setFechaEmision(ov.fechaEmision || new Date().toISOString().split('T')[0]);
    setDescripcion(ov.descripcion || '');
    setEstado(ov.estado || 'creada');
    setHorasPorRol(ov.horasPorRol || {
      supervisor: 0,
      coordinador: 0,
      sac: 0,
      contents: 0,
      contentd: 0,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsParsing(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/parse-ov-document', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-app-auth-token': 'mega-proyectos-secure-token-2026',
            },
            body: JSON.stringify({
              fileData: base64Data,
              mimeType: file.type || 'application/pdf',
            })
          });
          const data = await res.json();
          if (res.ok && data) {
            if (data.numero) setNumero(data.numero);
            if (typeof data.subtotal === 'number') setSubtotal(data.subtotal);
            if (typeof data.impuestos === 'number') setImpuestos(data.impuestos);
            if (typeof data.comisiones === 'number') setComisiones(data.comisiones);
            if (typeof data.monto === 'number') setMonto(data.monto);
            if (data.moneda) setMoneda(data.moneda);
            if (data.fechaEmision) setFechaEmision(data.fechaEmision);
            if (data.descripcion) setDescripcion(data.descripcion);
            if (data.horasPorRol) {
              setHorasPorRol({
                supervisor: data.horasPorRol.supervisor ?? 0,
                coordinador: data.horasPorRol.coordinador ?? 0,
                sac: data.horasPorRol.sac ?? 0,
                contents: data.horasPorRol.contents ?? 0,
                contentd: data.horasPorRol.contentd ?? 0,
              });
            }
          } else {
            alert(data.error || 'No se pudo analizar el archivo con la IA.');
          }
        } catch (err) {
          console.error(err);
          alert('Error al conectar con la IA de parsing.');
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsParsing(false);
    }
  };

  const handleSaveOV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim()) return;

    const subTotalNum = typeof subtotal === 'number' ? subtotal : undefined;
    const impuestosNum = typeof impuestos === 'number' ? impuestos : undefined;
    const comisionesNum = typeof comisiones === 'number' ? comisiones : undefined;
    const newMontoNum = typeof monto === 'number' 
      ? monto 
      : ((subTotalNum || 0) + (impuestosNum || 0) + (comisionesNum || 0));

    let updatedList: OrdenVenta[];
    if (editingOV) {
      updatedList = ordenesVenta.map(ov => ov.id === editingOV.id ? {
        ...ov,
        numero: numero.trim(),
        subtotal: subTotalNum,
        impuestos: impuestosNum,
        comisiones: comisionesNum,
        monto: newMontoNum,
        moneda,
        horasAsociadas: totalHorasAuto,
        horasPorRol,
        fechaEmision,
        descripcion: descripcion.trim(),
        estado
      } : ov);
    } else {
      const newOV: OrdenVenta = {
        id: `ov-${Date.now()}`,
        numero: numero.trim(),
        subtotal: subTotalNum,
        impuestos: impuestosNum,
        comisiones: comisionesNum,
        monto: newMontoNum,
        moneda,
        horasAsociadas: totalHorasAuto,
        horasPorRol,
        fechaEmision,
        descripcion: descripcion.trim(),
        estado
      };
      updatedList = [...ordenesVenta, newOV];
    }

    syncAndSaveProject(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteOV = (ovId: string) => {
    if (ordenesVenta.length <= 1) {
      alert('El proyecto debe mantener al menos una Orden de Venta.');
      return;
    }
    const updatedList = ordenesVenta.filter(ov => ov.id !== ovId);
    syncAndSaveProject(updatedList);
  };

  const handleQuickStatusChange = (ovId: string, newStatus: EstadoOV) => {
    const updatedList = ordenesVenta.map(ov => ov.id === ovId ? { ...ov, estado: newStatus } : ov);
    syncAndSaveProject(updatedList);
  };

  const syncAndSaveProject = (updatedOVs: OrdenVenta[]) => {
    const newTotalIncome = updatedOVs.reduce((sum, ov) => sum + (ov.monto || 0), 0);
    const newOvNumbersStr = updatedOVs.map(ov => ov.numero).join(', ') || updatedOVs[0]?.numero || 'OV-001';

    onUpdateProject({
      ...project,
      ordenesVenta: updatedOVs,
      totalIncome: newTotalIncome,
      saleOrderNumber: newOvNumbersStr,
      ovNumber: newOvNumbersStr
    });
  };

  const getStatusBadge = (st: EstadoOV) => {
    switch (st) {
      case 'creada':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Creada' };
      case 'enviada':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500', label: 'Enviada' };
      case 'bloqueada':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', label: 'Bloqueada' };
      case 'facturada':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Facturada' };
      default:
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Creada' };
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6" id="multi-ov-manager">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Órdenes de Venta (Multi-OV)
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
              {ordenesVenta.length} registrada{ordenesVenta.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gestión de facturación comercial y presupuestos contratados por el cliente.
          </p>
        </div>

        {isCoordinador && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar OV
          </button>
        )}
      </div>

      {/* KPI METRICS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monto Total Contratado</span>
          <div className="text-lg font-black text-slate-900 font-mono">
            ${totalMonto.toLocaleString('es-CL', { minimumFractionDigits: 0 })} <span className="text-xs text-slate-400 font-bold">{project.currency || 'CLP'}</span>
          </div>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Horas Totales en OVs</span>
          <div className="text-lg font-black text-indigo-600 font-mono">
            {totalHoras} <span className="text-xs text-indigo-400 font-bold">horas</span>
          </div>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estados OVs</span>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{countCreadas} Creadas</span>
              <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">{countEnviadas} Enviadas</span>
              <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{countBloqueadas} Bloqueadas</span>
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{countFacturadas} Facturadas</span>
            </div>
          </div>
          <Layers className="w-5 h-5 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* OVs LIST TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-2.5 px-3">No. OV</th>
              <th className="py-2.5 px-3">Monto</th>
              <th className="py-2.5 px-3">Horas Totales</th>
              <th className="py-2.5 px-3">Emisión</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3">Descripción / Concepto</th>
              {isCoordinador && <th className="py-2.5 px-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {ordenesVenta.map((ov) => {
              const badge = getStatusBadge(ov.estado || 'creada');
              return (
                <tr key={ov.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                      {ov.numero}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <div className="font-black text-slate-800">
                      ${(ov.monto || 0).toLocaleString('es-CL')} <span className="text-[10px] text-slate-400">{ov.moneda}</span>
                    </div>
                    {(ov.subtotal !== undefined || ov.impuestos !== undefined || ov.comisiones !== undefined) && (
                      <div className="text-[9px] text-slate-500 font-medium mt-0.5 space-x-1 flex flex-wrap gap-x-1">
                        {typeof ov.subtotal === 'number' && <span>Sub: ${ov.subtotal.toLocaleString('es-CL')}</span>}
                        {typeof ov.impuestos === 'number' && ov.impuestos > 0 && <span className="text-amber-700">| IVA: ${ov.impuestos.toLocaleString('es-CL')}</span>}
                        {typeof ov.comisiones === 'number' && ov.comisiones > 0 && <span className="text-cyan-700">| Com: ${ov.comisiones.toLocaleString('es-CL')}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                    {ov.horasAsociadas || 0}h
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-medium text-[11px]">
                    {ov.fechaEmision || 'Sin fecha'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate text-[11px]" title={ov.descripcion}>
                    {ov.descripcion || 'Sin descripción'}
                  </td>
                  {isCoordinador && (
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Status Dropdown */}
                        <select
                          value={ov.estado || 'creada'}
                          onChange={(e) => handleQuickStatusChange(ov.id, e.target.value as EstadoOV)}
                          className="text-[10px] font-bold bg-slate-100 border border-slate-200 rounded px-1.5 py-1 text-slate-700 cursor-pointer focus:outline-none"
                        >
                          <option value="creada">Creada</option>
                          <option value="enviada">Enviada</option>
                          <option value="bloqueada">Bloqueada</option>
                          <option value="facturada">Facturada</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ov)}
                          className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Editar OV"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOV(ov.id)}
                          className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar OV"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL PARA AGREGAR / EDITAR OV */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {editingOV ? 'Editar Orden de Venta' : 'Nueva Orden de Venta'}
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI DOCUMENT UPLOADER BANNER */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-indigo-950 block">Rellenar automáticamente con IA</span>
                  <span className="text-[10px] font-medium text-indigo-600 block">Sube un PDF o imagen de la OV / Cotización</span>
                </div>
              </div>
              <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs shrink-0 ${
                isParsing ? 'opacity-70 pointer-events-none' : ''
              }`}>
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Documento</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
                  disabled={isParsing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <form onSubmit={handleSaveOV} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    No. Orden de Venta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: SO19229"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Estado OV *
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoOV)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="creada">Creada</option>
                    <option value="enviada">Enviada</option>
                    <option value="bloqueada">Bloqueada</option>
                    <option value="facturada">Facturada</option>
                  </select>
                </div>
              </div>

              {/* Financial breakdown: Subtotal, Impuestos, Comisiones, Monto Total */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                  Desglose Financiero de la Orden
                </span>
                
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Subtotal Neto
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Ej: 7175.10"
                      value={subtotal}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setSubtotal(val);
                        // Auto calculate total if subtotal set
                        const imp = typeof impuestos === 'number' ? impuestos : 0;
                        const com = typeof comisiones === 'number' ? comisiones : 0;
                        if (val !== '') {
                          setMonto(Number((Number(val) + imp + com).toFixed(2)));
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Impuestos / IVA
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej: 861.02"
                      value={impuestos}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setImpuestos(val);
                        const sub = typeof subtotal === 'number' ? subtotal : 0;
                        const com = typeof comisiones === 'number' ? comisiones : 0;
                        if (sub > 0) {
                          setMonto(Number((sub + (val !== '' ? Number(val) : 0) + com).toFixed(2)));
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Comisión / Retención
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej: 35.88"
                      value={comisiones}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setComisiones(val);
                        const sub = typeof subtotal === 'number' ? subtotal : 0;
                        const imp = typeof impuestos === 'number' ? impuestos : 0;
                        if (sub > 0) {
                          setMonto(Number((sub + imp + (val !== '' ? Number(val) : 0)).toFixed(2)));
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">
                      Monto Total Final contratado *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Ej: 8072.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl font-mono font-black text-indigo-950 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Moneda
                    </label>
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="CLP">CLP ($)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GTQ">GTQ (Q)</option>
                      <option value="UF">UF</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* HORAS VENDIDAS POR ROL DESGLOSE */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Horas Vendidas por Rol
                  </span>
                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-mono">
                    Total: {totalHorasAuto} hrs
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Supervisor</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={horasPorRol.supervisor ?? ''}
                      onChange={(e) => setHorasPorRol({ ...horasPorRol, supervisor: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Coordinación</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={horasPorRol.coordinador ?? ''}
                      onChange={(e) => setHorasPorRol({ ...horasPorRol, coordinador: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">SAC / Consultor</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={horasPorRol.sac ?? ''}
                      onChange={(e) => setHorasPorRol({ ...horasPorRol, sac: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Social Media</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={horasPorRol.contents ?? ''}
                      onChange={(e) => setHorasPorRol({ ...horasPorRol, contents: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase mb-0.5">Diseñador</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={horasPorRol.contentd ?? ''}
                      onChange={(e) => setHorasPorRol({ ...horasPorRol, contentd: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Fecha de Emisión
                </label>
                <input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Descripción / Concepto
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Servicio de consultoría y diseño de contenidos Q3"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {editingOV ? 'Guardar Cambios' : 'Crear Orden de Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
