import React, { useState, useEffect } from 'react';
import {
  UserSession,
  IntegrationConfig,
  IntegrationSource,
  SyncLogEntry,
  AutomationRule,
  WebhookEndpoint,
  WebhookDeliveryLog
} from '../types';
import {
  Database,
  MessageSquare,
  Calendar,
  FolderGit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  ShieldCheck,
  ExternalLink,
  Info,
  X,
  Clock,
  Zap,
  Check,
  Unplug,
  Play,
  Plus,
  Trash2,
  Code2,
  Send,
  Terminal,
  ArrowRight,
  Activity,
  Copy,
  Radio,
  Sliders,
  Globe,
  Share2,
  Layers,
  Sparkles,
  Filter,
  Flame,
  CheckSquare
} from 'lucide-react';

interface IntegrationsPanelProps {
  currentUser: UserSession;
}

const STORAGE_KEY = 'saas_phase_system_integrations_v2';
const SYNC_LOG_KEY = 'saas_phase_system_sync_logs_v2';
const RULES_STORAGE_KEY = 'saas_phase_system_automation_rules_v2';
const WEBHOOKS_STORAGE_KEY = 'saas_phase_system_webhooks_v2';
const WEBHOOK_LOGS_STORAGE_KEY = 'saas_phase_system_webhook_logs_v2';

// 12 herramientas empresariales completas
const DEFAULT_INTEGRATIONS: IntegrationConfig[] = [
  { source: 'odoo', connected: true, connectedAt: new Date(Date.now() - 3600000 * 48).toISOString(), category: 'erp' },
  { source: 'hubspot', connected: false, category: 'erp' },
  { source: 'slack', connected: true, connectedAt: new Date(Date.now() - 3600000 * 24).toISOString(), category: 'communication' },
  { source: 'teams', connected: true, connectedAt: new Date(Date.now() - 3600000 * 72).toISOString(), category: 'communication' },
  { source: 'google_workspace', connected: true, connectedAt: new Date(Date.now() - 3600000 * 12).toISOString(), category: 'calendar_time' },
  { source: 'clockify', connected: false, category: 'calendar_time' },
  { source: 'outlook', connected: false, category: 'calendar_time' },
  { source: 'sharepoint', connected: false, category: 'storage_docs' },
  { source: 'notion', connected: false, category: 'storage_docs' },
  { source: 'jira', connected: true, connectedAt: new Date(Date.now() - 3600000 * 96).toISOString(), category: 'tasks_dev' },
  { source: 'github', connected: false, category: 'tasks_dev' },
  { source: 'zapier', connected: false, category: 'automation' },
];

const INITIAL_SYNC_LOGS: SyncLogEntry[] = [
  {
    id: 'log-101',
    source: 'odoo',
    status: 'success',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    message: 'Sincronizadas 8 Órdenes de Venta y tarifas por hora de roles',
    details: 'XML-RPC Odoo v16+ · Puerto Seguro 443 · 200 OK',
  },
  {
    id: 'log-102',
    source: 'slack',
    status: 'success',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    message: 'Alerta de retrabajo despachada a #proyectos-alertas',
    details: 'Canal asignado: C059281 · Entregable DEL-8812',
  },
  {
    id: 'log-103',
    source: 'jira',
    status: 'success',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    message: 'Tickets de Sprint 4 sincronizados con Fase de Desarrollo',
    details: '14 tickets vinculados a fases activas',
  },
];

const INITIAL_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Notificar en Slack cuando un Entregable entra en Retrabajo',
    triggerEvent: 'deliverable.rework',
    actionTarget: 'slack_channel',
    enabled: true,
    createdByName: 'Coordinador PM',
    executionCount: 22,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'rule-2',
    name: 'Registrar Log Auditado en Odoo ERP al Vencer SLA de Fase',
    triggerEvent: 'sla.vencido',
    actionTarget: 'odoo_log',
    enabled: true,
    createdByName: 'Director Financiero',
    executionCount: 7,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: 'rule-3',
    name: 'Alerta de Desvío Presupuestario (>80% horas) a Teams',
    triggerEvent: 'budget.exceeded_80',
    actionTarget: 'teams_channel',
    enabled: true,
    createdByName: 'Coordinador PM',
    executionCount: 4,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: 'rule-4',
    name: 'Bloquear fechas en Google Calendar al Aprobar Fase',
    triggerEvent: 'phase.completed',
    actionTarget: 'google_calendar',
    enabled: true,
    createdByName: 'Coordinador PM',
    executionCount: 16,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
];

const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh-101',
    name: 'Endpoint Producción - Odoo ERP Sync',
    url: 'https://odoo-erp.agenciatpp.com/api/v1/webhooks/deliverables',
    events: ['deliverable.rework', 'sla.vencido', 'phase.completed'],
    secretKey: 'whsec_odoo_live_99887711223344',
    status: 'active',
    lastStatusCode: 200,
    lastLatencyMs: 114,
    lastDeliveryAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'wh-102',
    name: 'Canal Central Slack / Webhook Gateway',
    url: 'https://hooks.slack.com/services/T0000/B0000/XXXXX',
    events: ['deliverable.rework', 'budget.exceeded_80'],
    secretKey: 'whsec_slack_live_44332211',
    status: 'active',
    lastStatusCode: 200,
    lastLatencyMs: 82,
    lastDeliveryAt: new Date(Date.now() - 5400000).toISOString(),
  },
];

const INITIAL_WEBHOOK_LOGS: WebhookDeliveryLog[] = [
  {
    id: 'wh-log-1',
    webhookId: 'wh-101',
    eventName: 'deliverable.rework',
    payload: {
      event: 'deliverable.rework',
      deliverableId: 'DEL-8821',
      title: 'Arte Final Campaña Verano 2026',
      reworkOrigen: 'cliente',
      reworkMotivo: 'Ajuste de dimensiones requerido por pauta digital',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    statusCode: 200,
    responseBody: '{"status":"received","record_id":"OD-9912"}',
    latencyMs: 114,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

// Metadatos detallados de cada herramienta: ¿En qué ayuda? y Requisitos
export const TOOL_DEFINITIONS: Record<
  IntegrationSource,
  {
    name: string;
    category: 'erp' | 'communication' | 'calendar_time' | 'storage_docs' | 'tasks_dev' | 'automation';
    categoryLabel: string;
    description: string;
    benefitHeadline: string;
    howItHelps: string[];
    capabilities: string[];
    accentColor: string;
    badgeBg: string;
    icon: any;
    requirements: string[];
    docUrl: string;
    defaultEndpoint: string;
  }
> = {
  odoo: {
    name: 'Odoo ERP & Facturación',
    category: 'erp',
    categoryLabel: 'ERP & Facturación',
    description: 'Sincronización bidireccional de Órdenes de Venta (OV), tarifas de roles y cálculo de margen bruto.',
    benefitHeadline: 'Control exacto de costos y facturación automatizada',
    howItHelps: [
      'Importa OVs aprobadas para calcular horas presupuestadas por perfil profesional sin doble carga.',
      'Sincroniza tarifas por hora reales para conocer la rentabilidad de cada fase al instante.',
      'Genera borradores de factura de hitos completados directamente en la contabilidad de Odoo.'
    ],
    capabilities: ['Lectura/Escritura OVs', 'Sincronización de Clientes', 'Auditoría Contable'],
    accentColor: 'from-purple-600 to-indigo-700',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: Database,
    requirements: [
      'URL del servidor Odoo v16+ (ej: https://empresa.odoo.com)',
      'Nombre de la Base de Datos de producción',
      'API Key o Token XML-RPC del usuario corporativo',
      'Permiso en módulo Ventas y Contabilidad'
    ],
    docUrl: 'https://www.odoo.com/documentation/16.0/developer/reference/external_api.html',
    defaultEndpoint: 'https://odoo.miempresa.com/jsonrpc'
  },
  hubspot: {
    name: 'HubSpot / CRM Comercial',
    category: 'erp',
    categoryLabel: 'ERP & Facturación',
    description: 'Generación automática de proyectos y clientes al ganar oportunidades en el pipeline de ventas.',
    benefitHeadline: 'Traspaso sin fricción de Ventas a Operaciones',
    howItHelps: [
      'Crea el borrador del proyecto cuando un negocio comercial pasa a "Closed-Won".',
      'Transfiere el presupuesto, alcance y contactos clave sin que el coordinador deba reescribirlos.',
      'Mantiene actualizado al ejecutivo de ventas con el avance real de ejecución.'
    ],
    capabilities: ['Creación de Proyectos', 'Sync de Contactos', 'Seguimiento de Pipeline'],
    accentColor: 'from-orange-500 to-amber-600',
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
    icon: Flame,
    requirements: [
      'HubSpot Private App Access Token (pat-na1-xxxx)',
      'Scope de lectura: crm.objects.deals.read',
      'ID del Pipeline comercial de servicios'
    ],
    docUrl: 'https://developers.hubspot.com/docs/api/crm/deals',
    defaultEndpoint: 'https://api.hubapi.com/crm/v3/objects/deals'
  },
  slack: {
    name: 'Slack Alertas & Canales',
    category: 'communication',
    categoryLabel: 'Comunicación & Alertas',
    description: 'Alertas inmediatas en canales dedicados de proyecto ante retrabajos, desvíos y entregas.',
    benefitHeadline: 'Respuesta inmediata del equipo sin saturar el correo',
    howItHelps: [
      'Notifica en el canal del proyecto cuando un cliente solicita retrabajo con el motivo y origen.',
      'Alerta al coordinador si una fase alcanza el 80% del presupuesto de horas para tomar acción preventiva.',
      'Envía felicitaciones y reconocimientos de kudos al canal general para motivar al equipo.'
    ],
    capabilities: ['Webhooks a Canales', 'Bots Interactivos', 'Comandos Slash'],
    accentColor: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: MessageSquare,
    requirements: [
      'Slack Incoming Webhook URL del canal objetivo',
      'Permiso para instalar aplicaciones en el Workspace',
      'Canales mapeados por prefijo (#proj-nombre)'
    ],
    docUrl: 'https://api.slack.com/messaging/webhooks',
    defaultEndpoint: 'https://hooks.slack.com/services/T0000/B0000/XXXXX'
  },
  teams: {
    name: 'Microsoft Teams Hub',
    category: 'communication',
    categoryLabel: 'Comunicación & Alertas',
    description: 'Canales de incidentes SLA, avisos a directores de cuenta y videollamadas de coordinación.',
    benefitHeadline: 'Integración fluida con el ecosistema corporativo Microsoft 365',
    howItHelps: [
      'Publica tarjetas adaptables (Adaptive Cards) en Teams al vencer o acercarse el plazo de un entregable.',
      'Permite a los líderes aprobar solicitudes de ampliación de horas desde un botón en Teams.',
      'Coordina reuniones automáticas de retrospectiva al completarse una fase con desvío.'
    ],
    capabilities: ['Adaptive Cards', 'Webhooks Entrantes', 'Notificaciones SLA'],
    accentColor: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: MessageSquare,
    requirements: [
      'URL de Incoming Webhook del canal de Teams objetivo',
      'ID de Equipo de Microsoft 365',
      'Permisos de Administrador en el canal'
    ],
    docUrl: 'https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
    defaultEndpoint: 'https://outlook.office.com/webhook/xxxx'
  },
  google_workspace: {
    name: 'Google Workspace (Drive & Calendar)',
    category: 'calendar_time',
    categoryLabel: 'Calendario & Tiempos',
    description: 'Bloqueo de sprints en Google Calendar y carpetas automatizadas en Google Drive.',
    benefitHeadline: 'Sincronización total de tiempos y documentos en la nube',
    howItHelps: [
      'Bloquea en Google Calendar las semanas de ejecución de cada fase para que los colaboradores no se sobreagenden.',
      'Crea automáticamente la carpeta del proyecto en Google Drive con subcarpetas por fase.',
      'Aloja el Brand Bible generado con IA y los archivos de brief accesibles con permisos por rol.'
    ],
    capabilities: ['Google Calendar Sync', 'Google Drive Folders', 'Docs & Sheets Export'],
    accentColor: 'from-sky-500 to-blue-600',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: Calendar,
    requirements: [
      'Cuenta Google Workspace corporativa',
      'Acceso OAuth2 a Google Calendar y Drive API',
      'Carpeta raíz de almacenamiento de la agencia'
    ],
    docUrl: 'https://developers.google.com/calendar/api/guides/overview',
    defaultEndpoint: 'https://www.googleapis.com/calendar/v3/calendars'
  },
  clockify: {
    name: 'Clockify / Toggl Track',
    category: 'calendar_time',
    categoryLabel: 'Calendario & Tiempos',
    description: 'Importación automática de cronómetros y timers de trabajo sin doble imputación manual.',
    benefitHeadline: 'Elimina el registro tedioso de horas y captura el tiempo real',
    howItHelps: [
      'Los colaboradores inician el timer en la app de Clockify/Toggl y se sincroniza directo a la fase del proyecto.',
      'Detecta desvíos de tiempo en vivo antes del cierre semanal.',
      'Asegura que ni una sola hora facturable se quede sin registrar.'
    ],
    capabilities: ['Sync de Timers en Vivo', 'Mapeo de Proyectos', 'Reportes de Capacidad'],
    accentColor: 'from-rose-500 to-pink-600',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: Clock,
    requirements: [
      'Clockify / Toggl Personal API Key',
      'Workspace ID de la empresa',
      'Mapeo de nombres de usuario por correo electrónico'
    ],
    docUrl: 'https://clockify.me/developers-api',
    defaultEndpoint: 'https://api.clockify.me/api/v1'
  },
  outlook: {
    name: 'Outlook Calendar & Exchange',
    category: 'calendar_time',
    categoryLabel: 'Calendario & Tiempos',
    description: 'Calendario corporativo compartido de hitos clave, entregas a clientes y vacaciones del equipo.',
    benefitHeadline: 'Visibilidad de disponibilidad y entregas para ejecutivos de cuenta',
    howItHelps: [
      'Sincroniza las fechas de presentación a clientes en la agenda de Microsoft Outlook.',
      'Refleja los días de ausencia aprobados de los colaboradores para no asignarles horas.',
      'Envía invitaciones de calendario a los clientes para la sesión de entrega de fase.'
    ],
    capabilities: ['Exchange Calendar', 'Gestión de Ausencias', 'Invitaciones de Reunión'],
    accentColor: 'from-blue-600 to-cyan-600',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: Calendar,
    requirements: [
      'Microsoft Azure App Registration (Client ID)',
      'Scope Microsoft Graph: Calendars.ReadWrite.Shared',
      'Dirección de correo del calendario corporativo'
    ],
    docUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/calendar',
    defaultEndpoint: 'https://graph.microsoft.com/v1.0/me/events'
  },
  sharepoint: {
    name: 'SharePoint & OneDrive Storage',
    category: 'storage_docs',
    categoryLabel: 'Almacenamiento & Docs',
    description: 'Repositorio seguro de actas firmadas de aceptación de entregables y piezas finales en alta resolución.',
    benefitHeadline: 'Almacenamiento corporativo de auditoría y respaldo legal',
    howItHelps: [
      'Crea la estructura de carpetas corporativa segura para cada proyecto bajo directivas de compliance.',
      'Almacena las actas firmadas de aceptación de fase para auditoría financiera.',
      'Control de versiones de archivos de diseño pesados con acceso directo desde el expediente.'
    ],
    capabilities: ['Biblioteca de Documentos', 'Permisos Azure AD', 'Versionado de Archivos'],
    accentColor: 'from-teal-600 to-emerald-700',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: FolderGit,
    requirements: [
      'URL del Sitio SharePoint corporativo',
      'Nombre de la Biblioteca de Documentos',
      'Token de aplicación Azure AD con scope Sites.Selected'
    ],
    docUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/sharepoint',
    defaultEndpoint: 'https://empresa.sharepoint.com/sites/proyectos'
  },
  notion: {
    name: 'Notion Workspace',
    category: 'storage_docs',
    categoryLabel: 'Almacenamiento & Docs',
    description: 'Centralización de wikis de proyecto, actas de reuniones y Brand Bibles en páginas colaborativas.',
    benefitHeadline: 'Toda la documentación y briefs accesibles en un workspace moderno',
    howItHelps: [
      'Crea una página de proyecto en Notion con el Brand Bible generado por IA y objetivos.',
      'Permite a clientes y equipo colaborar en minutas y requerimientos sin salir de su herramienta.',
      'Sincroniza el estado de las fases en una base de datos visual en Notion.'
    ],
    capabilities: ['Páginas Automáticas', 'Bases de Datos Notion', 'Bloques de Documentación'],
    accentColor: 'from-stone-800 to-black',
    badgeBg: 'bg-stone-100 text-stone-900 border-stone-300',
    icon: Layers,
    requirements: [
      'Notion Internal Integration Secret (secret_xxxx)',
      'Database ID donde alojar los proyectos',
      'Página compartida con la integración'
    ],
    docUrl: 'https://developers.notion.com/docs/getting-started',
    defaultEndpoint: 'https://api.notion.com/v1/pages'
  },
  jira: {
    name: 'Jira Software / Atlassian',
    category: 'tasks_dev',
    categoryLabel: 'Gestión & Devs',
    description: 'Sincronización de tickets de desarrollo, QA y diseño con el avance porcentual de las fases.',
    benefitHeadline: 'Puente directo entre la gestión de proyectos y los equipos técnicos',
    howItHelps: [
      'Al cerrar incidencias en Jira, actualiza automáticamente el avance porcentual de la fase.',
      'Evita que los desarrolladores deban duplicar reportes en la plataforma de gestión.',
      'Vincula el número de ticket (ej: PROJ-142) a la bitácora de tiempo de la plataforma.'
    ],
    capabilities: ['Sync de Epics & Sprints', 'Cálculo de % Avance', 'Mapeo de Tareas'],
    accentColor: 'from-blue-700 to-indigo-800',
    badgeBg: 'bg-blue-50 text-blue-900 border-blue-200',
    icon: CheckSquare,
    requirements: [
      'Dominio Atlassian Cloud (ej: tuempresa.atlassian.net)',
      'Correo de usuario y API Token de Jira',
      'Clave de proyecto objetivo (Project Key: PROJ)'
    ],
    docUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/',
    defaultEndpoint: 'https://tuempresa.atlassian.net/rest/api/3'
  },
  github: {
    name: 'GitHub / GitLab Code Repos',
    category: 'tasks_dev',
    categoryLabel: 'Gestión & Devs',
    description: 'Trazabilidad de Pull Requests, commits y despliegues vinculados a fases de proyectos de desarrollo.',
    benefitHeadline: 'Auditoría técnica en vivo de entregables de código y software',
    howItHelps: [
      'Asocia commits y PRs mergeados a las fases de desarrollo web o software de la plataforma.',
      'Marca fases como listas para QA cuando se completa un despliegue en staging.',
      'Registra qué desarrollador realizó cada commit para la bitácora de auditoría.'
    ],
    capabilities: ['Webhooks de PR & Commits', 'Trazabilidad de Releases', 'Seguimiento Dev'],
    accentColor: 'from-slate-900 to-stone-900',
    badgeBg: 'bg-slate-100 text-slate-900 border-slate-300',
    icon: Code2,
    requirements: [
      'GitHub Personal Access Token (ghp_xxxx) con scope repo',
      'Organización / Repositorio objetivo',
      'Webhook en el repositorio apuntando al endpoint de la plataforma'
    ],
    docUrl: 'https://docs.github.com/en/rest',
    defaultEndpoint: 'https://api.github.com/repos'
  },
  zapier: {
    name: 'Zapier & Make (No-Code Hub)',
    category: 'automation',
    categoryLabel: 'Automatización No-Code',
    description: 'Conector universal para vincular la plataforma con más de 5,000 herramientas y servicios externos.',
    benefitHeadline: 'Flexibilidad infinita sin escribir una sola línea de código',
    howItHelps: [
      'Dispara mensajes de WhatsApp a clientes con Twilio cuando se aprueba una fase.',
      'Sincroniza tareas con Asana, Monday, ClickUp o Trello según la preferencia del cliente.',
      'Genera contratos en DocuSign o SignNow automáticamente al iniciar un proyecto.'
    ],
    capabilities: ['Trigger por Webhooks REST', '5,000+ Apps Conectables', 'Automatizaciones Multi-Paso'],
    accentColor: 'from-orange-600 to-amber-500',
    badgeBg: 'bg-orange-50 text-orange-900 border-orange-200',
    icon: Zap,
    requirements: [
      'Cuenta activa en Zapier o Make.com',
      'Webhook URL generado en tu "Catch Hook" trigger',
      'Formato de Payload JSON estándar de la plataforma'
    ],
    docUrl: 'https://zapier.com/apps/webhook/integrations',
    defaultEndpoint: 'https://hooks.zapier.com/hooks/catch/xxxx/yyyy'
  }
};

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'conectores' | 'automatizaciones' | 'webhooks'>('conectores');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'erp' | 'communication' | 'calendar_time' | 'storage_docs' | 'tasks_dev' | 'automation'>('all');

  // Integraciones de Conectores
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_INTEGRATIONS;
  });

  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(SYNC_LOG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SYNC_LOGS;
  });

  // Automatizaciones
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() => {
    try {
      const saved = localStorage.getItem(RULES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_AUTOMATION_RULES;
  });

  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(() => {
    try {
      const saved = localStorage.getItem(WEBHOOKS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WEBHOOKS;
  });

  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>(() => {
    try {
      const saved = localStorage.getItem(WEBHOOK_LOGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WEBHOOK_LOGS;
  });

  // UI state
  const [selectedToolModal, setSelectedToolModal] = useState<IntegrationSource | null>(null);
  const [testingPingSource, setTestingPingSource] = useState<IntegrationSource | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Rule Modal
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleEvent, setNewRuleEvent] = useState<AutomationRule['triggerEvent']>('deliverable.rework');
  const [newRuleTarget, setNewRuleTarget] = useState<AutomationRule['actionTarget']>('slack_channel');

  // New Webhook Modal
  const [isNewWebhookModalOpen, setIsNewWebhookModalOpen] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['deliverable.rework', 'sla.vencido']);

  // Webhook Tester State
  const [testWebhookId, setTestWebhookId] = useState<string>('');
  const [testEventName, setTestEventName] = useState<string>('deliverable.rework');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Form states inside modal
  const [modalEndpoint, setModalEndpoint] = useState('');
  const [modalApiKey, setModalApiKey] = useState('');
  const [modalEvents, setModalEvents] = useState<string[]>(['retrabajo', 'vencimiento']);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Expanded tool card info state
  const [expandedInfoSource, setExpandedInfoSource] = useState<IntegrationSource | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
    } catch (e) { console.error(e); }
  }, [integrations]);

  useEffect(() => {
    try {
      localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(syncLogs));
    } catch (e) { console.error(e); }
  }, [syncLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(automationRules));
    } catch (e) { console.error(e); }
  }, [automationRules]);

  useEffect(() => {
    try {
      localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(webhooks));
    } catch (e) { console.error(e); }
  }, [webhooks]);

  useEffect(() => {
    try {
      localStorage.setItem(WEBHOOK_LOGS_STORAGE_KEY, JSON.stringify(webhookLogs));
    } catch (e) { console.error(e); }
  }, [webhookLogs]);

  // Toast clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const hasAccess = currentUser.role === 'coordinador' || currentUser.role === 'director_financiero';

  if (!hasAccess) {
    return (
      <div className="p-10 max-w-xl mx-auto my-12 text-center space-y-4 bg-white rounded-3xl shadow-xs border border-stone-200/80">
        <div className="w-16 h-16 bg-[#F4F5F0] text-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-8 h-8 text-slate-800" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-sm text-slate-500 font-normal max-w-md mx-auto leading-relaxed">
          El Centro de Integraciones y Automatizaciones está reservado para Coordinadores PM y la Dirección de Operaciones.
        </p>
      </div>
    );
  }

  const getConfig = (source: IntegrationSource): IntegrationConfig => {
    return integrations.find((i) => i.source === source) || { source, connected: false };
  };

  const handleOpenConnectModal = (source: IntegrationSource) => {
    const config = getConfig(source);
    const def = TOOL_DEFINITIONS[source];
    setModalEndpoint(config.endpointUrl || def.defaultEndpoint || '');
    setModalApiKey(config.apiKey || '');
    setSelectedToolModal(source);
  };

  const handleSaveAndVerifyConnection = (source: IntegrationSource) => {
    setIsSavingConfig(true);
    const def = TOOL_DEFINITIONS[source];

    setTimeout(() => {
      const nowISO = new Date().toISOString();
      const newLog: SyncLogEntry = {
        id: `log-${Date.now()}`,
        source,
        status: 'success',
        timestamp: nowISO,
        message: `Conexión verificada exitosamente con ${def.name}`,
        details: modalEndpoint ? `Endpoint: ${modalEndpoint}` : 'Protocolo OAuth2 / API Key verificada',
      };

      setIntegrations((prev) =>
        prev.map((item) =>
          item.source === source
            ? {
                ...item,
                connected: true,
                connectedAt: nowISO,
                configuredBy: currentUser.username,
                endpointUrl: modalEndpoint || undefined,
                apiKey: modalApiKey ? '••••••••' : undefined,
                lastSync: newLog,
              }
            : item
        )
      );

      setSyncLogs((prev) => [newLog, ...prev]);
      setIsSavingConfig(false);
      setSelectedToolModal(null);
      setToastMessage(`Conector ${def.name} conectado y verificado exitosamente`);
    }, 700);
  };

  const handleTestPingInstant = (source: IntegrationSource, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestingPingSource(source);
    const def = TOOL_DEFINITIONS[source];

    setTimeout(() => {
      const latency = Math.floor(Math.random() * 65) + 40;
      const nowISO = new Date().toISOString();
      const newLog: SyncLogEntry = {
        id: `log-${Date.now()}`,
        source,
        status: 'success',
        timestamp: nowISO,
        message: `Ping de verificación a ${def.name} exitoso`,
        details: `Respuesta HTTP 200 OK · Latencia: ${latency}ms · TLS v1.3`,
      };

      setSyncLogs((prev) => [newLog, ...prev]);
      setIntegrations((prev) =>
        prev.map((item) => (item.source === source ? { ...item, lastSync: newLog } : item))
      );

      setTestingPingSource(null);
      setToastMessage(`Test de conexión a ${def.name}: 200 OK (${latency}ms)`);
    }, 800);
  };

  const handleDisconnect = (source: IntegrationSource) => {
    const def = TOOL_DEFINITIONS[source];
    const nowISO = new Date().toISOString();
    const newLog: SyncLogEntry = {
      id: `log-${Date.now()}`,
      source,
      status: 'pending',
      timestamp: nowISO,
      message: `Conector ${def.name} desconectado`,
      details: `Desconectado por ${currentUser.username}`,
    };

    setIntegrations((prev) =>
      prev.map((item) =>
        item.source === source
          ? { ...item, connected: false, connectedAt: undefined, lastSync: newLog }
          : item
      )
    );
    setSyncLogs((prev) => [newLog, ...prev]);
    setSelectedToolModal(null);
    setToastMessage(`Conector ${def.name} desconectado`);
  };

  const handleToggleRule = (ruleId: string) => {
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
    setToastMessage('Estado de la regla actualizado');
  };

  const handleExecuteRuleNow = (rule: AutomationRule) => {
    const nowISO = new Date().toISOString();
    setAutomationRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? { ...r, executionCount: r.executionCount + 1, lastTriggeredAt: nowISO }
          : r
      )
    );
    setToastMessage(`Regla "${rule.name}" ejecutada y registrada`);
  };

  const handleCreateRule = () => {
    if (!newRuleName.trim()) return;
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      triggerEvent: newRuleEvent,
      actionTarget: newRuleTarget,
      enabled: true,
      createdByName: currentUser.username,
      executionCount: 0,
    };
    setAutomationRules((prev) => [newRule, ...prev]);
    setIsNewRuleModalOpen(false);
    setNewRuleName('');
    setToastMessage('Nueva regla de automatización activada');
  };

  const handleDeleteRule = (ruleId: string) => {
    setAutomationRules((prev) => prev.filter((r) => r.id !== ruleId));
    setToastMessage('Regla eliminada');
  };

  const handleCreateWebhook = () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) return;
    const newWh: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      name: newWebhookName.trim(),
      url: newWebhookUrl.trim(),
      events: newWebhookEvents,
      secretKey: `whsec_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`,
      status: 'active',
    };
    setWebhooks((prev) => [newWh, ...prev]);
    setIsNewWebhookModalOpen(false);
    setNewWebhookName('');
    setNewWebhookUrl('');
    setToastMessage('Endpoint Webhook registrado correctamente');
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    setToastMessage('Endpoint Webhook eliminado');
  };

  const handleRunTestWebhook = () => {
    const targetWebhook = webhooks.find((w) => w.id === testWebhookId) || webhooks[0];
    if (!targetWebhook) {
      setToastMessage('Seleccione un Webhook para probar');
      return;
    }

    setIsTestingWebhook(true);

    setTimeout(() => {
      const nowISO = new Date().toISOString();
      const latency = Math.floor(Math.random() * 85) + 38;
      const isSuccess = Math.random() > 0.04;
      const statusCode = isSuccess ? 200 : 500;

      const samplePayload = {
        event: testEventName,
        timestamp: nowISO,
        projectId: 'PRJ-TPP-2026',
        projectName: 'Campaña Global Redes Q3',
        triggeredBy: currentUser.username,
        data: {
          deliverableId: 'DEL-9902',
          title: 'Entrega Final de Artes para aprobación SLA',
          status: 'retrabajo',
          motivo: 'Ajuste de dimensiones requerido por cliente',
        },
      };

      const newLog: WebhookDeliveryLog = {
        id: `wh-log-${Date.now()}`,
        webhookId: targetWebhook.id,
        eventName: testEventName,
        payload: samplePayload,
        statusCode,
        responseBody: isSuccess
          ? '{"status":"success","received":true,"event_id":"evt_8832"}'
          : '{"error":"Internal Server Error","code":500}',
        latencyMs: latency,
        timestamp: nowISO,
      };

      setWebhookLogs((prev) => [newLog, ...prev]);

      setWebhooks((prev) =>
        prev.map((w) =>
          w.id === targetWebhook.id
            ? {
                ...w,
                lastStatusCode: statusCode,
                lastLatencyMs: latency,
                lastDeliveryAt: nowISO,
                status: isSuccess ? 'active' : 'failed',
              }
            : w
        )
      );

      setIsTestingWebhook(false);
      setToastMessage(
        isSuccess
          ? `Payload transmitido a ${targetWebhook.name} (HTTP 200 OK - ${latency}ms)`
          : `Error HTTP 500 en endpoint ${targetWebhook.name}`
      );
    }, 900);
  };

  const formatFreshness = (isoString?: string) => {
    if (!isoString) return 'Sin sincronizar';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return new Date(isoString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const connectedCount = integrations.filter((i) => i.connected).length;
  const activeRulesCount = automationRules.filter((r) => r.enabled).length;

  // Filter tools by category
  const toolList = (Object.keys(TOOL_DEFINITIONS) as IntegrationSource[]).filter((src) => {
    if (categoryFilter === 'all') return true;
    return TOOL_DEFINITIONS[src].category === categoryFilter;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* NOTIFICACIÓN TOAST */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-[#c6ef4e] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F4F5F0] text-slate-700 border border-stone-200/60">
              <span className="w-2 h-2 rounded-full bg-[#c6ef4e]" />
              Ecosistema Conectado • TPP Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Centro de Integraciones y Automatizaciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Conecta tus herramientas empresariales (ERP, Slack, Jira, Google, Notion) para sincronizar datos en tiempo real y eliminar la doble carga operativa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('automatizaciones')}
            className="px-4 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-slate-700" />
            <span>Reglas ({activeRulesCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('webhooks')}
            className="px-4 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Radio className="w-4 h-4 text-slate-700" />
            <span>Webhooks ({webhooks.length})</span>
          </button>
        </div>
      </div>

      {/* BANNER DE KPIS EJECUTIVOS DE CONECTIVIDAD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Conectores Activos
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{connectedCount}</span>
              <span className="text-xs font-semibold text-slate-400">/ 12 disponibles</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#edf9c7] flex items-center justify-center text-slate-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Salud del Ecosistema
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">99.8%</span>
              <span className="text-xs font-bold text-emerald-600">SLA OK</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F4F5F0] flex items-center justify-center text-slate-800">
            <Activity className="w-5 h-5 text-slate-700" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Reglas Automatizadas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{activeRulesCount}</span>
              <span className="text-xs font-semibold text-slate-500">en vivo</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F4F5F0] flex items-center justify-center text-slate-800">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Eventos Sincronizados
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{syncLogs.length + webhookLogs.length}</span>
              <span className="text-xs font-semibold text-slate-500">auditorías</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F4F5F0] flex items-center justify-center text-slate-800">
            <Clock className="w-5 h-5 text-slate-700" />
          </div>
        </div>
      </div>

      {/* PESTAÑAS PRINCIPALES DEL PANEL */}
      <div className="flex bg-[#F4F5F0] p-1.5 rounded-2xl gap-1 border border-stone-200/50 w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('conectores')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'conectores'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-slate-700" />
          <span>Conectores de Herramientas (12)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('automatizaciones')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'automatizaciones'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Reglas de Automatización ({automationRules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'webhooks'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4 text-slate-700" />
          <span>Webhooks & Live Sandbox ({webhooks.length})</span>
        </button>
      </div>

      {/* ======================= PESTAÑA 1: CONECTORES ======================= */}
      {activeTab === 'conectores' && (
        <div className="space-y-6">

          {/* FILTRO DE CATEGORÍAS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
              Categorías:
            </span>
            {[
              { id: 'all', label: 'Todas las Herramientas (12)' },
              { id: 'erp', label: 'ERP & Facturación (2)' },
              { id: 'communication', label: 'Comunicación & Alertas (2)' },
              { id: 'calendar_time', label: 'Calendario & Tiempos (3)' },
              { id: 'storage_docs', label: 'Almacenamiento & Docs (3)' },
              { id: 'tasks_dev', label: 'Gestión & Devs (2)' },
              { id: 'automation', label: 'No-Code & Webhooks (1)' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-[#F4F5F0] text-slate-600 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* GRID DE HERRAMIENTAS INTEGRADAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {toolList.map((source) => {
              const def = TOOL_DEFINITIONS[source];
              const config = getConfig(source);
              const isTesting = testingPingSource === source;
              const isExpanded = expandedInfoSource === source;

              return (
                <div
                  key={source}
                  className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 flex items-center justify-center text-slate-800 shadow-2xs shrink-0">
                          <def.icon className="w-6 h-6 text-slate-800" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {def.categoryLabel}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">
                            {def.name}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                          config.connected
                            ? 'bg-[#edf9c7] text-slate-900 border border-[#c6ef4e]/80'
                            : 'bg-[#F4F5F0] text-slate-500 border border-stone-200/60'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            config.connected ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        />
                        {config.connected ? 'Conectado' : 'Disponible'}
                      </span>
                    </div>

                    {/* Descripción Breve */}
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">
                      {def.description}
                    </p>

                    {/* SECCIÓN DESTACADA: ¿EN QUÉ TE AYUDA? */}
                    <div className="p-3.5 bg-[#F4F5F0] rounded-2xl border border-stone-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-slate-800" />
                          <span>¿En qué te ayuda?</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedInfoSource(isExpanded ? null : source)}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                        >
                          {isExpanded ? 'Menos detalles' : 'Ver beneficios'}
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 font-semibold leading-snug">
                        {def.benefitHeadline}
                      </p>

                      {/* Beneficios desplegados */}
                      {isExpanded && (
                        <ul className="space-y-1.5 pt-2 border-t border-stone-200/60 text-[11px] text-slate-600 animate-in fade-in">
                          {def.howItHelps.map((help, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span>{help}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Capacidades clave */}
                    <div className="flex flex-wrap gap-1.5">
                      {def.capabilities.map((cap, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-stone-100 text-slate-600"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    {/* Última sincronización */}
                    {config.connected && config.lastSync && (
                      <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-stone-100">
                        <span className="truncate">{config.lastSync.message}</span>
                        <span className="font-mono text-[10px] shrink-0 text-slate-400">
                          {formatFreshness(config.lastSync.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones de Tarjeta */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    {config.connected ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleTestPingInstant(source, e)}
                          disabled={isTesting}
                          className="px-3.5 py-1.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5"
                          title="Probar conexión con ping real"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Probando...' : 'Test Ping'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenConnectModal(source)}
                          className="px-4 py-1.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-2xs"
                        >
                          Configurar
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={def.docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1"
                        >
                          <span>Docs</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenConnectModal(source)}
                          className="px-5 py-1.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          Conectar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* HISTORIAL RECIENTE DE SINCRONIZACIÓN */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Bitácora de Sincronizaciones Recientes
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Registro en vivo de intercambios de datos, pings de salud y eventos auditados.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F4F5F0] text-slate-700">
                {syncLogs.length} logs registrados
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {syncLogs.map((log) => {
                const def = TOOL_DEFINITIONS[log.source];
                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-[#F4F5F0] rounded-2xl border border-stone-200/60 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-stone-200/60 shadow-2xs">
                        {def ? <def.icon className="w-4 h-4 text-slate-800" /> : <Database className="w-4 h-4 text-slate-800" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          {log.message}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {log.details}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px]">
                        ✓ Exitoso
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                        {formatFreshness(log.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ======================= PESTAÑA 2: AUTOMATIZACIONES ======================= */}
      {activeTab === 'automatizaciones' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/80 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Reglas de Automatización de Flujos</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5 max-w-xl">
                Configura disparadores en cascada: cuando ocurra un evento operativo en la plataforma, ejecuta automáticamente una acción en tus canales o ERP.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewRuleModalOpen(true)}
              className="px-5 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-slate-900" />
              <span>Nueva Regla de Automatización</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automationRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rule.enabled ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        />
                        <h4 className="font-bold text-sm text-slate-900">{rule.name}</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Creada por {rule.createdByName} · Ejecuciones: {rule.executionCount}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lógica SI ... ENTONCES ... */}
                  <div className="grid grid-cols-1 gap-2 bg-[#F4F5F0] p-3.5 rounded-2xl text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-white font-bold text-slate-800 text-[10px] border border-stone-200/60">
                        SI EVENTO:
                      </span>
                      <span className="font-mono text-slate-800 font-semibold">{rule.triggerEvent}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-white font-bold text-slate-800 text-[10px] border border-stone-200/60">
                        ENTONCES:
                      </span>
                      <span className="font-mono text-slate-800 font-semibold">{rule.actionTarget}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      rule.enabled
                        ? 'bg-[#edf9c7] text-slate-900 border border-[#c6ef4e]'
                        : 'bg-stone-200 text-slate-600'
                    }`}
                  >
                    {rule.enabled ? '✓ Activa' : 'Pausada'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteRuleNow(rule)}
                    className="px-4 py-1.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-800 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-slate-800" />
                    <span>Ejecutar Ahora</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= PESTAÑA 3: WEBHOOKS & LIVE SANDBOX ======================= */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/80 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-slate-800" />
                <span>Gestión de Webhooks & Endpoints Salientes</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5 max-w-xl">
                Transmite payloads JSON seguros firmados con HMAC SHA-256 hacia tus microservicios o plataformas externas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewWebhookModalOpen(true)}
              className="px-5 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-slate-900" />
              <span>Registrar Nuevo Webhook</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                      <h4 className="font-bold text-sm text-slate-900">{wh.name}</h4>
                    </div>
                    <p className="text-xs font-mono text-slate-500 truncate max-w-xs">{wh.url}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar webhook"
                  >
                    <Trash2 className="w-4 h-4 text-slate-800" />
                  </button>
                </div>

                <div className="bg-[#F4F5F0] p-3.5 rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Secret Key:</span>
                    <span className="font-mono text-xs text-slate-800 font-bold">{wh.secretKey}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Eventos suscritos:</span>
                    <span className="font-bold text-slate-800">{wh.events.join(', ')}</span>
                  </div>
                  {wh.lastStatusCode && (
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-stone-200/60">
                      <span>Último Estado:</span>
                      <span className="font-bold text-emerald-700">
                        HTTP {wh.lastStatusCode} ({wh.lastLatencyMs}ms)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SIMULADOR INTERACTIVO (LIVE SANDBOX) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-slate-800" />
                  <span>Probador Interactivo de Payloads Webhook (Live Sandbox)</span>
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Simula la emisión inmediata de un evento operativo hacia tu endpoint y analiza el payload JSON recibido.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunTestWebhook}
                disabled={isTestingWebhook}
                className="px-6 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-40 shrink-0 active:scale-[0.98]"
              >
                <Send className={`w-4 h-4 text-slate-900 ${isTestingWebhook ? 'animate-bounce' : ''}`} />
                <span>{isTestingWebhook ? 'Transmitiendo...' : 'Enviar Payload de Prueba'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1.5">
                  Seleccionar Endpoint Objetivo:
                </label>
                <select
                  value={testWebhookId}
                  onChange={(e) => setTestWebhookId(e.target.value)}
                  className="w-full bg-[#F4F5F0] rounded-2xl px-4 py-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#c6ef4e]/40"
                >
                  <option value="">-- Seleccionar Endpoint Registrado --</option>
                  {webhooks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.url})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1.5">
                  Evento Operativo a Simular:
                </label>
                <select
                  value={testEventName}
                  onChange={(e) => setTestEventName(e.target.value)}
                  className="w-full bg-[#F4F5F0] rounded-2xl px-4 py-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#c6ef4e]/40"
                >
                  <option value="deliverable.rework">deliverable.rework (Entregable a Retrabajo)</option>
                  <option value="sla.vencido">sla.vencido (Vencimiento de SLA)</option>
                  <option value="phase.completed">phase.completed (Fase de Proyecto Aprobada)</option>
                  <option value="budget.exceeded_80">budget.exceeded_80 (Consumo &gt; 80% Horas)</option>
                </select>
              </div>
            </div>

            {/* Consola de Último Log Transmitido */}
            {webhookLogs.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Último Payload Transmitido (JSON Response 200 OK):
                </span>
                <pre className="p-4 bg-[#F4F5F0] rounded-2xl font-mono text-[11px] text-slate-800 overflow-x-auto border border-stone-200/60 max-h-48">
                  {JSON.stringify(webhookLogs[0].payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL GUIADO DE CONEXIÓN CON LA MISMA FORMA Y LÍNEA GRÁFICA DE LA PLATAFORMA */}
      {/* ========================================================================= */}
      {selectedToolModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {(() => {
              const def = TOOL_DEFINITIONS[selectedToolModal];
              const config = getConfig(selectedToolModal);

              return (
                <>
                  {/* HEADER UNIFICADO */}
                  <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
                        <def.icon className="w-5 h-5 text-slate-800" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#F4F5F0] text-slate-700 border border-stone-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c6ef4e]" />
                            Conector Oficial • {def.categoryLabel}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                          {def.name}
                        </h2>
                        <p className="text-xs text-slate-500 font-normal mt-0.5">
                          {def.benefitHeadline}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedToolModal(null)}
                      className="p-2.5 text-slate-400 hover:text-slate-900 bg-[#F4F5F0] hover:bg-stone-200 rounded-full transition-all cursor-pointer"
                      title="Cerrar ventana (Esc)"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* CUERPO DEL MODAL */}
                  <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 bg-white">

                    {/* BLOQUE INFORMATIVO: ¿EN QUÉ ME AYUDA ESTA HERRAMIENTA? */}
                    <div className="p-4 bg-[#F4F5F0] rounded-2xl border border-stone-200/80 space-y-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-slate-800" />
                        <span>Ventajas operativas de conectar {def.name}:</span>
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {def.howItHelps.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* REQUISITOS TÉCNICOS */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Requisitos de Vinculación
                      </label>
                      <div className="space-y-1.5">
                        {def.requirements.map((req, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-[#F4F5F0] rounded-xl text-xs text-slate-700 flex items-center gap-2.5"
                          >
                            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FORMULARIO DE CREDENCIALES */}
                    <div className="space-y-4 pt-2 border-t border-stone-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Endpoint URL o Servidor API *
                        </label>
                        <input
                          type="text"
                          value={modalEndpoint}
                          onChange={(e) => setModalEndpoint(e.target.value)}
                          placeholder="https://servidor.miempresa.com/api"
                          className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          API Token / Client Secret / Webhook Key
                        </label>
                        <input
                          type="password"
                          value={modalApiKey}
                          onChange={(e) => setModalApiKey(e.target.value)}
                          placeholder="••••••••••••••••••••••••••••••••"
                          className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500">Credenciales cifradas con TLS v1.3</span>
                        <a
                          href={def.docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-800 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Guía Oficial de Conexión</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                  </div>

                  {/* FOOTER UNIFICADO DE LA PLATAFORMA */}
                  <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-stone-100 bg-[#FAFAF8] flex items-center justify-between shrink-0">
                    <div>
                      {config.connected ? (
                        <button
                          type="button"
                          onClick={() => handleDisconnect(selectedToolModal)}
                          className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Unplug className="w-3.5 h-3.5 text-rose-600" />
                          <span>Desconectar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedToolModal(null)}
                          className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isSavingConfig}
                      onClick={() => handleSaveAndVerifyConnection(selectedToolModal)}
                      className="px-7 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-900" />
                      <span>{isSavingConfig ? 'Verificando...' : 'Guardar y Verificar Conexión'}</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NUEVA REGLA DE AUTOMATIZACIÓN CON LÍNEA GRÁFICA UNIFICADA */}
      {/* ========================================================================= */}
      {isNewRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 flex items-center justify-center text-slate-800 shadow-2xs">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Nueva Regla de Automatización
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Configuración de disparador y acción inmediata.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewRuleModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 bg-[#F4F5F0] hover:bg-stone-200 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CUERPO */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nombre descriptivo de la regla *
                </label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ej: Enviar alerta inmediata a Slack cuando un entregable entre en retrabajo"
                  className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Evento Disparador (SI OCURRE...) *
                </label>
                <select
                  value={newRuleEvent}
                  onChange={(e) => setNewRuleEvent(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all cursor-pointer"
                >
                  <option value="deliverable.rework">deliverable.rework (Entregable entra a Retrabajo)</option>
                  <option value="sla.vencido">sla.vencido (Vencimiento de fecha límite de fase)</option>
                  <option value="budget.exceeded_80">budget.exceeded_80 (Consumo supera 80% horas presupuestadas)</option>
                  <option value="phase.completed">phase.completed (Fase completada y aprobada)</option>
                  <option value="deliverable.approaching_deadline">deliverable.approaching_deadline (Cierre en menos de 24 horas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Acción a Ejecutar (ENTONCES HACER...) *
                </label>
                <select
                  value={newRuleTarget}
                  onChange={(e) => setNewRuleTarget(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all cursor-pointer"
                >
                  <option value="slack_channel">Canal Slack de Proyecto (Notificación interactiva)</option>
                  <option value="teams_channel">Canal Microsoft Teams (Adaptive Card)</option>
                  <option value="odoo_log">Registrar Log de Auditoría en Odoo ERP</option>
                  <option value="google_calendar">Crear Bloqueo en Google Calendar</option>
                  <option value="jira_ticket">Actualizar Ticket en Jira Software</option>
                  <option value="sharepoint_sync">Sincronizar Archivo en SharePoint</option>
                  <option value="webhook_custom">Disparar Webhook Saliente Personalizado</option>
                </select>
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-stone-100 bg-[#FAFAF8] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsNewRuleModalOpen(false)}
                className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateRule}
                disabled={!newRuleName.trim()}
                className="px-7 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-40"
              >
                Crear Regla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL REGISTRAR WEBHOOK CON LÍNEA GRÁFICA UNIFICADA */}
      {/* ========================================================================= */}
      {isNewWebhookModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F4F5F0] border border-stone-200/60 flex items-center justify-center text-slate-800 shadow-2xs">
                  <Radio className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Registrar Webhook Endpoint
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Recepción de eventos JSON con autenticación HMAC.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewWebhookModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 bg-[#F4F5F0] hover:bg-stone-200 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CUERPO */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nombre del Endpoint *
                </label>
                <input
                  type="text"
                  value={newWebhookName}
                  onChange={(e) => setNewWebhookName(e.target.value)}
                  placeholder="Ej: Servidor Central de Analytics / Gateway Zapier"
                  className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-medium text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  URL de Destino (HTTPS) *
                </label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://api.tuempresa.com/v1/webhooks/deliverables"
                  className="w-full px-4 py-3 bg-[#F4F5F0] hover:bg-stone-100/70 focus:bg-white rounded-2xl text-sm font-mono text-slate-900 border border-transparent focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c6ef4e]/40 transition-all"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-stone-100 bg-[#FAFAF8] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsNewWebhookModalOpen(false)}
                className="px-5 py-2.5 bg-[#F4F5F0] hover:bg-stone-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateWebhook}
                disabled={!newWebhookName.trim() || !newWebhookUrl.trim()}
                className="px-7 py-2.5 bg-[#c6ef4e] hover:bg-[#b5e03b] text-slate-900 font-bold rounded-full text-xs transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-40"
              >
                Registrar Webhook
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
