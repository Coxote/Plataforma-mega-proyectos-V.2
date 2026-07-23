import React, { useState } from 'react';
import { Project, DeliverableItem } from '../types';
import { FileVideo, FileAudio, FileText, Image, Link, LogOut, CheckCircle2, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react';

interface ClientPortalProps {
  project: Project;
  onAddAnnotation: (deliverableId: string, comment: string) => void;
  onLogout: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({ project, onAddAnnotation, onLogout }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const visibleDeliverables = project?.deliverables?.filter((d) => d.isVisibleToClient) || [];

  const handleSend = (deliverableId: string) => {
    if (!commentText.trim()) return;
    onAddAnnotation(deliverableId, commentText);
    setCommentText('');
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

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime-500 rounded-xl flex items-center justify-center font-bold text-slate-900 shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-lime-700 uppercase tracking-widest bg-lime-100 px-2 py-0.5 rounded-md">
                  Portal de Cliente
                </span>
                <span className="text-[11px] text-slate-400">• Acceso Autorizado</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{project?.name || 'Proyecto de Marca'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-700">{project?.clientContact || 'Contacto Principal'}</p>
              <p className="text-[10px] text-slate-400">{project?.clientName || 'Cliente'}</p>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-all border border-slate-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Project Intro Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-100/30 rounded-full blur-2xl pointer-events-none" />
          <div className="max-w-3xl space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acerca del Proyecto</h2>
            <h3 className="text-xl font-bold font-playfair text-slate-900">Seguimiento de Entregables</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {project?.description || 'Bienvenido a tu portal personalizado. Aquí podrás revisar los entregables aprobados y listos para tu feedback en tiempo real. Utiliza la sección de anotaciones debajo de cada tarjeta para informarnos sobre cualquier cambio necesario.'}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Objetivo Clave</span>
                <p className="text-xs text-slate-700 font-medium">{project?.objective || 'Definido al iniciar'}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Alcance Acordado</span>
                <p className="text-xs text-slate-700 font-medium">{project?.alcance || 'Establecido en contrato'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables Grid Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                📦 Entregables Públicos para Revisión ({visibleDeliverables.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">Total de archivos publicados</span>
          </div>

          {visibleDeliverables.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">No hay entregables disponibles</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Su coordinador de proyectos no ha publicado ningún archivo para revisión en esta fase todavía.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleDeliverables.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all space-y-4">
                  
                  {/* File Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-1 bg-slate-100 text-slate-600 rounded-md tracking-wider flex items-center gap-1.5">
                        {getDeliverableIcon(item.type)}
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 text-sm leading-snug">{item.title}</h3>
                      <p className="text-[11px] text-slate-400">Subido por: {item.uploadedBy || 'Coordinador'}</p>
                    </div>

                    {/* View/Download link if available */}
                    {(item.externalUrl || item.fileUrl) && (
                      <a
                        href={item.externalUrl || item.fileUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-lime-700 font-semibold hover:text-slate-900 bg-lime-50 hover:bg-lime-100 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Entregable</span>
                      </a>
                    )}
                  </div>

                  {/* Comments / Feedback System */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        Comentarios e Indicaciones ({item.annotations?.length || 0})
                      </span>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {(!item.annotations || item.annotations.length === 0) ? (
                        <p className="text-[11px] text-slate-400 italic py-2">No hay comentarios en este entregable. Agrega uno abajo.</p>
                      ) : (
                        item.annotations.map((ann) => (
                          <div key={ann.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="font-bold text-slate-600">{ann.authorName}</span>
                              <div className="flex items-center gap-1.5">
                                <span>{ann.date}</span>
                                {ann.status === 'resuelto' ? (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1 py-0.2 rounded-md flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2 h-2" /> Resuelto
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1 py-0.2 rounded-md">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{ann.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Annotation input form */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Escribe una observación o solicita cambios..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white focus:border-lime-500 transition-all placeholder:text-slate-400"
                        value={selectedId === item.id ? commentText : ''}
                        onFocus={() => setSelectedId(item.id)}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSend(item.id);
                        }}
                      />
                      <button
                        onClick={() => handleSend(item.id)}
                        className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-800 active:scale-95 transition-all shadow-xs shrink-0"
                      >
                        Enviar
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
      <footer className="bg-white border-t border-slate-200 py-4 px-6 mt-12 text-center text-xs text-slate-400">
        <p>© 2026 {project?.clientName || 'SaaS Client Portal'}. Con tecnología de Herramienta Interna de Fases.</p>
      </footer>
    </div>
  );
};
