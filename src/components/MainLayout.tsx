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
import { Project, UserSession } from '../types';
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
        
        <div>
          {/* Logo / Branding */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center shadow-md shadow-lime-900/10">
              <Shield className="w-4 h-4 text-slate-950 font-black" />
            </div>
            <div>
              <span className="text-white font-black text-sm tracking-tight block">Fases SaaS</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Herramienta Interna</span>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="p-4 space-y-1.5" id="sidebar-nav">
            {currentUser.role === 'coordinador' && (
              <button 
                onClick={() => onNavigate('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'dashboard' 
                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                Torre de Control
              </button>
            )}
            
            <button 
              onClick={() => onNavigate('planner')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'planner' 
                  ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              Planner Dailys
            </button>

            <button 
              onClick={() => onNavigate('gantt')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'gantt' 
                  ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              Línea de Tiempo (Gantt)
            </button>

            <button 
              onClick={() => onNavigate('project')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'project' 
                  ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              Ficha de Proyecto
            </button>

            {currentUser.role === 'coordinador' && (
              <button 
                onClick={() => onNavigate('team')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'team' 
                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                Gestión de Equipo
              </button>
            )}

            {currentUser.role === 'coordinador' && (
              <button 
                onClick={() => onNavigate('clients')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'clients' 
                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                Clientes & Brand Bibles
              </button>
            )}
          </nav>
        </div>

        {/* Módulo Inferior: Usuario, Asistente y Salida */}
        <div className="p-4 border-t border-slate-800/80 space-y-3.5 bg-slate-950/20">
          
          {/* Botón flotante preparado para el Asistente IA (Dictar Avance) */}
          <button 
            onClick={() => setIsAIAssistantOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-lime-400 rounded-xl transition-colors border border-slate-700/60 border-dashed text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            Dictar Avance
          </button>

          {/* Perfil de Usuario */}
          <div className="flex items-center gap-3 px-1 py-1 border-t border-slate-800/40 pt-3">
            <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-white font-bold capitalize select-none">
              {currentUser.username.charAt(0)}
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
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
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
