import React, { useState, useMemo } from 'react';
import { Project, OrdenVenta, EstadoOV, Client, DecisionLogEntry, UserSession } from '../types';
import {
  User,
  Hash,
  Clock,
  Briefcase,
  Target,
  ShieldAlert,
  TrendingUp,
  Plus,
  PlusCircle,
  Trash2,
  DollarSign,
  CheckCircle2,
  X,
  Building2,
  Phone,
  Mail,
  Globe,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
  FileCheck,
  Palette,
  Check
} from 'lucide-react';
import { getRetrabajoStats } from '../dashboardUtils';
import { CustomModal } from './CustomModal';

interface PerfilGeneralProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  userRole?: string;
  clients?: Client[];
  currentUser?: UserSession;
}

export const PerfilGeneral: React.FC<PerfilGeneralProps> = ({
  project,
  onUpdateProject,
  userRole,
  clients = [],
  currentUser
}) => {
  const isCoordinador = userRole === 'coordinador';

  // 1. Resumen del Cliente sacado de la sección clientes
  const clientData = useMemo(() => {
    if (!clients || clients.length === 0) return null;
    return clients.find(
      (c) =>
        c.nombreComercial.toLowerCase() === (project.clientName || '').toLowerCase() ||
        c.id === (project as any).clientId
    ) || null;
  }, [clients, project.clientName]);

  // 2. Órdenes de Venta Vinculadas
  const ordenesVentaList: OrdenVenta[] = useMemo(() => {
    if (project.ordenesVenta && project.ordenesVenta.length > 0) {
      return project.ordenesVenta;
    }
    const defaultNum = String(project.saleOrderNumber || project.ovNumber || 'OV-001');
    return [{
      id: `ov-${project.id}-default`,
      numero: defaultNum,
      monto: project.totalIncome || 0,
      moneda: project.currency || 'USD',
      horasAsociadas: project.hoursTotal || 0,
      fechaEmision: project.startDate || new Date().toISOString().split('T')[0],
      descripcion: 'Orden de Venta Principal',
      estado: 'creada'
    }];
  }, [project.ordenesVenta, project.saleOrderNumber, project.ovNumber, project.totalIncome, project.currency, project.hoursTotal, project.startDate, project.id]);

  const [newOvNumber, setNewOvNumber] = useState('');
  const [newOvMonto, setNewOvMonto] = useState<number | ''>('');
  const [newOvHoras, setNewOvHoras] = useState<number | ''>('');
  const [newOvDesc, setNewOvDesc] = useState('');
  const [isAddingOv, setIsAddingOv] = useState(false);
  const [ovToDelete, setOvToDelete] = useState<string | null>(null);
  const [ovRestrictionModal, setOvRestrictionModal] = useState(false);

  const saveUpdatedOVs = (updatedList: OrdenVenta[]) => {
    const calcTotalIncome = updatedList.reduce((sum, o) => sum + (o.monto || 0), 0);
    const ovNumbersConcat = updatedList.map((o) => o.numero).join(', ') || updatedList[0]?.numero || 'OV-001';

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

    const newOV: OrdenVenta = {
      id: `ov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      numero: cleanNum,
      monto: typeof newOvMonto === 'number' ? newOvMonto : 0,
      moneda: project.currency || 'USD',
      horasAsociadas: typeof newOvHoras === 'number' ? newOvHoras : 0,
      fechaEmision: new Date().toISOString().split('T')[0],
      descripcion: newOvDesc.trim() || `Orden de Venta ${cleanNum}`,
      estado: 'creada'
    };

    saveUpdatedOVs([...ordenesVentaList, newOV]);
    setNewOvNumber('');
    setNewOvMonto('');
    setNewOvHoras('');
    setNewOvDesc('');
    setIsAddingOv(false);
  };

  const handleDeleteOV = (ovId: string) => {
    if (ordenesVentaList.length <= 1) {
      setOvRestrictionModal(true);
      return;
    }
    setOvToDelete(ovId);
  };

  const confirmDeleteOV = () => {
    if (!ovToDelete) return;
    saveUpdatedOVs(ordenesVentaList.filter((o) => o.id !== ovToDelete));
    setOvToDelete(null);
  };

  const handleQuickStatusChange = (ovId: string, newStatus: EstadoOV) => {
    saveUpdatedOVs(ordenesVentaList.map((o) => (o.id === ovId ? { ...o, estado: newStatus } : o)));
  };

  // 3. Cálculos de Desglose de Horas Presupuestadas vs. Ejecutadas (Minimalista)
  const roleHours = project.roleHours || { coordinador: 40, sac: 30, contents: 30, contentd: 40, supervisor: 10, proveedor: 0 };
  const totalHours = project.hoursTotal || 0;
  const timeEntries = project.timeEntries || [];
  const totalConsumedHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const availableHours = Math.max(0, totalHours - totalConsumedHours);
  const consumedPercent = totalHours > 0 ? Math.min(100, Math.round((totalConsumedHours / totalHours) * 100)) : 0;

  const consumedByRole = useMemo(() => {
    const map: Record<string, number> = {
      supervisor: 0,
      coordinador: 0,
      sac: 0,
      contents: 0,
      contentd: 0,
      proveedor: 0
    };
    timeEntries.forEach((e) => {
      const r = (e.role || '').toLowerCase();
      if (r.includes('superv')) map.supervisor += e.hours || 0;
      else if (r.includes('coord')) map.coordinador += e.hours || 0;
      else if (r.includes('sac')) map.sac += e.hours || 0;
      else if (r.includes('contents') || r.includes('content s') || r.includes('social')) map.contents += e.hours || 0;
      else if (r.includes('contentd') || r.includes('content d') || r.includes('diseñ')) map.contentd += e.hours || 0;
      else if (r.includes('provee')) map.proveedor += e.hours || 0;
    });
    return map;
  }, [timeEntries]);

  const retrabajoStats = getRetrabajoStats(project);

  const handleRoleHourChange = (roleKey: string, val: number) => {
    const newRoleHours = { ...roleHours, [roleKey]: Math.max(0, val) };
    const newTotal =
      Number(newRoleHours.coordinador || 0) +
      Number(newRoleHours.sac || 0) +
      Number(newRoleHours.contents || 0) +
      Number(newRoleHours.contentd || 0) +
      Number(newRoleHours.supervisor || 0) +
      Number(newRoleHours.proveedor || 0);

    const updatedBudget = { ...project.budget };
    if (updatedBudget && (updatedBudget as any)[roleKey]) {
      (updatedBudget as any)[roleKey] = {
        ...(updatedBudget as any)[roleKey],
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

  // 4. Registro Cronológico de Acuerdos con Cliente (Decision Log) con Filtros
  const [decisionCategoryFilter, setDecisionCategoryFilter] = useState<string>('todos');
  const [showAddDecisionForm, setShowAddDecisionForm] = useState(false);
  const [decTitle, setDecTitle] = useState('');
  const [decCategory, setDecCategory] = useState<'Alcance' | 'Presupuesto' | 'Diseño' | 'Técnico' | 'Aprobación'>('Alcance');
  const [decRationale, setDecRationale] = useState('');
  const [decApprovedBy, setDecApprovedBy] = useState('');

  const decisionLogList: DecisionLogEntry[] = useMemo(() => {
    return project.decisionLog || [];
  }, [project.decisionLog]);

  const filteredDecisions = useMemo(() => {
    if (decisionCategoryFilter === 'todos') return decisionLogList;
    return decisionLogList.filter(
      (d) => (d.category || '').toLowerCase() === decisionCategoryFilter.toLowerCase()
    );
  }, [decisionLogList, decisionCategoryFilter]);

  const handleAddDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decTitle.trim()) return;

    const authorName = currentUser?.username || 'Coordinador';
    const newEntry: DecisionLogEntry = {
      id: `dec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: authorName,
      userRole: (currentUser?.role || 'coordinador') as any,
      title: decTitle.trim(),
      description: decRationale.trim() || decTitle.trim(),
      category: decCategory.toLowerCase(),
      date: new Date().toISOString().split('T')[0],
      approvedBy: decApprovedBy.trim() || 'Cliente Autorizado',
      createdAt: new Date().toISOString()
    };

    const updatedDecisions = [newEntry, ...(project.decisionLog || [])];
    const newAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      username: authorName,
      userRole: (currentUser?.role || 'coordinador') as any,
      action: 'REGISTRAR_ACUERDO',
      entityType: 'DecisionLog',
      details: `Registró acuerdo "${decTitle}" en categoría ${decCategory}. Aprobado por: ${newEntry.approvedBy}`
    };

    onUpdateProject({
      ...project,
      decisionLog: updatedDecisions,
      auditLog: [newAuditEntry, ...(project.auditLog || [])]
    });

    setDecTitle('');
    setDecRationale('');
    setDecApprovedBy('');
    setShowAddDecisionForm(false);
  };

  return (
    <div className="space-y-6" id="project-profile-view-tab">

      {/* ========================================================================= */}
      {/* 1. INFORMACIÓN DEL CLIENTE (RESUMEN SACADO DE LA SECCIÓN CLIENTES)        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200/70 space-y-5" id="client-info-summary-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {project.clientName ? project.clientName.substring(0, 2).toUpperCase() : 'CL'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {clientData?.nombreComercial || project.clientName || 'Cliente Principal'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {clientData?.estado === 'activo' ? 'Cliente Activo' : 'Cuenta en Regla'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {clientData?.categoria || 'Cuenta Corporativa'} • Resumen oficial de cuenta y ficha de contacto
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F4F5F0] text-slate-700 border border-stone-200/80 self-start sm:self-auto">
            Ficha de Cuenta
          </span>
        </div>

        {/* Datos de contacto y empresa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-[#F4F5F0] rounded-2xl space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <User className="w-3 h-3 text-slate-700" /> Contacto Principal
            </span>
            <p className="text-slate-900 font-semibold truncate">
              {clientData?.contactoPrincipal || project.clientContact || 'No especificado'}
            </p>
          </div>

          <div className="p-3.5 bg-[#F4F5F0] rounded-2xl space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-700" /> Correo Electrónico
            </span>
            <p className="text-slate-900 font-semibold truncate">
              {clientData?.email || 'contacto@cliente.com'}
            </p>
          </div>

          <div className="p-3.5 bg-[#F4F5F0] rounded-2xl space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-700" /> Teléfono Directo
            </span>
            <p className="text-slate-900 font-semibold truncate">
              {clientData?.telefono || '+502 2200-0000'}
            </p>
          </div>

          <div className="p-3.5 bg-[#F4F5F0] rounded-2xl space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-700" /> Portal / Sitio Web
            </span>
            <a
              href={clientData?.sitioWebRedes || '#'}
              target="_blank"
              rel="noreferrer"
              className="text-slate-900 font-semibold hover:underline truncate block"
            >
              {clientData?.sitioWebRedes || 'www.cliente.com'}
            </a>
          </div>
        </div>

        {/* Resumen de Brand Voice / Tono de Marca si está disponible */}
        {clientData?.brandBible && (
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Palette className="w-3.5 h-3.5 text-slate-800" />
              <span>Lineamientos de Marca ({clientData.brandBible.archetype || 'Voz de Marca'})</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              <strong>Tono de Voz:</strong> {clientData.brandBible.tonoVoz || 'Profesional y dinámico'} •{' '}
              <strong>Propósito:</strong> {clientData.brandBible.misionVision || 'Generar impacto medible en audiencias clave.'}
            </p>
            {clientData.brandBible.coloresHex && clientData.brandBible.coloresHex.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-500">Paleta oficial:</span>
                <div className="flex items-center gap-1.5">
                  {clientData.brandBible.coloresHex.map((hex, i) => (
                    <span
                      key={i}
                      className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs inline-block"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. ÓRDENES DE VENTA (OVS) VINCULADAS AL PROYECTO                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200/70 space-y-5" id="project-ov-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-800" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Órdenes de Venta Vinculadas ({ordenesVentaList.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Trazabilidad comercial del contrato. Total facturado: <strong className="text-slate-900 font-mono">${(project.totalIncome || 0).toLocaleString('es-CL')} {project.currency || 'USD'}</strong>
            </p>
          </div>

          {isCoordinador && !isAddingOv && (
            <button
              type="button"
              onClick={() => {
                setNewOvNumber(`OV-${String(ordenesVentaList.length + 1).padStart(3, '0')}`);
                setIsAddingOv(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Orden de Venta</span>
            </button>
          )}
        </div>

        {/* Formulario Agregar OV */}
        {isAddingOv && (
          <form onSubmit={handleAddOV} className="p-5 bg-[#F4F5F0] rounded-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" /> Registrar Nueva Orden de Venta (OV)
              </span>
              <button
                type="button"
                onClick={() => setIsAddingOv(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Número de OV *</label>
                <input
                  type="text"
                  required
                  value={newOvNumber}
                  onChange={(e) => setNewOvNumber(e.target.value)}
                  placeholder="Ej: OV-002"
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Monto Total ($) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newOvMonto}
                  onChange={(e) => setNewOvMonto(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej: 4500"
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Horas Asociadas</label>
                <input
                  type="number"
                  min="0"
                  value={newOvHoras}
                  onChange={(e) => setNewOvHoras(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej: 80"
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción / Alcance Comercial</label>
              <input
                type="text"
                value={newOvDesc}
                onChange={(e) => setNewOvDesc(e.target.value)}
                placeholder="Ej: Paquete de diseño mensual y producción de contenidos"
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingOv(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-stone-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Guardar OV
              </button>
            </div>
          </form>
        )}

        {/* Lista de OVs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ordenesVentaList.map((ov, index) => (
            <div
              key={ov.id || index}
              className="p-4 rounded-2xl border border-stone-200 bg-[#F4F5F0] hover:bg-stone-50 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-stone-200 text-slate-900">
                      {ov.numero}
                    </span>
                    <span className="font-mono font-bold text-base text-slate-900">
                      ${(ov.monto || 0).toLocaleString('es-CL')} {ov.moneda || 'USD'}
                    </span>
                  </div>
                  {ov.descripcion && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{ov.descripcion}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCoordinador ? (
                    <select
                      value={ov.estado}
                      onChange={(e) => handleQuickStatusChange(ov.id, e.target.value as EstadoOV)}
                      className="text-xs font-bold px-3 py-1 rounded-full border border-stone-200 bg-white text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="creada">Creada</option>
                      <option value="enviada">Enviada</option>
                      <option value="bloqueada">Bloqueada</option>
                      <option value="facturada">Facturada</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-slate-700 uppercase">
                      {ov.estado}
                    </span>
                  )}

                  {isCoordinador && ordenesVentaList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOV(ov.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer rounded-lg"
                      title="Eliminar OV"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-stone-200/60">
                <span>{ov.horasAsociadas || 0} hrs asignadas</span>
                <span>Emisión: {ov.fechaEmision || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DESGLOSE DE HORAS PRESUPUESTADAS VS. EJECUTADAS (MINIMALISTA)           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200/70 space-y-5" id="minimal-hours-budget-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-800" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Desglose de Horas Presupuestadas vs. Ejecutadas
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Monitoreo minimalista de consumo real por especialidad y balance restante.
            </p>
          </div>

          {/* Resumen en pastillas minimalistas */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
            <span className="bg-[#F4F5F0] text-slate-800 px-3 py-1 rounded-full border border-stone-200/80">
              Total: <strong>{totalHours}h</strong>
            </span>
            <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200/70">
              Consumidas: <strong>{totalConsumedHours}h</strong> ({consumedPercent}%)
            </span>
            <span className="bg-stone-100 text-slate-700 px-3 py-1 rounded-full">
              Disponibles: <strong>{availableHours}h</strong>
            </span>
          </div>
        </div>

        {/* Barra de progreso lineal minimalista */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
            <span>Avance general de consumo</span>
            <span className="font-mono">{totalConsumedHours}h de {totalHours}h ({consumedPercent}%)</span>
          </div>
          <div className="w-full h-2 bg-[#F4F5F0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                consumedPercent > 90 ? 'bg-rose-500' : consumedPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${consumedPercent}%` }}
            />
          </div>
        </div>

        {/* Tabla minimalista por rol */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-stone-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2.5">Especialidad / Rol</th>
                <th className="pb-2.5 text-center">Presupuestadas</th>
                <th className="pb-2.5 text-center">Ejecutadas (Reales)</th>
                <th className="pb-2.5 text-center">% Utilización</th>
                <th className="pb-2.5 text-right">Saldo Restante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
              {[
                { key: 'coordinador', label: 'Coordinador PM', allocated: roleHours.coordinador || 0, consumed: consumedByRole.coordinador },
                { key: 'sac', label: 'SAC / Consultor', allocated: roleHours.sac || 0, consumed: consumedByRole.sac },
                { key: 'contentd', label: 'Diseñador (ContentD)', allocated: roleHours.contentd || 0, consumed: consumedByRole.contentd },
                { key: 'contents', label: 'Social Media (ContentS)', allocated: roleHours.contents || 0, consumed: consumedByRole.contents },
                { key: 'supervisor', label: 'Supervisor General', allocated: roleHours.supervisor || 0, consumed: consumedByRole.supervisor },
                { key: 'proveedor', label: 'Proveedor Externo', allocated: roleHours.proveedor || 0, consumed: consumedByRole.proveedor }
              ].map((row) => {
                const ratio = row.allocated > 0 ? Math.min(100, Math.round((row.consumed / row.allocated) * 100)) : 0;
                const saldo = row.allocated - row.consumed;
                const isOver = saldo < 0;

                return (
                  <tr key={row.key} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900">{row.label}</td>
                    <td className="py-2.5 text-center">
                      {isCoordinador ? (
                        <input
                          type="number"
                          min="0"
                          value={row.allocated}
                          onChange={(e) => handleRoleHourChange(row.key, Number(e.target.value) || 0)}
                          className="w-16 bg-white border border-stone-200 rounded-lg px-2 py-0.5 text-center font-mono font-bold text-xs outline-none focus:border-slate-800"
                        />
                      ) : (
                        <span className="font-mono">{row.allocated}h</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center font-mono">{row.consumed}h</td>
                    <td className="py-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-[#F4F5F0] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isOver ? 'bg-rose-500' : ratio > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">{ratio}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${isOver ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {saldo > 0 ? `+${saldo}h` : `${saldo}h`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. REGISTRO CRONOLÓGICO DE ACUERDOS CON CLIENTE (DECISION LOG)             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200/70 space-y-5" id="decision-log-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-800" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Registro de Acuerdos con Cliente (Decision Log)
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bitácora formal de cambios de alcance, aprobaciones y resoluciones acordadas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddDecisionForm(!showAddDecisionForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Acuerdo</span>
          </button>
        </div>

        {/* Filtros por Categoría (Alcance, Presupuesto, Diseño, Técnico) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filtrar:
          </span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'alcance', label: 'Alcance' },
            { id: 'presupuesto', label: 'Presupuesto' },
            { id: 'diseño', label: 'Diseño' },
            { id: 'aprobacion', label: 'Aprobación' },
            { id: 'tecnico', label: 'Técnico' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setDecisionCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                decisionCategoryFilter === cat.id
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-[#F4F5F0] text-slate-600 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Formulario para registrar acuerdo */}
        {showAddDecisionForm && (
          <form onSubmit={handleAddDecisionSubmit} className="p-5 bg-[#F4F5F0] rounded-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Nuevo Acuerdo con el Cliente
              </span>
              <button
                type="button"
                onClick={() => setShowAddDecisionForm(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Título del Acuerdo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aprobación de 2 variantes extra para campaña"
                  value={decTitle}
                  onChange={(e) => setDecTitle(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                <select
                  value={decCategory}
                  onChange={(e: any) => setDecCategory(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none cursor-pointer"
                >
                  <option value="Alcance">Alcance</option>
                  <option value="Presupuesto">Presupuesto</option>
                  <option value="Diseño">Diseño</option>
                  <option value="Aprobación">Aprobación</option>
                  <option value="Técnico">Técnico</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Aprobado / Validado por</label>
                <input
                  type="text"
                  placeholder="Ej: Ricardo Toro (Director de Marca)"
                  value={decApprovedBy}
                  onChange={(e) => setDecApprovedBy(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Detalle / Justificación</label>
                <input
                  type="text"
                  placeholder="Ej: Acordado en sesión de revisión vía Meet del 30/09"
                  value={decRationale}
                  onChange={(e) => setDecRationale(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddDecisionForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-stone-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Guardar en Bitácora
              </button>
            </div>
          </form>
        )}

        {/* Lista cronológica de acuerdos */}
        <div className="space-y-3">
          {filteredDecisions.length === 0 ? (
            <div className="p-8 bg-[#F4F5F0] rounded-2xl text-center text-xs text-slate-400 font-medium">
              No hay acuerdos registrados en esta categoría.
            </div>
          ) : (
            filteredDecisions.map((dec) => {
              const catLower = (dec.category || '').toLowerCase();
              const badgeStyle =
                catLower.includes('alcan') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                catLower.includes('presup') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                catLower.includes('diseñ') ? 'bg-sky-50 text-sky-700 border-sky-200' :
                catLower.includes('aprob') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-stone-100 text-slate-700 border-stone-200';

              const dateFormatted = dec.timestamp
                ? new Date(dec.timestamp).toLocaleDateString('es-CL')
                : dec.date || 'Reciente';

              const timeFormatted = dec.timestamp
                ? new Date(dec.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={dec.id}
                  className="p-4 bg-[#F4F5F0] rounded-2xl border border-stone-200/80 hover:bg-stone-50 transition-all space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                        {dec.category || 'Acuerdo'}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900">{dec.title}</h4>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {dateFormatted} {timeFormatted && `• ${timeFormatted}`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {dec.description || dec.rationale}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-stone-200/60 font-medium">
                    <span>Aprobado por: <strong className="text-slate-800">{dec.approvedBy || 'Cliente'}</strong></span>
                    <span>Registrado por: {dec.author}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modales de Confirmación de OV */}
      <CustomModal
        isOpen={!!ovToDelete}
        onClose={() => setOvToDelete(null)}
        type="danger"
        isDestructive={true}
        title="¿Eliminar Orden de Venta?"
        description="Esta acción eliminará la Orden de Venta seleccionada del proyecto. No se puede deshacer."
        confirmLabel="Eliminar OV"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteOV}
      />

      <CustomModal
        isOpen={ovRestrictionModal}
        onClose={() => setOvRestrictionModal(false)}
        type="info"
        title="Acción Restringida"
        description="El proyecto debe mantener al menos una Orden de Venta activa en todo momento para asegurar la trazabilidad comercial."
        confirmLabel="Entendido"
      />
    </div>
  );
};
