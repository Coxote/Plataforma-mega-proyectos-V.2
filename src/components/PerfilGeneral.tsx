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
  Plus, 
  PlusCircle, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  X, 
  Building2, 
  Phone, 
  Calendar, 
  PieChart, 
  Sparkles, 
  ChevronRight,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { getRetrabajoStats, getRetrabajoBadgeStyle } from '../dashboardUtils';

interface PerfilGeneralProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  userRole?: string;
}

export const PerfilGeneral: React.FC<PerfilGeneralProps> = ({ project, onUpdateProject, userRole }) => {
  const [activeSection, setActiveSection] = useState<'all' | 'comercial' | 'tecnica' | 'horas'>('all');

  const roleHours = project.roleHours || { coordinador: 0, sac: 0, contents: 0, contentd: 0 };
  const totalHours = project.hoursTotal || 0;

  // Calculos de horas consumidas generales y por rol
  const timeEntries = project.timeEntries || [];
  const totalConsumedHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const availableHours = Math.max(0, totalHours - totalConsumedHours);
  const consumedPercent = totalHours > 0 ? Math.min(100, Math.round((totalConsumedHours / totalHours) * 100)) : 0;

  // Agrupacion de horas consumidas por rol real
  const consumedByRole = useMemo(() => {
    const map: Record<string, number> = {
      coordinador: 0,
      sac: 0,
      contents: 0,
      contentd: 0,
    };
    timeEntries.forEach((e) => {
      const r = (e.role || '').toLowerCase();
      if (r.includes('coord')) map.coordinador += e.hours || 0;
      else if (r.includes('sac')) map.sac += e.hours || 0;
      else if (r.includes('contents') || r.includes('content s')) map.contents += e.hours || 0;
      else if (r.includes('contentd') || r.includes('content d')) map.contentd += e.hours || 0;
    });
    return map;
  }, [timeEntries]);

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
    <div className="p-6 max-w-6xl mx-auto space-y-6 my-2" id="project-expediente-wrapper">
      
      {/* 🚀 DOSSIER HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-900/50 px-2.5 py-1 rounded-md border border-orange-500/30 flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Expediente del Proyecto
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-bold text-slate-300">
                Cliente: <strong className="text-white">{project.clientName || 'GLOBEX S.A.'}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {project.name || 'Sin nombre asignado'}
            </h1>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
              {project.description || 'Ficha oficial de control técnico, órdenes comerciales de venta y presupuesto presupuestado.'}
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl text-left">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Monto Total OV</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                ${(project.totalIncome || 0).toLocaleString('es-CL')}
              </span>
              <span className="text-[9px] text-slate-400 block">{activeOVs.length} OV Activa(s)</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl text-left">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Presupuesto Horas</span>
              <span className="text-base font-black text-white">
                {totalConsumedHours}h <span className="text-xs text-slate-400 font-normal">/ {totalHours}h</span>
              </span>
              <span className="text-[9px] text-amber-300 block font-semibold">{availableHours}h disponibles</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl text-left col-span-2 sm:col-span-1">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Tasa Retrabajo</span>
              <span className={`text-base font-black ${retrabajoStats.porcentajeRetrabajo > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {retrabajoStats.porcentajeRetrabajo.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 block">{retrabajoStats.horasRetrabajo}h registradas</span>
            </div>
          </div>

        </div>

        {/* SECTION FILTER PILLS */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-700/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'all'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <LayersIcon className="w-3.5 h-3.5" />
            <span>Ver Todo el Expediente</span>
          </button>

          <button
            onClick={() => setActiveSection('comercial')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'comercial'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Comercial & OVs</span>
          </button>

          <button
            onClick={() => setActiveSection('tecnica')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'tecnica'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-blue-400" />
            <span>Ficha Técnica & Scope</span>
          </button>

          <button
            onClick={() => setActiveSection('horas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'horas'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Presupuesto por Rol</span>
          </button>
        </div>
      </div>

      {/* 🔴 SECCIÓN 1: DATOS COMERCIALES & ÓRDENES DE VENTA */}
      {(activeSection === 'all' || activeSection === 'comercial') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6" id="section-comercial">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                  Información Comercial & Órdenes de Venta
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Datos del cliente, contactos autorizados y vinculación de OVs facturables.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre Cliente */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-slate-600" /> Nombre de la Empresa / Cliente
              </label>
              <input
                type="text"
                disabled={!isCoordinador}
                value={project.clientName || ''}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                placeholder="Ej: Globex S.A."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-slate-900/10 outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>

            {/* Contacto Principal */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-600" /> Contacto Principal / Teléfono / Mail
              </label>
              <input
                type="text"
                disabled={!isCoordinador}
                value={project.clientContact || ''}
                onChange={(e) => handleInputChange('clientContact', e.target.value)}
                placeholder="Ej: Ricardo Toro (CTO) - ricardo@globex.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-slate-900/10 outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>
          </div>

          {/* CONTENEDOR MULTI-OV CON DISEÑO DE ALTO IMPACTO */}
          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 shadow-md" id="multi-ov-container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Órdenes de Venta Vinculadas ({ordenesVentaList.length})
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {activeOVs.length} Activa(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Consolidado total: <strong className="text-white font-mono font-bold">${(project.totalIncome || 0).toLocaleString('es-CL')} {project.currency || 'CLP'}</strong>
                </p>
              </div>

              {isCoordinador && !isAddingOv && (
                <button
                  type="button"
                  onClick={() => {
                    setNewOvNumber(`OV-${String(ordenesVentaList.length + 1).padStart(3, '0')}`);
                    setIsAddingOv(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Nueva OV
                </button>
              )}
            </div>

            {/* LISTA DE OVS */}
            <div className="space-y-2.5">
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
                      <span className="px-3 py-1 rounded-xl bg-slate-950 font-mono font-extrabold text-xs text-emerald-400 border border-slate-800 shrink-0">
                        {ov.numero}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-white">
                            ${(ov.monto || 0).toLocaleString('es-CL')} {ov.moneda || 'CLP'}
                          </span>
                          {ov.horasAsociadas ? (
                            <span className="text-[10px] bg-slate-900 text-slate-300 font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                              {ov.horasAsociadas} hrs asociadas
                            </span>
                          ) : null}
                        </div>
                        {ov.descripcion && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ov.descripcion}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {isCoordinador ? (
                        <select
                          value={ov.estado}
                          onChange={(e) => handleQuickStatusChange(ov.id, e.target.value as any)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-xl border focus:outline-none cursor-pointer bg-slate-900 ${
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
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-xl border ${
                          ov.estado === 'activa' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          ov.estado === 'facturada' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {ov.estado.toUpperCase()}
                        </span>
                      )}

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

            {/* FORMULARIO PARA AGREGAR OV */}
            {isAddingOv && isCoordinador && (
              <form onSubmit={handleAddOV} className="p-4 bg-slate-950/90 rounded-2xl border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" /> Registrar Nueva Orden de Venta
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
                    placeholder="Ej: Ampliación de alcance para fase de pruebas QA"
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
      )}

      {/* 🟢 SECCIÓN 2: FICHA TÉCNICA, OBJETIVO Y ALCANCE */}
      {(activeSection === 'all' || activeSection === 'tecnica') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6" id="section-tecnica">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                  Ficha Técnica, Objetivo y Scope Lock
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Definición formal del proyecto, metas de negocio y restricciones de alcance.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nombre del Proyecto */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Nombre del Proyecto
              </label>
              <input
                type="text"
                disabled={!isCoordinador}
                value={project.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-black text-slate-900 text-base focus:ring-2 focus:ring-slate-900/10 outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>

            {/* Descripción General */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Resumen Ejecutivo / Descripción del Servicio
              </label>
              <textarea
                rows={2}
                disabled={!isCoordinador}
                value={project.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-slate-900/10 outline-none resize-none disabled:bg-slate-100 disabled:text-slate-600 leading-relaxed font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Objetivo de Negocio */}
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/60 space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" /> Objetivo de Negocio
                </label>
                <textarea
                  rows={3}
                  disabled={!isCoordinador}
                  value={project.objective || ''}
                  onChange={(e) => handleInputChange('objective', e.target.value)}
                  className="w-full bg-white border border-emerald-200/80 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none disabled:bg-slate-100 disabled:text-slate-600 leading-relaxed font-medium"
                  placeholder="Especifica los KPIs y metas que el cliente busca lograr con este proyecto..."
                />
              </div>

              {/* Scope Lock (Alcance) */}
              <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/60 space-y-2">
                <label className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Alcance Lock (Límites Contractuales)
                </label>
                <textarea
                  rows={3}
                  disabled={!isCoordinador}
                  value={project.alcance || ''}
                  onChange={(e) => handleInputChange('alcance', e.target.value)}
                  className="w-full bg-white border border-amber-200/80 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none disabled:bg-slate-100 disabled:text-slate-600 leading-relaxed font-medium"
                  placeholder="Define claramente los límites para prevenir solicitudes fuera de alcance..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟡 SECCIÓN 3: PRESUPUESTO & HORAS POR ROL */}
      {(activeSection === 'all' || activeSection === 'horas') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6" id="section-horas">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                  Desglose de Horas Presupuestadas vs. Ejecutadas
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Control de asignación por rol y monitoreo de consumo en tiempo real.
                </p>
              </div>
            </div>

            <span className="text-xs font-black bg-slate-900 text-white px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
              Presupuesto Total: {totalHours} hrs
            </span>
          </div>

          {/* TARJETAS DE ROLES CON COMPARADOR EN TIEMPO REAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Coordinador */}
            <RoleCard
              roleKey="coordinador"
              label="Coordinador PM"
              allocated={roleHours.coordinador}
              consumed={consumedByRole.coordinador}
              isCoordinador={isCoordinador}
              onChange={(val) => handleRoleHourChange('coordinador', val)}
            />

            {/* SAC */}
            <RoleCard
              roleKey="sac"
              label="SAC / Consultor"
              allocated={roleHours.sac}
              consumed={consumedByRole.sac}
              isCoordinador={isCoordinador}
              onChange={(val) => handleRoleHourChange('sac', val)}
            />

            {/* ContentS */}
            <RoleCard
              roleKey="contents"
              label="ContentS (Estrategia)"
              allocated={roleHours.contents}
              consumed={consumedByRole.contents}
              isCoordinador={isCoordinador}
              onChange={(val) => handleRoleHourChange('contents', val)}
            />

            {/* ContentD */}
            <RoleCard
              roleKey="contentd"
              label="ContentD (Diseño)"
              allocated={roleHours.contentd}
              consumed={consumedByRole.contentd}
              isCoordinador={isCoordinador}
              onChange={(val) => handleRoleHourChange('contentd', val)}
            />

          </div>

          {/* BARRA DE PROGRESO GLOBAL */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600 uppercase tracking-wider">Progreso Global de Consumo de Horas</span>
              <span className="text-slate-900 font-mono font-extrabold">{totalConsumedHours} / {totalHours} hrs ({consumedPercent}%)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  consumedPercent > 90 ? 'bg-rose-500' : consumedPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${consumedPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// COMPONENTE SECUNDARIO PARA TARJETA DE ROL
interface RoleCardProps {
  roleKey: string;
  label: string;
  allocated: number;
  consumed: number;
  isCoordinador: boolean;
  onChange: (val: number) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ label, allocated, consumed, isCoordinador, onChange }) => {
  const percent = allocated > 0 ? Math.min(100, Math.round((consumed / allocated) * 100)) : 0;
  const isOver = consumed > allocated && allocated > 0;

  return (
    <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
      isOver ? 'bg-rose-50/50 border-rose-200/80' : 'bg-slate-50/80 border-slate-200/80'
    }`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{label}</span>
        {isOver && (
          <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
            Excedido
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <input
          type="number"
          min="0"
          disabled={!isCoordinador}
          value={allocated}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          className="text-xl font-black text-slate-900 w-20 bg-white border border-slate-200 rounded-lg px-2 py-0.5 focus:ring-2 focus:ring-slate-900/10 outline-none disabled:bg-transparent disabled:border-none disabled:p-0"
        />
        <span className="text-xs font-bold text-slate-400">hrs vendidas</span>
      </div>

      <div className="space-y-1 pt-1 border-t border-slate-200/60">
        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
          <span>Ejecutadas: <strong className="text-slate-800">{consumed}h</strong></span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all rounded-full ${
              isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const LayersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
    <path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L3.18 12.5"/>
    <path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L3.18 17.5"/>
  </svg>
);
