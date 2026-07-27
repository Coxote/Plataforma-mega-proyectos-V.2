export type Role = 'coordinador' | 'sac' | 'contents' | 'contentd' | 'invitado';

export const ROLE_HOURLY_RATES: Record<Role, number> = {
  coordinador: 40.00,
  sac: 35.50,
  contents: 28.11,
  contentd: 33.19,
  invitado: 0.00
};

export const getUserAvatarUrl = (username: string): string => {
  const name = username.toLowerCase();
  if (name.includes('carlos')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256';
  }
  if (name.includes('ana')) {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256';
  }
  if (name.includes('lucia')) {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';
  }
  if (name.includes('pedro')) {
    return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256';
  }
  if (name.includes('invitado') || name.includes('cliente')) {
    return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256';
  }
  
  // Deterministic fallback based on username length or first character
  const index = username.length % 4;
  const fallbacks = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256'
  ];
  return fallbacks[index];
};

export interface UserSession {
  id: string;
  username: string;
  puesto: string;
  role: Role;
  password?: string;
  projectId?: string; // Restringir invitado a un proyecto específico
  capacidadMensualHoras?: number; // Capacidad mensual (default 176h)
  estado?: 'activo' | 'inactivo';
  lastLoginAt?: string;
}

export type TimeEntryType = 'normal' | 'retrabajo' | 'no_facturable';

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
  projectId?: string;
  type?: TimeEntryType;
  retrabajoMotivo?: string;
  retrabajoOrigen?: 'cliente' | 'interno' | 'proveedor';
  deliverableId?: string;
  ovId?: string;
  createdAt?: string;
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
  phaseId?: string;
  status?: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  assignedTo?: string;
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

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  author: string;
  userRole: Role;
  title: string;
  description: string;
  phaseId?: string;
  category: 'alcance' | 'presupuesto' | 'aprobacion' | 'tecnica' | 'otro' | string;
  date?: string;
  rationale?: string;
  approvedBy?: string;
  createdAt?: string;
}

export interface Phase {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  completedAt: string | null;
  checklist: ChecklistItem[];
  fields: Record<string, string>;
  exitCriteria?: string;
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
  estado?: 'activo' | 'inactivo' | 'pausado';
  fechaUltimaActividad?: string;
  fechaAlta?: string;
}

export interface OrdenVenta {
  id: string;
  numero: string;
  monto: number;
  moneda: string;
  horasAsociadas: number;
  fechaEmision: string;
  descripcion?: string;
  estado: 'activa' | 'facturada' | 'cancelada';
}

export interface CargaMensualUsuario {
  userId: string;
  anioMes: string; // 'YYYY-MM'
  horasDisponibles: number;
  horasVendidas: number;
  horasConsumidas: number;
  horasRetrabajo: number;
}

export type ProjectTemplateType = 
  | 'redes' 
  | 'app' 
  | 'juego' 
  | 'web' 
  | 'consultoria' 
  | 'custom';

export interface SlaAlert {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  phaseId?: string;
  phaseLabel?: string;
  deliverableId?: string;
  deliverableTitle?: string;
  type: 'phase_overdue' | 'phase_approaching' | 'deliverable_overdue' | 'deliverable_approaching' | 'hours_overflow';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  dueDate: string;
  daysDiff: number;
  targetType: 'fase' | 'entregable' | 'proyecto';
}

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
  decisionLog?: DecisionLogEntry[];
  ordenesVenta?: OrdenVenta[]; // Múltiples Órdenes de Venta por proyecto
  ovNumber?: string;       // Número de Orden de Venta (Deprecated / Compatibilidad)
  hoursSold?: number;      // Horas vendidas
  saleOrderNumber?: number | string; // No. de Orden de Venta (OV - Deprecated / Compatibilidad)
  roleHours?: RoleHoursAllocation;   // Desglose de horas por rol
  templateType?: string;
}
