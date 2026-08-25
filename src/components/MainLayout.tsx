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
  ChevronDown,
  DollarSign,
  Sparkles,
  Plug,
  BrainCircuit,
  CheckCircle2,
  Search
} from 'lucide-react';
import { Project, UserSession, TimeEntryType, getUserAvatarUrl, ROLE_LABELS } from '../types';
import { TppLogo } from './TppLogo';
import { AIAssistantModal } from './AIAssistantModal';
import { GlobalLogTimeModal } from './GlobalLogTimeModal';

export type ViewState = 'dashboard' | 'planner' | 'team' | 'project' | 'gantt' | 'clients' | 'profile' | 'financial' | 'integrations' | 'predictive';
export type PlatformStatus = 'en_linea' | 'ausente' | 'no_molestar';

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

// Logic: First name + initial of first last name, cleanly mapping system users to display names
export function getSimplifiedUserName(userOrUsername: UserSession | string): string {
  let username = typeof userOrUsername === 'string' ? userOrUsername : (userOrUsername.username || '');
  if (!username) return 'Usuario';

  // If email format, strip the @domain
  if (username.includes('@')) {
    username = username.split('@')[0];
  }

  const clean = username.replace(/[._-]/g, ' ').trim();
  const lower = clean.toLowerCase();

  // Known initials mapping matching the reference exactly
  const knownInitials: Record<string, string> = {
    coordinador: 'Rodrigo D.',
    rodrigo: 'Rodrigo D.',
    lourdes: 'Lourdes P.',
    maylin: 'Maylin G.',
    eduardo: 'Eduardo R.',
    edgar: 'Edgar C.',
    jeremy: 'Jeremy S.',
    noemi: 'Noemí T.',
    alejandra: 'Alejandra B.',
    fabiola: 'Fabiola D.',
    luis: 'Luis A.',
    sofia: 'Sofía V.',
    director: 'Sofía V.',
    proveedor: 'TechStudio L.',
    invitado: 'Cliente I.'
  };

  if (knownInitials[lower]) {
    return knownInitials[lower];
  }

  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const lastInitial = parts[1].charAt(0).toUpperCase() + '.';
    return `${firstName} ${lastInitial}`;
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

// Formats role with only the first letter uppercase (e.g. "Coordinador")
export function getFormattedUserRole(user: UserSession): string {
  if (user.role === 'coordinador') return 'Coordinador';
  if (user.role === 'supervisor') return 'Supervisor';
  if (user.role === 'director_financiero') return 'Director financiero';
  if (user.role === 'sac') return 'PM / SAC';
  if (user.role === 'contentd') return 'Diseñador';
  if (user.role === 'contents') return 'Social media';
  if (user.role === 'proveedor') return 'Proveedor';
  if (user.role === 'invitado') return 'Invitado';

  const roleStr = user.puesto || ROLE_LABELS[user.role] || user.role || 'Usuario';
  return roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();
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
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>(() => {
    try {
      const saved = localStorage.getItem('saas_user_platform_status_v1');
      return (saved as PlatformStatus) || 'en_linea';
    } catch {
      return 'en_linea';
    }
  });
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const handleStatusChange = (status: PlatformStatus) => {
    setPlatformStatus(status);
    setIsStatusMenuOpen(false);
    try {
      localStorage.setItem('saas_user_platform_status_v1', status);
    } catch {
      // ignore
    }
  };

  const handleNavClick = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const hasDirectionAccess = currentUser.role === 'coordinador' || currentUser.role === 'director_financiero' || currentUser.role === 'supervisor';
  const hasAdminAccess = currentUser.role === 'coordinador' || currentUser.role === 'director_financiero';
  const isActiveNavItem = (view: ViewState) => currentView === view;

  const statusConfig: Record<PlatformStatus, { label: string; lowerLabel: string; dotColor: string; textColor: string; glowColor: string; hex: string }> = {
    en_linea: {
      label: 'En línea',
      lowerLabel: 'en linea',
      dotColor: 'bg-[#12ab51]',
      textColor: 'text-[#12ab51]',
      glowColor: 'from-[#12ab51]/50 via-[#12ab51]/35 to-[#12ab51]/15',
      hex: '#12ab51'
    },
    ausente: {
      label: 'Ausente',
      lowerLabel: 'ausente',
      dotColor: 'bg-[#efbc2c]',
      textColor: 'text-[#efbc2c]',
      glowColor: 'from-[#efbc2c]/50 via-[#efbc2c]/35 to-[#efbc2c]/15',
      hex: '#efbc2c'
    },
    no_molestar: {
      label: 'No molestar',
      lowerLabel: 'no molestar',
      dotColor: 'bg-[#c52211]',
      textColor: 'text-[#c52211]',
      glowColor: 'from-[#c52211]/50 via-[#c52211]/35 to-[#c52211]/15',
      hex: '#c52211'
    }
  };

  // Calculate today's logged hours progress vs daily target (8 hours)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHoursLogged = projects.reduce((acc, p) => {
    const userEntries = (p.timeEntries || []).filter(
      (e) => (e.userId === currentUser.id || (e.username && e.username.toLowerCase() === currentUser.username.toLowerCase())) &&
             e.date === todayStr
    );
    return acc + userEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  }, 0);
  const todayProgressPct = Math.min(100, Math.round((todayHoursLogged / 8) * 100));

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
      label: 'Operación',
      items: [
        { view: 'dashboard', label: 'Dashboard Proyectos', icon: LayoutDashboard, show: currentUser.role === 'coordinador' },
        { view: 'planner', label: 'Planer Diario', icon: CalendarDays, show: currentUser.role !== 'proveedor' },
        { view: 'gantt', label: 'Línea de Tiempo', icon: Layers, show: currentUser.role !== 'proveedor' },
      ],
    },
    {
      label: 'Proyecto',
      items: [
        { view: 'project', label: 'Expediente del Proyecto', icon: Activity, show: true },
      ],
    },
    {
      label: 'Dirección',
      items: [
        { view: 'financial', label: 'Salud Financiera', icon: DollarSign, show: hasDirectionAccess },
        { view: 'predictive', label: 'Simulador Predictivo', icon: BrainCircuit, show: hasDirectionAccess },
      ],
    },
    {
      label: 'Administración',
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

  const simplifiedName = getSimplifiedUserName(currentUser);
  const formattedRole = getFormattedUserRole(currentUser);

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className={`flex flex-col h-full justify-between select-none relative bg-[#1E1E1E] rounded-tr-[20px] overflow-hidden sidebar ${isCollapsed ? 'collapsed sidebar-collapsed' : ''}`}>
      <div className="overflow-y-auto flex-1 scrollbar-none">
        
        {/* PERFIL DE USUARIO EN LA PARTE SUPERIOR (FOTO 20% MÁS GRANDE CON HALO DINÁMICO, DATOS, BOTÓN MINIMIZAR INTERNO) */}
        <div className={`relative ${isCollapsed ? 'p-3.5 pt-5 pb-3 flex flex-col items-center justify-center' : 'p-4 pt-5 pb-3'}`}>
          <div className="flex items-center justify-between gap-2.5">
            {/* Foto de Perfil con degradado desenfocado dinámico según el estado actual (tamaño +20%: w-14 h-14 / 56px) */}
            <div 
              onClick={() => handleNavClick('profile')}
              className="relative flex items-center justify-center shrink-0 cursor-pointer group mx-auto md:mx-0"
              title={`Ver Mi Perfil (${simplifiedName}) - ${statusConfig[platformStatus].label}`}
            >
              {/* Fondo desenfocado ambiental que cambia de color según el estado */}
              <div className={`absolute -inset-2 bg-gradient-to-tr ${statusConfig[platformStatus].glowColor} rounded-full blur-md transition-all duration-300`} />
              <img
                src={getUserAvatarUrl(currentUser.username)}
                alt={simplifiedName}
                className="relative w-14 h-14 rounded-full object-cover border border-slate-700/80 shadow-md transition-transform duration-200"
                referrerPolicy="no-referrer"
              />
            </div>

            {!isCollapsed && (
              <>
                {/* Información del Usuario: Nombre, Rol y Estado en línea abajo */}
                <div className="flex-1 min-w-0 flex flex-col justify-center sidebar-text">
                  {/* Nombre del Usuario (sin cambio de color en hover) */}
                  <div 
                    onClick={() => handleNavClick('profile')}
                    className="text-white font-bold text-sm leading-snug truncate cursor-pointer"
                  >
                    {simplifiedName}
                  </div>

                  {/* Rol (en minúsculas solo la primera mayúscula: Coordinador, color #808080) */}
                  <div className="text-[11.5px] text-[#808080] font-normal truncate mt-0.5 leading-tight">
                    {formattedRole}
                  </div>

                  {/* Estado interactivo abajo del rol: transparente solo con flecha (solo disponible con barra expandida) */}
                  <div className="relative mt-1">
                    <button
                      onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                      className={`flex items-center gap-1.5 text-[11px] font-medium transition-opacity cursor-pointer bg-transparent border-none p-0 ${statusConfig[platformStatus].textColor} hover:opacity-90`}
                      title="Cambiar estado en la plataforma"
                    >
                      <span>{statusConfig[platformStatus].lowerLabel}</span>
                      <ChevronDown className="w-3 h-3 text-[#808080] transition-transform duration-200" style={{ transform: isStatusMenuOpen ? 'rotate(180deg)' : 'none' }} />
                    </button>

                    {/* Dropdown flotante de Estados */}
                    {isStatusMenuOpen && (
                      <div className="absolute top-full left-0 mt-2 w-36 bg-[#252525] border border-slate-700/80 rounded-xl p-1 shadow-2xl z-50 space-y-0.5 animate-fadeIn">
                        {(['en_linea', 'ausente', 'no_molestar'] as PlatformStatus[]).map((status) => {
                          const cfg = statusConfig[status];
                          const isSelected = platformStatus === status;
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                                isSelected ? 'bg-slate-800 font-semibold text-white' : 'text-[#808080] hover:text-white hover:bg-slate-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                                <span>{cfg.label}</span>
                              </div>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5500]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTÓN MINIMIZAR BARRA LATERAL (DENTRO DE LA BARRA A UN COSTADO DE LOS DATOS) */}
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden md:flex p-1.5 text-[#808080] hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer shrink-0 sidebar-text"
                  title="Minimizar barra lateral"
                  aria-label="Minimizar barra lateral"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL: TEXTOS #808080, SELECCIONADO #FFFFFF, BARRA 1px, SIN HOVER */}
        <nav className={`px-2 py-2 space-y-4 ${isCollapsed ? 'px-1' : 'sm:px-2.5'}`} id="sidebar-nav">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div className="space-y-0.5" key={section.label}>
                {!isCollapsed ? (
                  <div className="px-3.5 mb-1.5 text-xs font-semibold text-[#808080] sidebar-text">
                    {section.label}
                  </div>
                ) : (
                  <div className="w-6 h-px bg-slate-800 my-1.5 mx-auto" />
                )}

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveNavItem(item.view);

                  return (
                    <div key={item.view} className="relative flex items-center">
                      {/* BARRA LATERAL CURVA PARA MOSTRAR LA OPCIÓN SELECCIONADA */}
                      {active && (
                        <span
                          className={`absolute left-0 top-1/2 -translate-y-1/2 bg-[#FF5500] rounded-r-full shadow-xs transition-all duration-200 z-20 ${
                            isCollapsed ? 'w-1 h-5' : 'w-1 h-5'
                          }`}
                        />
                      )}

                      <button
                        onClick={() => handleNavClick(item.view)}
                        title={item.title || item.label}
                        className={`w-full flex items-center cursor-pointer min-h-[34px] rounded-lg text-xs bg-transparent border-none ${
                          isCollapsed
                            ? 'justify-center px-0 py-1.5'
                            : 'gap-2.5 px-3 py-1.5 pl-3.5'
                        } ${
                          active
                            ? 'text-white font-medium'
                            : 'text-[#808080]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#808080]'}`} />
                        {!isCollapsed && (
                          <span className={`sidebar-text truncate text-left ${active ? 'text-white font-medium' : 'text-[#808080]'}`}>
                            {item.label}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* MÓDULO INFERIOR: ASISTENTE IA, CONFIGURAR PERFIL Y SALIDA */}
      <div className={`p-2.5 border-t border-slate-800/80 space-y-1 bg-[#1A1A1A] shrink-0 ${isCollapsed ? 'px-1' : 'sm:p-2.5'}`}>
        
        {/* Botón Asistente: color #fd4c06, limpio sin recuadro */}
        <button
          onClick={() => {
            setIsAIAssistantOpen(true);
            setIsMobileMenuOpen(false);
          }}
          title="Asistente IA"
          className={`flex items-center text-[#fd4c06] bg-transparent border-none cursor-pointer text-xs font-semibold ${
            isCollapsed ? 'w-8 h-8 justify-center mx-auto p-0' : 'w-full px-3 py-1.5 gap-2.5 min-h-[32px] pl-3.5'
          }`}
        >
          <Mic className="w-3.5 h-3.5 shrink-0 text-[#fd4c06]" />
          {!isCollapsed && <span className="sidebar-text text-[#fd4c06] font-semibold">Asistente</span>}
        </button>

        {/* Configurar Perfil: igual que todos los botones de la barra */}
        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            title="Configurar perfil y preferencias"
            className={`flex items-center text-[#808080] bg-transparent border-none cursor-pointer text-xs font-normal ${
              isCollapsed ? 'w-8 h-8 justify-center mx-auto p-0' : 'w-full px-3 py-1.5 gap-2.5 min-h-[32px] pl-3.5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#808080]" />
            {!isCollapsed && <span className="sidebar-text">Configurar Perfil</span>}
          </button>
        )}

        {/* Salir del Sistema: hover rojo #c52211 */}
        <button
          onClick={() => {
            onLogout();
            setIsMobileMenuOpen(false);
          }}
          title="Salir del Sistema"
          className={`flex items-center text-[#808080] hover:text-[#c52211] bg-transparent border-none cursor-pointer text-xs font-normal transition-colors duration-200 group ${
            isCollapsed ? 'w-8 h-8 justify-center mx-auto p-0' : 'w-full px-3 py-1.5 gap-2.5 min-h-[32px] pl-3.5'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 text-[#808080] group-hover:text-[#c52211] transition-colors duration-200" />
          {!isCollapsed && <span className="sidebar-text">Salir del Sistema</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-50 overflow-hidden font-sans" id="main-layout-container">

      {/* 📱 MOBILE TOP HEADER BAR */}
      <header className="md:hidden oa-sidebar text-white p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
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
          {/* Botón Cargar Horas en móvil */}
          <button
            onClick={() => setIsGlobalLogTimeOpen(true)}
            className="px-3 py-1.5 bg-[#E6F4FE] text-[#0284C7] hover:bg-[#D4EDFD] rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border border-[#BAE6FD]/60 shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
            Cargar horas
          </button>

          <div
            onClick={() => onNavigate('profile')}
            className="relative w-8 h-8 rounded-full border border-slate-700 overflow-visible bg-slate-800 cursor-pointer"
            title={`${simplifiedName} (${statusConfig[platformStatus].label})`}
          >
            <img
              src={getUserAvatarUrl(currentUser.username)}
              alt={simplifiedName}
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${statusConfig[platformStatus].dotColor}`}
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
          <aside className="relative w-[280px] max-w-[85vw] bg-[#1E1E1E] text-slate-300 h-full shadow-2xl z-10 flex flex-col animate-slideRight">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* ⬛ ZONA 1: SIDEBAR OSCURO DESKTOP (Expandible / Colapsable - Redondeado 20px superior derecho con animación suave) */}
      <aside
        className={`hidden md:flex oa-sidebar text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800/80 rounded-tr-[20px] transition-all duration-300 ease-in-out sidebar ${
          isSidebarCollapsed ? 'w-[86px] collapsed sidebar-collapsed' : 'w-[225px]'
        }`}
        id="dark-sidebar"
      >
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>

      {/* ⬜ ZONA 2: CONTENEDOR PRINCIPAL DINÁMICO CON TOPBAR DE REFERENCIA (CARGAR HORAS, PROGRESO DE HOY, BUSCAR) */}
      <main
        className="flex-1 flex flex-col min-w-0 relative overflow-hidden oa-app-surface"
        id="main-content-area"
      >
        {/* BARRA SUPERIOR DE LA PLATAFORMA (COMO LA REFERENCIA COMPARTIDA) */}
        <header className="hidden md:flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-200/90 shadow-2xs z-20 shrink-0">
          <div className="flex items-center gap-3.5">
            {/* Botón para colapsar/expandir barra lateral (afuera a la par de la foto de perfil) */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expandir barra lateral" : "Minimizar barra lateral"}
              aria-label={isSidebarCollapsed ? "Expandir barra lateral" : "Minimizar barra lateral"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 text-slate-700" /> : <ChevronLeft className="w-4 h-4 text-slate-700" />}
            </button>

            {/* BOTÓN CARGAR HORAS (Píldora celeste / azul suave) */}
            <button
              onClick={() => setIsGlobalLogTimeOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#E6F4FE] hover:bg-[#D4EDFD] text-[#0284C7] rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer border border-[#BAE6FD]/60 active:scale-[0.98]"
              title="Cargar horas de trabajo"
            >
              <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Cargar horas</span>
            </button>

            {/* PROGRESO DE HOY (Barra delgada con % calculado) */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Progreso de hoy</span>
              <span className="text-xs font-extrabold text-slate-700">{todayProgressPct}%</span>
              <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${todayProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* DERECHA: BARRA DE BÚSQUEDA CTRL+K */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar"
                className="pl-8 pr-14 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-700 rounded-full border border-slate-200 focus:border-orange-500 focus:outline-hidden transition-all w-48 lg:w-64 placeholder:text-slate-400"
              />
              <div className="absolute right-2.5 flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs pointer-events-none">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </div>
          </div>
        </header>

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
