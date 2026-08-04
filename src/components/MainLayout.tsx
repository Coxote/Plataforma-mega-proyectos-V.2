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
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  DollarSign
} from 'lucide-react';
import { Project, UserSession, TimeEntryType, getUserAvatarUrl } from '../types';
import { TppLogo } from './TppLogo';
import { AIAssistantModal } from './AIAssistantModal';
import { GlobalLogTimeModal } from './GlobalLogTimeModal';

export type ViewState = 'dashboard' | 'planner' | 'team' | 'project' | 'gantt' | 'clients' | 'profile' | 'financial';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleNavClick = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="overflow-y-auto flex-1 scrollbar-none">
        {/* Logo / Branding TPP HUB DIGITAL */}
        <div className={`p-4 border-b border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {!isCollapsed ? (
              <TppLogo size="sm" variant="full" darkMode={true} />
            ) : (
              <TppLogo size="sm" variant="icon" darkMode={true} />
            )}
          </div>
          
          {/* Collapse/Expand Toggle Button on Desktop */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? "Expandir barra lateral" : "Minimizar barra lateral"}
            aria-label={isCollapsed ? "Expandir barra lateral" : "Minimizar barra lateral"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

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
        <div className={`p-3 pb-1 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => {
              setIsGlobalLogTimeOpen(true);
              setIsMobileMenuOpen(false);
            }}
            title="Registrar Horas"
            className={`flex items-center justify-center gap-2 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-2xl transition-all cursor-pointer text-xs font-black shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] ${
              isCollapsed ? 'w-10 h-10 p-0' : 'w-full px-3 py-2.5 min-h-[40px]'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0 text-white" />
            {!isCollapsed && <span>Registrar Horas</span>}
          </button>
        </div>

        {/* Navegación Principal Agrupada */}
        <nav className={`p-3 space-y-4 ${isCollapsed ? 'px-2' : 'sm:p-4'}`} id="sidebar-nav">
          
          {/* GRUPO: OPERACIÓN */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Operación
              </div>
            ) : (
              <div className="w-8 h-px bg-slate-800 my-2 mx-auto" />
            )}

            {currentUser.role === 'coordinador' && (
              <button 
                onClick={() => handleNavClick('dashboard')}
                title="Torre de Control"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'dashboard' 
                    ? 'bg-gradient-to-r from-[#FF5500]/90 to-[#E04B00]/90 text-white shadow-lg shadow-orange-500/25 border border-white/30 backdrop-blur-xl font-black scale-[1.01]' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Torre de Control</span>}
              </button>
            )}
            
            {currentUser.role !== 'proveedor' && (
              <button 
                onClick={() => handleNavClick('planner')}
                title="Planner Diario"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'planner' 
                    ? 'bg-gradient-to-r from-[#FF5500]/90 to-[#E04B00]/90 text-white shadow-lg shadow-orange-500/25 border border-white/30 backdrop-blur-xl font-black scale-[1.01]' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Planner Diario</span>}
              </button>
            )}

            {currentUser.role !== 'proveedor' && (
              <button 
                onClick={() => handleNavClick('gantt')}
                title="Línea de Tiempo"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'gantt' 
                    ? 'bg-gradient-to-r from-[#FF5500]/90 to-[#E04B00]/90 text-white shadow-lg shadow-orange-500/25 border border-white/30 backdrop-blur-xl font-black scale-[1.01]' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Línea de Tiempo</span>}
              </button>
            )}
          </div>

          {/* GRUPO: PROYECTO */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Proyecto
              </div>
            ) : (
              <div className="w-8 h-px bg-slate-800 my-2 mx-auto" />
            )}
            <button 
              onClick={() => handleNavClick('project')}
              title="Expediente del Proyecto"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                currentView === 'project' 
                  ? 'bg-gradient-to-r from-[#FF5500]/90 to-[#E04B00]/90 text-white shadow-lg shadow-orange-500/25 border border-white/30 backdrop-blur-xl font-black scale-[1.01]' 
                  : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Expediente del Proyecto</span>}
            </button>
          </div>

          {/* GRUPO: ADMINISTRACIÓN & PERFIL */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Mi Espacio
              </div>
            ) : (
              <div className="w-8 h-px bg-slate-800 my-2 mx-auto" />
            )}
            <button 
              onClick={() => handleNavClick('profile')}
              title="Mi Perfil y Horas"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                currentView === 'profile' 
                  ? 'bg-gradient-to-r from-[#FF5500]/90 to-[#E04B00]/90 text-white shadow-lg shadow-orange-500/25 border border-white/30 backdrop-blur-xl font-black scale-[1.01]' 
                  : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Mi Perfil y Horas</span>}
            </button>

            {currentUser.role === 'coordinador' && (
              <button 
                onClick={() => handleNavClick('team')}
                title="Equipo"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'team' 
                    ? 'bg-gradient-to-r from-[#FF5500]/90 to-[#E04B00]/90 text-white shadow-lg shadow-orange-500/25 border border-white/30 backdrop-blur-xl font-black scale-[1.01]' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Equipo</span>}
              </button>
            )}

            {(currentUser.role === 'coordinador' || currentUser.role === 'director_financiero' || currentUser.role === 'supervisor') && (
              <button 
                onClick={() => handleNavClick('clients')}
                title="Clientes y Marca IA"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'clients' 
                    ? 'bg-gradient-to-r from-[#FF5500]/90 to-[#E04B00]/90 text-white shadow-lg shadow-orange-500/25 border border-white/30 backdrop-blur-xl font-black scale-[1.01]' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Clientes y Marca IA</span>}
              </button>
            )}

            {(currentUser.role === 'coordinador' || currentUser.role === 'director_financiero' || currentUser.role === 'supervisor') && (
              <button 
                onClick={() => handleNavClick('financial')}
                title="Salud Financiera"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  currentView === 'financial' 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25 border border-white/30 backdrop-blur-xl font-black scale-[1.01]' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
                {!isCollapsed && <span>Salud Financiera</span>}
              </button>
            )}
          </div>

        </nav>
      </div>

      {/* Módulo Inferior: Usuario, Asistente y Salida */}
      <div className={`p-3 border-t border-slate-800/80 space-y-3 bg-slate-950/20 shrink-0 ${isCollapsed ? 'px-2' : 'sm:p-4'}`}>
        
        {/* Botón flotante preparado para el Asistente IA (Dictar Avance) */}
        <button 
          onClick={() => {
            setIsAIAssistantOpen(true);
            setIsMobileMenuOpen(false);
          }}
          title="Dictar Avance con IA"
          className={`flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-lime-400 rounded-full transition-colors border border-slate-700/60 border-dashed text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
            isCollapsed ? 'w-10 h-10 p-0 mx-auto' : 'w-full px-3 py-2.5 min-h-[38px]'
          }`}
        >
          <Mic className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Dictar Avance</span>}
        </button>

        {/* Perfil de Usuario */}
        <div 
          onClick={() => handleNavClick('profile')}
          className={`flex items-center gap-3 border-t border-slate-800/40 pt-2.5 cursor-pointer hover:opacity-90 transition-opacity ${
            isCollapsed ? 'justify-center px-0' : 'px-1 py-1'
          }`}
          title={`Ver Mi Perfil (${currentUser.username})`}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-700 shadow-xs overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
            <img 
              src={getUserAvatarUrl(currentUser.username)} 
              alt={currentUser.username} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-white font-bold text-xs truncate capitalize leading-tight">{currentUser.username}</div>
              <div className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-wider mt-0.5">
                {currentUser.puesto || currentUser.role}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            onLogout();
            setIsMobileMenuOpen(false);
          }}
          title="Salir del Sistema"
          className={`flex items-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer text-xs font-semibold ${
            isCollapsed ? 'w-10 h-10 justify-center mx-auto p-0' : 'w-full px-3 py-2 gap-3 min-h-[38px]'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Salir del Sistema</span>}
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

          <TppLogo size="sm" variant="full" darkMode={true} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGlobalLogTimeOpen(true)}
            className="px-2.5 py-1.5 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 shadow-md shadow-orange-500/20"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
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
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* ⬛ ZONA 1: SIDEBAR OSCURO DESKTOP (El Ancla - Collapsible) */}
      <aside 
        className={`hidden md:flex bg-slate-900/95 backdrop-blur-xl text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800/80 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
        }`} 
        id="dark-sidebar"
      >
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>

      {/* ⬜ ZONA 2: CONTENEDOR PRINCIPAL DINÁMICO (Versa Glassmorphic Background) */}
      <main className="flex-1 flex flex-col min-w-0 versa-bg-gradient relative overflow-hidden" id="main-content-area">
        {/* Soft Ambient Radial Glass Orbs matching Versa UI Reference */}
        <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-purple-400/25 rounded-full blur-[100px] pointer-events-none -z-0 animate-pulse" />
        <div className="absolute top-1/4 -right-24 w-[700px] h-[700px] bg-blue-400/25 rounded-full blur-[120px] pointer-events-none -z-0" />
        <div className="absolute -bottom-32 left-1/3 w-[650px] h-[650px] bg-orange-400/20 rounded-full blur-[110px] pointer-events-none -z-0" />
        <div className="absolute top-2/3 left-10 w-[450px] h-[450px] bg-lime-300/20 rounded-full blur-[90px] pointer-events-none -z-0" />
        
        <div className="relative z-10 flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {children}
        </div>
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
