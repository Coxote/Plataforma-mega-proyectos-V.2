import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Sparkles, Building2, User, Globe, Check, Edit3 } from 'lucide-react';
import { Client, BrandBible } from '../types';

interface NewClientWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClient: (client: Client) => void;
  initialData?: Client | null; // <-- Para el modo edición
}

export const NewClientWizard: React.FC<NewClientWizardProps> = ({ isOpen, onClose, onSaveClient, initialData }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isEditing, setIsEditing] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Formulario
  const [nombreComercial, setNombreComercial] = useState('');
  const [categoria, setCategoria] = useState('');
  const [contactoPrincipal, setContactoPrincipal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [sitioWebRedes, setSitioWebRedes] = useState('');
  const [brandBible, setBrandBible] = useState<BrandBible | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNombreComercial(initialData.nombreComercial);
        setCategoria(initialData.categoria);
        setContactoPrincipal(initialData.contactoPrincipal);
        setTelefono(initialData.telefono || '');
        setEmail(initialData.email || '');
        setSitioWebRedes(initialData.sitioWebRedes || '');
        setBrandBible(initialData.brandBible || null);
        setIsEditing(false);
      } else {
        setNombreComercial('');
        setCategoria('');
        setContactoPrincipal('');
        setTelefono('');
        setEmail('');
        setSitioWebRedes('');
        setBrandBible(null);
        setIsEditing(true);
      }
      setStep(1);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isStep1Valid = nombreComercial.trim() !== '' && categoria.trim() !== '' && contactoPrincipal.trim() !== '';

  // --- Manejo de Drag & Drop ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setIsAnalyzing(true);
    // Simulación de análisis IA leyendo el archivo
    setTimeout(() => {
      setBrandBible({
        archetype: 'El Creador / El Mago',
        misionVision: `Posicionarse como líderes indiscutibles en el sector ${categoria || 'digital'}.`,
        tonoVoz: 'Irreverente, directo, millenial y fresco.',
        coloresHex: ['#000000', '#06b6d4', '#10b981', '#f8fafc'],
        mensajesClave: 'Menos teoría, más conversiones aceleradas.'
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  const handleFinish = () => {
    onSaveClient({
      id: initialData?.id || `client-${Date.now()}`,
      nombreComercial,
      categoria,
      contactoPrincipal,
      telefono,
      email,
      sitioWebRedes,
      brandBible: brandBible || undefined
    });
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setStep(1);
    setNombreComercial('');
    setCategoria('');
    setContactoPrincipal('');
    setTelefono('');
    setEmail('');
    setSitioWebRedes('');
    setBrandBible(null);
    setIsEditing(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 relative">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-600" />
                {initialData ? 'Perfil del Cliente' : 'Nuevo Cliente'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {step === 1 ? 'Fase 1: Datos Básicos' : 'Fase 2: Brand Bible IA'}
              </p>
            </div>
            {/* BOTÓN EDITAR EN LA PARTE SUPERIOR */}
            {initialData && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Editar
              </button>
            )}
          </div>
          <button onClick={handleResetAndClose} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FASE 1 */}
        {step === 1 && (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Nombre comercial *</label>
                <input 
                  type="text" 
                  disabled={!isEditing} 
                  value={nombreComercial} 
                  placeholder="Ej: Nike, Apple..."
                  onChange={(e) => setNombreComercial(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-60" 
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Categoría *</label>
                <input 
                  type="text" 
                  disabled={!isEditing} 
                  value={categoria} 
                  placeholder="Ej: Retail, Tecnología..."
                  onChange={(e) => setCategoria(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-60" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Contacto Principal *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input 
                    type="text" 
                    disabled={!isEditing} 
                    value={contactoPrincipal} 
                    placeholder="Nombre completo y Rol"
                    onChange={(e) => setContactoPrincipal(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-cyan-500 disabled:opacity-60" 
                  />
                </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Teléfono</label>
                <input 
                  type="tel" 
                  disabled={!isEditing} 
                  value={telefono} 
                  placeholder="+502..."
                  onChange={(e) => setTelefono(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium disabled:opacity-60 focus:outline-none focus:border-cyan-500" 
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Email</label>
                <input 
                  type="email" 
                  disabled={!isEditing} 
                  value={email} 
                  placeholder="contacto@marca.com"
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium disabled:opacity-60 focus:outline-none focus:border-cyan-500" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Sitio Web o Redes</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input 
                    type="text" 
                    disabled={!isEditing} 
                    value={sitioWebRedes} 
                    placeholder="Link a IG, LinkedIn o Web"
                    onChange={(e) => setSitioWebRedes(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-cyan-500 disabled:opacity-60" 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              {initialData && (
                <button 
                  onClick={() => setStep(2)} 
                  className="px-5 py-3 text-cyan-600 font-bold text-sm hover:underline cursor-pointer"
                >
                  Ver Brand Bible IA &rarr;
                </button>
              )}
              <div className="ml-auto">
                {isEditing ? (
                  <button 
                    disabled={!isStep1Valid} 
                    onClick={() => setStep(2)} 
                    className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm disabled:opacity-30 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    Siguiente fase <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={onClose} 
                    className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm cursor-pointer transition-all"
                  >
                    Cerrar Perfil
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FASE 2: DROPZONE REAL */}
        {step === 2 && (
          <div className="p-8 space-y-6">
            {!brandBible ? (
              <div className="space-y-4">
                {/* ZONA DRAG AND DROP */}
                <form 
                  onDragEnter={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDragOver={handleDrag} 
                  onDrop={handleDrop}
                  onClick={() => isEditing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all flex flex-col items-center justify-center ${
                    !isEditing ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50' :
                    dragActive ? 'border-cyan-500 bg-cyan-100/50 scale-98' : 'border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50 cursor-pointer'
                  }`}
                >
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={handleChange} 
                    accept=".pdf,.doc,.docx,.txt" 
                    disabled={!isEditing}
                  />
                  <UploadCloud className={`w-10 h-10 mb-4 ${dragActive ? 'text-cyan-600 animate-bounce' : 'text-cyan-500'}`} />
                  <span className="text-sm font-bold text-cyan-900 block mb-1">
                    {isEditing ? 'Arrastra el manual de marca o PDF aquí' : 'No se ha cargado manual de marca'}
                  </span>
                  <span className="text-xs text-cyan-600/70 font-medium">
                    {isEditing ? 'o haz clic para explorar en tu equipo' : 'Ponte en modo edición para cargar un archivo'}
                  </span>
                </form>

                {isAnalyzing && (
                  <div className="text-center py-4 text-cyan-600 font-bold animate-pulse flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" /> La IA está analizando detalladamente el documento...
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-xs text-cyan-400 uppercase tracking-wider">Brand Bible Extraído con Éxito</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Arquetipo</span>
                      <p className="font-semibold text-slate-100">{brandBible.archetype}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Misión & Visión</span>
                      <p className="font-medium text-slate-200">{brandBible.misionVision}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Tono y Voz</span>
                      <p className="font-medium text-slate-200">{brandBible.tonoVoz}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Mensajes Clave</span>
                      <p className="font-semibold text-cyan-300 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-900/30 text-xs">
                        {brandBible.mensajesClave}
                      </p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">Colores Extraídos</span>
                      <div className="flex flex-wrap gap-2">
                        {brandBible.coloresHex?.map(color => (
                          <div key={color} className="flex items-center gap-1.5 bg-slate-800 pr-2.5 py-0.5 rounded-full text-xs border border-slate-700">
                            <span className="w-5 h-5 rounded-full block border border-slate-600 shadow-inner" style={{ backgroundColor: color }}></span>
                            <span className="font-mono text-[10px] text-slate-300">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="border border-dashed border-cyan-100 bg-cyan-50/20 p-4 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">¿Quieres re-analizar otro archivo?</span>
                    <button 
                      onClick={() => setBrandBible(null)} 
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-cyan-600 font-bold border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Cargar nuevo
                    </button>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="px-5 py-3 text-slate-500 font-bold text-sm hover:text-slate-800 cursor-pointer">Volver</button>
                  {isEditing ? (
                    <button onClick={handleFinish} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm cursor-pointer shadow-lg shadow-cyan-500/20 transition-all">Guardar Cliente</button>
                  ) : (
                    <button onClick={onClose} className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm cursor-pointer">Cerrar</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
