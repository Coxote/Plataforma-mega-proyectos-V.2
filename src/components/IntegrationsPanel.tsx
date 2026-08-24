import React, { useState, useEffect } from 'react';
import {
  UserSession,
  IntegrationConfig,
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
  Sliders
} from 'lucide-react';

interface IntegrationsPanelProps {
  currentUser: UserSession;
}

const STORAGE_KEY = 'saas_phase_system_integrations_v1';
const SYNC_LOG_KEY = 'saas_phase_system_sync_logs_v1';
const RULES_STORAGE_KEY = 'saas_phase_system_automation_rules_v1';
const WEBHOOKS_STORAGE_KEY = 'saas_phase_system_webhooks_v1';
const WEBHOOK_LOGS_STORAGE_KEY = 'saas_phase_system_webhook_logs_v1';

const DEFAULT_INTEGRATIONS: IntegrationConfig[] = [
  { source: 'odoo', connected: false },
  { source: 'teams', connected: false },
  { source: 'outlook', connected: false },
  { source: 'sharepoint', connected: false },
];

const INITIAL_SYNC_LOGS: SyncLogEntry[] = [
  {
    id: 'log-101',
    source: 'odoo',
    status: 'pending',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    message: 'Servicio en espera de credenciales de API Key de Odoo v16+',
    details: 'VerificaciÃ³n de puerto XML-RPC de facturaciÃ³n y OVs',
  },
  {
    id: 'log-102',
    source: 'teams',
    status: 'pending',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    message: 'Webhook de canal de alertas SLA pendiente de configuraciÃ³n',
    details: 'Microsoft Teams Incoming Webhook v2',
  },
];

const INITIAL_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Notificar en Teams cuando un Entregable entra en Retrabajo',
    triggerEvent: 'deliverable.rework',
    actionTarget: 'teams_channel',
    enabled: true,
    createdByName: 'Coordinador PM',
    executionCount: 14,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'rule-2',
    name: 'Registrar Log Auditado en Odoo al Vencer SLA de Fase',
    triggerEvent: 'sla.vencido',
    actionTarget: 'odoo_log',
    enabled: true,
    createdByName: 'Director Financiero',
    executionCount: 5,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'rule-3',
    name: 'Sincronizar Documentos en SharePoint al Completar Fase',
    triggerEvent: 'phase.completed',
    actionTarget: 'sharepoint_sync',
    enabled: false,
    createdByName: 'Coordinador PM',
    executionCount: 0,
  },
];

const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh-101',
    name: 'Endpoint ProducciÃ³n - Odoo ERP Sync',
    url: 'https://odoo-erp.agenciatpp.com/api/v1/webhooks/deliverables',
    events: ['deliverable.rework', 'sla.vencido', 'phase.completed'],
    secretKey: 'whsec_odoo_live_99887711223344',
    status: 'active',
    lastStatusCode: 200,
    lastLatencyMs: 142,
    lastDeliveryAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'wh-102',
    name: 'Canal Alertas - Microsoft Teams Webhook',
    url: 'https://outlook.office.com/webhook/tpp-sla-channel-01@agenciatpp.com',
    events: ['deliverable.approaching_deadline', 'deliverable.rework'],
    secretKey: 'whsec_teams_live_44332211',
    status: 'active',
    lastStatusCode: 200,
    lastLatencyMs: 89,
    lastDeliveryAt: new Date(Date.now() - 7200000).toISOString(),
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
      title: 'Arte Final CampaÃ±a Verano 2026',
      reworkOrigen: 'cliente',
      reworkMotivo: 'Ajuste de tono de color institucional',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    statusCode: 200,
    responseBody: '{"status":"received","record_id":"OD-9912"}',
    latencyMs: 142,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'conectores' | 'automatizaciones' | 'webhooks'>('conectores');

  // Capa 1: Conectores
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

  // Capa 2: Automatizaciones
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() => {
    try {
      const saved = localStorage.getItem(RULES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_AUTOMATION_RULES;
  });

  // Capa 3: Webhooks
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
  const [selectedToolModal, setSelectedToolModal] = useState<'odoo' | 'teams' | 'outlook' | 'sharepoint' | null>(null);
  const [isSyncingSource, setIsSyncingSource] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Rule Modal
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleEvent, setNewRuleEvent] = useState<AutomationRule['triggerEvent']>('deliverable.rework');
  const [newRuleTarget, setNewRuleTarget] = useState<AutomationRule['actionTarget']>('teams_channel');

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

  // Save states to localStorage
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

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const hasAccess = currentUser.role === 'coordinador' || currentUser.role === 'director_financiero';

  if (!hasAccess) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Acceso Restringido</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          El Panel de Integraciones y Automatizaciones estÃ¡ reservado para Coordinadores PM y la DirecciÃ³n Financiera.
        </p>
      </div>
    );
  }

  const getConfig = (source: 'odoo' | 'teams' | 'outlook' | 'sharepoint'): IntegrationConfig => {
    return integrations.find((i) => i.source === source) || { source, connected: false };
  };

  const handleOpenConnectModal = (source: 'odoo' | 'teams' | 'outlook' | 'sharepoint') => {
    const config = getConfig(source);
    setModalEndpoint(config.endpointUrl || '');
    setModalApiKey('');
    setSelectedToolModal(source);
  };

  const handleSimulateConnection = (source: 'odoo' | 'teams' | 'outlook' | 'sharepoint') => {
    const nowISO = new Date().toISOString();
    const newLog: SyncLogEntry = {
      id: `log-${Date.now()}`,
      source,
      status: 'success',
      timestamp: nowISO,
      message: `ConexiÃ³n verificada exitosamente con ${source.toUpperCase()}`,
      details: modalEndpoint ? `Endpoint: ${modalEndpoint}` : 'ConexiÃ³n vÃ­a API OAuth2',
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
              lastSync: newLog,
            }
          : item
      )
    );

    setSyncLogs((prev) => [newLog, ...prev]);
    setSelectedToolModal(null);
    setToastMessage(`Conector de ${source.toUpperCase()} vinculado correctamente`);
  };

  const handleDisconnect = (source: 'odoo' | 'teams' | 'outlook' | 'sharepoint') => {
    const nowISO = new Date().toISOString();
    const newLog: SyncLogEntry = {
      id: `log-${Date.now()}`,
      source,
      status: 'pending',
      timestamp: nowISO,
      message: `Conector ${source.toUpperCase()} desconectado por el usuario`,
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
    setToastMessage(`Conector de ${source.toUpperCase()} desconectado`);
  };

  const handleSyncNow = (source: 'odoo' | 'teams' | 'outlook' | 'sharepoint') => {
    setIsSyncingSource(source);

    setTimeout(() => {
      const nowISO = new Date().toISOString();
      const newLog: SyncLogEntry = {
        id: `log-${Date.now()}`,
        source,
        status: 'success',
        timestamp: nowISO,
        message: `SincronizaciÃ³n manual completada (0 errores)`,
        details: `Ejecutado por ${currentUser.username}`,
      };

      setIntegrations((prev) =>
        prev.map((item) =>
          item.source === source
            ? { ...item, lastSync: newLog }
            : item
        )
      );

      setSyncLogs((prev) => [newLog, ...prev]);
      setIsSyncingSource(null);
      setToastMessage(`SincronizaciÃ³n de ${source.toUpperCase()} realizada con Ã©xito`);
    }, 1200);
  };

  // Rule Actions
  const handleToggleRule = (ruleId: string) => {
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleRunRuleManual = (rule: AutomationRule) => {
    const nowISO = new Date().toISOString();
    setAutomationRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? { ...r, executionCount: r.executionCount + 1, lastTriggeredAt: nowISO }
          : r
      )
    );
    setToastMessage(`Regla "${rule.name}" ejecutada manualmente`);
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
    setToastMessage(`Regla de automatizaciÃ³n creada con Ã©xito`);
  };

  const handleDeleteRule = (ruleId: string) => {
    setAutomationRules((prev) => prev.filter((r) => r.id !== ruleId));
    setToastMessage(`Regla eliminada`);
  };

  // Webhook Actions
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
    setToastMessage(`Endpoint Webhook registrado correctamente`);
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    setToastMessage(`Endpoint Webhook eliminado`);
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
      const latency = Math.floor(Math.random() * 120) + 45;
      const isSuccess = Math.random() > 0.05; // 95% success rate
      const statusCode = isSuccess ? 200 : 500;

      const samplePayload = {
        event: testEventName,
        timestamp: nowISO,
        projectId: 'PRJ-TPP-2026',
        projectName: 'CampaÃ±a Global Redes Q3',
        triggeredBy: currentUser.username,
        data: {
          deliverableId: 'DEL-9902',
          title: 'Entrega Final de Artes para aprobaciÃ³n SLA',
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
          ? `Payload enviado a ${targetWebhook.name} (HTTP 200 OK - ${latency}ms)`
          : `Error HTTP 500 en endpoint ${targetWebhook.name}`
      );
    }, 1100);
  };

  const formatFreshness = (isoString?: string) => {
    if (!isoString) return 'Sin sincronizar';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return new Date(isoString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Tool details dictionary
  const TOOL_INFO = {
    odoo: {
      name: 'Odoo ERP & FacturaciÃ³n',
      category: 'Finanzas y Ã“rdenes de Venta',
      description: 'SincronizaciÃ³n de Ã“rdenes de Venta (OV), clientes, facturaciÃ³n y estados de cobro en tiempo real.',
      icon: Database,
      accentColor: 'from-[#FF5500] to-amber-600',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
      requirements: [
        'URL del servidor Odoo v16+ (ej: https://miempresa.odoo.com)',
        'Nombre exacto de la Base de Datos de producciÃ³n',
        'API Key o Token XML-RPC del usuario de integraciÃ³n',
        'Correo electrÃ³nico corporativo registrado en Odoo',
      ],
      docUrl: 'https://www.odoo.com/documentation/16.0/developer/reference/external_api.html',
    },
    teams: {
      name: 'Microsoft Teams Notifications',
      category: 'ComunicaciÃ³n & Alertamiento SLA',
      description: 'Alertas automÃ¡ticas en canales de Teams cuando un entregables o fase entra en riesgo de SLA o retrabajo.',
      icon: MessageSquare,
      accentColor: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      requirements: [
        'URL de Incoming Webhook del canal de Teams objetivo',
        'ID del Equipo Microsoft 365 (Team ID)',
        'Permisos de Administrador para agregar conectores',
        'Reglas de notificaciÃ³n de entregables activas',
      ],
      docUrl: 'https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
    },
    outlook: {
      name: 'Outlook & Exchange Calendar',
      category: 'SincronizaciÃ³n Temporal de Entregas',
      description: 'PublicaciÃ³n de fechas de cierre de fase, entregas a clientes e hitos en calendarios corporativos compartidos.',
      icon: Calendar,
      accentColor: 'from-sky-600 to-blue-800',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
      requirements: [
        'Microsoft Azure App Registration (Client ID & Tenant ID)',
        'Permiso Microsoft Graph API: Calendars.ReadWrite.Shared',
        'DirecciÃ³n del Calendario Compartido de la Agencia',
        'Consentimiento de Administrador de Microsoft 365',
      ],
      docUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/calendar',
    },
    sharepoint: {
      name: 'SharePoint & OneDrive Storage',
      category: 'GestiÃ³n de Entregables & Marca',
      description: 'VinculaciÃ³n directa y almacenamiento de enlaces de entregables, artes finales y bibliotecas de marca.',
      icon: FolderGit,
      accentColor: 'from-teal-600 to-emerald-700',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      requirements: [
        'URL del Sitio SharePoint de Clientes (ej: https://empresa.sharepoint.com/sites/entregables)',
        'Nombre de la Biblioteca de Documentos (ej: Entregables_TPP_2026)',
        'Token de AplicaciÃ³n Azure AD con scope Sites.Selected',
        'Estructura de carpetas por ID de Proyecto',
      ],
      docUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/sharepoint',
    },
  };

  const connectedCount = integrations.filter((i) => i.connected).length;
  const activeRulesCount = automationRules.filter((r) => r.enabled).length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 tracking-wider">
              FASE 6.3 COMPLETA
            </span>
            <span className="text-xs text-slate-400 font-bold">â€¢ Integraciones & Automatizaciones</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Ecosistema de Integraciones & Webhooks</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            GestiÃ³n integral de conectores con Odoo, Teams, Outlook y SharePoint, motor de reglas condicionales y Webhook Hub con probador de payload en vivo.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-xs font-black uppercase text-slate-400 block">Conectores</span>
            <span className="text-lg font-black text-slate-900">{connectedCount} / 4</span>
          </div>
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-xs font-black uppercase text-slate-400 block">Reglas Activas</span>
            <span className="text-lg font-black text-amber-600">{activeRulesCount}</span>
          </div>
          <div className="text-center px-3">
            <span className="text-xs font-black uppercase text-slate-400 block">Webhooks</span>
            <span className="text-lg font-black text-indigo-600">{webhooks.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('conectores')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'conectores'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>1. Conectores Oficiales ({connectedCount}/4)</span>
        </button>

        <button
          onClick={() => setActiveTab('automatizaciones')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'automatizaciones'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>2. Motor de Automatizaciones ({activeRulesCount} activas)</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'webhooks'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 text-amber-400" />
          <span>3. Webhook Hub & Payload Tester ({webhooks.length})</span>
        </button>
      </div>

      {/* TAB 1: CONECTORES OFICIALES */}
      {activeTab === 'conectores' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Honest Architecture Notice Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Trazabilidad Transparente de Conexiones</h3>
                <span className="text-xs font-black bg-white/10 text-slate-300 px-2 py-0.5 rounded uppercase">
                  Gobernanza
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ninguna herramienta mostrarÃ¡ estado <strong>"Conectado"</strong> sin credenciales de API verificadas de producciÃ³n. Haz clic en "Conectar" para revisar la lista de prerequisitos tÃ©cnicos o solicitar la activaciÃ³n formal con el Ã¡rea de TI.
              </p>
            </div>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['odoo', 'teams', 'outlook', 'sharepoint'] as const).map((source) => {
              const info = TOOL_INFO[source];
              const config = getConfig(source);
              const Icon = info.icon;
              const isSyncing = isSyncingSource === source;

              return (
                <div
                  key={source}
                  className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden ${
                    config.connected
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Card Header */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${info.accentColor} text-white flex items-center justify-center shadow-md`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-slate-900 tracking-tight">{info.name}</h3>
                          <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full border ${info.badgeBg}`}>
                            {info.category}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {config.connected ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Conectado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                            <Unplug className="w-3.5 h-3.5 text-slate-400" />
                            No conectado
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{info.description}</p>

                    {/* Freshness & Config Meta */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Ãšltima SincronizaciÃ³n:
                        </span>
                        <span className="font-black text-slate-800">
                          {formatFreshness(config.lastSync?.timestamp)}
                        </span>
                      </div>

                      {config.connected && config.configuredBy && (
                        <div className="flex items-center justify-between text-slate-600 text-xs pt-1 border-t border-slate-200">
                          <span className="text-slate-400">Configurado por:</span>
                          <span className="font-bold text-slate-700">{config.configuredBy}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    {config.connected ? (
                      <>
                        <button
                          onClick={() => handleSyncNow(source)}
                          disabled={isSyncing}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                        </button>

                        <button
                          onClick={() => handleDisconnect(source)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold rounded-2xl text-xs transition-all border border-slate-200 hover:border-rose-200 cursor-pointer"
                        >
                          Desconectar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenConnectModal(source)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Conectar Herramienta</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sync Log History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Historial Auditable de Sincronizaciones</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Registro cronolÃ³gico de verificaciones, sincronizaciones manuales y cambios de estado.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {syncLogs.length} Registros
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Herramienta</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Mensaje auditado</th>
                    <th className="p-3">Detalle tÃ©cnico</th>
                    <th className="p-3 text-right">Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {syncLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                        No hay registros de sincronizaciÃ³n recientes.
                      </td>
                    </tr>
                  ) : (
                    syncLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-extrabold uppercase text-xs text-slate-900">
                          {log.source}
                        </td>
                        <td className="p-3">
                          {log.status === 'success' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ã‰xito
                            </span>
                          )}
                          {log.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-300">
                              <Unplug className="w-3 h-3 text-slate-400" /> Pendiente
                            </span>
                          )}
                          {log.status === 'error' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Error
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{log.message}</td>
                        <td className="p-3 text-slate-500 text-xs font-mono">{log.details || 'â€”'}</td>
                        <td className="p-3 text-right text-slate-500 font-semibold text-xs">
                          {new Date(log.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOTOR DE AUTOMATIZACIONES */}
      {activeTab === 'automatizaciones' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Reglas Condicionales "SI [Evento] ENTONCES [AcciÃ³n]"</span>
              </h3>
              <p className="text-xs text-slate-500">
                Automatiza disparadores entre eventos de entregables y tus herramientas conectadas (Teams, Odoo, SharePoint).
              </p>
            </div>

            <button
              onClick={() => setIsNewRuleModalOpen(true)}
              className="px-4 py-2 bg-[#FF5500] hover:bg-[#E04B00] text-white font-black rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Regla</span>
            </button>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {automationRules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  rule.enabled ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      rule.enabled
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}>
                      {rule.enabled ? 'ACTIVA' : 'PAUSADA'}
                    </span>

                    <h4 className="font-extrabold text-sm text-slate-900 truncate">{rule.name}</h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium flex-wrap">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-xs">
                      SI: {rule.triggerEvent}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-xs">
                      ENTONCES: {rule.actionTarget}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>Creado por: <strong>{rule.createdByName}</strong></span>
                    <span>â€¢</span>
                    <span>Ejecutado: <strong>{rule.executionCount} veces</strong></span>
                    {rule.lastTriggeredAt && (
                      <>
                        <span>â€¢</span>
                        <span>Ãšltimo disparo: {formatFreshness(rule.lastTriggeredAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    onClick={() => handleRunRuleManual(rule)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Ejecutar regla manualmente ahora"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ejecutar</span>
                  </button>

                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1.5 font-bold rounded-xl text-xs transition-colors cursor-pointer ${
                      rule.enabled
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {rule.enabled ? 'Pausar' : 'Activar'}
                  </button>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar regla"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOK HUB & PAYLOAD TESTER */}
      {activeTab === 'webhooks' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Top Bar for Webhooks */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                <span>GestiÃ³n de Webhooks & Secret Keys</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Endpoints salientes para transmitir eventos en tiempo real a tus servidores o plataformas externas.
              </p>
            </div>

            <button
              onClick={() => setIsNewWebhookModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Webhook</span>
            </button>
          </div>

          {/* Registered Webhooks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {webhooks.map((wh) => (
              <div key={wh.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="font-extrabold text-sm text-slate-900">{wh.name}</h4>
                    </div>
                    <p className="text-xs font-mono text-slate-500 truncate max-w-xs">{wh.url}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Secret Key:</span>
                    <span className="font-mono text-xs text-slate-700 font-bold">{wh.secretKey}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Eventos suscritos:</span>
                    <span className="font-bold text-slate-800">{wh.events.join(', ')}</span>
                  </div>
                  {wh.lastStatusCode && (
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200">
                      <span>Ãšltimo Status HTTP:</span>
                      <span className="font-black text-emerald-600">
                        HTTP {wh.lastStatusCode} ({wh.lastLatencyMs}ms)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Payload Tester */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-6 border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-400" />
                  <span>Probador Interactivo de Payloads Webhook (Live Sandbox)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Simula el envÃ­o inmediato de un payload JSON de evento hacia tu endpoint objetivo y verifica la respuesta.
                </p>
              </div>

              <button
                onClick={handleRunTestWebhook}
                disabled={isTestingWebhook}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-[#FF5500] hover:opacity-95 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Send className={`w-4 h-4 ${isTestingWebhook ? 'animate-bounce' : ''}`} />
                <span>{isTestingWebhook ? 'Transmitiendo HTTP...' : 'Enviar Payload de Prueba'}</span>
              </button>
            </div>

            {/* Selector Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Seleccionar Webhook Objetivo:</label>
                <select
                  value={testWebhookId}
                  onChange={(e) => setTestWebhookId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="">-- Seleccionar Endpoint --</option>
                  {webhooks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.url})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Seleccionar Tipo de Evento:</label>
                <select
                  value={testEventName}
                  onChange={(e) => setTestEventName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="deliverable.rework">deliverable.rework (Entregable a Retrabajo)</option>
                  <option value="sla.vencido">sla.vencido (SLA Vencido en Fase)</option>
                  <option value="phase.completed">phase.completed (Fase Marcada Completada)</option>
                  <option value="deliverable.approaching_deadline">deliverable.approaching_deadline (LÃ­mite PrÃ³ximo)</option>
                </select>
              </div>
            </div>

            {/* Code / Payload Preview JSON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Payload JSON transmitido:</span>
                <span className="text-emerald-400 font-bold">Content-Type: application/json</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-amber-300 font-mono text-xs overflow-x-auto">
{JSON.stringify({
  event: testEventName,
  timestamp: new Date().toISOString(),
  projectId: 'PRJ-TPP-2026',
  projectName: 'CampaÃ±a Global Redes Q3',
  triggeredBy: currentUser.username,
  data: {
    deliverableId: 'DEL-9902',
    title: 'Entrega Final de Artes para aprobaciÃ³n SLA',
    status: testEventName.includes('rework') ? 'retrabajo' : 'completado',
    motivo: 'VerificaciÃ³n en sandbox de automatizaciÃ³n Capa 3',
  }
}, null, 2)}
              </pre>
            </div>

            {/* Webhook Delivery Audit Log */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Logs de EnvÃ­os de Webhook en Vivo
              </h4>

              <div className="space-y-2">
                {webhookLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No hay entregas registradas en la sesiÃ³n.</p>
                ) : (
                  webhookLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${
                          log.statusCode === 200 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          HTTP {log.statusCode}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">{log.eventName}</span>
                        <span className="text-slate-500 text-xs">â€¢ {log.latencyMs}ms</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span>{log.responseBody}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONNECT MODAL (CAPA 1) */}
      {selectedToolModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-all duration-300 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col text-slate-800">
            {(() => {
              const info = TOOL_INFO[selectedToolModal];
              const Icon = info.icon;
              return (
                <>
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${info.accentColor} text-white flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base tracking-tight">{info.name}</h3>
                        <p className="text-xs text-slate-300">ConfiguraciÃ³n de Conector Capa 1</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedToolModal(null)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-amber-950">Prerequisitos TÃ©cnicos de ConexiÃ³n</span>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Este conector requiere parÃ¡metros de acceso de tu infraestructura corporativa. Puedes registrar los parÃ¡metros a continuaciÃ³n o ejecutar una prueba de conexiÃ³n simulada para verificar el comportamiento de la plataforma.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Credenciales Requeridas
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {info.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        ParÃ¡metros de ConfiguraciÃ³n
                      </h4>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          URL Servidor / Webhook Endpoint
                        </label>
                        <input
                          type="text"
                          value={modalEndpoint}
                          onChange={(e) => setModalEndpoint(e.target.value)}
                          placeholder="https://servidor-corporativo.com/api"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          API Key / User Access Token (Secret)
                        </label>
                        <input
                          type="password"
                          value={modalApiKey}
                          onChange={(e) => setModalApiKey(e.target.value)}
                          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <a
                        href={info.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#FF5500] hover:underline font-bold flex items-center gap-1"
                      >
                        <span>DocumentaciÃ³n Oficial</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedToolModal(null)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={() => handleSimulateConnection(selectedToolModal)}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar & Verificar ConexiÃ³n</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* NEW RULE MODAL */}
      {isNewRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Nueva Regla de AutomatizaciÃ³n</span>
              </h3>
              <button
                onClick={() => setIsNewRuleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nombre de la Regla:</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ej: Enviar alerta Teams al marcar entregable como retrabajo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Evento Disparador (SI...):</label>
                <select
                  value={newRuleEvent}
                  onChange={(e) => setNewRuleEvent(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                >
                  <option value="deliverable.rework">deliverable.rework (Entregable a Retrabajo)</option>
                  <option value="sla.vencido">sla.vencido (SLA Vencido en Fase)</option>
                  <option value="phase.completed">phase.completed (Fase Completada)</option>
                  <option value="deliverable.approaching_deadline">deliverable.approaching_deadline (Cierre en &lt; 24h)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">AcciÃ³n Objetivo (ENTONCES...):</label>
                <select
                  value={newRuleTarget}
                  onChange={(e) => setNewRuleTarget(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                >
                  <option value="teams_channel">Canal Microsoft Teams (Webhook)</option>
                  <option value="odoo_log">Registrar Log auditado en Odoo ERP</option>
                  <option value="outlook_event">Publicar hito en Calendario Outlook</option>
                  <option value="sharepoint_sync">Sincronizar archivo en SharePoint</option>
                  <option value="webhook_custom">Disparar Webhook Saliente Personalizado</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewRuleModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRule}
                disabled={!newRuleName.trim()}
                className="px-5 py-2 bg-[#FF5500] hover:bg-[#E04B00] text-white font-black rounded-xl text-xs shadow-md disabled:opacity-50"
              >
                Crear Regla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW WEBHOOK MODAL */}
      {isNewWebhookModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                <span>Registrar Nuevo Webhook Endpoint</span>
              </h3>
              <button
                onClick={() => setIsNewWebhookModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nombre del Endpoint:</label>
                <input
                  type="text"
                  value={newWebhookName}
                  onChange={(e) => setNewWebhookName(e.target.value)}
                  placeholder="Ej: Servidor Analytics Hubspot"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">URL de Destino (HTTPS):</label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://api.tuempresa.com/webhooks/listener"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewWebhookModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWebhook}
                disabled={!newWebhookName.trim() || !newWebhookUrl.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md disabled:opacity-50"
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
