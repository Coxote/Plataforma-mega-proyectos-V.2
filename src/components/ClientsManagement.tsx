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
  Edit3
} from 'lucide-react';
import { NewClientWizard } from './NewClientWizard';

interface ClientsManagementProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
}

export const ClientsManagement: React.FC<ClientsManagementProps> = ({ clients, onAddClient }) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Dynamic selected client lookup to reflect instant updates from saving edits
  const currentSelectedClient = clients.find(c => c.id === selectedClient?.id) || selectedClient;

  // Filter clients based on search query
  const filteredClients = clients.filter(c => 
    c.nombreComercial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactoPrincipal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
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
          <p className="text-xs text-slate-500 font-medium">Gestiona los manuales de marca y perfiles generados por inteligencia artificial.</p>
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
          
          {/* BARRA DE BÚSQUEDA */}
          <div className="p-4 border-b border-slate-100 shrink-0">
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
          </div>

          {/* LISTA DE CLIENTES */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No se encontraron clientes registrados.
              </div>
            ) : (
              filteredClients.map(client => {
                const isSelected = selectedClient?.id === client.id;
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {client.nombreComercial.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{client.nombreComercial}</h4>
                        <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider scale-95 shrink-0">
                          {client.categoria}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate">Contacto: {client.contactoPrincipal}</p>
                      
                      {client.brandBible && (
                        <div className="flex items-center gap-1.5 pt-1">
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
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-cyan-100 text-cyan-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {currentSelectedClient.categoria}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">ID: {currentSelectedClient.id}</span>
                    <button 
                      onClick={() => {
                        setEditingClient(currentSelectedClient);
                        setIsWizardOpen(true);
                      }}
                      className="ml-2 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-slate-200"
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

                <div className="w-14 h-14 bg-cyan-600/10 text-cyan-700 rounded-2xl flex items-center justify-center font-black text-2xl">
                  {currentSelectedClient.nombreComercial.charAt(0)}
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
              <Building2 className="w-12 h-12 text-slate-350" />
              <div>
                <h3 className="font-bold text-slate-700 text-sm">Selecciona un cliente</h3>
                <p className="text-[11px] text-slate-450 mt-1 max-w-xs">Elige un cliente de la lista de la izquierda para revisar la información de contacto y su Brand Bible extraído con Inteligencia Artificial.</p>
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
