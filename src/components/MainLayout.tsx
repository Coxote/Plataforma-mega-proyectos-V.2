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
  DollarSign,
  Sparkles,
  Plug,
  BrainCircuit
} from 'lucide-react';
import { Project, UserSession, TimeEntryType, getUserAvatarUrl } from '../types';
import { TppLogo } from './TppLogo';
import { AIAssistantModal } from './AIAssistantModal';
import { GlobalLogTimeModal } from './GlobalLogTimeModal';

export type ViewState = 'dashboard' | 'planner' | 'team' | 'project' | 'gantt' | 'clients' | 'profile' | 'financial' | 'integrations' | 'predictive';

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
  onOpenOnboarding?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUser,
  onLogout,
  children,
  currentView,
  onNavigate,
  projects,
  users,
  onLogTimeGlobal,
  onOpenOnboarding
}) => {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isGlobalLogTimeOpen, setIsGlobalLogTimeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleNavClick = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const hasDirectionAccess = currentUser.role === 'coordinador' || currentUser.role === 'director_financiero' || currentUser.role === 'supervisor';
  const hasAdminAccess = currentUser.role === 'coordinador' || currentUser.role === 'director_financiero';
  const isActiveNavItem = (view: ViewState) => currentView === view;
  const navItemClass = (view: ViewState, isCollapsed: boolean) => `w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[40px] ${
    isActiveNavItem(view)
      ? 'bg-[#FF5500] text-white shadow-sm shadow-orange-500/20 font-bold'
      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
  }`;

  const navSections: Array<{
    label: string;
    items: Array<{
      view: ViewState;
      label: string;
      title?: string;
      icon: React.ComponentType<{ className?: string }>;
      show: boolean;
    }>;
  }> = [
    {
      label: 'Operacion',
      items: [
        { view: 'dashboard', label: 'Torre de Control', icon: LayoutDashboard, show: currentUser.role === 'coordinador' },
        { view: 'planner', label: 'Planner Diario', icon: CalendarDays, show: currentUser.role !== 'proveedor' },
        { view: 'gantt', label: 'Linea de Tiempo', icon: Layers, show: currentUser.role !== 'proveedor' },
      ],
    },
    {
      label: 'Proyecto',
      items: [
        { view: 'project', label: 'Expediente del Proyecto', icon: Activity, show: true },
      ],
    },
    {
      label: 'Direccion',
      items: [
        { view: 'financial', label: 'Salud Financiera', icon: DollarSign, show: hasDirectionAccess },
        { view: 'predictive', label: 'Simulador Predictivo', icon: BrainCircuit, show: hasDirectionAccess },
      ],
    },
    {
      label: 'Administracion',
      items: [
        { view: 'team', label: 'Equipo', icon: Users, show: currentUser.role === 'coordinador' },
        { view: 'clients', label: 'Clientes y Marca IA', icon: Building2, show: hasDirectionAccess },
        { view: 'integrations', label: 'Integraciones', icon: Plug, show: hasAdminAccess },
      ],
    },
    {
      label: 'Mi Espacio',
      items: [
        { view: 'profile', label: 'Mi Perfil y Horas', icon: User, show: true },
      ],
    },
  ];

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

        {/* BOTÃ“N DE CARGA RÃPIDA DE HORAS GLOBAL */}
        <div className={`p-3 pb-1 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => {
              setIsGlobalLogTimeOpen(true);
              setIsMobileMenuOpen(false);
            }}
            title="Registrar Horas"
            className={`flex items-center justify-center gap-2 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl transition-all cursor-pointer text-xs font-black shadow-sm shadow-orange-500/20 active:scale-[0.99] ${
              isCollapsed ? 'w-10 h-10 p-0' : 'w-full px-3 py-2.5 min-h-[40px]'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0 text-white" />
            {!isCollapsed && <span>Registrar Horas</span>}
          </button>
        </div>

        {/* Navegacion principal agrupada por intencion operativa */}
        <nav className={`p-3 space-y-4 ${isCollapsed ? 'px-2' : 'sm:p-4'}`} id="sidebar-nav">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div className="space-y-1" key={section.label}>
                {!isCollapsed ? (
                  <div className="px-3 mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {section.label}
                  </div>
                ) : (
                  <div className="w-8 h-px bg-slate-800 my-2 mx-auto" />
                )}

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.view}
                      onClick={() => handleNavClick(item.view)}
                      title={item.title || item.label}
                      className={navItemClass(item.view, isCollapsed)}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* MÃ³dulo Inferior: Usuario, Asistente y Salida */}
      <div className={`p-3 border-t border-slate-800/80 space-y-3 bg-slate-950/20 shrink-0 ${isCollapsed ? 'px-2' : 'sm:p-4'}`}>

        {/* BotÃ³n flotante preparado para el Asistente IA (Dictar Avance) */}
        <button
          onClick={() => {
            setIsAIAssistantOpen(true);
            setIsMobileMenuOpen(false);
          }}
          title="Dictar Avance con IA"
          className={`flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-lime-400 rounded-full transition-colors border border-slate-700/60 border-dashed text-xs font-bold uppercase tracking-wider cursor-pointer ${
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
              <div className="text-xs text-slate-500 font-medium truncate uppercase tracking-wider mt-0.5">
                {currentUser.puesto || currentUser.role}
              </div>
            </div>
          )}
        </div>

        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            title="Configurar perfil y preferencias"
            className={`flex items-center text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-full transition-colors cursor-pointer text-xs font-semibold ${
              isCollapsed ? 'w-10 h-10 justify-center mx-auto p-0' : 'w-full px-3 py-1.5 gap-2 min-h-[34px]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            {!isCollapsed && <span>Configurar Perfil</span>}
          </button>
        )}

        <button
          onClick={() => {
            onLogout();
            setIsMobileMenuOpen(false);
          }}
          title="Salir del Sistema"
          className={`flex items-center text-rose-200/80 hover:text-white hover:bg-rose-500/20 rounded-full transition-colors cursor-pointer text-xs font-semibold ${
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

      {/* ðŸ“± MOBILE TOP HEADER BAR */}
      <header className="md:hidden oa-sidebar text-white p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Abrir menÃº de navegaciÃ³n"
          >
            <Menu className="w-5 h-5" />
          </button>

          <TppLogo size="sm" variant="full" darkMode={true} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGlobalLogTimeOpen(true)}
            className="px-2.5 py-1.5 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-md shadow-orange-500/20"
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

      {/* ðŸ“± MOBILE DRAWER SIDEBAR OVERLAY */}
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

      {/* â¬› ZONA 1: SIDEBAR OSCURO DESKTOP (El Ancla - Collapsible) */}
      <aside
        className={`hidden md:flex oa-sidebar text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800/80 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
        id="dark-sidebar"
      >
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>

      {/* â¬œ ZONA 2: CONTENEDOR PRINCIPAL DINÃMICO (Smooth Ice-Blue Radial Background) */}
      <main
        className="flex-1 flex flex-col min-w-0 relative overflow-hidden oa-app-surface"
        id="main-content-area"
      >
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
