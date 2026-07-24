import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  LogOut, 
  Mic,
  Shield,
  Activity,
  Layers,
  Building2
} from 'lucide-react';
import { Project, UserSession, getUserAvatarUrl } from '../types';
import { AIAssistantModal } from './AIAssistantModal';

export type ViewState = 'dashboard' | 'planner' | 'team' | 'project' | 'gantt' | 'clients';

interface MainLayoutProps {
  currentUser: { username: string; role: string; puesto?: string };
  onLogout: () => void;
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  projects: Project[];
  users: UserSession[];
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  currentUser, 
  onLogout, 
  children,
  currentView,
  onNavigate,
  projects,
  users
}) => {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans" id="main-layout-container">
      
      {/* ⬛ ZONA 1: SIDEBAR OSCURO (El Ancla) */}
      <aside className="w-[240px] bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800" id="dark-sidebar">
        
        <div className="overflow-y-auto flex-1">
          {/* Logo / Branding */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-md shadow-orange-950/20">
              <Shield className="w-4 h-4 text-white font-black" />
            </div>
            <div>
              <span className="text-white font-black text-xs tracking-tight block uppercase">Operations Atelier</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Herramienta Interna</span>
            </div>
          </div>

          {/* Navegación Principal Agrupada */}
          <nav className="p-4 space-y-4" id="sidebar-nav">
            
            {/* GRUPO: OPERACIÓN */}
            <div className="space-y-1">
              <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Operación
              </div>
              {currentUser.role === 'coordinador' && (
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    currentView === 'dashboard' 
                      ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                      : 'text-slate-450 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  Torre de Control
                </button>
              )}
              
              <button 
                onClick={() => onNavigate('planner')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'planner' 
                    ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                    : 'text-slate-450 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                Planner Diario
              </button>

              <button 
                onClick={() => onNavigate('gantt')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'gantt' 
                    ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                    : 'text-slate-450 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                Línea de Tiempo
              </button>
            </div>

            {/* GRUPO: PROYECTO */}
            <div className="space-y-1">
              <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Proyecto
              </div>
              <button 
                onClick={() => onNavigate('project')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'project' 
                    ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                    : 'text-slate-450 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                Expediente del Proyecto
              </button>
            </div>

            {/* GRUPO: ADMINISTRACIÓN */}
            <div className="space-y-1">
              <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Administración
              </div>
              {currentUser.role === 'coordinador' && (
                <button 
                  onClick={() => onNavigate('team')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    currentView === 'team' 
                      ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                      : 'text-slate-450 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  Equipo
                </button>
              )}

              {currentUser.role === 'coordinador' && (
                <button 
                  onClick={() => onNavigate('clients')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    currentView === 'clients' 
                      ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                      : 'text-slate-450 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  Clientes y Marca IA
                </button>
              )}
            </div>

          </nav>
        </div>

        {/* Módulo Inferior: Usuario, Asistente y Salida */}
        <div className="p-4 border-t border-slate-800/80 space-y-3.5 bg-slate-950/20">
          
          {/* Botón flotante preparado para el Asistente IA (Dictar Avance) */}
          <button 
            onClick={() => setIsAIAssistantOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-lime-400 rounded-full transition-colors border border-slate-700/60 border-dashed text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            Dictar Avance
          </button>

          {/* Perfil de Usuario */}
          <div className="flex items-center gap-3 px-1 py-1 border-t border-slate-800/40 pt-3">
            <div className="w-9 h-9 rounded-full border border-slate-700 shadow-xs overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
              <img 
                src={getUserAvatarUrl(currentUser.username)} 
                alt={currentUser.username} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-white font-bold text-xs truncate capitalize leading-tight">{currentUser.username}</div>
              <div className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-wider mt-0.5">
                {currentUser.puesto || currentUser.role}
              </div>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Salir del Sistema
          </button>
        </div>
      </aside>

      {/* ⬜ ZONA 2: CONTENEDOR PRINCIPAL DINÁMICO */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden" id="main-content-area">
        {children}
      </main>

      <AIAssistantModal 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
        projects={projects}
        users={users}
      />

    </div>
  );
};
