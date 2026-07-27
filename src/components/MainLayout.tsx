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
  Building2,
  Clock,
  User,
  Plus,
  Menu,
  X
} from 'lucide-react';
import { Project, UserSession, TimeEntryType, getUserAvatarUrl } from '../types';
import { AIAssistantModal } from './AIAssistantModal';
import { GlobalLogTimeModal } from './GlobalLogTimeModal';

export type ViewState = 'dashboard' | 'planner' | 'team' | 'project' | 'gantt' | 'clients' | 'profile';

interface MainLayoutProps {
  currentUser: UserSession;
  onLogout: () => void;
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  projects: Project[];
  users: UserSession[];
  onLogTimeGlobal: (
    projectId: string,
    phaseId: string,
    hours: number,
    description: string,
    type: TimeEntryType,
    retrabajoOrigen?: 'cliente' | 'interno' | 'proveedor',
    retrabajoMotivo?: string
  ) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  currentUser, 
  onLogout, 
  children,
  currentView,
  onNavigate,
  projects,
  users,
  onLogTimeGlobal
}) => {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isGlobalLogTimeOpen, setIsGlobalLogTimeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="overflow-y-auto flex-1">
        {/* Logo / Branding */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-md shadow-orange-950/20">
              <Shield className="w-4 h-4 text-white font-black" />
            </div>
            <div>
              <span className="text-white font-black text-xs tracking-tight block uppercase">Operations Atelier</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Herramienta Interna</span>
            </div>
          </div>
          {isMobileMenuOpen && (
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* BOTÓN DE CARGA RÁPIDA DE HORAS GLOBAL */}
        <div className="p-3 pb-1">
          <button
            onClick={() => {
              setIsGlobalLogTimeOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl transition-all cursor-pointer text-xs font-black shadow-md shadow-orange-950/30 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            Registrar Horas
          </button>
        </div>

        {/* Navegación Principal Agrupada */}
        <nav className="p-3 sm:p-4 space-y-4" id="sidebar-nav">
          
          {/* GRUPO: OPERACIÓN */}
          <div className="space-y-1">
            <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Operación
            </div>
            {currentUser.role === 'coordinador' && (
              <button 
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'dashboard' 
                    ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                Torre de Control
              </button>
            )}
            
            <button 
              onClick={() => handleNavClick('planner')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                currentView === 'planner' 
                  ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              Planner Diario
            </button>

            <button 
              onClick={() => handleNavClick('gantt')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                currentView === 'gantt' 
                  ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
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
              onClick={() => handleNavClick('project')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                currentView === 'project' 
                  ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              Expediente del Proyecto
            </button>
          </div>

          {/* GRUPO: ADMINISTRACIÓN & PERFIL */}
          <div className="space-y-1">
            <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Mi Espacio
            </div>
            <button 
              onClick={() => handleNavClick('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                currentView === 'profile' 
                  ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              Mi Perfil y Horas
            </button>

            {currentUser.role === 'coordinador' && (
              <button 
                onClick={() => handleNavClick('team')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'team' 
                    ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                Equipo
              </button>
            )}

            {currentUser.role === 'coordinador' && (
              <button 
                onClick={() => handleNavClick('clients')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'clients' 
                    ? 'bg-orange-600 text-white shadow-none border border-orange-500' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
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
      <div className="p-3 sm:p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/20 shrink-0">
        
        {/* Botón flotante preparado para el Asistente IA (Dictar Avance) */}
        <button 
          onClick={() => {
            setIsAIAssistantOpen(true);
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-lime-400 rounded-full transition-colors border border-slate-700/60 border-dashed text-[10px] font-bold uppercase tracking-wider cursor-pointer min-h-[38px]"
        >
          <Mic className="w-3.5 h-3.5" />
          Dictar Avance
        </button>

        {/* Perfil de Usuario */}
        <div 
          onClick={() => handleNavClick('profile')}
          className="flex items-center gap-3 px-1 py-1 border-t border-slate-800/40 pt-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          title="Ver Mi Perfil"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-700 shadow-xs overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
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
          onClick={() => {
            onLogout();
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer text-xs font-semibold min-h-[38px]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Salir del Sistema
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-50 overflow-hidden font-sans" id="main-layout-container">
      
      {/* 📱 MOBILE TOP HEADER BAR */}
      <header className="md:hidden bg-slate-900 text-white p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-600 rounded-md flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white font-black" />
            </div>
            <span className="text-white font-black text-xs uppercase tracking-tight truncate max-w-[150px]">Atelier</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGlobalLogTimeOpen(true)}
            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[11px] font-black transition-all flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Horas
          </button>

          <div 
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full border border-slate-700 overflow-hidden bg-slate-800 cursor-pointer"
          >
            <img 
              src={getUserAvatarUrl(currentUser.username)} 
              alt={currentUser.username} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* 📱 MOBILE DRAWER SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fadeIn">
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] bg-slate-900 text-slate-300 h-full shadow-2xl z-10 flex flex-col animate-slideRight">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* ⬛ ZONA 1: SIDEBAR OSCURO DESKTOP (El Ancla) */}
      <aside className="hidden md:flex w-[240px] bg-slate-900 text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800" id="dark-sidebar">
        {renderSidebarContent()}
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

      <GlobalLogTimeModal
        isOpen={isGlobalLogTimeOpen}
        onClose={() => setIsGlobalLogTimeOpen(false)}
        currentUser={currentUser}
        projects={projects}
        onLogTime={onLogTimeGlobal}
      />

    </div>
  );
};
