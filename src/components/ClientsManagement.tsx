import React, { useState } from 'react';
import { Client, BrandBible } from '../types';
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
  ArrowRight,
  TrendingUp,
  Sliders,
  Palette,
  Edit3,
  Calendar,
  Clock,
  Filter
} from 'lucide-react';
import { NewClientWizard } from './NewClientWizard';

interface ClientsManagementProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClientStatus?: (clientId: string, nuevoEstado: 'activo' | 'inactivo' | 'pausado') => void;
}

export const ClientsManagement: React.FC<ClientsManagementProps> = ({ clients, onAddClient, onUpdateClientStatus }) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'activos' | 'todos' | 'pausados' | 'inactivos'>('activos');

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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden" id="clients-management-view">
      {/* HEADER SUPERIOR */}
      <div className="px-8 py-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            Directorio de Clientes
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clientes & Brand Bibles</h1>
          <p className="text-xs text-slate-500 font-medium">Gestiona los manuales de marca, estados de actividad y perfiles de clientes.</p>
        </div>

        <button 
          onClick={() => {
            setEditingClient(null);
            setIsWizardOpen(true);
          }}
          className="px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Registrar Cliente con IA
        </button>
      </div>

      {/* WORKSPACE DIVIDIDO EN DOS COLUMNAS */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: LISTA DE CLIENTES */}
        <div className="w-full md:w-[380px] border-r border-slate-200 bg-white flex flex-col h-full shrink-0">
          
          {/* BARRA DE BÚSQUEDA Y FILTROS DE ESTADO */}
          <div className="p-3 border-b border-slate-100 shrink-0 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Buscar cliente, categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition-all font-medium"
              />
            </div>

            {/* STATUS FILTER TABS */}
            <div className="flex gap-1 text-[10px] font-bold bg-slate-100/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter('activos')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center ${
                  statusFilter === 'activos'
                    ? 'bg-white text-emerald-700 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Activos ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pausados')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center ${
                  statusFilter === 'pausados'
                    ? 'bg-white text-amber-700 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pausados ({pausedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactivos')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center ${
                  statusFilter === 'inactivos'
                    ? 'bg-white text-slate-800 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Inactivos ({inactiveCount})
              </button>
              <button
                type="button"
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
                    onClick={() => setSelectedClient(client)}
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
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 uppercase tracking-wider flex items-center gap-1 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium truncate">
                        <span>Contacto: {client.contactoPrincipal}</span>
                        <span className="text-slate-400 font-mono text-[9px]">{client.categoria}</span>
                      </div>
                      
                      {client.brandBible && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[9px] text-cyan-600 font-bold bg-cyan-100/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
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

        {/* COLUMNA DERECHA: BRAND BIBLE DETAIL */}
        <div className="hidden md:flex flex-1 flex-col h-full bg-slate-50/50 overflow-y-auto p-8">
          {currentSelectedClient ? (
            <div className="max-w-3xl space-y-6 animate-in fade-in duration-300">
              
              {/* HEADER DE CLIENTE */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] bg-cyan-100 text-cyan-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {currentSelectedClient.categoria}
                      </span>

                      {/* Status Badge */}
                      {(() => {
                        const badge = getClientStatusBadge(currentSelectedClient.estado);
                        return (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider flex items-center gap-1 ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        );
                      })()}

                      {/* Quick Status Selector */}
                      {onUpdateClientStatus && (
                        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold ml-auto">
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
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-slate-200"
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
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha de Alta: <strong className="text-slate-800">{currentSelectedClient.fechaAlta ? currentSelectedClient.fechaAlta.split('T')[0] : 'Julio 2026'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Última Actividad: <strong className="text-slate-800">{currentSelectedClient.fechaUltimaActividad ? currentSelectedClient.fechaUltimaActividad.split('T')[0] : 'Reciente'}</strong></span>
                  </div>
                </div>
              </div>

              {/* BRAND BIBLE CONTAINER */}
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
                        <span className="text-[11px] font-bold uppercase tracking-widest">Arquetipo de Marca</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{currentSelectedClient.brandBible.archetype || 'No especificado'}</p>
                    </div>

                    {/* Tono y Voz */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-2">
                      <div className="flex items-center gap-2 text-cyan-600">
                        <Sliders className="w-4.5 h-4.5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Tono de Voz</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{currentSelectedClient.brandBible.tonoVoz || 'No especificado'}</p>
                    </div>

                    {/* Misión y Visión */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-2 text-cyan-600">
                        <Building2 className="w-4.5 h-4.5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Misión & Visión</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{currentSelectedClient.brandBible.misionVision || 'No especificado'}</p>
                    </div>

                    {/* Mensajes Clave */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-2 text-cyan-600">
                        <Sparkles className="w-4.5 h-4.5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Mensajes Clave</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{currentSelectedClient.brandBible.mensajesClave || 'No especificado'}</p>
                    </div>

                    {/* Paleta de Colores */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-3 sm:col-span-2">
                      <div className="flex items-center gap-2 text-cyan-600">
                        <Palette className="w-4.5 h-4.5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Paleta de Colores Extraída</span>
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
                              <span className="text-[10px] font-mono font-bold text-slate-700 flex items-center gap-0.5">
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
                <div className="bg-white p-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-3">
                  <Sparkles className="w-8 h-8 text-slate-300" />
                  <div>
                    <h3 className="font-bold text-slate-700">Sin Brand Bible generada</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">Este cliente posee datos de contacto básicos pero aún no se ha ejecutado el extractor de manual de marca con Inteligencia Artificial.</p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-4">
              <Building2 className="w-12 h-12 text-slate-300" />
              <div>
                <h3 className="font-bold text-slate-700 text-sm">Selecciona un cliente</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Elige un cliente de la lista de la izquierda para revisar la información de contacto, estado de actividad y su Brand Bible.</p>
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
