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
    <div className="flex-1 flex flex-col h-full bg-[#F4F5F0] overflow-hidden" id="clients-management-view">
      {/* HEADER SUPERIOR */}
      <div className="px-8 py-6 bg-white border-b border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-800" />
            Directorio de Clientes
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Clientes & Historial de Marcas</h1>
          <p className="text-xs text-slate-500 font-normal">Gestiona cuentas, historial de proyectos con Órdenes de Venta (OVs) y Brand Bibles.</p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsWizardOpen(true);
          }}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL EN DOS COLUMNAS */}
      <div className="flex-1 flex overflow-hidden">

        {/* COLUMNA IZQUIERDA: LISTA DE CLIENTES */}
        <div className="w-full md:w-80 lg:w-96 bg-white border-r border-stone-200/60 flex flex-col shrink-0">

          {/* SEARCH & FILTERS */}
          <div className="p-4 border-b border-stone-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#F4F5F0] hover:bg-stone-100 focus:bg-white border-0 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>

            {/* STATUS TABS */}
            <div className="flex gap-1 bg-[#F4F5F0] p-1 rounded-full text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('activos')}
                className={`flex-1 py-1.5 px-3 rounded-full transition-all cursor-pointer text-center ${
                  statusFilter === 'activos'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 font-normal'
                }`}
              >
                Activos ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('pausados')}
                className={`py-1.5 px-3 rounded-full transition-all cursor-pointer text-center ${
                  statusFilter === 'pausados'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 font-normal'
                }`}
              >
                Pausados ({pausedCount})
              </button>
              <button
                onClick={() => setStatusFilter('todos')}
                className={`py-1.5 px-3 rounded-full transition-all cursor-pointer text-center ${
                  statusFilter === 'todos'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 font-normal'
                }`}
              >
                Todos ({totalCount})
              </button>
            </div>
          </div>

          {/* LISTA DE CLIENTES */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-cyan-50/70 text-slate-900 shadow-2xs font-medium'
                        : 'hover:bg-stone-50/90 text-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      isSelected ? 'bg-cyan-600 text-white' : 'bg-[#F4F5F0] text-slate-700'
                    }`}>
                      {client.nombreComercial.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{client.nombreComercial}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider flex items-center gap-1 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium truncate">
                        <span>{client.contactoPrincipal}</span>
                        <span className="text-slate-400 font-mono text-xs">{client.categoria}</span>
                      </div>

                      {client.brandBible && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-xs text-cyan-700 font-bold bg-cyan-100/60 px-2 py-0.5 rounded-full flex items-center gap-1">
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
        <div className="hidden md:flex flex-1 flex-col h-full bg-[#F4F5F0] overflow-y-auto p-6 sm:p-8">
          {currentSelectedClient ? (
            <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">

              {/* HEADER DE CLIENTE */}
              <div className="bg-white p-7 rounded-3xl shadow-xs space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs bg-cyan-50 text-cyan-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {currentSelectedClient.categoria}
                      </span>

                      {/* Status Badge */}
                      {(() => {
                        const badge = getClientStatusBadge(currentSelectedClient.estado);
                        return (
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        );
                      })()}

                      {/* Quick Status Selector */}
                      {onUpdateClientStatus && (
                        <div className="flex gap-1 bg-[#F4F5F0] p-1 rounded-full text-xs font-semibold ml-auto">
                          <button
                            type="button"
                            title="Cambiar estado a Activo"
                            onClick={() => onUpdateClientStatus(currentSelectedClient.id, 'activo')}
                            className={`px-3 py-1 rounded-full transition cursor-pointer ${
                              (currentSelectedClient.estado || 'activo') === 'activo'
                                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Activo
                          </button>
                          <button
                            type="button"
                            title="Cambiar estado a Pausado"
                            onClick={() => onUpdateClientStatus(currentSelectedClient.id, 'pausado')}
                            className={`px-3 py-1 rounded-full transition cursor-pointer ${
                              currentSelectedClient.estado === 'pausado'
                                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Pausado
                          </button>
                          <button
                            type="button"
                            title="Cambiar estado a Inactivo"
                            onClick={() => onUpdateClientStatus(currentSelectedClient.id, 'inactivo')}
                            className={`px-3 py-1 rounded-full transition cursor-pointer ${
                              currentSelectedClient.estado === 'inactivo'
                                ? 'bg-slate-900 text-white shadow-xs font-semibold'
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
                        className="flex items-center gap-1.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" /> Editar Datos
                      </button>
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{currentSelectedClient.nombreComercial}</h2>

                    {/* CONTACT INFO GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium text-slate-600">
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

                  <div className="w-16 h-16 bg-stone-100 text-slate-800 rounded-3xl flex items-center justify-center font-semibold font-display text-2xl shrink-0 shadow-2xs">
                    {currentSelectedClient.nombreComercial.charAt(0)}
                  </div>
                </div>

                {/* DATES METADATA BAR */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha de Alta: <strong className="text-slate-800 font-semibold">{currentSelectedClient.fechaAlta ? currentSelectedClient.fechaAlta.split('T')[0] : 'Julio 2026'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Última Actividad: <strong className="text-slate-800 font-semibold">{currentSelectedClient.fechaUltimaActividad ? currentSelectedClient.fechaUltimaActividad.split('T')[0] : 'Reciente'}</strong></span>
                  </div>
                </div>
              </div>

              {/* TABS NAVEGACIÓN PERFIL DE CLIENTE */}
              <div className="flex gap-2">
                <button
                  onClick={() => setProfileTab('proyectos')}
                  className={`px-5 py-2.5 font-semibold text-xs flex items-center gap-2 rounded-full transition-all cursor-pointer ${
                    profileTab === 'proyectos'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Historial de Proyectos & OVs
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-display ${
                    profileTab === 'proyectos' ? 'bg-white/20 text-white' : 'bg-[#F4F5F0] text-slate-800'
                  }`}>
                    {clientProjects.length}
                  </span>
                </button>

                <button
                  onClick={() => setProfileTab('brand_bible')}
                  className={`px-5 py-2.5 font-semibold text-xs flex items-center gap-2 rounded-full transition-all cursor-pointer ${
                    profileTab === 'brand_bible'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Brand Bible IA
                  {currentSelectedClient.brandBible && (
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  )}
                </button>
              </div>

              {/* CONTENIDO TAB 1: HISTORIAL DE PROYECTOS Y OVS */}
              {profileTab === 'proyectos' && (
                <div className="space-y-6">

                  {/* METRICAS DE LA CUENTA (KPIs DISPLAY) */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl shadow-xs">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-slate-800" /> Proyectos Totales
                      </div>
                      <div className="text-3xl font-semibold text-slate-900 font-display">{clientProjects.length}</div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl shadow-xs">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-slate-800" /> OVs Registradas
                      </div>
                      <div className="text-3xl font-semibold text-slate-900 font-display">{totalOvsCount}</div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl shadow-xs">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-800" /> Monto Acumulado
                      </div>
                      <div className="text-3xl font-semibold text-slate-900 font-display">${totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl shadow-xs">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-800" /> Horas Contratadas
                      </div>
                      <div className="text-3xl font-semibold text-slate-900 font-display">{totalContractedHours} hrs</div>
                    </div>
                  </div>

                  {/* LISTA DE PROYECTOS ASOCIADOS */}
                  {clientProjects.length === 0 ? (
                    <div className="bg-white p-12 text-center text-slate-400 text-xs font-medium rounded-3xl shadow-xs space-y-3">
                      <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                      <div>
                        <h3 className="font-bold text-slate-700">Sin proyectos asociados</h3>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                          No existen proyectos creados bajo la cuenta <strong className="text-slate-600">{currentSelectedClient.nombreComercial}</strong> aún.
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
                          <div key={project.id} className="bg-white rounded-3xl shadow-xs overflow-hidden transition-all">

                            {/* CABECERA DEL PROYECTO */}
                            <div className="p-6 bg-[#F4F5F0]/50 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full shadow-2xs">
                                    ID: {project.id}
                                  </span>
                                  <span className="text-xs font-bold bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    {project.templateType || 'Proyecto'}
                                  </span>
                                  <span className="text-xs font-semibold bg-stone-100 text-slate-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-slate-800" />
                                    Salud: {project.health}%
                                  </span>
                                </div>
                                <h3 className="font-semibold text-slate-900 text-base">{project.name}</h3>
                                <p className="text-xs text-slate-500 font-normal line-clamp-2">{project.description}</p>
                              </div>

                              <div className="text-right shrink-0 space-y-1">
                                <div className="text-xs font-medium text-slate-700">
                                  Fase Actual: <span className="text-slate-900 font-semibold">{activePhaseLabel}</span>
                                </div>
                                <div className="text-xs text-slate-400 font-normal">
                                  Horas: <strong className="text-slate-800 font-semibold">{consumedHours}h</strong> / {project.hoursTotal}h
                                </div>
                              </div>
                            </div>

                            {/* DETALLE DE ÓRDENES DE VENTA (OVs) */}
                            <div className="p-6 space-y-3">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 border-b border-stone-100 pb-2">
                                <span className="flex items-center gap-1.5 text-slate-800 uppercase tracking-wider text-xs font-semibold">
                                  <Receipt className="w-4 h-4 text-slate-800" />
                                  Órdenes de Venta (OVs) de la Cuenta
                                </span>
                                <span className="text-xs text-slate-400 font-normal">
                                  {ovs.length} {ovs.length === 1 ? 'Orden' : 'Órdenes'} de Venta
                                </span>
                              </div>

                              {ovs.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No se han registrado Órdenes de Venta específicas para este proyecto.</p>
                              ) : (
                                <div className="space-y-2">
                                  {ovs.length > 1 && (
                                    <div className="bg-stone-50 rounded-2xl p-3.5 flex flex-wrap items-center justify-between text-xs font-medium text-slate-700 gap-2 border border-stone-200/60">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900">Monto Total del Proyecto ({ovs.length} OVs):</span>
                                        <span className="text-slate-900 font-semibold font-display text-sm">
                                          ${ovs.reduce((s, o) => s + (o.monto || 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {ovs[0]?.moneda || 'USD'}
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-600 font-normal">
                                        Horas Contratadas Sumadas: <strong className="text-slate-900 font-semibold">{ovs.reduce((s, o) => s + (o.horasAsociadas || 0), 0)} hrs</strong>
                                      </div>
                                    </div>
                                  )}

                                  <div className="divide-y divide-stone-100">
                                    {ovs.map((ov, index) => {
                                      const badge = getOvStatusBadge(ov.estado);
                                      return (
                                        <div key={ov.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                          <div className="flex items-center gap-3">
                                            {/* ID / NÚMERO DE OV PROMINENTE */}
                                            <div className="bg-stone-100 text-slate-800 px-3.5 py-1.5 rounded-full font-mono font-semibold text-xs shadow-2xs flex items-center gap-1.5 shrink-0">
                                              <Receipt className="w-3.5 h-3.5 text-slate-800" />
                                              {ov.numero}
                                              {ovs.length > 1 && index > 0 && (
                                                <span className="ml-1 bg-stone-200 text-slate-800 text-xs font-semibold px-2 py-0.5 rounded-full uppercase">
                                                  Adenda
                                                </span>
                                              )}
                                            </div>

                                            <div className="space-y-0.5">
                                              <div className="font-medium text-slate-800 text-xs">
                                                Monto: <span className="text-slate-900 font-semibold font-display">${(ov.monto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {ov.moneda || 'USD'}</span>
                                              </div>
                                              <div className="text-xs text-slate-400 font-normal flex items-center gap-2">
                                                <span>Emisión: {ov.fechaEmision ? ov.fechaEmision.split('T')[0] : 'N/A'}</span>
                                                <span>•</span>
                                                <span>Horas: {ov.horasAsociadas} hrs</span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 self-start sm:self-center">
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${badge.bg}`}>
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
                      <div className="flex items-center gap-2.5 pb-2">
                        <BookOpen className="w-5 h-5 text-slate-800" />
                        <h3 className="font-semibold text-slate-900 uppercase text-xs tracking-wider">Brand Bible Generada por Inteligencia Artificial</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Arquetipo */}
                        <div className="bg-white p-6 rounded-3xl shadow-xs space-y-2">
                          <div className="flex items-center gap-2 text-slate-800">
                            <TrendingUp className="w-4.5 h-4.5 text-slate-800" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Arquetipo de Marca</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{currentSelectedClient.brandBible.archetype || 'No especificado'}</p>
                        </div>

                        {/* Tono y Voz */}
                        <div className="bg-white p-6 rounded-3xl shadow-xs space-y-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <Sliders className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Tono de Voz</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">{currentSelectedClient.brandBible.tonoVoz || 'No especificado'}</p>
                        </div>

                        {/* Misión y Visión */}
                        <div className="bg-white p-6 rounded-3xl shadow-xs space-y-2 sm:col-span-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <Building2 className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Misión & Visión</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">{currentSelectedClient.brandBible.misionVision || 'No especificado'}</p>
                        </div>

                        {/* Mensajes Clave */}
                        <div className="bg-white p-6 rounded-3xl shadow-xs space-y-2 sm:col-span-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <Sparkles className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Mensajes Clave</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 leading-relaxed bg-[#F4F5F0] p-4 rounded-2xl">{currentSelectedClient.brandBible.mensajesClave || 'No especificado'}</p>
                        </div>

                        {/* Paleta de Colores */}
                        <div className="bg-white p-6 rounded-3xl shadow-xs space-y-3 sm:col-span-2">
                          <div className="flex items-center gap-2 text-cyan-600">
                            <Palette className="w-4.5 h-4.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Paleta de Colores Extraída</span>
                          </div>
                          <div className="flex flex-wrap gap-4">
                            {currentSelectedClient.brandBible.coloresHex && currentSelectedClient.brandBible.coloresHex.length > 0 ? (
                              currentSelectedClient.brandBible.coloresHex.map((color) => (
                                <div
                                  key={color}
                                  onClick={() => handleCopyColor(color)}
                                  className="group flex flex-col items-center gap-1.5 bg-[#F4F5F0] hover:bg-stone-200 p-3 rounded-2xl transition-all cursor-pointer min-w-[75px]"
                                >
                                  <span
                                    className="w-10 h-10 rounded-full block shadow-2xs border border-white"
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
                    <div className="bg-white p-12 text-center text-slate-400 text-xs font-medium rounded-3xl shadow-xs flex flex-col items-center justify-center space-y-3">
                      <Sparkles className="w-8 h-8 text-slate-300" />
                      <div>
                        <h3 className="font-bold text-slate-700">Sin Brand Bible generada</h3>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-sm">Este cliente posee datos de contacto básicos pero aún no se ha ejecutado el extractor de manual de marca con Inteligencia Artificial.</p>
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
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Elige un cliente de la lista de la izquierda para revisar el historial de proyectos, Órdenes de Venta (OVs) y Brand Bible.</p>
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
