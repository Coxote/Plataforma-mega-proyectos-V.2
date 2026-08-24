import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, FileText, ArrowLeft, 
  FileCode2, CheckCircle2, ShieldAlert, GripVertical, 
  ChevronUp, ChevronDown, Layers, Clock, Upload, Sparkles, Loader2
} from 'lucide-react';
import { RoleHoursAllocation, UserSession, EstadoOV } from '../types';

const PREDEFINED_TAGS = {
  'Entregable': ['#RedesSociales', '#Branding', '#UI/UX', '#VideoMotion', '#PixelArt', '#GameDev', '#DesarrolloWeb'],
  'Modelo': ['#SuscripcionMensual', '#ProyectoFijo', '#OneShot', '#Auditoria'],
  'Prioridad': ['#Urgente', '#Lanzamiento', '#Mantenimiento']
};

interface NewProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: any) => void;
  users: UserSession[];
  registeredClients?: any[];
}

export interface ProjectDraftOV {
  id: string;
  numero: string;
  monto: number | '';
  moneda: string;
  horasAsociadas: number | '';
  horasPorRol?: {
    supervisor?: number | '';
    coordinador?: number | '';
    sac?: number | '';
    contents?: number | '';
    contentd?: number | '';
  };
  fechaEmision: string;
  descripcion: string;
  estado: EstadoOV;
}

// Componente para gestión unificada de Array de Órdenes de Venta (OV)
const OrdenesVentaArrayManager: React.FC<{
  draft: any;
  onAddOV: () => void;
  onRemoveOV: (id: string) => void;
  onUpdateOV: (id: string, field: string, value: any) => void;
}> = ({ draft, onAddOV, onRemoveOV, onUpdateOV }) => {
  const [parsingOVId, setParsingOVId] = useState<string | null>(null);

  const handleFileUpload = async (ovId: string, file: File) => {
    if (!file) return;
    setParsingOVId(ovId);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/parse-ov-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64Data,
              mimeType: file.type || 'application/pdf',
            })
          });
          const data = await res.json();
          if (res.ok && data) {
            if (data.numero) onUpdateOV(ovId, 'numero', data.numero);
            if (typeof data.subtotal === 'number') onUpdateOV(ovId, 'subtotal', data.subtotal);
            if (typeof data.impuestos === 'number') onUpdateOV(ovId, 'impuestos', data.impuestos);
            if (typeof data.comisiones === 'number') onUpdateOV(ovId, 'comisiones', data.comisiones);
            if (typeof data.monto === 'number') onUpdateOV(ovId, 'monto', data.monto);
            if (data.moneda) onUpdateOV(ovId, 'moneda', data.moneda);
            if (data.fechaEmision) onUpdateOV(ovId, 'fechaEmision', data.fechaEmision);
            if (data.descripcion) onUpdateOV(ovId, 'descripcion', data.descripcion);
            if (data.horasPorRol) {
              if (typeof data.horasPorRol.supervisor === 'number') onUpdateOV(ovId, 'horasPorRol_supervisor', data.horasPorRol.supervisor);
              if (typeof data.horasPorRol.coordinador === 'number') onUpdateOV(ovId, 'horasPorRol_coordinador', data.horasPorRol.coordinador);
              if (typeof data.horasPorRol.sac === 'number') onUpdateOV(ovId, 'horasPorRol_sac', data.horasPorRol.sac);
              if (typeof data.horasPorRol.contents === 'number') onUpdateOV(ovId, 'horasPorRol_contents', data.horasPorRol.contents);
              if (typeof data.horasPorRol.contentd === 'number') onUpdateOV(ovId, 'horasPorRol_contentd', data.horasPorRol.contentd);
            }
          } else {
            alert(data.error || 'No se pudo extraer información del archivo de la OV.');
          }
        } catch (err) {
          console.error(err);
          alert('Error de conexión al procesar el archivo.');
        } finally {
          setParsingOVId(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setParsingOVId(null);
    }
  };

  const getEstadoBadge = (st: EstadoOV) => {
    switch (st) {
      case 'creada':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: '• Creada' };
      case 'enviada':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200', label: '• Enviada' };
      case 'bloqueada':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: '• Bloqueada' };
      case 'facturada':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '• Facturada' };
      default:
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: '• Creada' };
    }
  };

  return (
    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Órdenes de Venta (OV) del Proyecto ({draft.ordenesVenta.length})
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Agrega múltiples OVs o sube tu PDF/Imagen para autocompletar horas por rol con IA.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddOV}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir Órden de Venta
        </button>
      </div>

      <div className="space-y-3">
        {draft.ordenesVenta.map((ov: any, index: number) => {
          const badge = getEstadoBadge(ov.estado || 'creada');
          const isParsing = parsingOVId === ov.id;

          return (
            <div key={ov.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-5 h-5 bg-cyan-100 text-cyan-800 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    OV #{ov.numero || 'Sin número'}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* UPLOADER BUTTON WITH IA AUTO-FILL */}
                  <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                    isParsing 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/80'
                  }`}>
                    {isParsing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                        <span>Analizando con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Subir PDF / Imagen</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
                      disabled={isParsing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(ov.id, file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>

                  {draft.ordenesVenta.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveOV(ov.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar esta OV"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Número / Código *</label>
                  <input
                    type="text"
                    value={ov.numero}
                    onChange={(e) => onUpdateOV(ov.id, 'numero', e.target.value)}
                    placeholder="Ej: SO19229"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Estado OV *</label>
                  <select
                    value={ov.estado || 'creada'}
                    onChange={(e) => onUpdateOV(ov.id, 'estado', e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="creada">Creada</option>
                    <option value="enviada">Enviada</option>
                    <option value="bloqueada">Bloqueada</option>
                    <option value="facturada">Facturada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Fecha Emisión</label>
                  <input
                    type="date"
                    value={ov.fechaEmision}
                    onChange={(e) => onUpdateOV(ov.id, 'fechaEmision', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Descripción / Detalle</label>
                  <input
                    type="text"
                    value={ov.descripcion}
                    onChange={(e) => onUpdateOV(ov.id, 'descripcion', e.target.value)}
                    placeholder="Servicios contratados..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>

              {/* DESGLOSE FINANCIERO CON IMPUESTOS Y COMISIONES */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Subtotal Neto</label>
                  <input
                    type="number"
                    step="any"
                    value={ov.subtotal ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      onUpdateOV(ov.id, 'subtotal', val);
                      const imp = typeof ov.impuestos === 'number' ? ov.impuestos : 0;
                      const com = typeof ov.comisiones === 'number' ? ov.comisiones : 0;
                      if (val !== '') {
                        onUpdateOV(ov.id, 'monto', Number((Number(val) + imp + com).toFixed(2)));
                      }
                    }}
                    placeholder="Ej: 7175.10"
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 focus:outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Impuestos / IVA</label>
                  <input
                    type="number"
                    step="any"
                    value={ov.impuestos ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      onUpdateOV(ov.id, 'impuestos', val);
                      const sub = typeof ov.subtotal === 'number' ? ov.subtotal : 0;
                      const com = typeof ov.comisiones === 'number' ? ov.comisiones : 0;
                      if (sub > 0) {
                        onUpdateOV(ov.id, 'monto', Number((sub + (val !== '' ? Number(val) : 0) + com).toFixed(2)));
                      }
                    }}
                    placeholder="Ej: 861.02"
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 focus:outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Comisión / Retención</label>
                  <input
                    type="number"
                    step="any"
                    value={ov.comisiones ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      onUpdateOV(ov.id, 'comisiones', val);
                      const sub = typeof ov.subtotal === 'number' ? ov.subtotal : 0;
                      const imp = typeof ov.impuestos === 'number' ? ov.impuestos : 0;
                      if (sub > 0) {
                        onUpdateOV(ov.id, 'monto', Number((sub + imp + (val !== '' ? Number(val) : 0)).toFixed(2)));
                      }
                    }}
                    placeholder="Ej: 35.88"
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 focus:outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-700 uppercase mb-1">Monto Total ({draft.currency}) *</label>
                  <input
                    type="number"
                    step="any"
                    value={ov.monto}
                    onChange={(e) => onUpdateOV(ov.id, 'monto', e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ej: 8072"
                    className="w-full px-2.5 py-1 bg-white border border-orange-300 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF5500] font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* SECCIÓN DESGLOSE DE HORAS POR ROL */}
              <div className="pt-2.5 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
                    Horas Vendidas por Rol (OV #{ov.numero || 'Sin número'})
                  </span>
                  <span className="text-[10px] font-bold text-[#FF5500] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full font-mono">
                    Total Horas OV: {typeof ov.horasAsociadas === 'number' ? ov.horasAsociadas : 0} hrs
                  </span>
                </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* Supervisor */}
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[9px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                    Supervisor
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ov.horasPorRol?.supervisor ?? ''}
                    onChange={(e) => onUpdateOV(ov.id, 'horasPorRol_supervisor', e.target.value ? Number(e.target.value) : '')}
                    placeholder="0 hrs"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Coordinador PM */}
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[9px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span>
                    Coordinador PM
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ov.horasPorRol?.coordinador ?? ''}
                    onChange={(e) => onUpdateOV(ov.id, 'horasPorRol_coordinador', e.target.value ? Number(e.target.value) : '')}
                    placeholder="0 hrs"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* SAC / Consultor */}
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[9px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                    SAC / Consultor
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ov.horasPorRol?.sac ?? ''}
                    onChange={(e) => onUpdateOV(ov.id, 'horasPorRol_sac', e.target.value ? Number(e.target.value) : '')}
                    placeholder="0 hrs"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Social Media (ContentS) */}
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[9px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Social Media
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ov.horasPorRol?.contents ?? ''}
                    onChange={(e) => onUpdateOV(ov.id, 'horasPorRol_contents', e.target.value ? Number(e.target.value) : '')}
                    placeholder="0 hrs"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Diseñador (ContentD) */}
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[9px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                    Diseñador
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ov.horasPorRol?.contentd ?? ''}
                    onChange={(e) => onUpdateOV(ov.id, 'horasPorRol_contentd', e.target.value ? Number(e.target.value) : '')}
                    placeholder="0 hrs"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

      <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-200/80 gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-500">
            Total OVs: <strong className="text-slate-800">{draft.ordenesVenta.length}</strong>
          </span>
          <span className="font-bold text-slate-500">
            Horas Vendidas Totales: <strong className="text-indigo-600">{draft.ordenesVenta.reduce((s: number, o: any) => s + (typeof o.horasAsociadas === 'number' ? o.horasAsociadas : 0), 0)} hrs</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-500">Monto Total OVs Válidas:</span>
          <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
            ${(typeof draft.totalIncome === 'number' ? draft.totalIncome : 0).toLocaleString('es-CL')} {draft.currency}
          </span>
        </div>
      </div>
    </div>
  );
};

export const NewProjectWizard: React.FC<NewProjectWizardProps> = ({ isOpen, onClose, onCreateProject, users, registeredClients }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<'general' | 'fases' | 'integrantes'>('general');
  const [clients, setClients] = useState<any[]>([]);

  // Búsqueda de integrantes
  const [rosterSearch, setRosterSearch] = useState('');

  // Drag & drop state para Integrantes
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);

  // Drag & drop state para Fases
  const [draggedPhaseIndex, setDraggedPhaseIndex] = useState<number | null>(null);

  // Estado para creación manual de Fase
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newPhaseChecklist, setNewPhaseChecklist] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (registeredClients && registeredClients.length > 0) {
        setClients(registeredClients);
      } else {
        try {
          const v5 = localStorage.getItem('saas_phase_system_clients_v5');
          const v1 = localStorage.getItem('saas_phase_system_clients');
          if (v5) setClients(JSON.parse(v5));
          else if (v1) setClients(JSON.parse(v1));
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [isOpen, registeredClients]);

  // --- ESTADO UNIFICADO DE BORRADOR (DRAFT) DE PROYECTO ---
  interface ProjectDraft {
    projectName: string;
    clientName: string;
    projectMode: 'blank' | 'template';
    selectedTemplate: string;
    startDate: string;
    endDate: string;
    saleOrderNumber: string;
    ordenesVenta: ProjectDraftOV[];
    deliverablesCount: number | '';
    description: string;
    riskMitigationText: string;
    tags: string[];
    customPhases: any[];
    members: any[];
    currency: string;
    totalIncome: number | '';
    roleHours: RoleHoursAllocation;
  }

  const DEFAULT_DRAFT: ProjectDraft = {
    projectName: '',
    clientName: '',
    projectMode: 'blank',
    selectedTemplate: 'redes',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    saleOrderNumber: 'OV-001',
    ordenesVenta: [
      {
        id: `ov-draft-1`,
        numero: 'OV-001',
        monto: '',
        moneda: 'USD',
        horasAsociadas: '',
        fechaEmision: new Date().toISOString().split('T')[0],
        descripcion: 'Orden de Venta Inicial',
        estado: 'creada'
      }
    ],
    deliverablesCount: '',
    description: '',
    riskMitigationText: '',
    tags: [],
    customPhases: [],
    members: [],
    currency: 'USD',
    totalIncome: '',
    roleHours: { 
      supervisor: 0,
      coordinador: 0, 
      sac: 0, 
      contents: 0, 
      contentd: 0 
    }
  };

  const [draft, setDraft] = useState<ProjectDraft>(() => {
    try {
      const saved = localStorage.getItem('saas_phase_system_project_draft');
      return saved ? JSON.parse(saved) : DEFAULT_DRAFT;
    } catch {
      return DEFAULT_DRAFT;
    }
  });

  // Guardar automáticamente el borrador cuando cambia
  useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem('saas_phase_system_project_draft', JSON.stringify(draft));
      } catch (err) {
        console.error('Error saving project draft to localStorage:', err);
      }
    }
  }, [draft, isOpen]);

  if (!isOpen) return null;

  const totalHoursCalculated = 
    Number(draft.roleHours.supervisor || 0) +
    Number(draft.roleHours.coordinador || 0) + 
    Number(draft.roleHours.sac || 0) + 
    Number(draft.roleHours.contents || 0) + 
    Number(draft.roleHours.contentd || 0);

  // Funciones de Etiquetas
  const toggleTag = (tag: string) => {
    setDraft(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  // Drag and Drop para Integrantes
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMemberId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropToRole = (e: React.DragEvent, newRole: 'Principal' | 'Apoyo' | 'Observador') => {
    e.preventDefault();
    if (draggedMemberId) {
      setDraft(prev => ({
        ...prev,
        members: prev.members.map(m => m.id === draggedMemberId ? { ...m, participationRole: newRole } : m)
      }));
      setDraggedMemberId(null);
    }
  };

  // Agregar al hacer clic
  const handleAddMemberClick = (user: any) => {
    if (!draft.members.some(m => m.id === user.id)) {
      setDraft(prev => ({
        ...prev,
        members: [...prev.members, { 
          id: user.id, 
          name: user.name, 
          role: user.roleBase, 
          participationRole: 'Principal',
          avatar: user.avatar 
        }]
      }));
    }
  };

  const handleRemoveMember = (id: string) => {
    setDraft(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id)
    }));
  };

  // --- EDITOR MANUAL DE FASES & CHECKLIST ---
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setNewPhaseChecklist(prev => [...prev, newChecklistText.trim()]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (idx: number) => {
    setNewPhaseChecklist(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddManualPhase = () => {
    if (!newPhaseName.trim()) return;
    const nextIdx = draft.customPhases.length + 1;
    const newPhaseObj = {
      id: `custom-ph-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      label: `A${nextIdx}. ${newPhaseName.trim()}`,
      status: nextIdx === 1 ? ('active' as const) : ('pending' as const),
      completedAt: null,
      checklist: newPhaseChecklist.map((task, tidx) => ({
        id: `task-${Date.now()}-${tidx}`,
        text: task,
        completed: false
      })),
      fields: {}
    };

    setDraft(prev => ({
      ...prev,
      customPhases: [...prev.customPhases, newPhaseObj]
    }));

    setNewPhaseName('');
    setNewChecklistText('');
    setNewPhaseChecklist([]);
  };

  const handleRemovePhase = (phaseId: string) => {
    setDraft(prev => {
      const updated = prev.customPhases.filter(p => p.id !== phaseId);
      // Renumerar prefijos A1, A2...
      const renumbered = updated.map((ph, idx) => {
        const cleanName = ph.label.replace(/^A\d+\.\s*/, '');
        return {
          ...ph,
          label: `A${idx + 1}. ${cleanName}`
        };
      });
      return { ...prev, customPhases: renumbered };
    });
  };

  // --- DRAG AND DROP PARA REORDENAR FASES ---
  const handlePhaseDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPhaseIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhaseDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePhaseDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPhaseIndex === null || draggedPhaseIndex === targetIndex) return;

    const updated = [...draft.customPhases];
    const [draggedPhase] = updated.splice(draggedPhaseIndex, 1);
    updated.splice(targetIndex, 0, draggedPhase);

    const renumbered = updated.map((ph, idx) => {
      const cleanName = ph.label.replace(/^A\d+\.\s*/, '');
      return {
        ...ph,
        label: `A${idx + 1}. ${cleanName}`
      };
    });

    setDraft(prev => ({ ...prev, customPhases: renumbered }));
    setDraggedPhaseIndex(null);
  };

  const handleMovePhase = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draft.customPhases.length) return;

    const updated = [...draft.customPhases];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const renumbered = updated.map((ph, idx) => {
      const cleanName = ph.label.replace(/^A\d+\.\s*/, '');
      return {
        ...ph,
        label: `A${idx + 1}. ${cleanName}`
      };
    });

    setDraft(prev => ({ ...prev, customPhases: renumbered }));
  };

  const handleFileUploadMD = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        let parsedPhases: any[] = [];
        let currentPhase: any = null;

        lines.forEach((line) => {
          if (line.startsWith('# ')) {
            if (currentPhase) parsedPhases.push(currentPhase);
            currentPhase = { 
              id: `md-${Date.now()}-${Math.random()}`, 
              label: line.replace('# ', '').trim(), 
              status: parsedPhases.length === 0 ? 'active' : 'pending', 
              completedAt: null,
              checklist: [], 
              fields: {} 
            };
          } else if (line.startsWith('- [ ]') && currentPhase) {
            currentPhase.checklist.push({ 
              id: `t-${Date.now()}-${Math.random()}`, 
              text: line.replace('- [ ]', '').trim(), 
              completed: false 
            });
          }
        });
        if (currentPhase) parsedPhases.push(currentPhase);
        
        const finalParsed = parsedPhases.length ? parsedPhases : [{ id: '1', label: 'A1. Fase Importada', status: 'active', completedAt: null, checklist: [], fields: {} }];
        
        const renumbered = finalParsed.map((ph, idx) => {
          const cleanName = ph.label.replace(/^A\d+\.\s*/, '');
          return {
            ...ph,
            label: `A${idx + 1}. ${cleanName}`
          };
        });

        setDraft(prev => ({
          ...prev,
          customPhases: renumbered
        }));
      };
      reader.readAsText(file);
    }
  };

  // Helper para recalcular rol de horas del borrador desde las OVs
  const recalculateRoleHoursFromOVs = (ordenesVenta: ProjectDraftOV[]): RoleHoursAllocation => {
    const activeOVs = ordenesVenta;
    const roleHours: RoleHoursAllocation = {
      supervisor: 0,
      coordinador: 0,
      sac: 0,
      contents: 0,
      contentd: 0
    };
    activeOVs.forEach(o => {
      if (o.horasPorRol) {
        roleHours.supervisor = (roleHours.supervisor || 0) + (typeof o.horasPorRol.supervisor === 'number' ? o.horasPorRol.supervisor : 0);
        roleHours.coordinador += (typeof o.horasPorRol.coordinador === 'number' ? o.horasPorRol.coordinador : 0);
        roleHours.sac += (typeof o.horasPorRol.sac === 'number' ? o.horasPorRol.sac : 0);
        roleHours.contents += (typeof o.horasPorRol.contents === 'number' ? o.horasPorRol.contents : 0);
        roleHours.contentd += (typeof o.horasPorRol.contentd === 'number' ? o.horasPorRol.contentd : 0);
      } else if (typeof o.horasAsociadas === 'number') {
        roleHours.coordinador += o.horasAsociadas;
      }
    });
    return roleHours;
  };

  // --- HANDLERS MULTI-OV DRAFT ---
  const handleAddDraftOV = () => {
    setDraft(prev => {
      const nextNum = `OV-${String(prev.ordenesVenta.length + 1).padStart(3, '0')}`;
      const newOV: ProjectDraftOV = {
        id: `ov-draft-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        numero: nextNum,
        monto: '',
        moneda: prev.currency || 'USD',
        horasAsociadas: '',
        horasPorRol: {
          supervisor: '',
          coordinador: '',
          sac: '',
          contents: '',
          contentd: ''
        },
        fechaEmision: prev.startDate || new Date().toISOString().split('T')[0],
        descripcion: 'Orden de Venta Adicional',
        estado: 'creada'
      };
      const updatedOVs = [...prev.ordenesVenta, newOV];
      const sumIncome = updatedOVs.reduce((s, o) => s + (typeof o.monto === 'number' ? o.monto : 0), 0);
      const computedRoleHours = recalculateRoleHoursFromOVs(updatedOVs);
      return {
        ...prev,
        ordenesVenta: updatedOVs,
        totalIncome: sumIncome > 0 ? sumIncome : prev.totalIncome,
        saleOrderNumber: updatedOVs.map(o => o.numero).join(', '),
        roleHours: computedRoleHours
      };
    });
  };

  const handleRemoveDraftOV = (ovId: string) => {
    setDraft(prev => {
      if (prev.ordenesVenta.length <= 1) return prev;
      const updatedOVs = prev.ordenesVenta.filter(o => o.id !== ovId);
      const sumIncome = updatedOVs.reduce((s, o) => s + (typeof o.monto === 'number' ? o.monto : 0), 0);
      const computedRoleHours = recalculateRoleHoursFromOVs(updatedOVs);
      return {
        ...prev,
        ordenesVenta: updatedOVs,
        totalIncome: sumIncome,
        saleOrderNumber: updatedOVs.map(o => o.numero).join(', '),
        roleHours: computedRoleHours
      };
    });
  };

  const handleUpdateDraftOV = (ovId: string, field: string, value: any) => {
    setDraft(prev => {
      const updatedOVs = prev.ordenesVenta.map(o => {
        if (o.id !== ovId) return o;
        if (field.startsWith('horasPorRol_')) {
          const roleKey = field.replace('horasPorRol_', '');
          const existing = o.horasPorRol || { supervisor: '', coordinador: '', sac: '', contents: '', contentd: '' };
          const updatedRoleHours = { ...existing, [roleKey]: value };
          const sumOV = 
            (typeof updatedRoleHours.supervisor === 'number' ? updatedRoleHours.supervisor : 0) +
            (typeof updatedRoleHours.coordinador === 'number' ? updatedRoleHours.coordinador : 0) +
            (typeof updatedRoleHours.sac === 'number' ? updatedRoleHours.sac : 0) +
            (typeof updatedRoleHours.contents === 'number' ? updatedRoleHours.contents : 0) +
            (typeof updatedRoleHours.contentd === 'number' ? updatedRoleHours.contentd : 0);
          return {
            ...o,
            horasPorRol: updatedRoleHours,
            horasAsociadas: sumOV > 0 ? sumOV : ''
          };
        }
        return { ...o, [field]: value };
      });

      const sumIncome = updatedOVs.reduce((s, o) => s + (typeof o.monto === 'number' ? o.monto : 0), 0);
      const computedRoleHours = recalculateRoleHoursFromOVs(updatedOVs);

      return {
        ...prev,
        ordenesVenta: updatedOVs,
        totalIncome: sumIncome > 0 ? sumIncome : prev.totalIncome,
        saleOrderNumber: updatedOVs.map(o => o.numero).join(', '),
        roleHours: computedRoleHours
      };
    });
  };

  // Resetear estados y borrar borrador temporal de localStorage
  const handleResetAndClose = () => {
    setStep(1);
    setActiveTab('general');
    setDraft(DEFAULT_DRAFT);
    try {
      localStorage.removeItem('saas_phase_system_project_draft');
    } catch (err) {
      console.error(err);
    }
    onClose();
  };

  // Guardar proyecto
  const handleFinish = () => {
    const defaultInitialPhases = [
      { 
        id: 'A1', 
        label: 'A1. Kickoff & Planificación', 
        status: 'active', 
        completedAt: null, 
        checklist: [{ id: 't-1', text: 'Reunión inicial con cliente', completed: false }], 
        fields: {} 
      },
      { 
        id: 'A2', 
        label: 'A2. Ejecución & Desarrollo', 
        status: 'pending', 
        completedAt: null, 
        checklist: [{ id: 't-2', text: 'Desarrollo de entregables principales', completed: false }], 
        fields: {} 
      },
      { 
        id: 'A3', 
        label: 'A3. Entrega & Aprobación', 
        status: 'pending', 
        completedAt: null, 
        checklist: [{ id: 't-3', text: 'Aprobación final del cliente', completed: false }], 
        fields: {} 
      }
    ];

    const finalPhases = draft.customPhases.length > 0 ? draft.customPhases : defaultInitialPhases;

    const formattedOVs = draft.ordenesVenta.map((ov, idx) => ({
      id: ov.id || `ov-${Date.now()}-${idx + 1}`,
      numero: ov.numero.trim() || `OV-${String(idx + 1).padStart(3, '0')}`,
      monto: typeof ov.monto === 'number' ? ov.monto : 0,
      moneda: ov.moneda || draft.currency || 'USD',
      horasAsociadas: typeof ov.horasAsociadas === 'number' ? ov.horasAsociadas : 0,
      horasPorRol: ov.horasPorRol ? {
        supervisor: typeof ov.horasPorRol.supervisor === 'number' ? ov.horasPorRol.supervisor : 0,
        coordinador: typeof ov.horasPorRol.coordinador === 'number' ? ov.horasPorRol.coordinador : 0,
        sac: typeof ov.horasPorRol.sac === 'number' ? ov.horasPorRol.sac : 0,
        contents: typeof ov.horasPorRol.contents === 'number' ? ov.horasPorRol.contents : 0,
        contentd: typeof ov.horasPorRol.contentd === 'number' ? ov.horasPorRol.contentd : 0,
      } : undefined,
      fechaEmision: ov.fechaEmision || draft.startDate || new Date().toISOString().split('T')[0],
      descripcion: ov.descripcion || 'Orden de Venta',
      estado: ov.estado || 'activa'
    }));

    const activeOVs = formattedOVs.filter(o => o.estado !== 'cancelada');
    const computedTotalIncome = activeOVs.reduce((sum, o) => sum + o.monto, 0);
    const combinedOVNumbers = formattedOVs.map(o => o.numero).join(', ') || 'OV-001';

    onCreateProject({
      name: draft.projectName,
      clientName: draft.clientName,
      templateType: 'custom',
      startDate: draft.startDate, 
      endDate: draft.endDate || new Date().toISOString().split('T')[0], 
      saleOrderNumber: combinedOVNumbers, 
      ovNumber: combinedOVNumbers,
      ordenesVenta: formattedOVs,
      deliverablesCount: Number(draft.deliverablesCount) || 0, 
      description: draft.description || '', 
      riesgos: draft.riskMitigationText || '',
      tags: draft.tags, 
      members: draft.members.map(m => ({ id: m.id, name: m.name, role: m.role, participationRole: m.participationRole })), 
      currency: draft.currency, 
      totalIncome: computedTotalIncome || Number(draft.totalIncome) || 0, 
      roleHours: draft.roleHours, 
      hoursTotal: totalHoursCalculated, 
      phases: finalPhases
    });

    handleResetAndClose();
  };

  const rosterUsers = (users || [])
    .filter(u => u.role !== 'invitado')
    .map(u => ({
      id: u.id,
      name: (u.username || 'Usuario').charAt(0).toUpperCase() + (u.username || 'Usuario').slice(1),
      roleBase: u.puesto || 'Colaborador',
      avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.username}`
    }));

  const filteredRoster = rosterUsers.filter(member => 
    member.name.toLowerCase().includes(rosterSearch.toLowerCase()) || 
    member.roleBase.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in duration-200">
        
        {/* ======================= PASO 1 ======================= */}
        {step === 1 && (
          <div className="p-8 space-y-6 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Configuración Inicial del Proyecto</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Introduce el nombre y cliente para comenzar.</p>
              </div>
              <button onClick={handleResetAndClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del proyecto *</label>
                <input 
                  type="text" 
                  placeholder="Ej: Rediseño Portal Clientes"
                  value={draft.projectName} 
                  onChange={(e) => setDraft(prev => ({ ...prev, projectName: e.target.value }))} 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF5500] bg-slate-50" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cliente *</label>
                <input
                  type="text"
                  list="clients-list-suggestions"
                  placeholder="Introduce o selecciona cliente *"
                  value={draft.clientName}
                  onChange={(e) => setDraft(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#FF5500] bg-slate-50"
                />
                <datalist id="clients-list-suggestions">
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.nombreComercial}>
                      {c.nombreComercial} {c.estado && c.estado !== 'activo' ? `(${c.estado.toUpperCase()})` : ''}
                    </option>
                  ))}
                </datalist>

                {/* Warning banner if selected client is inactive or paused */}
                {(() => {
                  const matched = clients.find((c: any) => c.nombreComercial?.toLowerCase() === draft.clientName?.trim().toLowerCase());
                  if (matched && (matched.estado === 'inactivo' || matched.estado === 'pausado')) {
                    return (
                      <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2 animate-in fade-in">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          El cliente <strong>{matched.nombreComercial}</strong> se encuentra como <strong>{matched.estado}</strong>. Se reactivará automáticamente a estar <strong>Activo</strong> al guardar.
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                disabled={!draft.projectName.trim() || !draft.clientName.trim()} 
                onClick={() => setStep(2)} 
                className="px-8 py-3 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* ======================= PASO 2 ======================= */}
        {step === 2 && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto shrink-0">
              <button 
                onClick={() => setActiveTab('general')} 
                className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-all ${
                  activeTab === 'general' ? 'border-[#FF5500] text-[#FF5500] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                ⚙️ General
              </button>
              
              <button 
                onClick={() => setActiveTab('fases')} 
                className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-all ${
                  activeTab === 'fases' ? 'border-[#FF5500] text-[#FF5500] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                🏗️ Fases del Proyecto
              </button>
              
              <button 
                onClick={() => setActiveTab('integrantes')} 
                className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-all ${
                  activeTab === 'integrantes' ? 'border-[#FF5500] text-[#FF5500] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                👥 Integrantes
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-white">
              
              {/* TAB GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Fecha de Inicio</label>
                      <input 
                        type="date" 
                        value={draft.startDate} 
                        onChange={(e) => setDraft(prev => ({ ...prev, startDate: e.target.value }))} 
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Fecha de Término *</label>
                      <input 
                        type="date" 
                        value={draft.endDate} 
                        onChange={(e) => setDraft(prev => ({ ...prev, endDate: e.target.value }))} 
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" 
                      />
                    </div>
                  </div>

                  {/* GESTOR MULTI-OV */}
                  <OrdenesVentaArrayManager
                    draft={draft}
                    onAddOV={handleAddDraftOV}
                    onRemoveOV={handleRemoveDraftOV}
                    onUpdateOV={handleUpdateDraftOV}
                  />

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Cantidad de entregables esperados</label>
                    <input 
                      type="number" 
                      placeholder="Ej: 5" 
                      value={draft.deliverablesCount} 
                      onChange={(e) => setDraft(prev => ({ ...prev, deliverablesCount: e.target.value ? Number(e.target.value) : '' }))} 
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" 
                    />
                  </div>


                </div>
              )}

              {/* TAB FASES (CREADOR MANUAL DE FASES + IMPORTADOR MARKDOWN + DRAG AND DROP) */}
              {activeTab === 'fases' && (
                <div className="space-y-6">
                  
                  {/* IMPORTADOR MARKDOWN & CREADOR MANUAL EN 2 COLUMNAS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* CREADOR MANUAL DE FASES CON CHECKLIST */}
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Layers className="w-4 h-4 text-[#FF5500]" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Crear Fase Manualmente</h4>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre de la Fase *</label>
                        <input
                          type="text"
                          placeholder="Ej: Kickoff & Levantamiento"
                          value={newPhaseName}
                          onChange={(e) => setNewPhaseName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Checklist / Tareas de la Fase</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ej: Aprobar brief de requerimientos"
                            value={newChecklistText}
                            onChange={(e) => setNewChecklistText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#FF5500]"
                          />
                          <button
                            type="button"
                            onClick={handleAddChecklistItem}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                          >
                            + Tarea
                          </button>
                        </div>

                        {newPhaseChecklist.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {newPhaseChecklist.map((task, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                                <span className="text-slate-700 font-medium">✓ {task}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChecklistItem(idx)}
                                  className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddManualPhase}
                        disabled={!newPhaseName.trim()}
                        className="w-full py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5 mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Fase a la Lista
                      </button>
                    </div>

                    {/* IMPORTADOR MARKDOWN */}
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 flex flex-col justify-center items-center text-center">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 w-full justify-center">
                        <FileCode2 className="w-4 h-4 text-slate-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Importar desde Markdown (.md)</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal max-w-xs">
                        Carga tu brief estructurado. Las líneas `#` se leen como Fases y `- [ ]` como tareas del checklist.
                      </p>
                      <label className="cursor-pointer bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs">
                        Subir archivo .md
                        <input type="file" accept=".md" className="hidden" onChange={handleFileUploadMD} />
                      </label>
                    </div>

                  </div>

                  {/* LISTA DE FASES APILADAS (CON DRAG & DROP Y BOTONES DE REORDENADO) */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Fases del Proyecto ({draft.customPhases.length})
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Arrastra con el ícono ⠿ o usa las flechas para reordenar las fases.
                      </span>
                    </div>

                    {draft.customPhases.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                        Aún no has agregado fases. Crea una manualmente arriba o sube un archivo Markdown.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {draft.customPhases.map((ph, index) => (
                          <div
                            key={ph.id}
                            draggable
                            onDragStart={(e) => handlePhaseDragStart(e, index)}
                            onDragOver={handlePhaseDragOver}
                            onDrop={(e) => handlePhaseDrop(e, index)}
                            className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Drag handle icon */}
                              <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-600 transition-colors shrink-0" title="Arrastrar para reordenar">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-800 text-xs font-extrabold flex items-center justify-center shrink-0 border border-cyan-100">
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-slate-800 truncate">{ph.label}</h5>
                                {ph.checklist && ph.checklist.length > 0 ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                      {ph.checklist.length} tareas en checklist
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">Sin tareas en checklist</span>
                                )}
                              </div>
                            </div>

                            {/* Acciones de Reordenado y Eliminación */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMovePhase(index, 'up')}
                                disabled={index === 0}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Mover arriba"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMovePhase(index, 'down')}
                                disabled={index === draft.customPhases.length - 1}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Mover abajo"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePhase(ph.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer ml-1 transition-colors"
                                title="Eliminar esta fase"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB INTEGRANTES: DRAG AND DROP */}
              {activeTab === 'integrantes' && (
                <div className="space-y-6 h-full flex flex-col">
                  <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full min-h-[350px]">
                    
                    {/* ROSTER LATERAL IZQUIERDO */}
                    <div className="w-full lg:w-1/3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col">
                      <div className="mb-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Roster de Integrantes</span>
                        <input 
                           type="text" 
                           placeholder="Buscar por nombre o rol..."
                           value={rosterSearch}
                           onChange={(e) => setRosterSearch(e.target.value)}
                           className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px]">
                        {filteredRoster.map(member => {
                          const isAssigned = draft.members.some(m => m.id === member.id);
                          return (
                            <div 
                              key={member.id} 
                              onClick={() => !isAssigned && handleAddMemberClick(member)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                isAssigned 
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-65' 
                                  : 'bg-white border-slate-200/60 hover:bg-slate-100 hover:border-slate-300 cursor-pointer shadow-xs'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <img src={member.avatar} className="w-7 h-7 rounded-full border border-slate-100 shadow-inner" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{member.name}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{member.roleBase}</span>
                                </div>
                              </div>
                              {!isAssigned && (
                                <span className="text-[10px] text-cyan-600 bg-cyan-50 font-bold px-2 py-0.5 rounded-lg border border-cyan-100">
                                  Añadir
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* DRAG AND DROP COLUMNS */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* COLUMNA 1: PRINCIPAL */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropToRole(e, 'Principal')}
                        className="bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-2xl flex flex-col min-h-[180px] transition-colors hover:bg-amber-50"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
                          <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                            👑 Principal ({draft.members.filter(m => m.participationRole === 'Principal').length})
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {draft.members.filter(m => m.participationRole === 'Principal').map(m => (
                            <div 
                              key={m.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, m.id)}
                              className="group flex items-center justify-between p-2 bg-white rounded-xl border border-amber-200/70 shadow-xs cursor-grab active:cursor-grabbing transition-all hover:border-amber-300"
                            >
                              <div className="flex items-center gap-2">
                                <img src={m.avatar} className="w-7 h-7 rounded-full shrink-0 shadow-inner" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{m.name}</span>
                                  <span className="text-[9px] text-slate-400 font-bold">{m.role}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* COLUMNA 2: APOYO */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropToRole(e, 'Apoyo')}
                        className="bg-blue-50/50 border border-blue-200/60 p-3.5 rounded-2xl flex flex-col min-h-[180px] transition-colors hover:bg-blue-50"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-blue-200 pb-2">
                          <span className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1">
                            🤝 Apoyo ({draft.members.filter(m => m.participationRole === 'Apoyo').length})
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {draft.members.filter(m => m.participationRole === 'Apoyo').map(m => (
                            <div 
                              key={m.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, m.id)}
                              className="group flex items-center justify-between p-2 bg-white rounded-xl border border-blue-200/70 shadow-xs cursor-grab active:cursor-grabbing transition-all hover:border-blue-300"
                            >
                              <div className="flex items-center gap-2">
                                <img src={m.avatar} className="w-7 h-7 rounded-full shrink-0 shadow-inner" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{m.name}</span>
                                  <span className="text-[9px] text-slate-400 font-bold">{m.role}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* COLUMNA 3: OBSERVADOR */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropToRole(e, 'Observador')}
                        className="bg-slate-100/50 border border-slate-300/60 p-3.5 rounded-2xl flex flex-col min-h-[180px] transition-colors hover:bg-slate-100"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-slate-300 pb-2">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            👁️ Observador ({draft.members.filter(m => m.participationRole === 'Observador').length})
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {draft.members.filter(m => m.participationRole === 'Observador').map(m => (
                            <div 
                              key={m.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, m.id)}
                              className="group flex items-center justify-between p-2 bg-white rounded-xl border border-slate-300/70 shadow-xs cursor-grab active:cursor-grabbing transition-all hover:border-slate-400"
                            >
                              <div className="flex items-center gap-2">
                                <img src={m.avatar} className="w-7 h-7 rounded-full shrink-0 shadow-inner" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{m.name}</span>
                                  <span className="text-[9px] text-slate-400 font-bold">{m.role}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Navegación Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
              <button 
                type="button"
                onClick={() => {
                  if (activeTab === 'integrantes') {
                    setActiveTab('fases');
                  } else if (activeTab === 'fases') {
                    setActiveTab('general');
                  } else {
                    setStep(1);
                  }
                }} 
                className="text-xs font-bold text-[#FF5500] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>

              {activeTab !== 'integrantes' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'general') {
                      setActiveTab('fases');
                    } else if (activeTab === 'fases') {
                      setActiveTab('integrantes');
                    }
                  }}
                  className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Siguiente
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleFinish} 
                  disabled={!draft.projectName.trim() || !draft.clientName.trim()}
                  className="px-8 py-3 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-40"
                >
                  Crear Proyecto
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
