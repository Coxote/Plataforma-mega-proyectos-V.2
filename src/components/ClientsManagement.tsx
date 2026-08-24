import React, { useState, useMemo } from 'react';
import { Client, Project, OrdenVenta } from '../types';
import {
  Building2,
  Sparkles,
  Plus,
  Search,
  Phone,
  Mail,
  Globe,
  Copy,
  Check,
  BookOpen,
  User,
  TrendingUp,
  Sliders,
  Palette,
  Edit3,
  Calendar,
  Clock,
  Briefcase,
  Receipt,
  DollarSign,
  Layers,
  FileText,
  BadgeCheck,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';
import { NewClientWizard } from './NewClientWizard';

interface ClientsManagementProps {
  clients: Client[];
  projects?: Project[];
  onAddClient: (client: Client) => void;
  onUpdateClientStatus?: (clientId: string, nuevoEstado: 'activo' | 'inactivo' | 'pausado') => void;
}

export const ClientsManagement: React.FC<ClientsManagementProps> = ({
  clients,
  projects = [],
  onAddClient,
  onUpdateClientStatus
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'activos' | 'todos' | 'pausados' | 'inactivos'>('activos');
  const [profileTab, setProfileTab] = useState<'proyectos' | 'brand_bible'>('proyectos');

  // Dynamic selected client lookup to reflect instant updates from saving edits
  const currentSelectedClient = clients.find(c => c.id === selectedClient?.id) || selectedClient;

  // Counts for tabs
  const activeCount = clients.filter(c => (c.estado || 'activo') === 'activo').length;
  const pausedCount = clients.filter(c => c.estado === 'pausado').length;
  const inactiveCount = clients.filter(c => c.estado === 'inactivo').length;
  const totalCount = clients.length;

  // Filter clients based on status filter and search query
  const filteredClients = clients.filter(c => {
    const currentStatus = c.estado || 'activo';
    if (statusFilter === 'activos' && currentStatus !== 'activo') return false;
    if (statusFilter === 'pausados' && currentStatus !== 'pausado') return false;
    if (statusFilter === 'inactivos' && currentStatus !== 'inactivo') return false;

    const query = searchQuery.toLowerCase();
    return (
      c.nombreComercial.toLowerCase().includes(query) ||
      c.categoria.toLowerCase().includes(query) ||
      c.contactoPrincipal.toLowerCase().includes(query)
    );
  });

  // Calculate projects linked to current selected client
  const clientProjects = useMemo(() => {
    if (!currentSelectedClient || !projects) return [];
    const clientNameClean = currentSelectedClient.nombreComercial.trim().toLowerCase();
    return projects.filter(p => {
      if (!p.clientName) return false;
      const pClientClean = p.clientName.trim().toLowerCase();
      return (
        pClientClean === clientNameClean ||
        pClientClean.includes(clientNameClean) ||
        clientNameClean.includes(pClientClean)
      );
    });
  }, [currentSelectedClient, projects]);

  // Helper to extract or fallback OVs for a project
  const getProjectOVs = (p: Project): OrdenVenta[] => {
    if (p.ordenesVenta && p.ordenesVenta.length > 0) {
      return p.ordenesVenta;
    }
    if (p.ovNumber || p.saleOrderNumber || p.totalIncome) {
      return [{
        id: `ov-${p.id}-1`,
        numero: String(p.saleOrderNumber || p.ovNumber || `OV-${p.id.toUpperCase()}-101`),
        monto: p.totalIncome || (p.hoursTotal ? p.hoursTotal * 40 : 0),
        moneda: p.currency || 'USD',
        horasAsociadas: p.hoursTotal || p.hoursSold || 0,
        fechaEmision: p.createdAt ? p.createdAt.split('T')[0] : '2026-07-15',
        estado: 'facturada'
      }];
    }
    return [];
  };

  // KPIs for selected client
  const totalOvsCount = useMemo(() => {
    return clientProjects.reduce((acc, p) => acc + getProjectOVs(p).length, 0);
  }, [clientProjects]);

  const totalRevenue = useMemo(() => {
    return clientProjects.reduce((acc, p) => {
      const ovs = getProjectOVs(p);
      if (ovs.length > 0) {
        return acc + ovs.reduce((sum, ov) => sum + (ov.monto || 0), 0);
      }
      return acc + (p.totalIncome || 0);
    }, 0);
  }, [clientProjects]);

  const totalContractedHours = useMemo(() => {
    return clientProjects.reduce((acc, p) => acc + (p.hoursTotal || 0), 0);
  }, [clientProjects]);

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const getClientStatusBadge = (estado?: 'activo' | 'inactivo' | 'pausado') => {
    const status = estado || 'activo';
    if (status === 'activo') {
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Activo' };
    }
    if (status === 'pausado') {
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Pausado' };
    }
    return { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', label: 'Inactivo' };
  };

  const getOvStatusBadge = (estado: string) => {
    switch (estado) {
      case 'facturada':
      case 'activa':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Facturada' };
      case 'enviada':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Enviada' };
      case 'creada':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Creada' };
      case 'bloqueada':
        return { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Bloqueada' };
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: estado };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden" id="clients-management-view">
      {/* HEADER SUPERIOR */}
      <div className="px-8 py-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            Directorio de Clientes
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clientes & Historial de Marcas</h1>
          <p className="text-xs text-slate-500 font-medium">Gestiona cuentas, historial de proyectos con Ã“rdenes de Venta (OVs) y Brand Bibles.</p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsWizardOpen(true);
          }}
          className="px-4 py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL EN DOS COLUMNAS */}
      <div className="flex-1 flex overflow-hidden">

        {/* COLUMNA IZQUIERDA: LISTA DE CLIENTES */}
        <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">

          {/* SEARCH & FILTERS */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente o categorÃ­a..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
              />
            </div>

            {/* STATUS TABS */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setStatusFilter('activos')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  statusFilter === 'activos'
                    ? 'bg-white text-cyan-700 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Activos ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('pausados')}
                className={`py-1 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  statusFilter === 'pausados'
                    ? 'bg-white text-amber-700 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pausados ({pausedCount})
              </button>
              <button
                onClick={() => setStatusFilter('todos')}
                className={`py-1 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  statusFilter === 'todos'
                    ? 'bg-white text-cyan-700 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos ({totalCount})
              </button>
            </div>
          </div>

          {/* LISTA DE CLIENTES */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-1">
                <p>No se encontraron clientes en este filtro.</p>
                {statusFilter !== 'todos' && (
                  <button
                    onClick={() => setStatusFilter('todos')}
                    className="text-cyan-600 font-bold hover:underline cursor-pointer"
                  >
                    Ver todos los clientes ({totalCount})
                  </button>
                )}
              </div>
            ) : (
              filteredClients.map(client => {
                const isSelected = selectedClient?.id === client.id;
                const badge = getClientStatusBadge(client.estado);
                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                    }}
                    className={`p-4 transition-all cursor-pointer flex items-start gap-3.5 border-l-4 ${
                      isSelected
                        ? 'bg-cyan-50/40 border-cyan-500'
                        : 'border-transparent hover:bg-slate-50/60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isSelected ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {client.nombreComercial.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{client.nombreComercial}</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 uppercase tracking-wider flex items-center gap-1 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium truncate">
                        <span>Contacto: {client.contactoPrincipal}</span>
                        <span className="text-slate-400 font-mono text-xs">{client.categoria}</span>
                      </div>

                      {client.brandBible && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-xs text-cyan-600 font-bold bg-cyan-100/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Brand Bible IA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: PERFIL DEL CLIENTE & HISTORIAL DE PROYECTOS / OVS */}
        <div className="hidden md:flex flex-1 flex-col h-full bg-slate-50/50 overflow-y-auto p-8">
          {currentSelectedClient ? (
            <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">

              {/* HEADER DE CLIENTE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs bg-cyan-100 text-cyan-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {currentSelectedClient.categoria}
                      </span>

                      {/* Status Badge */}
                      {(() => {
                        const badge = getClientStatusBadge(currentSelectedClient.estado);
                        return (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider flex items-center gap-1 ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        );
                      })()}

                      {/* Quick Status Selector */}
                      {onUpdateClientStatus && (
                        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold ml-auto">
                          <button
                            type="button"
                            title="Cambiar estado a Activo"
                            onClick={() => onUpdateClientStatus(currentSelectedClient.id, 'activo')}
                            className={`px-2 py-0.5 rounded transition cursor-pointer ${
                              (currentSelectedClient.estado || 'activo') === 'activo'
                                ? 'bg-emerald-600 text-white shadow-xs font-black'
                                : 'text-slate-500 hover:text-emerald-700'
                            }`}
                          >
                            Activo
                          </button>
                          <button
                            type="button"
                            title="Cambiar estado a Pausado"
                            onClick={() => onUpdateClientStatus(currentSelectedClient.id, 'pausado')}
                            className={`px-2 py-0.5 rounded transition cursor-pointer ${
                              currentSelectedClient.estado === 'pausado'
                                ? 'bg-amber-500 text-white shadow-xs font-black'
                                : 'text-slate-500 hover:text-amber-700'
                            }`}
                          >
                            Pausado
                          </button>
                          <button
                            type="button"
                            title="Cambiar estado a Inactivo"
                            onClick={() => onUpdateClientStatus(currentSelectedClient.id, 'inactivo')}
                            className={`px-2 py-0.5 rounded transition cursor-pointer ${
                              currentSelectedClient.estado === 'inactivo'
                                ? 'bg-slate-700 text-white shadow-xs font-black'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Inactivo
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setEditingClient(currentSelectedClient);
                          setIsWizardOpen(true);
                        }}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" /> Editar Datos
                      </button>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentSelectedClient.nombreComercial}</h2>

                    {/* CONTACT INFO GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{currentSelectedClient.contactoPrincipal}</span>
                      </div>
                      {currentSelectedClient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{currentSelectedClient.email}</span>
                        </div>
                      )}
                      {currentSelectedClient.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{currentSelectedClient.telefono}</span>
                        </div>
                      )}
                      {currentSelectedClient.sitioWebRedes && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{currentSelectedClient.sitioWebRedes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-14 h-14 bg-cyan-600/10 text-cyan-700 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0">
                    {currentSelectedClient.nombreComercial.charAt(0)}
                  </div>
                </div>

                {/* DATES METADATA BAR */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha de Alta: <strong className="text-slate-800">{currentSelectedClient.fechaAlta ? currentSelectedClient.fechaAlta.split('T')[0] : 'Julio 2026'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ãšltima Actividad: <strong className="text-slate-800">{currentSelectedClient.fechaUltimaActividad ? currentSelectedClient.fechaUltimaActividad.split('T')[0] : 'Reciente'}</strong></span>
                  </div>
                </div>
              </div>

              {/* TABS NAVEGACIÃ“N PERFIL DE CLIENTE */}
              <div className="flex gap-2 border-b border-slate-200 pb-0">
                <button
                  onClick={() => setProfileTab('proyectos')}
                  className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    profileTab === 'proyectos'
                      ? 'border-cyan-600 text-cyan-700 bg-white/80 rounded-t-xl shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Historial de Proyectos & OVs
                  <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-black">
                    {clientProjects.length}
                  </span>
                </button>

                <button
                  onClick={() => setProfileTab('brand_bible')}
                  className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    profileTab === 'brand_bible'
                      ? 'border-cyan-600 text-cyan-700 bg-white/80 rounded-t-xl shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Brand Bible IA
                  {currentSelectedClient.brandBible && (
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  )}
                </button>
              </div>

              {/* CONTENIDO TAB 1: HISTORIAL DE PROYECTOS Y OVS */}
              {profileTab === 'proyectos' && (
                <div className="space-y-6">

                  {/* METRICAS DE LA CUENTA */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-cyan-600" /> Proyectos Totales
                      </div>
                      <div className="text-xl font-black text-slate-900">{clientProjects.length}</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" /> OVs Registradas
                      </div>
                      <div className="text-xl font-black text-emerald-700">{totalOvsCount}</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-cyan-600" /> Monto Acumulado
                      </div>
                      <div className="text-xl font-black text-slate-900">${totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Horas Contratadas
                      </div>
                      <div className="text-xl font-black text-slate-900">{totalContractedHours} hrs</div>
                    </div>
                  </div>

                  {/* LISTA DE PROYECTOS ASOCIADOS */}
                  {clientProjects.length === 0 ? (
                    <div className="bg-white p-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl space-y-3">
                      <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                      <div>
                        <h3 className="font-bold text-slate-700">Sin proyectos asociados</h3>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                          No existen proyectos creados bajo la cuenta <strong className="text-slate-600">{currentSelectedClient.nombreComercial}</strong> aÃºn.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clientProjects.map((project) => {
                        const ovs = getProjectOVs(project);
                        const consumedHours = project.timeEntries ? project.timeEntries.reduce((sum, te) => sum + (te.hours || 0), 0) : 0;
                        const activePhaseLabel = project.phases?.find(p => p.id === project.activePhaseId)?.label || project.activePhaseId;

                        return (
                          <div key={project.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all hover:border-slate-300">

                            {/* CABECERA DEL PROYECTO */}
                            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                                    ID: {project.id}
                                  </span>
                                  <span className="text-xs font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {project.templateType || 'Proyecto'}
                                  </span>
                                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Salud: {project.health}%
                                  </span>
                                </div>
                                <h3 className="font-black text-slate-900 text-base">{project.name}</h3>
                                <p className="text-xs text-slate-500 font-medium line-clamp-2">{project.description}</p>
                              </div>

                              <div className="text-right shrink-0 space-y-1">
                                <div className="text-xs font-bold text-slate-700">
                                  Fase Actual: <span className="text-cyan-700 font-black">{activePhaseLabel}</span>
                                </div>
                                <div className="text-xs text-slate-400 font-medium">
                                  Horas: <strong className="text-slate-800">{consumedHours}h</strong> / {project.hoursTotal}h
                                </div>
                              </div>
                            </div>

                            {/* DETALLE DE Ã“RDENES DE VENTA (OVs) */}
                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                                <span className="flex items-center gap-1.5 text-cyan-800 uppercase tracking-wider text-xs">
                                  <Receipt className="w-4 h-4 text-cyan-600" />
                                  Ã“rdenes de Venta (OVs) de la Cuenta
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                  {ovs.length} {ovs.length === 1 ? 'Orden' : 'Ã“rdenes'} de Venta
                                </span>
                              </div>

                              {ovs.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No se han registrado Ã“rdenes de Venta especÃ­ficas para este proyecto.</p>
                              ) : (
                                <div className="space-y-2">
                                  {ovs.length > 1 && (
                                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700 gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">Monto Total del Proyecto ({ovs.length} OVs):</span>
                                        <span className="text-emerald-700 font-black font-mono text-sm">
                                          ${ovs.reduce((s, o) => s + (o.monto || 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {ovs[0]?.moneda || 'USD'}
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-600 font-medium">
                                        Horas Contratadas Sumadas: <strong className="text-slate-900 font-bold">{ovs.reduce((s, o) => s + (o.horasAsociadas || 0), 0)} hrs</strong>
                                      </div>
                                    </div>
                                  )}

                                  <div className="divide-y divide-slate-100">
                                    {ovs.map((ov, index) => {
                                      const badge = getOvStatusBadge(ov.estado);
                                      return (
                                        <div key={ov.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                          <div className="flex items-center gap-3">
                                            {/* ID / NÃšMERO DE OV PROMINENTE */}
                                            <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-3 py-1 rounded-xl font-mono font-black text-xs shadow-2xs flex items-center gap-1.5 shrink-0">
                                              <Receipt className="w-3.5 h-3.5 text-cyan-600" />
                                              {ov.numero}
                                              {ovs.length > 1 && index > 0 && (
                                                <span className="ml-1 bg-cyan-200 text-cyan-900 text-xs font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                                                  Adenda
                                                </span>
                                              )}
                                            </div>

                                            <div className="space-y-0.5">
                                              <div className="font-bold text-slate-800 text-xs">
                                                Monto: <span className="text-emerald-700 font-black">${(ov.monto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {ov.moneda || 'USD'}</span>
                                              </div>
                                              <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                                                <span>EmisiÃ³n: {ov.fechaEmision ? ov.fechaEmision.split('T')[0] : 'N/A'}</span>
                                                <span>â€¢</span>
                                                <span>Horas: {ov.horasAsociadas} hrs</span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 self-start sm:self-center">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badge.bg}`}>
                                              {badge.label}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* CONTENIDO TAB 2: BRAND BIBLE CONTAINER */}
              {profileTab === 'brand_bible' && (
                <div>
                  {currentSelectedClient.brandBible ? (
                    <div className="space-y-6">

                      {/* TITLE OF BRAND BIBLE SECTION */}
                      <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                        <BookOpen className="w-5 h-5 text-cyan-600" />
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-wider">Brand Bible Generada por Inteligencia Artificial</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Arquetipo */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <TrendingUp className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Arquetipo de Marca</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{currentSelectedClient.brandBible.archetype || 'No especificado'}</p>
                        </div>

                        {/* Tono y Voz */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <Sliders className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Tono de Voz</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">{currentSelectedClient.brandBible.tonoVoz || 'No especificado'}</p>
                        </div>

                        {/* MisiÃ³n y VisiÃ³n */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-2 sm:col-span-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <Building2 className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">MisiÃ³n & VisiÃ³n</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">{currentSelectedClient.brandBible.misionVision || 'No especificado'}</p>
                        </div>

                        {/* Mensajes Clave */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-2 sm:col-span-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <Sparkles className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Mensajes Clave</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{currentSelectedClient.brandBible.mensajesClave || 'No especificado'}</p>
                        </div>

                        {/* Paleta de Colores */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-3 sm:col-span-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <Palette className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Paleta de Colores ExtraÃ­da</span>
                          </div>
                          <div className="flex flex-wrap gap-4">
                            {currentSelectedClient.brandBible.coloresHex && currentSelectedClient.brandBible.coloresHex.length > 0 ? (
                              currentSelectedClient.brandBible.coloresHex.map((color) => (
                                <div
                                  key={color}
                                  onClick={() => handleCopyColor(color)}
                                  className="group flex flex-col items-center gap-1 bg-slate-50 border border-slate-200/50 hover:bg-slate-100 p-2.5 rounded-2xl transition-all cursor-pointer min-w-[70px]"
                                >
                                  <span
                                    className="w-10 h-10 rounded-full block shadow-inner border border-slate-200"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-0.5">
                                    {copiedColor === color ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                                    )}
                                    {color}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No se extrajeron colores.</p>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="bg-white p-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
                      <Sparkles className="w-8 h-8 text-slate-300" />
                      <div>
                        <h3 className="font-bold text-slate-700">Sin Brand Bible generada</h3>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-sm">Este cliente posee datos de contacto bÃ¡sicos pero aÃºn no se ha ejecutado el extractor de manual de marca con Inteligencia Artificial.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-4">
              <Building2 className="w-12 h-12 text-slate-300" />
              <div>
                <h3 className="font-bold text-slate-700 text-sm">Selecciona un cliente</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Elige un cliente de la lista de la izquierda para revisar el historial de proyectos, Ã“rdenes de Venta (OVs) y Brand Bible.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* NEW CLIENT WIZARD */}
      <NewClientWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSaveClient={onAddClient}
        initialData={editingClient}
      />
    </div>
  );
};
