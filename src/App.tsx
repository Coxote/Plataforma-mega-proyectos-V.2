import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Project,
  UserSession,
  RoleHoursAllocation,
  Client,
  TimeEntryType,
  ViewState,
  isViewAllowedForRole,
  getDefaultViewForRole
} from './types';
import { createDefaultPhases, createDefaultBudget, createDefaultRaci } from './initialData';
import Sidebar from './components/Sidebar';
import PhaseContent from './components/PhaseContent';
import Login from './components/Login';
import { ClientPortal } from './components/ClientPortal';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { MainLayout } from './components/MainLayout';
import { TeamManagement } from './components/TeamManagement';
import { PlannerGrid } from './components/PlannerGrid';
import { GanttView } from './components/GanttView';
import { ClientsManagement } from './components/ClientsManagement';
import { MyProfileView } from './components/MyProfileView';
import { FinancialDashboard } from './components/FinancialDashboard';
import { IntegrationsPanel } from './components/IntegrationsPanel';
import { PredictiveAnalyticsPanel } from './components/PredictiveAnalyticsPanel';
import { GamificationView } from './components/GamificationView';
import { MiniWidgetStandalone } from './components/MiniWidgetStandalone';
import { Sparkles, Shield, Users, LogOut, Activity, Briefcase } from 'lucide-react';
import { generatePhasesForTemplate } from './projectTemplates';
import { NewProjectWizard } from './components/NewProjectWizard';
import { CustomModal } from './components/CustomModal';
import { useDeliverableMonitoring } from './hooks/useDeliverableMonitoring';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import {
  subscribeProjects,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  subscribeClients,
  saveClientToFirestore,
  deleteClientFromFirestore,
  subscribeUsers,
  saveUserToFirestore,
  deleteUserFromFirestore,
  authenticateOrApproveUserInFirestore,
  seedFirestoreIfEmpty,
  logTimeEntryToFirestore
} from './services/firebaseDb';

const DEMO_VERSION_KEY = 'saas_phase_system_prod_clean_v2';
const STORAGE_KEY = 'saas_phase_system_projects_prod_v2';
const ACTIVE_PROJECT_KEY = 'saas_phase_system_active_project_prod_v2';
const SESSION_USER_KEY = 'saas_phase_system_current_user_prod_v2';
const USERS_LIST_KEY = 'saas_phase_system_users_list_prod_v2';
const CLIENTS_STORAGE_KEY = 'saas_phase_system_clients_prod_v2';

const DEFAULT_CLIENTS: Client[] = [];

const DEFAULT_USERS: UserSession[] = [
  { id: 'u-rodrigo', username: 'rodrigo', email: 'rodrigo@tpp.com', puesto: 'Coordinador PM', role: 'coordinador', password: '123456', estado: 'activo', capacidadMensualHoras: 176 },
];

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [usersList, setUsersList] = useState<UserSession[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('planner');
  const [clients, setClients] = useState<Client[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isInitialized = useRef(false);

  // Modales de confirmación destructiva y advertencia de bloqueo (Paso 3 UX Modales)
  const [blockedPhaseModal, setBlockedPhaseModal] = useState<{
    isOpen: boolean;
    phaseLabel: string;
    pendingCount: number;
    pendingTasks: string[];
  }>({
    isOpen: false,
    phaseLabel: '',
    pendingCount: 0,
    pendingTasks: [],
  });
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [singleProjectRestrictionModal, setSingleProjectRestrictionModal] = useState(false);

  // Hook de monitoreo de entregables y SLAs del sistema
  const deliverableMonitoring = useDeliverableMonitoring(projects);

  // Normalizador de proyectos para migración automática Fase 0
  const normalizeProject = (p: any): Project => {
    const fallbackPhases = createDefaultPhases();
    const phases = Array.isArray(p.phases) && p.phases.length > 0
      ? p.phases.map((phase: any, index: number) => ({
          ...phase,
          id: phase.id || `A${index + 1}`,
          label: phase.label || `Fase ${index + 1}`,
          status: phase.status || (index === 0 ? 'active' : 'pending'),
          completedAt: phase.completedAt ?? null,
          checklist: Array.isArray(phase.checklist) ? phase.checklist : [],
          fields: phase.fields || {}
        }))
      : fallbackPhases;

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
      phases,
      activePhaseId: phases.some((phase) => phase.id === p.activePhaseId)
        ? p.activePhaseId
        : phases[0]?.id || 'A1',
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
      setProjects([]);
      setActiveProjectId('');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.removeItem(ACTIVE_PROJECT_KEY);

      setUsersList(DEFAULT_USERS);
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS));

      setClients(DEFAULT_CLIENTS);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));

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
        } else {
          setActiveProjectId('');
        }
      } catch (err) {
        setProjects([]);
        setActiveProjectId('');
      }
    } else {
      setProjects([]);
      setActiveProjectId('');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
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

  const [firebaseAuthUser, setFirebaseAuthUser] = useState<FirebaseUser | null>(auth.currentUser);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseAuthUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Sincronización en tiempo real con Cloud Firestore (Base de datos en la nube)
  useEffect(() => {
    if (!currentUser || !firebaseAuthUser) {
      return;
    }

    seedFirestoreIfEmpty([], DEFAULT_CLIENTS, DEFAULT_USERS);

    const unsubProjects = subscribeProjects((cloudProjects) => {
      if (cloudProjects && cloudProjects.length > 0) {
        const normalized = cloudProjects.map(normalizeProject);
        setProjects(normalized);
      }
    });

    const unsubClients = subscribeClients((cloudClients) => {
      if (cloudClients && cloudClients.length > 0) {
        const normalized = cloudClients.map(normalizeClient);
        setClients(normalized);
      }
    });

    const unsubUsers = subscribeUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsersList(cloudUsers);
        localStorage.setItem(USERS_LIST_KEY, JSON.stringify(cloudUsers));
      }
    });

    return () => {
      unsubProjects();
      unsubClients();
      unsubUsers();
    };
  }, [currentUser, firebaseAuthUser]);

  // Centralized local storage synchronization (Single Source of Truth)
  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (isInitialized.current) {
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
    saveClientToFirestore(newClient).catch(err => console.warn('Cloud sync note (Client):', err));
  };

  const handleUpdateClientStatus = (clientId: string, nuevoEstado: 'activo' | 'inactivo' | 'pausado') => {
    setClients((prevClients) => {
      const updated = prevClients.map((c) => (c.id === clientId ? { ...c, estado: nuevoEstado } : c));
      const target = updated.find((c) => c.id === clientId);
      if (target) {
        saveClientToFirestore(target).catch(err => console.warn('Cloud sync note (Client Status):', err));
      }
      return updated;
    });
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prevClients) => prevClients.filter((c) => c.id !== clientId));
    deleteClientFromFirestore(clientId).catch(err => console.warn('Cloud sync note (Delete Client):', err));
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

  // Strict View Permission Guard for all roles
  useEffect(() => {
    if (currentUser) {
      if (!isViewAllowedForRole(currentUser.role, currentView)) {
        const fallbackView = getDefaultViewForRole(currentUser.role);
        setCurrentView(fallbackView);
      }
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

    // Sincronizar con Cloud Firestore
    saveProjectToFirestore(updated).catch(err => console.warn('Cloud sync note (Project):', err));
  };

  // Create new project
  const handleAddProject = (data: any) => {
    // 1. Calcular total de horas vendidas
    const totalHours = data.hoursTotal || 0;
    const incomingPhases = Array.isArray(data.phases) && data.phases.length > 0
      ? data.phases
      : createDefaultPhases();
    const creatorMember = currentUser
      ? {
          id: currentUser.id,
          name: currentUser.username,
          role: currentUser.puesto || currentUser.role,
          email: currentUser.email
        }
      : null;
    const incomingMembers = Array.isArray(data.members) ? data.members : [];
    const members = creatorMember && !incomingMembers.some((m: any) => m.id === creatorMember.id)
      ? [creatorMember, ...incomingMembers]
      : incomingMembers;

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
      members,
      currency: data.currency || 'USD',
      totalIncome: data.totalIncome || 0,
      saleOrderNumber: data.saleOrderNumber,
      ovNumber: String(data.saleOrderNumber || ''),
      ordenesVenta: data.ordenesVenta || [],
      roleHours: data.roleHours,
      hoursTotal: totalHours,
      activePhaseId: incomingPhases[0]?.id || 'A1',
      health: 100,
      createdAt: new Date().toISOString(),
      objective: 'Definir el objetivo principal...',
      alcance: 'Definir el alcance técnico inicial...',
      riesgos: 'Definir riesgos conocidos...',
      phases: incomingPhases,
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
      decisionLog: [],
      templateType: data.templateType,
    };

    setProjects((prevProjects) => [newProject, ...prevProjects]);
    setActiveProjectId(newProject.id);
    setCurrentView('project');
    localStorage.setItem(ACTIVE_PROJECT_KEY, newProject.id);

    if (data.clientName) {
      updateClientLastActivity(data.clientName);
    }

    // Sincronizar nuevo proyecto con Cloud Firestore
    saveProjectToFirestore(newProject).catch(err => console.warn('Cloud sync note (New Project):', err));

    // Flash toast
    handleSave();
  };

  // Delete project with confirmation modal
  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
      setSingleProjectRestrictionModal(true);
      return;
    }
    const target = projects.find((p) => p.id === id);
    setProjectToDelete({
      id,
      name: target?.name || 'este proyecto',
    });
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    const id = projectToDelete.id;
    setProjects((prevProjects) => {
      const filtered = prevProjects.filter((p) => p.id !== id);
      if (activeProjectId === id && filtered.length > 0) {
        setActiveProjectId(filtered[0].id);
        localStorage.setItem(ACTIVE_PROJECT_KEY, filtered[0].id);
      }
      return filtered;
    });

    // Eliminar en Cloud Firestore
    deleteProjectFromFirestore(id).catch(err => console.warn('Cloud sync note (Delete Project):', err));

    setProjectToDelete(null);
    handleSave();
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
      setBlockedPhaseModal({
        isOpen: true,
        phaseLabel: currentPhase.label || currentPhase.id,
        pendingCount: pendingTasks.length,
        pendingTasks: pendingTasks.map(t => t.text || 'Tarea pendiente'),
      });
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

    const targetDeliv = (activeProject.deliverables || []).find((d) => d.id === deliverableId);
    const newAuditLog = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser ? currentUser.id : 'client',
        username: currentUser ? currentUser.username : 'Cliente',
        userRole: currentUser ? currentUser.role : 'invitado' as const,
        action: 'SOLICITUD_CAMBIOS_CLIENTE',
        entityType: 'Entregable',
        details: `Cliente solicitó cambios en el entregable "${targetDeliv?.title || 'Entregable'}": "${comment}".`,
        phaseId: targetDeliv?.phaseId,
        tag: 'ENTREGABLE_CAMBIOS'
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

  const handleClientDeliverableStatusUpdate = (deliverableId: string, newStatus: 'aprobado' | 'rechazado', comment?: string) => {
    if (!activeProject) return;

    const targetDeliv = (activeProject.deliverables || []).find((d) => d.id === deliverableId);
    const nowIso = new Date().toISOString();
    const actionText = newStatus === 'aprobado' ? 'Aprobó Formalmente' : 'Solicitó Correcciones en';
    const tag = newStatus === 'aprobado' ? 'ENTREGABLE_REVISADO' : 'ENTREGABLE_CAMBIOS';

    const updatedDeliverables = (activeProject.deliverables || []).map((d) => {
      if (d.id === deliverableId) {
        const newAnnotations = [...(d.annotations || [])];
        if (comment && comment.trim()) {
          newAnnotations.push({
            id: `ann-${Date.now()}`,
            authorName: currentUser?.username || 'Cliente',
            date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            comment: comment.trim(),
            status: 'pendiente' as const
          });
        }
        return {
          ...d,
          status: newStatus,
          annotations: newAnnotations
        };
      }
      return d;
    });

    const newAuditLog = [
      {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: nowIso,
        userId: currentUser?.id || 'client',
        username: currentUser?.username || 'Cliente',
        userRole: 'invitado' as const,
        action: newStatus === 'aprobado' ? 'APROBACION_CLIENTE' : 'RECHAZO_CORRECCION_CLIENTE',
        entityType: 'Entregable',
        details: `Cliente ${actionText} el entregable "${targetDeliv?.title || 'Entregable'}".${comment ? ` Comentario: "${comment}"` : ''}`,
        phaseId: targetDeliv?.phaseId,
        tag: tag as any
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
    const initialView = getDefaultViewForRole(user.role);
    setCurrentView(initialView);

    const existingById = usersList.some((u) => u.id === user.id);
    const existingByEmail = usersList.find((u) => u.email?.toLowerCase() === user.email?.toLowerCase());

    if (!existingById) {
      const updated = existingByEmail
        ? usersList.map((u) => (u.email?.toLowerCase() === user.email?.toLowerCase() ? user : u))
        : [...usersList, user];
      setUsersList(updated);
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
    }

    saveUserToFirestore(user).catch(err => console.warn('Cloud sync error (Login User):', err));
  };

  const handleLogout = () => {
    signOut(auth).catch(err => console.warn('Firebase sign out warning:', err));
    setCurrentUser(null);
    localStorage.removeItem(SESSION_USER_KEY);
  };

  // Users management Handlers
  const handleUpdateUser = (updatedUser: UserSession) => {
    const updated = usersList.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsersList(updated);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
    saveUserToFirestore(updatedUser).catch(err => console.warn('Cloud sync error (Update User):', err));

    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const handleAddUser = (newUser: UserSession) => {
    const updated = [...usersList, newUser];
    setUsersList(updated);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
    saveUserToFirestore(newUser).catch(err => console.warn('Cloud sync error (Add User):', err));
  };

  const handleDeleteUser = (userId: string) => {
    const updated = usersList.filter((u) => u.id !== userId);
    setUsersList(updated);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
    deleteUserFromFirestore(userId).catch(err => console.warn('Cloud sync error (Delete User):', err));
  };

  // Autenticar o Aprobar usuario pendiente (Supervisor o Coordinador)
  const handleApproveUser = async (userId: string) => {
    const approverName = currentUser?.username || 'Coordinador';
    const updated = usersList.map(u => u.id === userId ? {
      ...u,
      estado: 'activo' as const,
      autenticadoPor: approverName,
      fechaAutenticacion: new Date().toISOString()
    } : u);
    setUsersList(updated);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
    await authenticateOrApproveUserInFirestore(userId, approverName).catch(err => console.warn('Cloud sync error (Approve User):', err));
    handleSave();
  };

  // Registro de nuevo usuario desde el Login (cae en estado 'pendiente_autenticacion')
  const handleRegisterUser = async (newUser: UserSession) => {
    const updated = [...usersList, newUser];
    setUsersList(updated);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updated));
    await saveUserToFirestore(newUser);
  };

  // Render Login if unauthenticated
  if (!currentUser) {
    return (
      <Login
        onLogin={handleLogin}
        onRegisterUser={handleRegisterUser}
        usersList={usersList}
      />
    );
  }

  if (currentUser.role === 'invitado' && !activeProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4F5F0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-stone-100 text-slate-800 rounded-2xl flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-bold">Tu usuario invitado aún no tiene un proyecto asignado.</p>
        </div>
      </div>
    );
  }

  // Dynamic Routing: Client Portal Layout for 'invitado'
  if (currentUser.role === 'invitado') {
    return (
      <ClientPortal
        project={activeProject}
        projects={visibleProjects}
        onSelectProject={handleSelectProject}
        onAddAnnotation={handleAddAnnotation}
        onUpdateDeliverableStatus={handleClientDeliverableStatusUpdate}
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

    // Sincronizar directamente el registro de horas y presupuesto en Cloud Firestore
    logTimeEntryToFirestore({
      projectId,
      phaseId,
      hours,
      description,
      type,
      retrabajoOrigen,
      retrabajoMotivo,
      currentUser
    }).catch(err => console.warn('Cloud sync note (Log Time to Firestore):', err));

    handleUpdateProject(updatedProject);
  };

  const activePhase = activeProject?.phases.find((p) => p.id === activeProject.activePhaseId) || activeProject?.phases[0];

  // Modo mini-ventana independiente (popup que solo renderiza el widget)
  const isMiniWidgetView = typeof window !== 'undefined' && window.location.search.includes('mini_widget=true');

  if (isMiniWidgetView) {
    const effectiveUser: UserSession = currentUser || {
      id: 'user-default',
      username: 'Colaborador',
      puesto: 'Colaborador',
      role: 'contents'
    };

    return (
      <MiniWidgetStandalone
        projects={projects}
        currentUser={effectiveUser}
        onLogTime={handleLogTimeGlobal}
      />
    );
  }

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
      {currentView === 'profile' && isViewAllowedForRole(currentUser.role, 'profile') ? (
        <div className="view-container">
          <MyProfileView
            currentUser={currentUser}
            projects={visibleProjects}
          />
        </div>
      ) : currentView === 'dashboard' && isViewAllowedForRole(currentUser.role, 'dashboard') ? (
        <div className="view-container">
          <CoordinatorDashboard
            projects={projects}
            users={usersList}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
          />
        </div>
      ) : currentView === 'team' && isViewAllowedForRole(currentUser.role, 'team') ? (
        <div className="view-container">
          <TeamManagement
            usersList={usersList}
            projects={projects}
            onUpdateUser={handleUpdateUser}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onApproveUser={handleApproveUser}
            currentUser={currentUser}
          />
        </div>
      ) : currentView === 'planner' && isViewAllowedForRole(currentUser.role, 'planner') ? (
        <div className="view-container">
          <PlannerGrid
            projects={visibleProjects}
            users={usersList}
            currentUser={currentUser}
          />
        </div>
      ) : currentView === 'gantt' && isViewAllowedForRole(currentUser.role, 'gantt') ? (
        <div className="view-container">
          <GanttView
            projects={visibleProjects}
            users={usersList}
          />
        </div>
      ) : currentView === 'clients' && isViewAllowedForRole(currentUser.role, 'clients') ? (
        <div className="view-container">
          <ClientsManagement
            clients={clients}
            projects={projects}
            onAddClient={handleAddClient}
            onUpdateClientStatus={handleUpdateClientStatus}
            onDeleteClient={handleDeleteClient}
          />
        </div>
      ) : currentView === 'financial' && isViewAllowedForRole(currentUser.role, 'financial') ? (
        <div className="view-container">
          <FinancialDashboard
            projects={projects}
            clients={clients}
            users={usersList}
            currentUser={currentUser}
          />
        </div>
      ) : currentView === 'integrations' && isViewAllowedForRole(currentUser.role, 'integrations') ? (
        <div className="view-container">
          <IntegrationsPanel currentUser={currentUser} />
        </div>
      ) : currentView === 'predictive' && isViewAllowedForRole(currentUser.role, 'predictive') ? (
        <div className="view-container">
          <PredictiveAnalyticsPanel
            projects={projects}
            users={usersList}
            currentUser={currentUser}
          />
        </div>
      ) : currentView === 'gamification' && isViewAllowedForRole(currentUser.role, 'gamification') ? (
        <div className="view-container">
          <GamificationView
            projects={projects}
            users={usersList}
            currentUser={currentUser}
            onSelectProject={handleSelectProject}
            onNavigateToView={(view) => setCurrentView(view)}
          />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden h-full min-h-0 relative" id="workspace-columns">

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
            currentUser={currentUser}
          />

          {/* MAIN WORKSPACE */}
          <div className="flex-1 h-full min-h-0 overflow-hidden flex flex-col min-w-0">
            {!activeProject || !activePhase || visibleProjects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F4F5F0]">
                <div className="w-16 h-16 bg-stone-100 text-slate-800 rounded-3xl flex items-center justify-center mb-4 shadow-xs">
                  <Briefcase className="w-8 h-8 text-slate-800" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay proyectos creados</h3>
                <p className="text-xs text-slate-500 max-w-md font-normal leading-relaxed">
                  Hola <strong className="text-slate-800 font-semibold capitalize">{currentUser.username}</strong>, esta instancia está limpia. Crea el primer proyecto desde el botón de nuevo proyecto o autoriza usuarios desde el módulo de equipo.
                </p>
                {currentUser.role !== 'invitado' && currentUser.role !== 'proveedor' && (
                  <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="mt-5 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Crear primer proyecto
                  </button>
                )}
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
                clients={clients}
              />
            )}
          </div>
        </div>
      )}

      {/* NEW PROJECT WIZARD */}
      <NewProjectWizard
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleAddProject}
        users={usersList}
        registeredClients={clients}
      />

      {/* MODAL ADVERTENCIA DE FASE BLOQUEADA (PASO 3 UX MODALES) */}
      <CustomModal
        isOpen={blockedPhaseModal.isOpen}
        onClose={() => setBlockedPhaseModal(prev => ({ ...prev, isOpen: false }))}
        type="warning"
        title={`Fase "${blockedPhaseModal.phaseLabel}" bloqueada`}
        description={`No se puede cerrar la fase porque existen ${blockedPhaseModal.pendingCount} tarea(s) sin completar en la checklist de la fase.`}
        confirmLabel="Entendido, revisar tareas"
      >
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 max-h-48 overflow-y-auto space-y-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tareas pendientes por completar:
          </p>
          {blockedPhaseModal.pendingTasks.map((task, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>{task}</span>
            </div>
          ))}
        </div>
      </CustomModal>

      {/* MODAL CONFIRMACIÓN DESTRUCTIVA - ELIMINAR PROYECTO */}
      <CustomModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        type="danger"
        isDestructive={true}
        title="¿Eliminar este proyecto?"
        description={`¿Estás seguro de que deseas eliminar permanentemente el proyecto "${projectToDelete?.name}"? Esta acción borrará sus fases, métricas y órdenes de venta asociadas y no se puede deshacer.`}
        confirmLabel="Eliminar proyecto"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteProject}
      />

      {/* MODAL RESTRICCIÓN UN SOLO PROYECTO */}
      <CustomModal
        isOpen={singleProjectRestrictionModal}
        onClose={() => setSingleProjectRestrictionModal(false)}
        type="info"
        title="Acción Restringida"
        description="El sistema requiere mantener al menos un proyecto activo en el portafolio. No es posible eliminar el único proyecto disponible."
        confirmLabel="Entendido"
      />
    </MainLayout>
  );
}
