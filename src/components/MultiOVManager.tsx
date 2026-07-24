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
  Sparkles
} from 'lucide-react';
import { Project, OrdenVenta } from '../types';

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

  // Form State
  const [numero, setNumero] = useState('');
  const [monto, setMonto] = useState<number | ''>('');
  const [moneda, setMoneda] = useState('CLP');
  const [horasAsociadas, setHorasAsociadas] = useState<number | ''>('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<'activa' | 'facturada' | 'cancelada'>('activa');

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
        estado: 'activa'
      }];

  // Totals calculations
  const validOVs = ordenesVenta.filter(ov => ov.estado !== 'cancelada');
  const totalMonto = validOVs.reduce((sum, ov) => sum + (ov.monto || 0), 0);
  const totalHoras = validOVs.reduce((sum, ov) => sum + (ov.horasAsociadas || 0), 0);
  const countActivas = ordenesVenta.filter(ov => ov.estado === 'activa').length;
  const countFacturadas = ordenesVenta.filter(ov => ov.estado === 'facturada').length;
  const countCanceladas = ordenesVenta.filter(ov => ov.estado === 'cancelada').length;

  const handleOpenAdd = () => {
    setEditingOV(null);
    setNumero(`OV-${String(ordenesVenta.length + 1).padStart(3, '0')}`);
    setMonto('');
    setMoneda(project.currency || 'CLP');
    setHorasAsociadas('');
    setFechaEmision(new Date().toISOString().split('T')[0]);
    setDescripcion('');
    setEstado('activa');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ov: OrdenVenta) => {
    setEditingOV(ov);
    setNumero(ov.numero);
    setMonto(ov.monto);
    setMoneda(ov.moneda || 'CLP');
    setHorasAsociadas(ov.horasAsociadas || '');
    setFechaEmision(ov.fechaEmision || new Date().toISOString().split('T')[0]);
    setDescripcion(ov.descripcion || '');
    setEstado(ov.estado);
    setIsModalOpen(true);
  };

  const handleSaveOV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim()) return;

    const newMontoNum = typeof monto === 'number' ? monto : 0;
    const newHorasNum = typeof horasAsociadas === 'number' ? horasAsociadas : 0;

    let updatedList: OrdenVenta[];
    if (editingOV) {
      updatedList = ordenesVenta.map(ov => ov.id === editingOV.id ? {
        ...ov,
        numero: numero.trim(),
        monto: newMontoNum,
        moneda,
        horasAsociadas: newHorasNum,
        fechaEmision,
        descripcion: descripcion.trim(),
        estado
      } : ov);
    } else {
      const newOV: OrdenVenta = {
        id: `ov-${Date.now()}`,
        numero: numero.trim(),
        monto: newMontoNum,
        moneda,
        horasAsociadas: newHorasNum,
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

  const handleQuickStatusChange = (ovId: string, newStatus: 'activa' | 'facturada' | 'cancelada') => {
    const updatedList = ordenesVenta.map(ov => ov.id === ovId ? { ...ov, estado: newStatus } : ov);
    syncAndSaveProject(updatedList);
  };

  const syncAndSaveProject = (updatedOVs: OrdenVenta[]) => {
    const activeOVs = updatedOVs.filter(ov => ov.estado !== 'cancelada');
    const newTotalIncome = activeOVs.reduce((sum, ov) => sum + (ov.monto || 0), 0);
    const newOvNumbersStr = activeOVs.map(ov => ov.numero).join(', ') || updatedOVs[0]?.numero || 'OV-001';

    onUpdateProject({
      ...project,
      ordenesVenta: updatedOVs,
      totalIncome: newTotalIncome,
      saleOrderNumber: newOvNumbersStr,
      ovNumber: newOvNumbersStr
    });
  };

  const getStatusBadge = (st: 'activa' | 'facturada' | 'cancelada') => {
    if (st === 'activa') {
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Activa' };
    }
    if (st === 'facturada') {
      return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Facturada' };
    }
    return { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', label: 'Cancelada' };
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
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Desglose de Estados</span>
            <div className="flex gap-2 text-[10px] font-bold">
              <span className="text-emerald-700">{countActivas} Activas</span>
              <span className="text-blue-700">{countFacturadas} Facturadas</span>
              {countCanceladas > 0 && <span className="text-slate-500">{countCanceladas} Canc.</span>}
            </div>
          </div>
          <Layers className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* OVs LIST TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-2.5 px-3">No. OV</th>
              <th className="py-2.5 px-3">Monto</th>
              <th className="py-2.5 px-3">Horas</th>
              <th className="py-2.5 px-3">Emisión</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3">Descripción / Concepto</th>
              {isCoordinador && <th className="py-2.5 px-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {ordenesVenta.map((ov) => {
              const badge = getStatusBadge(ov.estado);
              return (
                <tr key={ov.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                      {ov.numero}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-black text-slate-800">
                    ${(ov.monto || 0).toLocaleString('es-CL')} <span className="text-[10px] text-slate-400">{ov.moneda}</span>
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
                        {/* Quick Status Dropdown / Toggle */}
                        <select
                          value={ov.estado}
                          onChange={(e) => handleQuickStatusChange(ov.id, e.target.value as any)}
                          className="text-[10px] font-bold bg-slate-100 border border-slate-200 rounded px-1.5 py-1 text-slate-700 cursor-pointer focus:outline-none"
                        >
                          <option value="activa">Activa</option>
                          <option value="facturada">Facturada</option>
                          <option value="cancelada">Cancelada</option>
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
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

            <form onSubmit={handleSaveOV} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    No. Orden de Venta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: OV-102"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Estado
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="activa">Activa</option>
                    <option value="facturada">Facturada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Monto
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 1500000"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Moneda
                  </label>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="CLP">CLP ($)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="UF">UF</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Horas Asociadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 40"
                    value={horasAsociadas}
                    onChange={(e) => setHorasAsociadas(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
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
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Descripción / Concepto
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Servicio de diseño de marca y piezas gráficas para Q3"
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
