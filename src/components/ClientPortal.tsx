import React, { useState, useMemo } from 'react';
import { Project, DeliverableItem } from '../types';
import {
  FileVideo,
  FileAudio,
  FileText,
  Image,
  Link,
  LogOut,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Clock,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface ClientPortalProps {
  project: Project;
  projects?: Project[];
  onSelectProject?: (projectId: string) => void;
  onAddAnnotation: (deliverableId: string, comment: string) => void;
  onUpdateDeliverableStatus?: (deliverableId: string, newStatus: 'aprobado' | 'rechazado', comment?: string) => void;
  onLogout: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  project,
  projects = [],
  onSelectProject,
  onAddAnnotation,
  onUpdateDeliverableStatus,
  onLogout
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendientes' | 'aprobados' | 'rechazados'>('todos');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<{ id: string; text: string } | null>(null);

  const visibleDeliverables = useMemo(() => {
    const list = project?.deliverables?.filter((d) => d.isVisibleToClient) || [];
    if (filterStatus === 'todos') return list;
    if (filterStatus === 'pendientes') return list.filter((d) => !d.status || d.status === 'pendiente' || d.status === 'en_revision');
    if (filterStatus === 'aprobados') return list.filter((d) => d.status === 'aprobado');
    if (filterStatus === 'rechazados') return list.filter((d) => d.status === 'rechazado');
    return list;
  }, [project, filterStatus]);

  const handleSend = (deliverableId: string) => {
    if (!commentText.trim()) return;
    onAddAnnotation(deliverableId, commentText);
    setCommentText('');
  };

  const handleApprove = (deliverableId: string) => {
    if (onUpdateDeliverableStatus) {
      onUpdateDeliverableStatus(deliverableId, 'aprobado');
      setActionSuccessMsg({ id: deliverableId, text: 'Entregable aprobado con éxito. El equipo ha sido notificado.' });
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleRequestCorrections = (deliverableId: string) => {
    if (!commentText.trim()) {
      setSelectedId(deliverableId);
      alert('Por favor escribe en el campo de texto las observaciones o correcciones requeridas antes de solicitar cambios.');
      return;
    }
    if (onUpdateDeliverableStatus) {
      onUpdateDeliverableStatus(deliverableId, 'rechazado', commentText.trim());
      setActionSuccessMsg({ id: deliverableId, text: 'Observaciones enviadas al equipo de producción.' });
      setCommentText('');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const getDeliverableIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <FileVideo className="w-5 h-5 text-indigo-500" />;
      case 'audio':
        return <FileAudio className="w-5 h-5 text-emerald-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'word':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-amber-500" />;
      case 'markdown':
        return <FileText className="w-5 h-5 text-slate-500" />;
      default:
        return <Link className="w-5 h-5 text-sky-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'aprobado') {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprobado por Cliente
        </span>
      );
    }
    if (status === 'rechazado') {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
          <AlertCircle className="w-3 h-3 text-rose-600" /> Requiere Corrección
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
        <Clock className="w-3 h-3 text-amber-600" /> Pendiente de Aprobación
      </span>
    );
  };

  const allVisibleCount = (project?.deliverables || []).filter(d => d.isVisibleToClient).length;
  const approvedCount = (project?.deliverables || []).filter(d => d.isVisibleToClient && d.status === 'aprobado').length;
  const pendingCount = (project?.deliverables || []).filter(d => d.isVisibleToClient && (!d.status || d.status === 'pendiente' || d.status === 'en_revision')).length;
  const rejectedCount = (project?.deliverables || []).filter(d => d.isVisibleToClient && d.status === 'rechazado').length;

  return (
    <div className="min-h-screen bg-[#F4F5F0] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white py-4 px-6 sticky top-0 z-10 shadow-xs border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs">
              {project?.name ? project.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest bg-stone-100 px-2.5 py-0.5 rounded-full">
                  Portal de Cliente
                </span>
                <span className="text-xs text-slate-400 font-normal">• Acceso Seguro</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{project?.name || 'Proyecto de Marca'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Selector de proyecto si tiene más de 1 asignado */}
            {projects.length > 1 && onSelectProject && (
              <div className="relative">
                <select
                  value={project?.id}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="bg-[#F4F5F0] border border-stone-200 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-7 appearance-none shadow-2xs"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            <div className="hidden sm:block text-right pr-2">
              <p className="text-xs font-bold text-slate-800">{project?.clientContact || 'Contacto Principal'}</p>
              <p className="text-xs text-slate-500 font-medium">{project?.clientName || 'Cliente'}</p>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-rose-600 bg-[#F4F5F0] hover:bg-rose-50 px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-700" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Project Intro Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200/70 relative overflow-hidden">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acerca de este Proyecto</h2>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Revisión & Aprobación de Entregables</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {project?.description || 'Bienvenido a tu portal corporativo. Revisa cada entregable listo, añade anotaciones específicas para el equipo creativo o aprueba formalmente para avanzar a la siguiente etapa.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#F4F5F0] rounded-2xl space-y-1 border border-stone-200/60">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Objetivo Clave</span>
                <p className="text-xs text-slate-800 font-semibold">{project?.objective || 'Definido al iniciar'}</p>
              </div>
              <div className="p-4 bg-[#F4F5F0] rounded-2xl space-y-1 border border-stone-200/60">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alcance Acordado</span>
                <p className="text-xs text-slate-800 font-semibold">{project?.alcance || 'Establecido en contrato'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-800" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Catálogo de Entregables ({allVisibleCount})
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-stone-200/80 shadow-2xs text-xs font-bold">
              <button
                onClick={() => setFilterStatus('todos')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  filterStatus === 'todos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({allVisibleCount})
              </button>
              <button
                onClick={() => setFilterStatus('pendientes')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  filterStatus === 'pendientes' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pendientes ({pendingCount})
              </button>
              <button
                onClick={() => setFilterStatus('aprobados')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  filterStatus === 'aprobados' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aprobados ({approvedCount})
              </button>
              <button
                onClick={() => setFilterStatus('rechazados')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  filterStatus === 'rechazados' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Correcciones ({rejectedCount})
              </button>
            </div>
          </div>

          {visibleDeliverables.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xs border border-stone-200/70 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-[#F4F5F0] rounded-full flex items-center justify-center text-slate-400">
                <AlertCircle className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">No hay entregables en este filtro</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm font-normal">
                  No se encontraron archivos en la categoría seleccionada.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleDeliverables.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200/70 flex flex-col justify-between hover:shadow-md transition-all space-y-4 relative"
                >
                  {/* Mensaje de acción exitosa */}
                  {actionSuccessMsg?.id === item.id && (
                    <div className="absolute top-3 left-3 right-3 bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-xl flex items-center gap-2 z-20 animate-in fade-in">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{actionSuccessMsg.text}</span>
                    </div>
                  )}

                  {/* File Metadata */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase px-3 py-1 bg-[#F4F5F0] text-slate-700 rounded-full tracking-wider flex items-center gap-1.5">
                        {getDeliverableIcon(item.type)}
                        {item.type}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{item.title}</h3>
                      <p className="text-xs text-slate-400 font-normal">
                        Subido por: <strong className="text-slate-700 font-semibold">{item.uploadedBy || 'Coordinador'}</strong>
                        <span className="mx-1">•</span>
                        <span className="font-mono text-2xs">{new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      </p>
                    </div>

                    {/* View/Download link if available */}
                    {(item.externalUrl || item.fileUrl) && (
                      <a
                        href={item.externalUrl || item.fileUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-900 font-bold hover:bg-stone-200 bg-[#F4F5F0] px-3.5 py-1.5 rounded-full transition-all border border-stone-200/60"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-800" />
                        <span>Abrir Entregable / Previsualizar</span>
                      </a>
                    )}
                  </div>

                  {/* Client Decision Actions */}
                  {onUpdateDeliverableStatus && (
                    <div className="bg-[#F4F5F0] p-3 rounded-2xl flex items-center justify-between gap-2 border border-stone-200/60">
                      <span className="text-xs font-bold text-slate-600">Resolución de Cliente:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            item.status === 'aprobado'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{item.status === 'aprobado' ? 'Aprobado ✓' : 'Aprobar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestCorrections(item.id)}
                          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            item.status === 'rechazado'
                              ? 'bg-rose-600 text-white'
                              : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300'
                          }`}
                          title="Escribe tus observaciones abajo y haz clic aquí para solicitar corrección"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Pedir Cambios</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comments / Feedback System */}
                  <div className="border-t border-stone-100 pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-800" />
                        Comentarios e Indicaciones ({item.annotations?.length || 0})
                      </span>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {(!item.annotations || item.annotations.length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-2">No hay comentarios en este entregable. Agrega tus observaciones abajo.</p>
                      ) : (
                        item.annotations.map((ann) => (
                          <div key={ann.id} className="bg-[#F4F5F0] p-3 rounded-2xl text-xs space-y-1 border border-stone-200/50">
                            <div className="flex justify-between items-center text-xs text-slate-400">
                              <span className="font-bold text-slate-800">{ann.authorName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-2xs">{ann.date}</span>
                                {ann.status === 'resuelto' ? (
                                  <span className="text-2xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Resuelto
                                  </span>
                                ) : (
                                  <span className="text-2xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-800 whitespace-pre-wrap">{ann.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Annotation input form */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Escribe una observación o detalles de corrección..."
                        className="flex-1 bg-[#F4F5F0] rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all placeholder:text-slate-400 border border-stone-200/50"
                        value={selectedId === item.id ? commentText : ''}
                        onFocus={() => setSelectedId(item.id)}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSend(item.id);
                        }}
                      />
                      <button
                        onClick={() => handleSend(item.id)}
                        className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-full text-xs hover:bg-slate-800 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        Comentar
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-6 px-6 mt-12 text-center text-xs text-slate-400 border-t border-stone-200/60">
        <p>© 2026 {project?.clientName || 'SaaS Client Portal'}. Plataforma de Control de Fases & Entregables.</p>
      </footer>
    </div>
  );
};
