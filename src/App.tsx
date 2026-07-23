import { useState, useEffect } from 'react';
import { Project, UserSession, RoleHoursAllocation, Client } from './types';
import { INITIAL_PROJECTS, createDefaultPhases, createDefaultBudget, createDefaultRaci } from './initialData';
import ProjectSelector from './components/ProjectSelector';
import Sidebar from './components/Sidebar';
import PhaseContent from './components/PhaseContent';
import RightPanel from './components/RightPanel';
import Login from './components/Login';
import UserManagementModal from './components/UserManagementModal';
import { ClientPortal } from './components/ClientPortal';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { MainLayout, ViewState } from './components/MainLayout';
import { TeamManagement } from './components/TeamManagement';
import { PlannerGrid } from './components/PlannerGrid';
import { GanttView } from './components/GanttView';
import { ClientsManagement } from './components/ClientsManagement';
import { Sparkles, Shield, Users, LogOut, Activity } from 'lucide-react';
import { generatePhasesForTemplate } from './projectTemplates';
import { NewProjectWizard } from './components/NewProjectWizard';

const STORAGE_KEY = 'saas_phase_system_projects';
const ACTIVE_PROJECT_KEY = 'saas_phase_system_active_project';
const SESSION_USER_KEY = 'saas_phase_system_current_user';
const USERS_LIST_KEY = 'saas_phase_system_users_list';
const CLIENTS_STORAGE_KEY = 'saas_phase_system_clients';

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'c1',
    nombreComercial: 'Acme Corp',
    categoria: 'Retail',
    contactoPrincipal: 'María López (Product Lead)',
    email: 'mlopez@acme.com',
    telefono: '+502 5555-1234',
    sitioWebRedes: 'https://acme.com',
    brandBible: {
      archetype: 'El Creador / El Sabio',
      misionVision: 'Automatizar el autoservicio de clientes con soluciones eficientes y transparentes.',
      tonoVoz: 'Profesional, atento, directo y empático.',
      coloresHex: ['#0f172a', '#10b981', '#3b82f6', '#f8fafc'],
      mensajesClave: 'La eficiencia y el control en un solo lugar.'
    }
  },
  {
    id: 'c2',
    nombreComercial: 'Fintech Go',
    categoria: 'Finanzas',
    contactoPrincipal: 'Alejandro Ruiz (CEO)',
    email: 'aruiz@fintechgo.com',
    telefono: '+502 5555-5678',
    sitioWebRedes: 'https://fintechgo.com',
    brandBible: {
      archetype: 'El Mago / El Héroe',
      misionVision: 'Disrumpir el onboarding financiero haciéndolo express y sin fricciones.',
      tonoVoz: 'Tecnológico, seguro, moderno y confiable.',
      coloresHex: ['#06b6d4', '#1e293b', '#10b981'],
      mensajesClave: 'Onboarding express en menos de 3 minutos, Finanzas sin límites.'
    }
  },
  {
    id: 'c3',
    nombreComercial: 'Globex S.A.',
    categoria: 'Logística',
    contactoPrincipal: 'Ricardo Toro (CTO)',
    email: 'rtoro@globex.com',
    telefono: '+502 5555-9012',
    sitioWebRedes: 'https://globex.com',
    brandBible: {
      archetype: 'El Gobernante / El Creador',
      misionVision: 'Brindar infraestructura logística robusta y de alta disponibilidad global.',
      tonoVoz: 'Corporativo, seguro, líder e institucional.',
      coloresHex: ['#1e3a8a', '#d97706', '#f3f4f6'],
      mensajesClave: 'Alta disponibilidad, Resiliencia total, Cobertura global.'
    }
  }
];

const DEFAULT_USERS: UserSession[] = [
  { id: 'u1', username: 'carlos', puesto: 'Coordinador', role: 'coordinador', password: '123' },
  { id: 'u2', username: 'ana', puesto: 'SAC', role: 'sac', password: '123' },
  { id: 'u3', username: 'lucia', puesto: 'ContentS', role: 'contents', password: '123' },
  { id: 'u5', username: 'pedro', puesto: 'ContentD', role: 'contentd', password: '123' },
  { id: 'u4', username: 'invitado', puesto: 'Cliente / Invitado', role: 'invitado', password: '123', projectId: 'p1' },
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

  // Load from local storage or default
  useEffect(() => {
    // 1. Load Projects
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedActiveId = localStorage.getItem(ACTIVE_PROJECT_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Project[];
        const normalized = parsed.map(p => ({
          ...p,
          timeEntries: p.timeEntries || [],
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
        }));
        setProjects(normalized);
        if (normalized.length > 0) {
          const defaultActive = normalized.find((p) => p.id === storedActiveId) || normalized[0];
          setActiveProjectId(defaultActive.id);
        }
      } catch (err) {
        const defaults = INITIAL_PROJECTS.map(p => ({
          ...p,
          timeEntries: p.timeEntries || [],
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
        }));
        setProjects(defaults);
        setActiveProjectId(defaults[0].id);
      }
    } else {
      const defaults = INITIAL_PROJECTS.map(p => ({
        ...p,
        timeEntries: p.timeEntries || [],
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
      }));
      setProjects(defaults);
      setActiveProjectId(defaults[0].id);
    }

    // 2. Load Users
    const storedUsers = localStorage.getItem(USERS_LIST_KEY);
    if (storedUsers) {
      try {
        setUsersList(JSON.parse(storedUsers));
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
        setClients(JSON.parse(storedClients));
      } catch (err) {
        setClients(DEFAULT_CLIENTS);
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));
      }
    } else {
      setClients(DEFAULT_CLIENTS);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));
    }
  }, []);

  // Sync to local storage
  const saveProjectsToStorage = (updatedProjects: Project[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  };

  const saveClientsToStorage = (updatedClients: Client[]) => {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
  };

  const handleAddClient = (newClient: Client) => {
    const exists = clients.some((c) => c.id === newClient.id);
    const updated = exists
      ? clients.map((c) => (c.id === newClient.id ? newClient : c))
      : [newClient, ...clients];
    setClients(updated);
    saveClientsToStorage(updated);
  };

  // Find currently active project
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    setCurrentView('project');
  };

  // General project updates
  const handleUpdateProject = (updated: Project) => {
    const updatedList = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(updatedList);
    saveProjectsToStorage(updatedList);
  };

  // Create new project
  const handleAddProject = (data: any) => {
    // 1. Calcular total de horas vendidas
    const totalHours = data.hoursTotal || 0;

    // 2. Crear presupuesto desglosado
    const customBudget = {
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

    const updatedList = [newProject, ...projects];
    setProjects(updatedList);
    setActiveProjectId(newProject.id);
    localStorage.setItem(ACTIVE_PROJECT_KEY, newProject.id);
    saveProjectsToStorage(updatedList);

    // Flash toast
    handleSave();
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;

    const filtered = projects.filter((p) => p.id !== id);
    setProjects(filtered);
    saveProjectsToStorage(filtered);

    if (activeProjectId === id) {
      setActiveProjectId(filtered[0].id);
      localStorage.setItem(ACTIVE_PROJECT_KEY, filtered[0].id);
    }
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
        details: `Anotó comentario en entregable: "${comment.substring(0, 40)}..."`,
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

  const activePhase = activeProject.phases.find((p) => p.id === activeProject.activePhaseId) || activeProject.phases[0];

  return (
    <MainLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      currentView={currentView}
      onNavigate={(view) => setCurrentView(view)}
      projects={projects}
      users={usersList}
    >
      {currentView === 'dashboard' && currentUser.role === 'coordinador' ? (
        <div className="flex-1 overflow-hidden h-full">
          <CoordinatorDashboard 
            projects={projects} 
            users={usersList} 
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
        <div className="flex-1 overflow-hidden h-full">
          <PlannerGrid
            projects={projects}
            users={usersList}
            currentUser={currentUser}
          />
        </div>
      ) : currentView === 'gantt' ? (
        <div className="flex-1 overflow-hidden h-full">
          <GanttView
            projects={projects}
            users={usersList}
          />
        </div>
      ) : currentView === 'clients' && currentUser.role === 'coordinador' ? (
        <div className="flex-1 overflow-hidden h-full">
          <ClientsManagement
            clients={clients}
            onAddClient={handleAddClient}
          />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[260px_1fr_330px] overflow-hidden h-full" id="workspace-columns">
          
          {/* COLUMN 1: LEFT SIDEBAR */}
          <div className="flex flex-col h-full border-r border-slate-200 bg-white shrink-0">
            <ProjectSelector
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={handleSelectProject}
              onAddProject={() => setIsNewProjectModalOpen(true)}
              onDeleteProject={handleDeleteProject}
              userRole={currentUser.role}
            />
            <div className="flex-1 overflow-hidden">
              <Sidebar
                phases={activeProject.phases}
                activePhaseId={activeProject.activePhaseId}
                onSelectPhase={handleSelectPhase}
              />
            </div>
          </div>

          {/* COLUMN 2: CENTER WORKSPACE */}
          <div className="h-full overflow-hidden flex flex-col">
            <PhaseContent
              activePhase={activePhase}
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onSave={handleSave}
              onCompletePhase={handleCompletePhase}
              showSaveToast={showSaveToast}
              userRole={currentUser.role}
            />
          </div>

          {/* COLUMN 3: RIGHT PANEL */}
          <div className="h-full overflow-hidden">
            <RightPanel
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              activePhase={activePhase}
              currentUser={currentUser}
            />
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
      />
    </MainLayout>
  );
}
