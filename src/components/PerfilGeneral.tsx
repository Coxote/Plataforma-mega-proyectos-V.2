import React, { useState, useMemo } from 'react';
import { Project, OrdenVenta } from '../types';
import { 
  User, 
  Hash, 
  Clock, 
  Briefcase, 
  Target, 
  ShieldAlert, 
  TrendingUp, 
  FileText, 
  Activity, 
  AlertTriangle,
  Plus,
  PlusCircle,
  Trash2,
  DollarSign,
  CheckCircle2,
  X,
  Layers
} from 'lucide-react';
import { getRetrabajoStats, getRetrabajoBadgeStyle } from '../dashboardUtils';

interface PerfilGeneralProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  userRole?: string;
}

export const PerfilGeneral: React.FC<PerfilGeneralProps> = ({ project, onUpdateProject, userRole }) => {
  const roleHours = project.roleHours || { coordinador: 0, sac: 0, contents: 0, contentd: 0 };
  const totalHours = project.hoursTotal || 0;

  // Calculos de horas consumidas y retrabajo
  const timeEntries = project.timeEntries || [];
  const totalConsumedHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const availableHours = Math.max(0, totalHours - totalConsumedHours);
  const consumedPercent = totalHours > 0 ? Math.min(100, Math.round((totalConsumedHours / totalHours) * 100)) : 0;

  const retrabajoStats = getRetrabajoStats(project);
  const badgeStyle = getRetrabajoBadgeStyle(retrabajoStats.porcentajeRetrabajo);

  const isCoordinador = userRole === 'coordinador';

  // Multi-OV list calculation & management
  const ordenesVentaList: OrdenVenta[] = useMemo(() => {
    if (project.ordenesVenta && project.ordenesVenta.length > 0) {
      return project.ordenesVenta;
    }
    const defaultNum = String(project.saleOrderNumber || project.ovNumber || 'OV-001');
    return [{
      id: `ov-${project.id}-default`,
      numero: defaultNum,
      monto: project.totalIncome || 0,
      moneda: project.currency || 'CLP',
      horasAsociadas: project.hoursTotal || 0,
      fechaEmision: project.startDate || new Date().toISOString().split('T')[0],
      descripcion: 'Orden de Venta Principal',
      estado: 'activa'
    }];
  }, [project.ordenesVenta, project.saleOrderNumber, project.ovNumber, project.totalIncome, project.currency, project.hoursTotal, project.startDate, project.id]);

  const activeOVs = useMemo(() => ordenesVentaList.filter(o => o.estado !== 'cancelada'), [ordenesVentaList]);

  const [newOvNumber, setNewOvNumber] = useState('');
  const [newOvMonto, setNewOvMonto] = useState<number | ''>('');
  const [newOvHoras, setNewOvHoras] = useState<number | ''>('');
  const [newOvDesc, setNewOvDesc] = useState('');
  const [isAddingOv, setIsAddingOv] = useState(false);

  const saveUpdatedOVs = (updatedList: OrdenVenta[]) => {
    const activeOVsList = updatedList.filter(o => o.estado !== 'cancelada');
    const calcTotalIncome = activeOVsList.reduce((sum, o) => sum + (o.monto || 0), 0);
    const ovNumbersConcat = activeOVsList.map(o => o.numero).join(', ') || updatedList[0]?.numero || 'OV-001';

    onUpdateProject({
      ...project,
      ordenesVenta: updatedList,
      totalIncome: calcTotalIncome,
      saleOrderNumber: ovNumbersConcat,
      ovNumber: ovNumbersConcat
    });
  };

  const handleAddOV = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newOvNumber.trim();
    if (!cleanNum) return;

    const montoNum = typeof newOvMonto === 'number' ? newOvMonto : 0;
    const horasNum = typeof newOvHoras === 'number' ? newOvHoras : 0;

    const newOV: OrdenVenta = {
      id: `ov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      numero: cleanNum,
      monto: montoNum,
      moneda: project.currency || 'CLP',
      horasAsociadas: horasNum,
      fechaEmision: new Date().toISOString().split('T')[0],
      descripcion: newOvDesc.trim() || `Orden de Venta ${cleanNum}`,
      estado: 'activa'
    };

    const updated = [...ordenesVentaList, newOV];
    saveUpdatedOVs(updated);

    // Reset form
    setNewOvNumber('');
    setNewOvMonto('');
    setNewOvHoras('');
    setNewOvDesc('');
    setIsAddingOv(false);
  };

  const handleDeleteOV = (ovId: string) => {
    if (ordenesVentaList.length <= 1) {
      alert('El proyecto debe mantener al menos una Orden de Venta.');
      return;
    }
    const updated = ordenesVentaList.filter(o => o.id !== ovId);
    saveUpdatedOVs(updated);
  };

  const handleQuickStatusChange = (ovId: string, newStatus: 'activa' | 'facturada' | 'cancelada') => {
    const updated = ordenesVentaList.map(o => o.id === ovId ? { ...o, estado: newStatus } : o);
    saveUpdatedOVs(updated);
  };

  const handleInputChange = (field: keyof Project, value: any) => {
    onUpdateProject({
      ...project,
      [field]: value
    });
  };

  const handleRoleHourChange = (role: string, val: number) => {
    const newRoleHours = { ...roleHours, [role]: val };
    const newTotal = 
      Number(newRoleHours.coordinador || 0) + 
      Number(newRoleHours.sac || 0) + 
      Number(newRoleHours.contents || 0) + 
      Number(newRoleHours.contentd || 0);

    // Also update budget allocated to reflect these hours if budget exists
    const updatedBudget = { ...project.budget };
    if (updatedBudget && updatedBudget[role as keyof typeof updatedBudget]) {
      updatedBudget[role as keyof typeof updatedBudget] = {
        ...updatedBudget[role as keyof typeof updatedBudget],
        allocated: val
      };
    }

    onUpdateProject({
      ...project,
      roleHours: newRoleHours,
      hoursTotal: newTotal,
      budget: updatedBudget
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-white rounded-3xl border border-slate-200 shadow-xs my-4" id="project-perfil-general">
      
      {/* 🟢 SECCIÓN 1: INFORMACIÓN DEL CLIENTE Y ORDEN DE VENTA */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-slate-900" /> Información del Cliente & Orden Comercial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Nombre Cliente */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Cliente</label>
            <input
              type="text"
              disabled={!isCoordinador}
              value={project.clientName || ''}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none disabled:text-slate-500"
            />
          </div>

          {/* Contacto Principal */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contacto Principal / Teléfono</label>
            <input
              type="text"
              disabled={!isCoordinador}
              value={project.clientContact || ''}
              onChange={(e) => handleInputChange('clientContact', e.target.value)}
              placeholder="Ej: Ricardo Toro (CTO)"
              className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none disabled:text-slate-500"
            />
          </div>

        </div>

        {/* 📋 CONTENEDOR MULTI-OV ESTRUCTURADO */}
        <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-4 shadow-md" id="multi-ov-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  Órdenes de Venta ({ordenesVentaList.length})
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {ordenesVentaList.filter(o => o.estado !== 'cancelada').length} Activas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monto Total Consolidado: <strong className="text-white font-mono font-bold">${(project.totalIncome || 0).toLocaleString('es-CL')} {project.currency || 'CLP'}</strong>
              </p>
            </div>

            {isCoordinador && !isAddingOv && (
              <button
                type="button"
                onClick={() => {
                  setNewOvNumber(`OV-${String(ordenesVentaList.length + 1).padStart(3, '0')}`);
                  setIsAddingOv(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar OV
              </button>
            )}
          </div>

          {/* LISTA DE OVS REGISTRADAS */}
          <div className="space-y-2">
            {ordenesVentaList.map((ov, index) => {
              const isCancelada = ov.estado === 'cancelada';
              const isFacturada = ov.estado === 'facturada';

              return (
                <div 
                  key={ov.id || index}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCancelada ? 'bg-slate-800/40 border-slate-800 text-slate-500' :
                    isFacturada ? 'bg-slate-800/80 border-blue-500/30 text-white' :
                    'bg-slate-800/90 border-slate-700 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-950 font-mono font-extrabold text-xs text-emerald-400 border border-slate-800">
                      {ov.numero}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-white">
                          ${(ov.monto || 0).toLocaleString('es-CL')} {ov.moneda || 'CLP'}
                        </span>
                        {ov.horasAsociadas ? (
                          <span className="text-[10px] bg-slate-900 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                            {ov.horasAsociadas} hrs
                          </span>
                        ) : null}
                      </div>
                      {ov.descripcion && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">{ov.descripcion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Select de Estado */}
                    {isCoordinador ? (
                      <select
                        value={ov.estado}
                        onChange={(e) => handleQuickStatusChange(ov.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer bg-slate-900 ${
                          ov.estado === 'activa' ? 'text-emerald-400 border-emerald-500/40' :
                          ov.estado === 'facturada' ? 'text-blue-400 border-blue-500/40' :
                          'text-slate-400 border-slate-700'
                        }`}
                      >
                        <option value="activa">Activa</option>
                        <option value="facturada">Facturada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    ) : (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${
                        ov.estado === 'activa' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        ov.estado === 'facturada' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {ov.estado.toUpperCase()}
                      </span>
                    )}

                    {/* Botón Eliminar */}
                    {isCoordinador && ordenesVentaList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteOV(ov.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Eliminar esta Orden de Venta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FORMULARIO ESTRUCTURADO PARA INGRESAR Y AGREGAR OVs */}
          {isAddingOv && isCoordinador && (
            <form onSubmit={handleAddOV} className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" /> Nueva Orden de Venta
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingOv(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nº de OV *</label>
                  <input
                    type="text"
                    required
                    value={newOvNumber}
                    onChange={(e) => setNewOvNumber(e.target.value)}
                    placeholder="Ej: OV-002"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newOvMonto}
                    onChange={(e) => setNewOvMonto(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ej: 1500000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Horas Asignadas</label>
                  <input
                    type="number"
                    min="0"
                    value={newOvHoras}
                    onChange={(e) => setNewOvHoras(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ej: 40"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción / Detalle</label>
                <input
                  type="text"
                  value={newOvDesc}
                  onChange={(e) => setNewOvDesc(e.target.value)}
                  placeholder="Ej: Fase 2 - Desarrollo adicional y soporte"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingOv(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors cursor-pointer shadow-xs"
                >
                  Guardar OV
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 🟢 SECCIÓN 2: DETALLE DEL PROYECTO */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-900" /> Detalle del Proyecto
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Proyecto</label>
            <input
              type="text"
              disabled={!isCoordinador}
              value={project.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 text-base focus:outline-none disabled:text-slate-500"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción General</label>
            <textarea
              rows={2}
              disabled={!isCoordinador}
              value={project.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full bg-transparent text-slate-700 text-sm focus:outline-none resize-none disabled:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* 🟢 SECCIÓN 3: DESGLOSE DE HORAS VENDIDAS POR ROL */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-900" /> Horas Vendidas (Presupuestas)
          </h3>
          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            Total Vendido: {totalHours} hrs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Coordinador</span>
            <input
              type="number"
              disabled={!isCoordinador}
              value={roleHours.coordinador}
              onChange={(e) => handleRoleHourChange('coordinador', parseInt(e.target.value, 10) || 0)}
              className="text-xl font-black text-slate-900 w-full bg-transparent focus:outline-none disabled:text-slate-500"
            />
            <span className="text-[10px] text-slate-400">horas asignadas</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SAC</span>
            <input
              type="number"
              disabled={!isCoordinador}
              value={roleHours.sac}
              onChange={(e) => handleRoleHourChange('sac', parseInt(e.target.value, 10) || 0)}
              className="text-xl font-black text-slate-900 w-full bg-transparent focus:outline-none disabled:text-slate-500"
            />
            <span className="text-[10px] text-slate-400">horas asignadas</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ContentS</span>
            <input
              type="number"
              disabled={!isCoordinador}
              value={roleHours.contents}
              onChange={(e) => handleRoleHourChange('contents', parseInt(e.target.value, 10) || 0)}
              className="text-xl font-black text-slate-900 w-full bg-transparent focus:outline-none disabled:text-slate-500"
            />
            <span className="text-[10px] text-slate-400">horas asignadas</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ContentD</span>
            <input
              type="number"
              disabled={!isCoordinador}
              value={roleHours.contentd}
              onChange={(e) => handleRoleHourChange('contentd', parseInt(e.target.value, 10) || 0)}
              className="text-xl font-black text-slate-900 w-full bg-transparent focus:outline-none disabled:text-slate-500"
            />
            <span className="text-[10px] text-slate-400">horas asignadas</span>
          </div>

        </div>
      </div>

      {/* 🟢 SECCIÓN 4: OBJETIVO Y ALCANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="text-xs font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-600" /> Objetivo de Negocio
          </label>
          <textarea
            rows={3}
            disabled={!isCoordinador}
            value={project.objective || ''}
            onChange={(e) => handleInputChange('objective', e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none resize-none disabled:text-slate-500"
            placeholder="Escribe el objetivo principal del proyecto para el negocio..."
          />
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="text-xs font-bold text-slate-900 uppercase mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" /> Alcance (Scope Lock)
          </label>
          <textarea
            rows={3}
            disabled={!isCoordinador}
            value={project.alcance || ''}
            onChange={(e) => handleInputChange('alcance', e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none resize-none disabled:text-slate-500"
            placeholder="Especifica los límites del alcance del proyecto..."
          />
        </div>
      </div>

      {/* 🟢 SECCIÓN 5: RESUMEN EJECUTIVO FINANCIERO & RENDIMIENTO DE HORAS (FASE C) */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Snapshot Financiero y Consumo de Horas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Resumen consolidado de Órdenes de Venta, avance presupuestario y retrabajo registrado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-black rounded-full border ${badgeStyle.bg}`}>
              Retrabajo: {retrabajoStats.porcentajeRetrabajo.toFixed(1)}% ({retrabajoStats.horasRetrabajo}h)
            </span>
          </div>
        </div>

        {/* METRICAS DE CONSUMO DE HORAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horas Vendidas</span>
            <span className="text-xl font-black text-white">{totalHours}h</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Presupuesto inicial</span>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horas Ejecutadas</span>
            <span className="text-xl font-black text-indigo-400">{totalConsumedHours}h</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{consumedPercent}% consumido</span>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horas Disponibles</span>
            <span className={`text-xl font-black ${availableHours < 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {availableHours}h
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Remanente de proyecto</span>
          </div>
        </div>

        {/* BARRA DE PROGRESO DE CONSUMO */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-slate-400 uppercase">Avance del Presupuesto de Horas</span>
            <span className="text-indigo-300 font-mono">{totalConsumedHours} / {totalHours} hrs</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                consumedPercent > 90 ? 'bg-rose-500' : consumedPercent > 70 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${consumedPercent}%` }}
            />
          </div>
        </div>

        {/* RESUMEN DE ÓRDENES DE VENTA (MULTI-OV) */}
        {activeOVs.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> Órdenes de Venta Asociadas ({activeOVs.length})
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Total: ${(project.totalIncome || 0).toLocaleString('es-CL')} {project.currency || 'USD'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeOVs.map((ov) => (
                <div key={ov.id} className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-extrabold text-white flex items-center gap-1.5">
                      <span>OV #{ov.numero}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {ov.estado}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{ov.descripcion || 'Sin descripción'} ({ov.fechaEmision})</div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-400 block">${ov.monto.toLocaleString('es-CL')}</span>
                    {ov.horasAsociadas ? <span className="text-[9px] text-slate-400">{ov.horasAsociadas} hrs</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
