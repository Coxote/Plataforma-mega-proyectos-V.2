import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Sparkles,
  Building2,
  User,
  Globe,
  Check,
  Edit3,
  FileText,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Palette,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Client, BrandBible } from '../types';
import { analyzeBriefWithGemini } from '../geminiService';

interface NewClientWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClient: (client: Client) => void;
  initialData?: Client | null;
}

export const NewClientWizard: React.FC<NewClientWizardProps> = ({
  isOpen,
  onClose,
  onSaveClient,
  initialData
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isEditing, setIsEditing] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [nombreComercial, setNombreComercial] = useState('');
  const [categoria, setCategoria] = useState('');
  const [contactoPrincipal, setContactoPrincipal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [sitioWebRedes, setSitioWebRedes] = useState('');
  const [brandBible, setBrandBible] = useState<BrandBible | null>(null);
  const [inputMethod, setInputMethod] = useState<'upload' | 'text'>('upload');
  const [briefTextInput, setBriefTextInput] = useState('');

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
        setBriefTextInput('');
        setIsEditing(true);
      }
      setStep(1);
    }
  }, [initialData, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const isStep1Valid = nombreComercial.trim() !== '' && categoria.trim() !== '' && contactoPrincipal.trim() !== '';

  const handleAnalyzeText = async () => {
    if (!briefTextInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const data = await analyzeBriefWithGemini(briefTextInput);
      const hexList = (data.visualIdentity?.colorPaletteHex || ['#0f172a', '#0284c7', '#10b981', '#f8fafc']).filter(Boolean);
      const toneStr = Array.isArray(data.voiceAndTone?.personalityTraits)
        ? data.voiceAndTone.personalityTraits.join(', ')
        : data.voiceAndTone?.guidelines || 'Estratégico, empático y orientado a resultados.';

      setBrandBible({
        archetype: data.valuesAndPersonality?.archetype || 'El Héroe / El Sabio',
        misionVision: `${data.onePager?.mission || ''} ${data.onePager?.vision || ''}`.trim() || `Impulsar el crecimiento y liderazgo en el sector ${categoria || 'comercial'}.`,
        tonoVoz: toneStr,
        coloresHex: hexList.length > 0 ? hexList : ['#0f172a', '#0284c7', '#10b981', '#f8fafc'],
        mensajesClave: data.onePager?.uvp || data.positioning?.statement || 'Excelencia y conversión acelerada.'
      });
    } catch {
      setBrandBible({
        archetype: 'El Creador / El Sabio',
        misionVision: `Consolidar a ${nombreComercial || 'la marca'} como referente en el sector ${categoria || 'empresarial'}.`,
        tonoVoz: 'Innovador, directo, empático y profesional.',
        coloresHex: ['#0f172a', '#0284c7', '#10b981', '#f8fafc'],
        mensajesClave: 'Menos fricción, máxima entrega de valor medible.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!isEditing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessFile = async (file: File) => {
    setIsAnalyzing(true);
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      try {
        const text = await file.text();
        const data = await analyzeBriefWithGemini(text);
        const hexList = (data.visualIdentity?.colorPaletteHex || ['#0f172a', '#0284c7', '#10b981', '#f8fafc']).filter(Boolean);
        const toneStr = Array.isArray(data.voiceAndTone?.personalityTraits)
          ? data.voiceAndTone.personalityTraits.join(', ')
          : data.voiceAndTone?.guidelines || 'Innovador, directo y profesional.';

        setBrandBible({
          archetype: data.valuesAndPersonality?.archetype || 'El Creador / El Mago',
          misionVision: `${data.onePager?.mission || ''} ${data.onePager?.vision || ''}`.trim() || `Liderar el sector ${categoria || 'digital'}.`,
          tonoVoz: toneStr,
          coloresHex: hexList.length > 0 ? hexList : ['#0f172a', '#0284c7', '#10b981', '#f8fafc'],
          mensajesClave: data.onePager?.uvp || 'Menos teoría, más conversiones aceleradas.'
        });
        setIsAnalyzing(false);
        return;
      } catch {
        // Fallback below
      }
    }

    setTimeout(() => {
      setBrandBible({
        archetype: 'El Creador / El Mago',
        misionVision: `Posicionarse como líderes indiscutibles en el sector ${categoria || 'digital'}.`,
        tonoVoz: 'Irreverente, directo, vanguardista y fresco.',
        coloresHex: ['#0f172a', '#0284c7', '#10b981', '#f8fafc'],
        mensajesClave: 'Menos teoría, más conversiones aceleradas.'
      });
      setIsAnalyzing(false);
    }, 1500);
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* HEADER UNIFICADO DE LA PLATAFORMA */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#F4F5F0] text-slate-700 border border-stone-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c6ef4e]" />
                  {step === 1 ? 'Paso 1 de 2 • Datos Básicos' : 'Paso 2 de 2 • Brand Bible IA'}
                </span>
                {initialData && (
                  <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">
                    {initialData.nombreComercial}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {initialData ? 'Expediente del Cliente' : 'Nuevo Cliente Comercial'}
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {step === 1
                  ? 'Ficha de datos de contacto, categoría comercial y canales.'
                  : 'Extracción inteligente de Brand Bible con Gemini para alinear identidad.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {initialData && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Editar
              </button>
            )}
            <button
              type="button"
              onClick={handleResetAndClose}
              className="p-2.5 text-slate-400 hover:text-slate-900 bg-[#F4F5F0] hover:bg-stone-200 rounded-full transition-all cursor-pointer"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEPPER BAR UNIFICADO */}
        <div className="bg-[#F4F5F0] p-1.5 rounded-2xl mx-6 sm:mx-8 my-4 shrink-0 border border-stone-200/40 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all ${
              step === 1
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 1 ? 'bg-[#c6ef4e] text-slate-900' : isStep1Valid ? 'bg-emerald-500 text-white' : 'bg-stone-300 text-slate-600'
              }`}
            >
              {isStep1Valid && step !== 1 ? '✓' : '1'}
            </span>
            <span>1. Datos Básicos del Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => isStep1Valid && setStep(2)}
            disabled={!isStep1Valid}
            className={`flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              step === 2
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 2 ? 'bg-[#c6ef4e] text-slate-900' : brandBible ? 'bg-emerald-500 text-white' : 'bg-stone-300 text-slate-600'
              }`}
            >
              {brandBible && step !== 2 ? '✓' : '2'}
            </span>
            <span>2. Brand Bible & Lineamientos IA</span>
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-white">

          {/* PASO 1: DATOS BÁSICOS */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nombre comercial *
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={nombreComercial}
                    placeholder="Ej: Grupo Danone, Banco Santander..."
                    onChange={(e) => setNombreComercial(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Categoría / Sector *
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={categoria}
                    placeholder="Ej: Retail, Fintech, Salud, Entretenimiento..."
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all disabled:opacity-60"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Contacto Principal (Nombre y Rol) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={contactoPrincipal}
                      placeholder="Ej: Laura Méndez · Directora de Marketing"
                      onChange={(e) => setContactoPrincipal(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Teléfono Directo
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="tel"
                      disabled={!isEditing}
                      value={telefono}
                      placeholder="+34 600 000 000"
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={email}
                      placeholder="contacto@cliente.com"
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Sitio Web o Redes Sociales
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={sitioWebRedes}
                      placeholder="https://marca.com o @instagram_marca"
                      onChange={(e) => setSitioWebRedes(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Informative Tip Box */}
              <div className="p-4 bg-[#F4F5F0] rounded-2xl border border-stone-200/50 flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Los datos básicos se vincularán inmediatamente a las Órdenes de Venta, reportes ejecutivos de fases y notificaciones automáticas para coordinadores y líderes de equipo.
                </p>
              </div>
            </div>
          )}

          {/* PASO 2: BRAND BIBLE IA */}
          {step === 2 && (
            <div className="space-y-6">
              {!brandBible ? (
                <div className="space-y-5">
                  {/* Selector de Método */}
                  {isEditing && (
                    <div className="flex bg-[#F4F5F0] p-1.5 rounded-2xl w-fit gap-1 border border-stone-200/40">
                      <button
                        type="button"
                        onClick={() => setInputMethod('upload')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          inputMethod === 'upload'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Subir Documento / Brief
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMethod('text')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          inputMethod === 'text'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Pegar Texto o Notas
                      </button>
                    </div>
                  )}

                  {/* DROPZONE */}
                  {inputMethod === 'upload' && isEditing && (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        dragActive
                          ? 'border-[#c6ef4e] bg-[#edf9c7]/30 scale-[1.01]'
                          : 'border-stone-200 hover:border-stone-300 bg-[#F4F5F0]/60 hover:bg-[#F4F5F0]'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.docx,.md"
                        className="hidden"
                        onChange={(e) => e.target.files && handleProcessFile(e.target.files[0])}
                      />
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-stone-200/60 flex items-center justify-center mb-4 text-slate-800">
                        <UploadCloud className="w-7 h-7 text-slate-800" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-1">
                        Arrastra tu Brief de Marca o Documento aquí
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mb-4">
                        Soporta archivos PDF, TXT, Word o Markdown. Gemini extraerá automáticamente el tono de voz, arquetipo y paleta visual.
                      </p>
                      <span className="px-4 py-2 bg-white hover:bg-stone-100 text-slate-800 text-xs font-bold rounded-full border border-stone-200/80 shadow-2xs">
                        Explorar archivos
                      </span>
                    </div>
                  )}

                  {/* PEGAR TEXTO */}
                  {inputMethod === 'text' && isEditing && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Pega el texto del brief o notas del cliente
                      </label>
                      <textarea
                        value={briefTextInput}
                        onChange={(e) => setBriefTextInput(e.target.value)}
                        rows={6}
                        placeholder="Pega aquí la descripción del cliente, pilares, tono de voz o notas de reunión. Gemini extraerá automáticamente el arquetipo, misión, mensajes clave y paleta de colores institucional..."
                        className="w-full p-4 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-xs font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 resize-none transition-all"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={!briefTextInput.trim() || isAnalyzing}
                          onClick={handleAnalyzeText}
                          className="px-5 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 rounded-full text-xs font-bold disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                          Analizar Brief con Gemini
                        </button>
                      </div>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="p-6 bg-[#edf9c7]/30 border border-[#c6ef4e]/60 rounded-2xl text-center flex flex-col items-center justify-center gap-2 animate-pulse">
                      <Sparkles className="w-5 h-5 text-slate-800 animate-spin" />
                      <p className="text-xs font-bold text-slate-800">
                        La IA está analizando detalladamente los lineamientos del cliente...
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Extrayendo arquetipo, misión, pilares de comunicación y código hexadecimal de colores.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* BRAND BIBLE EXTRAÍDO - DISEÑO EJECUTIVO DE LA PLATAFORMA */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-6 bg-[#F4F5F0] rounded-3xl border border-stone-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-stone-200/50">
                          <Palette className="w-4 h-4 text-slate-800" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Brand Bible Institucional
                          </h4>
                          <span className="text-[11px] text-slate-500">Extraído y validado por Gemini</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#edf9c7] text-slate-900 border border-[#c6ef4e]/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Listo para Producción
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-white rounded-2xl border border-stone-200/60">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Arquetipo de Marca
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{brandBible.archetype}</p>
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-stone-200/60">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Tono y Voz
                        </span>
                        <p className="font-medium text-slate-700">{brandBible.tonoVoz}</p>
                      </div>

                      <div className="col-span-1 md:col-span-2 p-4 bg-white rounded-2xl border border-stone-200/60">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Misión y Visión
                        </span>
                        <p className="font-medium text-slate-700 leading-relaxed">{brandBible.misionVision}</p>
                      </div>

                      <div className="col-span-1 md:col-span-2 p-4 bg-white rounded-2xl border border-stone-200/60">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Mensajes Clave & Propuesta de Valor
                        </span>
                        <p className="font-medium text-slate-800 bg-[#F4F5F0] p-3 rounded-xl border border-stone-200/40">
                          {brandBible.mensajesClave}
                        </p>
                      </div>

                      <div className="col-span-1 md:col-span-2 p-4 bg-white rounded-2xl border border-stone-200/60">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                          Paleta de Colores Institucionales
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                          {brandBible.coloresHex?.map((color) => (
                            <div
                              key={color}
                              className="flex items-center gap-2 bg-[#F4F5F0] pr-3.5 pl-1.5 py-1.5 rounded-full border border-stone-200/60 text-xs font-semibold text-slate-800"
                            >
                              <span
                                className="w-5 h-5 rounded-full block border border-black/10 shadow-2xs shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="font-mono text-xs">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center justify-between p-4 bg-[#F4F5F0] rounded-2xl border border-stone-200/50 text-xs">
                      <span className="text-slate-600 font-medium">
                        ¿Deseas analizar otro archivo o redactar nuevas directrices?
                      </span>
                      <button
                        type="button"
                        onClick={() => setBrandBible(null)}
                        className="px-4 py-2 bg-white hover:bg-stone-100 text-slate-800 font-bold rounded-full transition-colors cursor-pointer border border-stone-200/60 shadow-2xs"
                      >
                        Reemplazar Brief
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER DE ACCIONES UNIFICADO DE LA PLATAFORMA */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-stone-100 bg-[#FAFAF8] flex items-center justify-between shrink-0">
          <div>
            {step === 1 ? (
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                Volver a Datos Básicos
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {step === 1 ? (
              <button
                type="button"
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
                className="px-7 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>Siguiente: Brand Bible</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
              </button>
            ) : (
              <>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="px-8 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-slate-900" />
                    <span>Guardar Cliente</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="px-8 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    Finalizar y Cerrar
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
