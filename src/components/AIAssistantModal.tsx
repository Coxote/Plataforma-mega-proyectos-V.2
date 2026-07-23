import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  TrendingUp, 
  Briefcase, 
  Users, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Project, UserSession } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  users: UserSession[];
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const QUICK_SUGGESTIONS = [
  "¿Quién tiene más carga operativa esta semana?",
  "¿Cómo va el estado de las fases activas de los proyectos?",
  "¿Qué colaboradores están disponibles para nuevas tareas?",
  "Ayúdame a formatear un avance que acabo de terminar"
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  projects = [],
  users = []
}) => {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: '¡Hola! Soy tu Asistente Operativo de IA. Puedo responder tus consultas sobre el estado de los proyectos, la carga de trabajo del equipo, la disponibilidad del personal, o ayudarte a estructurar tus dictados de avance. ¿En qué te puedo apoyar hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Close modal on Escape press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clean up recording if modal is closed or unmounts
  useEffect(() => {
    if (!isOpen && isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (err) {
        console.error('Error stopping speech recognition on close:', err);
      }
    }
  }, [isOpen, isRecording]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Scroll to bottom whenever messages change or modal is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [messages, isLoading, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'es-ES';

      rec.onstart = () => {
        setIsRecording(true);
        setRecordingError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => prev ? prev + ' ' + transcript : transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setRecordingError('Permiso de micrófono denegado.');
        } else if (event.error === 'no-speech') {
          setRecordingError('No se detectó voz.');
        } else {
          setRecordingError('Error al capturar voz.');
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    } else {
      setIsSpeechSupported(false);
    }
  }, []);

  const handleToggleRecording = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      setRecordingError('Tu navegador no es compatible con el dictado por voz.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Clear input
    setInputText('');
    setRecordingError(null);

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Append user message
    const userMsg: ChatMessage = {
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          users: users,
          projects: projects,
          history: messages.map(m => ({ role: m.sender, text: m.text }))
        })
      });

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        throw new Error(errObj.error || `Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: data.reply || 'No se recibió respuesta válida del asistente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error in assistant query:', err);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `Lo siento, ocurrió un error al consultar al servicio de IA: ${err.message || 'Error desconocido'}.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6" 
      id="ai-assistant-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      
      {/* Container */}
      <div 
        className="bg-white w-full max-w-2xl h-[600px] rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
        id="ai-assistant-modal-panel"
      >
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 relative overflow-hidden shrink-0">
          <div className="absolute right-0 bottom-0 top-0 w-32 bg-gradient-to-l from-lime-500/10 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-3 z-10">
            <div className="w-9 h-9 bg-lime-400 rounded-xl flex items-center justify-center shadow-md shadow-lime-900/20">
              <Sparkles className="w-5 h-5 text-slate-950 font-black animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                <h3 className="font-black text-sm text-white uppercase tracking-wider">Copiloto Operativo IA</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Modelo: Gemini 3.6-Flash</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
            title="Cerrar Asistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages-container">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    msg.sender === 'user' 
                      ? 'bg-slate-900 text-white border-slate-800' 
                      : 'bg-white text-lime-600 border-slate-200 shadow-xs'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/60'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className={`text-[8.5px] font-semibold mt-1.5 block ${
                      msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Loader */}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-white text-lime-600 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white border border-slate-200/60 p-4 rounded-2xl rounded-tl-none flex items-center gap-2.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-lime-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-lime-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-lime-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Recording Feedback Banner */}
            {isRecording && (
              <div className="bg-lime-50 border-t border-b border-lime-100 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-bold text-lime-800">Grabando dictado de voz... Habla ahora</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-1 h-3.5 bg-lime-600 animate-pulse rounded" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-5 bg-lime-600 animate-pulse rounded" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2.5 bg-lime-600 animate-pulse rounded" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-4 bg-lime-600 animate-pulse rounded" style={{ animationDelay: '450ms' }} />
                </div>
              </div>
            )}

            {/* Error Banner */}
            {recordingError && (
              <div className="bg-rose-50 border-t border-b border-rose-100 px-4 py-2.5 flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{recordingError}</span>
              </div>
            )}

            {/* Bottom Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputText);
                }}
                className="flex items-center gap-2.5"
              >
                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    !isSpeechSupported
                      ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                      : isRecording 
                      ? 'bg-red-500 border-red-600 text-white animate-pulse' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title={
                    !isSpeechSupported 
                      ? 'Tu navegador no soporta dictado por voz (Prueba con Chrome)' 
                      : isRecording 
                      ? 'Detener grabación' 
                      : 'Dictar avance por voz'
                  }
                  disabled={!isSpeechSupported}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe tu consulta o haz clic en el micrófono para dictar..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all text-slate-800"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() && !isRecording}
                  className="p-3.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

          {/* Sidebar Panel with Suggestions */}
          <div className="w-full md:w-[220px] bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-4 space-y-4 shrink-0 overflow-y-auto">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-lime-600" /> Consultas Rápidas
              </h4>
              <div className="space-y-2">
                {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="w-full text-left bg-white hover:bg-slate-100/80 border border-slate-200/80 p-2.5 rounded-xl text-[10px] font-bold text-slate-650 leading-normal transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Integración Activa</span>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                <Users className="w-3.5 h-3.5 text-lime-600" />
                <span>{users.length} Colaboradores</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                <span>{projects.length} Proyectos</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
