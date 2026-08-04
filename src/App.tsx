import { useState, useEffect, useRef, useMemo } from 'react';
import { Project, UserSession, RoleHoursAllocation, Client, TimeEntryType } from './types';
import { INITIAL_PROJECTS, createDefaultPhases, createDefaultBudget, createDefaultRaci } from './initialData';
import Sidebar from './components/Sidebar';
import PhaseContent from './components/PhaseContent';
import Login from './components/Login';
import UserManagementModal from './components/UserManagementModal';
import { ClientPortal } from './components/ClientPortal';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { MainLayout, ViewState } from './components/MainLayout';
import { TeamManagement } from './components/TeamManagement';
import { PlannerGrid } from './components/PlannerGrid';
import { GanttView } from './components/GanttView';
import { ClientsManagement } from './components/ClientsManagement';
import { MyProfileView } from './components/MyProfileView';
import { FinancialDashboard } from './components/FinancialDashboard';
import { Sparkles, Shield, Users, LogOut, Activity, Briefcase } from 'lucide-react';
import { generatePhasesForTemplate } from './projectTemplates';
import { NewProjectWizard } from './components/NewProjectWizard';
import { useDeliverableMonitoring } from './hooks/useDeliverableMonitoring';

const DEMO_VERSION_KEY = 'saas_phase_system_demo_v5_clean';
const STORAGE_KEY = 'saas_phase_system_projects_v5';
const ACTIVE_PROJECT_KEY = 'saas_phase_system_active_project_v5';
const SESSION_USER_KEY = 'saas_phase_system_current_user_v5';
const USERS_LIST_KEY = 'saas_phase_system_users_list_v5';
const CLIENTS_STORAGE_KEY = 'saas_phase_system_clients_v5';

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'c-famosa',
    nombreComercial: 'Famosa',
    categoria: 'Comercial',
    contactoPrincipal: 'Contacto Famosa',
    email: 'contacto@famosa.com',
    telefono: '+502 2222-1001',
    sitioWebRedes: 'https://famosa.com',
    estado: 'activo',
    fechaAlta: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'c-eltejar',
    nombreComercial: 'El tejar',
    categoria: 'Materiales',
    contactoPrincipal: 'Contacto El Tejar',
    email: 'contacto@eltejar.com',
    telefono: '+502 2222-1002',
    sitioWebRedes: 'https://eltejar.com',
    estado: 'activo',
    fechaAlta: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'c-fajonda',
    nombreComercial: 'Fajonda',
    categoria: 'Automotriz',
    contactoPrincipal: 'Contacto Fajonda',
    email: 'contacto@fajonda.com',
    telefono: '+502 2222-1003',
    sitioWebRedes: 'https://fajonda.com',
    estado: 'activo',
    fechaAlta: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'c-adoc',
    nombreComercial: 'ADOC',
    categoria: 'Calzado & Retail',
    contactoPrincipal: 'Contacto ADOC',
    email: 'contacto@adoc.com',
    telefono: '+502 2222-1004',
    sitioWebRedes: 'https://adoc.com',
    estado: 'activo',
    fechaAlta: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'c-impelsa',
    nombreComercial: 'Impelsa',
    categoria: 'Distribución',
    contactoPrincipal: 'Contacto Impelsa',
    email: 'contacto@impelsa.com',
    telefono: '+502 2222-1005',
    sitioWebRedes: 'https://impelsa.com',
    estado: 'activo',
    fechaAlta: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'c-bicredid',
    nombreComercial: 'BI-Credid',
    categoria: 'Banca & Finanzas',
    contactoPrincipal: 'Contacto BI-Credid',
    email: 'contacto@bicredid.com',
    telefono: '+502 2222-1006',
    sitioWebRedes: 'https://bicredid.com',
    estado: 'activo',
    fechaAlta: '2026-01-15T08:00:00.000Z'
  }
];

const DEFAULT_USERS: UserSession[] = [
  { id: 'u-rodrigo', username: 'rodrigo', puesto: 'Supervisor', role: 'coordinador', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-lourdes', username: 'lourdes', puesto: 'PM', role: 'sac', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-maylin', username: 'maylin', puesto: 'PM', role: 'sac', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-eduardo', username: 'eduardo', puesto: 'Diseñador', role: 'contentd', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-edgar', username: 'edgar', puesto: 'Diseñador', role: 'contentd', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-jeremy', username: 'jeremy', puesto: 'Diseñador', role: 'contentd', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-noemi', username: 'noemi', puesto: 'PM', role: 'sac', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-alejandra', username: 'alejandra', puesto: 'Supervisor', role: 'coordinador', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-fabiola', username: 'fabiola', puesto: 'Supervisor', role: 'coordinador', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-luis', username: 'luis', puesto: 'PM', role: 'sac', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-sofia', username: 'sofia', puesto: 'Directora Financiera', role: 'director_financiero', password: '123', capacidadMensualHoras: 176 },
  { id: 'u-proveedor', username: 'proveedor', puesto: 'Proveedor Dev', role: 'proveedor', password: '123', tarifaHoraProveedor: 50, empresaProveedor: 'TechStudio Latam', proyectosAsignados: ['p1'], capacidadMensualHoras: 160 },
  { id: 'u-invitado', username: 'invitado', puesto: 'Invitado', role: 'invitado', password: '123', projectId: 'p1', capacidadMensualHoras: 0 },
];

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [usersList, setUsersList] = useState<UserSession[]>([]);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('planner');
  const [clients, setClients] = useState<Client[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isInitialized = useRef(false);

  // Hook de monitoreo de entregables y SLAs del sistema
  const deliverableMonitoring = useDeliverableMonitoring(projects);

  // Normalizador de proyectos para migración automática Fase 0
  const normalizeProject = (p: any): Project => {
    const timeEntries = (p.timeEntries || []).map((e: any) => ({
      ...e,
      type: e.type || 'normal'
    }));

    const ordenesVenta = p.ordenesVenta || (p.saleOrderNumber || p.ovNumber ? [{
      id: `ov-${p.id}-1`,
      numero: String(p.saleOrderNumber || p.ovNumber || 'OV-001'),
      monto: p.totalIncome || 0,
      moneda: p.currency || 'USD',
      horasAsociadas: p.hoursTotal || 0,
      fechaEmision: p.createdAt || new Date().toISOString(),
      estado: 'activa'
    }] : []);

    return {
      ...p,
      timeEntries,
      ordenesVenta,
      auditLog: p.auditLog || [],
      deliverables: p.deliverables || [],
      budget: p.budget || createDefaultBudget(p.hoursTotal || 40),
      raciMatrix: p.raciMatrix || createDefaultRaci(),
      brandBible: p.brandBible || {
        companyContext: { historyAndBackground: '', missionVisionUvp: '' },
        brandPersona: { archetype: '', buyerPersonas: '' },
        voiceAndTone: { personalityTraits: [], dosAndDonts: '', coreMessages: '' },
        visualIdentity: { logoRules: '', colorPaletteHex: [], typographyHierarchy: '', moodboardLinks: [] },
        resources: { driveFolderUrl: '', figmaUrl: '' }
      }
    };
  };

  // Normalizador de clientes
  const normalizeClient = (c: any): Client => ({
    ...c,
    estado: c.estado || 'activo',
    fechaAlta: c.fechaAlta || new Date().toISOString()
  });

  // Load from local storage or default
  useEffect(() => {
    const isDemoVersion = localStorage.getItem(DEMO_VERSION_KEY);
    if (!isDemoVersion) {
      localStorage.setItem(DEMO_VERSION_KEY, 'true');
      const defaults = INITIAL_PROJECTS.map(normalizeProject);
      setProjects(defaults);
      setActiveProjectId(defaults[0].id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));

      setUsersList(DEFAULT_USERS);
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS));

      setClients(DEFAULT_CLIENTS);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));

      // Auto login as Rodrigo (Supervisor) by default for seamless demo testing
      setCurrentUser(DEFAULT_USERS[0]);
      setCurrentView('planner');
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(DEFAULT_USERS[0]));
      return;
    }

    // 1. Load Projects
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedActiveId = localStorage.getItem(ACTIVE_PROJECT_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Project[];
        const normalized = parsed.map(normalizeProject);
        setProjects(normalized);
        if (normalized.length > 0) {
          const defaultActive = normalized.find((p) => p.id === storedActiveId) || normalized[0];
          setActiveProjectId(defaultActive.id);
        }
      } catch (err) {
        const defaults = INITIAL_PROJECTS.map(normalizeProject);
        setProjects(defaults);
        setActiveProjectId(defaults[0].id);
      }
    } else {
      const defaults = INITIAL_PROJECTS.map(normalizeProject);
      setProjects(defaults);
      setActiveProjectId(defaults[0].id);
    }

    // 2. Load Users
    const storedUsers = localStorage.getItem(USERS_LIST_KEY);
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers) as UserSession[];
        const normalizedUsers = parsedUsers.map(u => ({
          ...u,
          capacidadMensualHoras: u.capacidadMensualHoras ?? (u.role === 'invitado' ? 0 : 176)
        }));
        setUsersList(normalizedUsers);
      } catch (err) {
        setUsersList(DEFAULT_USERS);
        localStorage.setItem(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS));
      }
    } else {
      setUsersList(DEFAULT_USERS);
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS));
    }

    // 3. Load Session
    const storedSession = localStorage.getItem(SESSION_USER_KEY);
    if (storedSession) {
      try {
        const user = JSON.parse(storedSession) as UserSession;
        setCurrentUser(user);
        if (user.role === 'coordinador') {
          setCurrentView('dashboard');
        }
      } catch (err) {
        setCurrentUser(null);
      }
    }

    // 4. Load Clients
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (storedClients) {
      try {
        const parsedClients = JSON.parse(storedClients);
        const normalizedClients = parsedClients.map(normalizeClient);
        setClients(normalizedClients);
      } catch (err) {
        setClients(DEFAULT_CLIENTS);
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));
      }
    } else {
      setClients(DEFAULT_CLIENTS);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));
    }

    isInitialized.current = true;
  }, []);

  // Centralized local storage synchronization (Single Source of Truth)
  useEffect(() => {
    if (isInitialized.current && projects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (isInitialized.current && clients.length > 0) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (isInitialized.current && usersList.length > 0) {
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(usersList));
    }
  }, [usersList]);

  const handleAddClient = (newClient: Client) => {
    setClients((prevClients) => {
      const exists = prevClients.some((c) => c.id === newClient.id);
      return exists
        ? prevClients.map((c) => (c.id === newClient.id ? newClient : c))
        : [newClient, ...prevClients];
    });
  };

  const handleUpdateClientStatus = (clientId: string, nuevoEstado: 'activo' | 'inactivo' | 'pausado') => {
    setClients((prevClients) =>
      prevClients.map((c) => (c.id === clientId ? { ...c, estado: nuevoEstado } : c))
    );
  };

  const updateClientLastActivity = (clientName: string) => {
    if (!clientName) return;
    const today = new Date().toISOString().split('T')[0];
    const normalizedName = clientName.trim().toLowerCase();
    
    setClients((prevClients) => {
      let found = false;
      const updatedClients = prevClients.map((c) => {
        if (c.nombreComercial.trim().toLowerCase() === normalizedName) {
          found = true;
          return {
            ...c,
            fechaUltimaActividad: today,
            estado: (c.estado === 'inactivo' || c.estado === 'pausado') ? ('activo' as const) : (c.estado || ('activo' as const))
          };
        }
        return c;
      });

      if (!found) {
        const newClient: Client = {
          id: `client-${Date.now()}`,
          nombreComercial: clientName,
          categoria: 'General',
          contactoPrincipal: 'Por asignar',
          estado: 'activo',
          fechaAlta: today,
          fechaUltimaActividad: today
        };
        return [newClient, ...prevClients];
      }
      return updatedClients;
    });
  };

  // Filter visible projects based on user role
  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'invitado') {
      return projects.filter((p) => p.id === currentUser.projectId);
    }
    if (currentUser.role === 'proveedor') {
      return projects.filter((p) => {
        const isAssigned = currentUser.proyectosAsignados && currentUser.proyectosAsignados.length > 0
          ? currentUser.proyectosAsignados.includes(p.id)
          : false;
        const isMember = p.members?.some(
          (m) => m.id === currentUser.id || m.userId === currentUser.id || m.name?.toLowerCase() === currentUser.username.toLowerCase()
        );
        return isAssigned || isMember;
      });
    }
    return projects;
  }, [projects, currentUser]);

  // Keep activeProjectId synced with visibleProjects
  useEffect(() => {
    if (currentUser && visibleProjects.length > 0) {
      if (!visibleProjects.some((p) => p.id === activeProjectId)) {
        setActiveProjectId(visibleProjects[0].id);
      }
    }
  }, [currentUser, visibleProjects, activeProjectId]);

  // Restrict proveedor from accessing coordinator-only views
  useEffect(() => {
    if (currentUser?.role === 'proveedor' && (currentView === 'dashboard' || currentView === 'team' || currentView === 'clients')) {
      setCurrentView('project');
    }
  }, [currentUser, currentView]);

  // Find currently active project
  const activeProject = visibleProjects.find((p) => p.id === activeProjectId) || visibleProjects[0] || projects[0];

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    setCurrentView('project');
  };

  // General project updates (Single Source of Truth)
  const handleUpdateProject = (updated: Project) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updated.id ? updated : p))
    );

    // Actualizar actividad del cliente si cambió
    if (updated.clientName) {
      updateClientLastActivity(updated.clientName);
    }
  };

  // Create new project
  const handleAddProject = (data: any) => {
    // 1. Calcular total de horas vendidas
    const totalHours = data.hoursTotal || 0;

    // 2. Crear presupuesto desglosado
    const customBudget = {
      supervisor: { allocated: data.roleHours?.supervisor || 0, consumed: 0 },
      coordinador: { allocated: data.roleHours?.coordinador || 0, consumed: 0 },
      sac: { allocated: data.roleHours?.sac || 0, consumed: 0 },
      contents: { allocated: data.roleHours?.contents || 0, consumed: 0 },
      contentd: { allocated: data.roleHours?.contentd || 0, consumed: 0 },
      invitado: { allocated: 0, consumed: 0 },
    };

    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: data.name,
      clientName: data.clientName,
      clientContact: '',
      startDate: data.startDate,
      endDate: data.endDate,
      deliverablesCount: data.deliverablesCount,
      description: data.description || 'Breve descripción del proyecto...',
      tags: data.tags || [],
      members: data.members || [],
      currency: data.currency || 'USD',
      totalIncome: data.totalIncome || 0,
      saleOrderNumber: data.saleOrderNumber,
      ovNumber: String(data.saleOrderNumber || ''),
      roleHours: data.roleHours,
      hoursTotal: totalHours,
      activePhaseId: data.phases && data.phases.length > 0 ? data.phases[0].id : 'A1',
      health: 100,
      createdAt: new Date().toISOString(),
      objective: 'Definir el objetivo principal...',
      alcance: 'Definir el alcance técnico inicial...',
      riesgos: 'Definir riesgos conocidos...',
      phases: data.phases || [],
      budget: customBudget,
      raciMatrix: createDefaultRaci(),
      brandBible: {
        companyContext: { historyAndBackground: '', missionVisionUvp: '' },
        brandPersona: { archetype: '', buyerPersonas: '' },
        voiceAndTone: { personalityTraits: [], dosAndDonts: '', coreMessages: '' },
        visualIdentity: { logoRules: '', colorPaletteHex: [], typographyHierarchy: '', moodboardLinks: [] },
        resources: { driveFolderUrl: '', figmaUrl: '' }
      },
      timeEntries: [],
      auditLog: [],
      deliverables: [],
      templateType: data.templateType,
    };

    setProjects((prevProjects) => [newProject, ...prevProjects]);
    setActiveProjectId(newProject.id);
    localStorage.setItem(ACTIVE_PROJECT_KEY, newProject.id);

    if (data.clientName) {
      updateClientLastActivity(data.clientName);
    }

    // Flash toast
    handleSave();
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;

    setProjects((prevProjects) => {
      const filtered = prevProjects.filter((p) => p.id !== id);
      if (activeProjectId === id && filtered.length > 0) {
        setActiveProjectId(filtered[0].id);
        localStorage.setItem(ACTIVE_PROJECT_KEY, filtered[0].id);
      }
      return filtered;
    });
  };

  // Temporary save indicator
  const handleSave = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  // Mark active phase as completed
  const handleCompletePhase = () => {
    if (!activeProject) return;

    const currentPhaseIndex = activeProject.phases.findIndex((p) => p.id === activeProject.activePhaseId);
    if (currentPhaseIndex === -1) return;

    const currentPhase = activeProject.phases[currentPhaseIndex];
    const pendingTasks = (currentPhase.checklist || []).filter(item => !item.completed);

    if (pendingTasks.length > 0) {
      alert(`⚠️ No se puede cerrar la fase "${currentPhase.label}" porque existen ${pendingTasks.length} tarea(s) sin completar en la checklist de la fase.\n\nCompleta todas las tareas para habilitar el cierre.`);
      return;
    }

    const updatedPhases = activeProject.phases.map((p, idx) => {
      if (idx === currentPhaseIndex) {
        return {
          ...p,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    let nextPhaseId = activeProject.activePhaseId;
    if (currentPhaseIndex < activeProject.phases.length - 1) {
      const nextPhase = activeProject.phases[currentPhaseIndex + 1];
      nextPhaseId = nextPhase.id;
      
      updatedPhases[currentPhaseIndex + 1] = {
        ...updatedPhases[currentPhaseIndex + 1],
        status: 'active' as const,
      };
    }

    // Add audit trail for closing phase
    const newAuditLog = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser ? currentUser.id : 'unknown',
        username: currentUser ? currentUser.username : 'Usuario',
        userRole: currentUser ? currentUser.role : 'coordinador' as const,
        action: 'Cierre de Fase',
        entityType: 'Fase',
        details: `Cerró fase ${activeProject.activePhaseId} exitosamente. Nueva fase: ${nextPhaseId}`,
      },
      ...(activeProject.auditLog || [])
    ];

    const updatedProject: Project = {
      ...activeProject,
      activePhaseId: nextPhaseId,
      phases: updatedPhases,
      auditLog: newAuditLog
    };

    handleUpdateProject(updatedProject);
    handleSave();
  };

  const handleSelectPhase = (phaseId: string) => {
    if (!activeProject) return;
    
    const updatedProject: Project = {
      ...activeProject,
      activePhaseId: phaseId,
    };
    handleUpdateProject(updatedProject);
  };

  // Client feedback annotation handler
  const handleAddAnnotation = (deliverableId: string, comment: string) => {
    if (!activeProject) return;

    const updatedDeliverables = (activeProject.deliverables || []).map((d) => {
      if (d.id === deliverableId) {
        const newAnnotation = {
          id: `ann-${Date.now()}`,
          authorName: currentUser ? currentUser.username : 'Cliente',
          date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          comment,
          status: 'pendiente' as const,
        };
        return {
          ...d,
          annotations: [...(d.annotations || []), newAnnotation],
        };
      }
      return d;
    });

    const newAuditLog = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser ? currentUser.id : 'client',
        username: currentUser ? currentUser.username : 'Cliente',
        userRole: currentUser ? currentUser.role : 'invitado' as const,
        action: 'Feedback de Cliente',
        entityType: 'Entregable',
        details: `Anotó comentario en entregable: "${(comment || '').substring(0, 40)}..."`,
      },
      ...(activeProject.auditLog || [])
    ];

    const updatedProject = {
      ...activeProject,
      deliverables: updatedDeliverables,
      auditLog: newAuditLog
    };

    handleUpdateProject(updatedProject);
    handleSave();
  };

  // Authentication Handlers
  const handleLogin = (user: UserSession) => {
    setCurrentUser(user);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    if (user.role === 'coordinador') {
      setCurrentView('dashboard');
    } else if (user.role === 'director_financiero') {
      setCurrentView('financial');
    } else {
      setCurrentView('planner');
    }

    if (!usersList.some((u) => u.username.toLowerCase() === user.username.toLowerCase())) {
      const updated = [...usersList, user];
      setUsersList(updated);
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_USER_KEY);
  };

  // Users management Handlers
  const handleUpdateUser = (updatedUser: UserSession) => {
    const updated = usersList.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsersList(updated);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));

    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const handleAddUser = (newUser: UserSession) => {
    const updated = [...usersList, newUser];
    setUsersList(updated);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
  };

  const handleDeleteUser = (userId: string) => {
    const updated = usersList.filter((u) => u.id !== userId);
    setUsersList(updated);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
  };

  // Render Login if unauthenticated
  if (!currentUser) {
    return <Login onLogin={handleLogin} usersList={usersList} />;
  }

  // Loading Screen
  if (!activeProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-semibold">Cargando Sistema de Fases...</p>
        </div>
      </div>
    );
  }

  // Dynamic Routing: Client Portal Layout for 'invitado'
  if (currentUser.role === 'invitado') {
    return (
      <ClientPortal
        project={activeProject}
        onAddAnnotation={handleAddAnnotation}
        onLogout={handleLogout}
      />
    );
  }

  const handleLogTimeGlobal = (
    projectId: string,
    phaseId: string,
    hours: number,
    description: string,
    type: TimeEntryType = 'normal',
    retrabajoOrigen?: 'cliente' | 'interno' | 'proveedor',
    retrabajoMotivo?: string
  ) => {
    if (!currentUser) return;
    const targetProj = projects.find(p => p.id === projectId);
    if (!targetProj) return;

    const newEntry = {
      id: `time-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser.id,
      username: currentUser.username,
      role: (currentUser.role || 'contents') as any,
      hours: hours,
      date: new Date().toISOString().split('T')[0],
      description: description,
      phaseId: phaseId,
      type: type,
      retrabajoOrigen: retrabajoOrigen,
      retrabajoMotivo: retrabajoMotivo
    };

    const updatedEntries = [...(targetProj.timeEntries || []), newEntry];

    // Actualizar presupuesto del rol
    const userRoleKey = currentUser.role === 'coordinador' ? 'coordinador' : currentUser.role;
    const currentBudget = targetProj.budget || createDefaultBudget();
    const updatedRoleBudget = {
      ...currentBudget[userRoleKey],
      consumed: (currentBudget[userRoleKey]?.consumed || 0) + hours
    };

    const updatedProject: Project = {
      ...targetProj,
      timeEntries: updatedEntries,
      budget: {
        ...currentBudget,
        [userRoleKey]: updatedRoleBudget
      }
    };

    handleUpdateProject(updatedProject);
  };

  const activePhase = activeProject.phases.find((p) => p.id === activeProject.activePhaseId) || activeProject.phases[0];

  return (
    <MainLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      currentView={currentView}
      onNavigate={(view) => setCurrentView(view)}
      projects={visibleProjects}
      users={usersList}
      onLogTimeGlobal={handleLogTimeGlobal}
    >
      {currentView === 'profile' ? (
        <div className="flex-1 overflow-y-auto h-full">
          <MyProfileView
            currentUser={currentUser}
            projects={visibleProjects}
          />
        </div>
      ) : currentView === 'dashboard' && currentUser.role === 'coordinador' ? (
        <div className="flex-1 overflow-hidden h-full">
          <CoordinatorDashboard 
            projects={projects} 
            users={usersList} 
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject} 
          />
        </div>
      ) : currentView === 'team' && currentUser.role === 'coordinador' ? (
        <div className="flex-1 overflow-hidden h-full">
          <TeamManagement
            usersList={usersList}
            projects={projects}
            onUpdateUser={handleUpdateUser}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            currentUser={currentUser}
          />
        </div>
      ) : currentView === 'planner' ? (
        <div className="flex-1 overflow-y-auto h-full">
          <PlannerGrid
            projects={visibleProjects}
            users={usersList}
            currentUser={currentUser}
          />
        </div>
      ) : currentView === 'gantt' ? (
        <div className="flex-1 overflow-y-auto h-full">
          <GanttView
            projects={visibleProjects}
            users={usersList}
          />
        </div>
      ) : currentView === 'clients' && (currentUser.role === 'coordinador' || currentUser.role === 'director_financiero' || currentUser.role === 'supervisor') ? (
        <div className="flex-1 overflow-y-auto h-full">
          <ClientsManagement
            clients={clients}
            projects={projects}
            onAddClient={handleAddClient}
            onUpdateClientStatus={handleUpdateClientStatus}
          />
        </div>
      ) : currentView === 'financial' && (currentUser.role === 'coordinador' || currentUser.role === 'director_financiero' || currentUser.role === 'supervisor') ? (
        <div className="flex-1 overflow-y-auto h-full">
          <FinancialDashboard
            projects={projects}
            clients={clients}
            users={usersList}
            currentUser={currentUser}
          />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden h-full relative" id="workspace-columns">
          
          {/* LEFT SIDEBAR: PROJECTS & SEARCH */}
          <Sidebar
            projects={visibleProjects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onAddProject={() => setIsNewProjectModalOpen(true)}
            onDeleteProject={handleDeleteProject}
            userRole={currentUser.role}
            overdueProjectIds={deliverableMonitoring.overdueProjectIds}
            approachingProjectIds={deliverableMonitoring.approachingProjectIds}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* MAIN WORKSPACE */}
          <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
            {visibleProjects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mb-4 border border-amber-200 shadow-sm">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Sin Proyectos Asignados</h3>
                <p className="text-xs text-slate-500 max-w-md font-medium leading-relaxed">
                  Hola <strong className="text-slate-800 capitalize">{currentUser.username}</strong>, actualmente no tienes proyectos asociados a tu perfil de <span className="text-amber-600 font-bold">Proveedor Externo</span>. Solicita a tu Coordinador que te asigne a los proyectos correspondientes.
                </p>
              </div>
            ) : (
              <PhaseContent
                activePhase={activePhase}
                project={activeProject}
                onUpdateProject={handleUpdateProject}
                onSave={handleSave}
                onCompletePhase={handleCompletePhase}
                showSaveToast={showSaveToast}
                userRole={currentUser.role}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      )}

      {/* USER MANAGEMENT MODAL */}
      <UserManagementModal
        isOpen={isUserMgmtOpen}
        onClose={() => setIsUserMgmtOpen(false)}
        usersList={usersList}
        projects={projects}
        onUpdateUser={handleUpdateUser}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        currentUser={currentUser}
      />

      {/* NEW PROJECT WIZARD */}
      <NewProjectWizard
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleAddProject}
        users={usersList}
        registeredClients={clients}
      />
    </MainLayout>
  );
}
