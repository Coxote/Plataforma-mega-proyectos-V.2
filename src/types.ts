export type Role = 'coordinador' | 'sac' | 'contents' | 'contentd' | 'invitado';

export const ROLE_HOURLY_RATES: Record<Role, number> = {
  coordinador: 40.00,
  sac: 35.50,
  contents: 28.11,
  contentd: 33.19,
  invitado: 0.00
};

export interface UserSession {
  id: string;
  username: string;
  puesto: string;
  role: Role;
  password?: string;
  projectId?: string; // Restringir invitado a un proyecto específico
}

// Registro de horas apiladas por rol
export interface TimeEntry {
  id: string;
  userId: string;
  username: string;
  role: Role;
  hours: number;
  date: string;
  description: string;
  phaseId: string;
}

// 1. Presupuesto de horas por Rol
export interface RoleBudget {
  allocated: number;
  consumed: number;
}

export type ProjectBudget = Record<Role, RoleBudget>;

// 2. Auditoría Global (Todo movimiento)
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  userRole: Role;
  action: string;      // ej: "CREAR_FASE", "SUBIR_ENTREGABLE"
  entityType: string;  // ej: "Fase", "Archivo", "Horas", "BrandBible"
  details: string;     // Descripción legible de lo que cambió
  phaseId?: string;    // Fase que modificó
}

// 3. Matriz RACI (Deprecated, pero mantenida la firma de tipo básica por compatibilidad si es necesario)
export interface RaciTask {
  id: string;
  taskName: string;
  responsible: Role[];
  accountable: Role;
  consulted: Role[];
  informed: Role[];
}

// Anotaciones y feedback del cliente en entregables
export interface ClientAnnotation {
  id: string;
  authorName: string;
  date: string;
  comment: string;
  status: 'pendiente' | 'resuelto';
}

// Entregables del proyecto
export interface DeliverableItem {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'pdf' | 'word' | 'image' | 'markdown' | 'link';
  fileUrl?: string;
  externalUrl?: string;
  uploadedBy: string;
  createdAt: string;
  isVisibleToClient: boolean;
  annotations: ClientAnnotation[];
}

// 4. Brand Bible Ultra-Detallada y Expandida
export interface BrandBibleData {
  onePager?: {
    mission?: string;
    vision?: string;
    uvp?: string;
  };
  positioning?: {
    statement?: string;
    competitors?: string;
    differentiators?: string; // Nuevos campos no visuales
  };
  valuesAndPersonality?: {
    values?: string;
    archetype?: string;
    emotionalBenefits?: string; // Nuevos campos no visuales
  };
  targetAudience?: {
    personas?: string;
  };
  brandTerritory?: {
    territoryDescription?: string;
    topicsToAvoid?: string;
  };
  contentPillars?: {
    pillarsList?: string;
    editorialGuidelines?: string;
  };
  styleAndGrammar?: {
    writingStyle?: string;
    allowedAnglicisms?: string;
  };
  voiceAndTone?: {
    guidelines?: string;
    vocabulary?: string;
    personalityTraits?: string[];
    dosAndDonts?: string; // Qué decir y qué NO decir
    coreMessages?: string;
  };
  visualIdentity?: {
    logoGuidelines?: string;
    colorPalette?: string;
    typographySystem?: string;
    logoRules?: string;
    colorPaletteHex?: string[];
    typographyHierarchy?: string;
    moodboardLinks?: string[];
  };
  companyContext?: {
    historyAndBackground?: string;
    missionVisionUvp?: string;
  };
  brandPersona?: {
    archetype?: string;
    buyerPersonas?: string; // Descripción detallada de la audiencia
  };
  resources?: {
    driveFolderUrl?: string;
    figmaUrl?: string;
  };
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Phase {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  completedAt: string | null;
  checklist: ChecklistItem[];
  fields: Record<string, string>;
}

export interface RoleHoursAllocation {
  coordinador: number;
  sac: number;
  contents: number;
  contentd: number;
}

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface BrandBible {
  archetype?: string;
  misionVision?: string;
  tonoVoz?: string;
  coloresHex?: string[];
  mensajesClave?: string;
}

export interface Client {
  id: string;
  nombreComercial: string;
  categoria: string;
  contactoPrincipal: string;
  telefono?: string;
  email?: string;
  sitioWebRedes?: string;
  brandBible?: BrandBible;
}

export type ProjectTemplateType = 
  | 'redes' 
  | 'app' 
  | 'juego' 
  | 'web' 
  | 'consultoria' 
  | 'custom';

// Modelo global del Proyecto
export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientContact?: string;
  startDate?: string;
  endDate?: string;
  deliverablesCount?: number;
  description: string;
  tags?: string[];
  members?: ProjectMember[];
  currency?: string;
  totalIncome?: number;
  activePhaseId: string;
  health: number;
  hoursTotal: number;
  createdAt: string;
  objective: string;
  alcance: string;
  riesgos: string;
  budget: ProjectBudget; // El nuevo desglose de horas
  raciMatrix?: RaciTask[]; // Deprecado / Opcional
  brandBible?: BrandBibleData;
  timeEntries: TimeEntry[];
  auditLog: AuditLogEntry[];
  deliverables: DeliverableItem[];
  phases: Phase[];
  ovNumber?: string;       // Número de Orden de Venta
  hoursSold?: number;      // Horas vendidas
  saleOrderNumber?: number | string; // No. de Orden de Venta (OV)
  roleHours?: RoleHoursAllocation;   // Desglose de horas por rol
  templateType?: string;
}
