import { Project, Phase, ProjectBudget, RaciTask } from './types';

export function createDefaultPhases(): Phase[] {
  return [
    {
      id: 'A1',
      label: 'Kickoff',
      status: 'active',
      completedAt: null,
      checklist: [
        { id: 'a1-1', text: 'Realizar reunión de inicio formal con el cliente', completed: true },
        { id: 'a1-2', text: 'Definir objetivos principales y criterios de éxito', completed: true },
        { id: 'a1-3', text: 'Presentar formalmente al equipo de trabajo', completed: true },
        { id: 'a1-4', text: 'Solicitar accesos a herramientas iniciales e infraestructura', completed: false },
      ],
      fields: {
        minuta: 'Reunión realizada el lunes. El cliente está entusiasmado con el cronograma y espera un MVP rápido.',
        stakeholders: 'María López (Product Lead), Juan Pérez (Technical Lead), Sofía Gómez (Designer).',
      },
    },
    {
      id: 'A2',
      label: 'Cronograma',
      status: 'pending',
      completedAt: null,
      checklist: [
        { id: 'a2-1', text: 'Establecer fecha de inicio oficial y fecha estimada de entrega', completed: false },
        { id: 'a2-2', text: 'Establecer hitos de entrega para cada una de las 7 fases', completed: false },
        { id: 'a2-3', text: 'Asignar responsabilidades de equipo en Jira/Trello', completed: false },
        { id: 'a2-4', text: 'Validar disponibilidad de recursos técnicos con Devops', completed: false },
      ],
      fields: {
        fechaInicio: '2026-07-21',
        fechaEntrega: '2026-09-30',
        hitosClave: 'Hito 1: UI/UX aprobado (A4) - 15 de Agosto\nHito 2: Desarrollo core (A5) - 10 de Septiembre\nHito 3: QA & UAT listo (A6) - 22 de Septiembre',
      },
    },
    {
      id: 'A3',
      label: 'Revisión',
      status: 'pending',
      completedAt: null,
      checklist: [
        { id: 'a3-1', text: 'Diseñar wireframes de baja y alta fidelidad', completed: false },
        { id: 'a3-2', text: 'Presentar propuesta de interfaz de usuario (Figma)', completed: false },
        { id: 'a3-3', text: 'Recopilar feedback estructurado del cliente', completed: false },
        { id: 'a3-4', text: 'Ajustar diseños según las correcciones acordadas', completed: false },
      ],
      fields: {
        linkPrototipo: 'https://figma.com/file/sample-saas-portal',
        comentariosCliente: 'Esperando agendar la sesión de revisión de diseño.',
      },
    },
    {
      id: 'A4',
      label: 'Aprobación',
      status: 'pending',
      completedAt: null,
      checklist: [
        { id: 'a4-1', text: 'Enviar propuesta de diseño final para aprobación', completed: false },
        { id: 'a4-2', text: 'Confirmar aceptación formal de requerimientos y alcance (Scope Lock)', completed: false },
        { id: 'a4-3', text: 'Verificar el pago del anticipo o validación de contrato', completed: false },
      ],
      fields: {
        aprobador: 'María López (Product Lead)',
        metodoAprobacion: 'Firma digital en plataforma interna de contratos.',
      },
    },
    {
      id: 'A5',
      label: 'Sprint',
      status: 'pending',
      completedAt: null,
      checklist: [
        { id: 'a5-1', text: 'Crear backlog de tareas en Jira / GitHub Projects', completed: false },
        { id: 'a5-2', text: 'Configurar repositorio en GitHub con CI/CD', completed: false },
        { id: 'a5-3', text: 'Desarrollar la API e integraciones de base de datos', completed: false },
        { id: 'a5-4', text: 'Construir vistas del cliente (Frontend SPA)', completed: false },
      ],
      fields: {
        repoUrl: 'https://github.com/acme/portal-clientes',
        estadoDesarrollo: 'No iniciado aún.',
      },
    },
    {
      id: 'A6',
      label: 'QA',
      status: 'pending',
      completedAt: null,
      checklist: [
        { id: 'a6-1', text: 'Escribir casos de prueba funcionales', completed: false },
        { id: 'a6-2', text: 'Ejecutar pruebas en entorno de staging', completed: false },
        { id: 'a6-3', text: 'Registrar y solucionar bugs críticos encontrados', completed: false },
        { id: 'a6-4', text: 'Realizar sesión de pruebas de aceptación (UAT) con cliente', completed: false },
      ],
      fields: {
        entornoTest: 'https://staging.acmeportal.com',
        bugsPendientes: 'Ninguno registrado.',
      },
    },
    {
      id: 'A7',
      label: 'Entrega',
      status: 'pending',
      completedAt: null,
      checklist: [
        { id: 'a7-1', text: 'Realizar despliegue en producción final', completed: false },
        { id: 'a7-2', text: 'Entregar documentación técnica y manuales de usuario', completed: false },
        { id: 'a7-3', text: 'Capacitar al equipo administrador del cliente', completed: false },
        { id: 'a7-4', text: 'Cerrar formalmente el proyecto y firmar acta de entrega', completed: false },
      ],
      fields: {
        urlProduccion: 'https://portal.acme.com',
        notasEntrega: 'Pendiente de inicio.',
      },
    },
  ];
}

export function createDefaultBudget(hoursTotal: number = 40): ProjectBudget {
  return {
    coordinador: { allocated: Math.round(hoursTotal * 0.3), consumed: 0 },
    sac: { allocated: Math.round(hoursTotal * 0.2), consumed: 0 },
    contents: { allocated: Math.round(hoursTotal * 0.25), consumed: 0 },
    contentd: { allocated: Math.round(hoursTotal * 0.25), consumed: 0 },
    invitado: { allocated: 0, consumed: 0 },
  };
}

export function createDefaultRaci(): RaciTask[] {
  return [
    {
      id: 'raci-1',
      taskName: 'Definición de Objetivos y Hitos',
      responsible: ['coordinador'],
      accountable: 'coordinador',
      consulted: ['sac', 'contents'],
      informed: ['invitado'],
    },
    {
      id: 'raci-2',
      taskName: 'Creación de Brand Bible',
      responsible: ['contents'],
      accountable: 'coordinador',
      consulted: ['sac'],
      informed: ['invitado'],
    },
    {
      id: 'raci-3',
      taskName: 'Desarrollo de Entregables de Fase',
      responsible: ['contents', 'coordinador'],
      accountable: 'coordinador',
      consulted: ['sac'],
      informed: ['invitado'],
    },
    {
      id: 'raci-4',
      taskName: 'Aprobación de Entregables por Cliente',
      responsible: ['sac'],
      accountable: 'coordinador',
      consulted: ['contents'],
      informed: ['invitado'],
    },
  ];
}

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Rediseño Portal Clientes',
    clientName: 'Acme Corp',
    clientContact: 'María López (Product Lead)',
    description: 'Plataforma SaaS para autoservicio de clientes con integración CRM.',
    activePhaseId: 'A3',
    health: 85,
    hoursTotal: 80,
    budget: {
      coordinador: { allocated: 32, consumed: 10 },
      sac: { allocated: 24, consumed: 8 },
      contents: { allocated: 12, consumed: 5 },
      contentd: { allocated: 12, consumed: 5 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: [
      {
        id: 'raci-1',
        taskName: 'Kickoff & Minuta inicial',
        responsible: ['coordinador', 'sac'],
        accountable: 'coordinador',
        consulted: ['sac'],
        informed: ['invitado'],
      },
      {
        id: 'raci-2',
        taskName: 'Mockups y Prototipos',
        responsible: ['contents'],
        accountable: 'coordinador',
        consulted: ['sac', 'coordinador'],
        informed: ['invitado'],
      },
      {
        id: 'raci-3',
        taskName: 'Carga de Contenido de Marca',
        responsible: ['contents'],
        accountable: 'sac',
        consulted: ['coordinador'],
        informed: ['invitado'],
      },
      {
        id: 'raci-4',
        taskName: 'Validación de Integraciones',
        responsible: ['coordinador'],
        accountable: 'coordinador',
        consulted: ['sac'],
        informed: ['invitado'],
      }
    ],
    brandBible: {
      companyContext: {
        historyAndBackground: 'Acme Corp es una empresa de distribución fundada en 2012, líder regional.',
        missionVisionUvp: 'Misión: Automatizar el autoservicio de clientes. UVP: Autoservicio 24/7 sin llamadas.'
      },
      brandPersona: {
        archetype: 'El Creador / El Sabio',
        buyerPersonas: 'Directores de Compras que buscan agilidad en sus pedidos recurrentes.'
      },
      voiceAndTone: {
        personalityTraits: ['Profesional', 'Atento', 'Directo', 'Empático'],
        dosAndDonts: 'DO: Explicar conceptos de forma sencilla y transparente. DONT: Usar jerga excesiva o tonos condescendientes.',
        coreMessages: 'La eficiencia y el control en un solo lugar.'
      },
      visualIdentity: {
        logoRules: 'Usar logotipo principal en fondos claros. Fondo azul oscuro usa la versión monocromática blanca.',
        colorPaletteHex: ['#0F172A', '#10B981', '#3B82F6', '#F8FAFC'],
        typographyHierarchy: 'Display: Inter Bold 36px. Body: Inter Regular 16px.',
        moodboardLinks: ['https://figma.com/file/sample-moodboard-acme']
      },
      resources: {
        driveFolderUrl: 'https://drive.google.com/drive/folders/acme-brand',
        figmaUrl: 'https://figma.com/file/acme-brand-bible'
      }
    },
    timeEntries: [
      { id: 't1', userId: 'u1', username: 'carlos', role: 'coordinador', hours: 10, date: '2026-07-11', description: 'Reunión kickoff & cronograma', phaseId: 'A1' },
      { id: 't2', userId: 'u2', username: 'ana', role: 'sac', hours: 8, date: '2026-07-13', description: 'Minutas de acuerdos iniciales', phaseId: 'A1' },
      { id: 't3', userId: 'u3', username: 'lucia', role: 'contents', hours: 10, date: '2026-07-15', description: 'Identidad y bocetos en Figma', phaseId: 'A3' }
    ],
    auditLog: [],
    deliverables: [],
    createdAt: '2026-07-10T10:00:00Z',
    objective: 'Reducir los tickets de soporte un 25% y aumentar la conversión de onboarding.',
    alcance: 'Landing page, dashboard de usuario, módulo de pagos e integración con HubSpot CRM.',
    riesgos: 'Posible demora en la entrega de credenciales de API por parte del equipo de TI del cliente.',
    phases: [
      {
        id: 'A1',
        label: 'Kickoff',
        status: 'completed',
        completedAt: '2026-07-12T16:30:00Z',
        checklist: [
          { id: 'a1-1', text: 'Realizar reunión de inicio formal con el cliente', completed: true },
          { id: 'a1-2', text: 'Definir objetivos principales y criterios de éxito', completed: true },
          { id: 'a1-3', text: 'Presentar formalmente al equipo de trabajo', completed: true },
          { id: 'a1-4', text: 'Solicitar accesos a herramientas iniciales e infraestructura', completed: true },
        ],
        fields: {
          minuta: 'Reunión realizada el 11 de Julio. El cliente aprobó los hitos iniciales.',
          stakeholders: 'María López, Sofía Gómez (UX), Carlos Díaz (Dev)',
        },
      },
      {
        id: 'A2',
        label: 'Cronograma',
        status: 'completed',
        completedAt: '2026-07-15T11:00:00Z',
        checklist: [
          { id: 'a2-1', text: 'Establecer fecha de inicio oficial y fecha estimada de entrega', completed: true },
          { id: 'a2-2', text: 'Establecer hitos de entrega para cada una de las 7 fases', completed: true },
          { id: 'a2-3', text: 'Asignar responsabilidades de equipo en Jira/Trello', completed: true },
          { id: 'a2-4', text: 'Validar disponibilidad de recursos técnicos con Devops', completed: true },
        ],
        fields: {
          fechaInicio: '2026-07-12',
          fechaEntrega: '2026-09-15',
          hitosClave: 'Hito de Diseño: 25 de Julio\nHito de Alpha Dev: 20 de Agosto\nHito de QA: 5 de Septiembre\nLanzamiento: 15 de Septiembre',
        },
      },
      {
        id: 'A3',
        label: 'Revisión',
        status: 'active',
        completedAt: null,
        checklist: [
          { id: 'a3-1', text: 'Diseñar wireframes de baja y alta fidelidad', completed: true },
          { id: 'a3-2', text: 'Presentar propuesta de interfaz de usuario (Figma)', completed: false },
          { id: 'a3-3', text: 'Recopilar feedback estructurado del cliente', completed: false },
          { id: 'a3-4', text: 'Ajustar diseños según las correcciones acordadas', completed: false },
        ],
        fields: {
          linkPrototipo: 'https://figma.com/file/acme-portal-redesign',
          comentariosCliente: 'El cliente está revisando las primeras maquetas de la vista principal del dashboard. Esperamos comentarios mañana.',
        },
      },
      {
        id: 'A4',
        label: 'Aprobación',
        status: 'pending',
        completedAt: null,
        checklist: [
          { id: 'a4-1', text: 'Enviar propuesta de diseño final para aprobación', completed: false },
          { id: 'a4-2', text: 'Confirmar aceptación formal de requerimientos y alcance (Scope Lock)', completed: false },
          { id: 'a4-3', text: 'Verificar el pago del anticipo o validación de contrato', completed: false },
        ],
        fields: {
          aprobador: 'María López (Product Lead)',
          metodoAprobacion: 'Validación electrónica DocuSign.',
        },
      },
      {
        id: 'A5',
        label: 'Sprint',
        status: 'pending',
        completedAt: null,
        checklist: [
          { id: 'a5-1', text: 'Crear backlog de tareas en Jira / GitHub Projects', completed: false },
          { id: 'a5-2', text: 'Configurar repositorio en GitHub con CI/CD', completed: false },
          { id: 'a5-3', text: 'Desarrollar la API e integraciones de base de datos', completed: false },
          { id: 'a5-4', text: 'Construir vistas del cliente (Frontend SPA)', completed: false },
        ],
        fields: {
          repoUrl: 'https://github.com/acme-corp/portal-clientes-saas',
          estadoDesarrollo: 'Esperando aprobación de diseño.',
        },
      },
      {
        id: 'A6',
        label: 'QA',
        status: 'pending',
        completedAt: null,
        checklist: [
          { id: 'a6-1', text: 'Escribir casos de prueba funcionales', completed: false },
          { id: 'a6-2', text: 'Ejecutar pruebas en entorno de staging', completed: false },
          { id: 'a6-3', text: 'Registrar y solucionar bugs críticos encontrados', completed: false },
          { id: 'a6-4', text: 'Realizar sesión de pruebas de aceptación (UAT) con cliente', completed: false },
        ],
        fields: {
          entornoTest: 'https://staging.acme-corp-saas.com',
          bugsPendientes: 'Cero bugs de momento.',
        },
      },
      {
        id: 'A7',
        label: 'Entrega',
        status: 'pending',
        completedAt: null,
        checklist: [
          { id: 'a7-1', text: 'Realizar despliegue en producción final', completed: false },
          { id: 'a7-2', text: 'Entregar documentación técnica y manuales de usuario', completed: false },
          { id: 'a7-3', text: 'Capacitar al equipo administrador del cliente', completed: false },
          { id: 'a7-4', text: 'Cerrar formalmente el proyecto y firmar acta de entrega', completed: false },
        ],
        fields: {
          urlProduccion: 'https://portal.acme-corp.com',
          notasEntrega: 'Por iniciar una vez finalizado el desarrollo.',
        },
      },
    ],
  },
  {
    id: 'p2',
    name: 'Onboarding SaaS Automático',
    clientName: 'Fintech Go',
    clientContact: 'Alejandro Ruiz (CEO)',
    description: 'Implementación del embudo de registro, KYC express y pasarela de cobro recurrente.',
    activePhaseId: 'A1',
    health: 98,
    hoursTotal: 50,
    budget: {
      coordinador: { allocated: 20, consumed: 4 },
      sac: { allocated: 15, consumed: 0 },
      contents: { allocated: 7, consumed: 0 },
      contentd: { allocated: 8, consumed: 0 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: [
      {
        id: 'raci-1',
        taskName: 'Estudio de Flujo KYC',
        responsible: ['coordinador'],
        accountable: 'coordinador',
        consulted: ['sac'],
        informed: ['invitado'],
      },
      {
        id: 'raci-2',
        taskName: 'Línea Gráfica del Embudo',
        responsible: ['contents'],
        accountable: 'coordinador',
        consulted: ['sac'],
        informed: ['invitado'],
      }
    ],
    brandBible: {
      companyContext: {
        historyAndBackground: 'Fintech Go es una startup de rápido crecimiento lanzada en 2025 para simplificar pagos.',
        missionVisionUvp: 'Misión: Onboarding express en menos de 3 minutos.'
      }
    },
    timeEntries: [
      { id: 't4', userId: 'u1', username: 'carlos', role: 'coordinador', hours: 4, date: '2026-07-19', description: 'Kickoff y definición de embudo', phaseId: 'A1' }
    ],
    auditLog: [],
    deliverables: [],
    createdAt: '2026-07-18T09:00:00Z',
    objective: 'Optimizar el proceso de alta reduciendo el abandono de registro en un 40%.',
    alcance: 'Formularios multi-step, integración con API de KYC, checkout Stripe y panel de facturas.',
    riesgos: 'Demoras en la aprobación de la cuenta comercial de Stripe.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p3',
    name: 'Migración Core AWS',
    clientName: 'Globex S.A.',
    clientContact: 'Ricardo Toro (CTO)',
    description: 'Migración de base de datos legacy a PostgreSQL en AWS RDS con configuración Multi-AZ.',
    activePhaseId: 'A6',
    health: 60,
    hoursTotal: 120,
    budget: {
      coordinador: { allocated: 50, consumed: 40 },
      sac: { allocated: 30, consumed: 30 },
      contents: { allocated: 20, consumed: 20 },
      contentd: { allocated: 20, consumed: 20 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: [
      {
        id: 'raci-1',
        taskName: 'Diseño de Red VPC & IAM',
        responsible: ['coordinador'],
        accountable: 'coordinador',
        consulted: ['sac'],
        informed: ['invitado'],
      },
      {
        id: 'raci-2',
        taskName: 'Mapeo de Datos Legacy',
        responsible: ['coordinador', 'sac'],
        accountable: 'coordinador',
        consulted: ['contents'],
        informed: ['invitado'],
      }
    ],
    brandBible: {
      companyContext: {
        historyAndBackground: 'Globex es un conglomerado internacional de logística fundado en 1998.',
        missionVisionUvp: 'UVP: Alta disponibilidad y resiliencia en infraestructura de datos.'
      }
    },
    timeEntries: [
      { id: 't5', userId: 'u1', username: 'carlos', role: 'coordinador', hours: 40, date: '2026-06-10', description: 'Configuración VPC & Terraform', phaseId: 'A1' },
      { id: 't6', userId: 'u2', username: 'ana', role: 'sac', hours: 30, date: '2026-06-15', description: 'Alcance técnico de base de datos', phaseId: 'A3' },
      { id: 't7', userId: 'u3', username: 'lucia', role: 'contents', hours: 40, date: '2026-06-25', description: 'Diagramas e infraestructura AWS', phaseId: 'A5' }
    ],
    auditLog: [],
    deliverables: [],
    createdAt: '2026-06-01T08:00:00Z',
    objective: 'Mejorar la latencia de queries un 50% y garantizar redundancia geográfica total.',
    alcance: 'Esquema de réplicas AWS, migración de 400GB de datos, auditoría de seguridad IAM y pruebas de carga.',
    riesgos: 'La migración requiere un downtime de producción programado de máximo 2 horas el fin de semana.',
    phases: [
      {
        id: 'A1',
        label: 'Kickoff',
        status: 'completed',
        completedAt: '2026-06-03T10:00:00Z',
        checklist: [
          { id: 'a1-1', text: 'Realizar reunión de inicio formal con el cliente', completed: true },
          { id: 'a1-2', text: 'Definir objetivos principales y criterios de éxito', completed: true },
          { id: 'a1-3', text: 'Presentar formalmente al equipo de trabajo', completed: true },
          { id: 'a1-4', text: 'Solicitar accesos a herramientas iniciales e infraestructura', completed: true },
        ],
        fields: {
          minuta: 'Kickoff realizado con éxito. Globex brindó accesos de lectura a sus servidores legacy.',
          stakeholders: 'Ricardo Toro (CTO), Esteban Soto (SysAdmin)',
        },
      },
      {
        id: 'A2',
        label: 'Cronograma',
        status: 'completed',
        completedAt: '2026-06-05T15:00:00Z',
        checklist: [
          { id: 'a2-1', text: 'Establecer fecha de inicio oficial y fecha estimada de entrega', completed: true },
          { id: 'a2-2', text: 'Establecer hitos de entrega para cada una de las 7 fases', completed: true },
          { id: 'a2-3', text: 'Asignar responsabilidades de equipo en Jira/Trello', completed: true },
          { id: 'a2-4', text: 'Validar disponibilidad de recursos técnicos con Devops', completed: true },
        ],
        fields: {
          fechaInicio: '2026-06-01',
          fechaEntrega: '2026-07-25',
          hitosClave: 'Hito 1: Esquema de RDS creado (A5) - 20 Junio\nHito 2: Script de replicación (A5) - 30 Junio\nHito 3: Simulación de migración (A6) - 15 Julio',
        },
      },
      {
        id: 'A3',
        label: 'Revisión',
        status: 'completed',
        completedAt: '2026-06-12T17:00:00Z',
        checklist: [
          { id: 'a3-1', text: 'Diseñar wireframes de baja y alta fidelidad', completed: true },
          { id: 'a3-2', text: 'Presentar propuesta de interfaz de usuario (Figma)', completed: true },
          { id: 'a3-3', text: 'Recopilar feedback estructurado del cliente', completed: true },
          { id: 'a3-4', text: 'Ajustar diseños según las correcciones acordadas', completed: true },
        ],
        fields: {
          linkPrototipo: 'N/A - Diagramas de arquitectura AWS presentados en Miro',
          comentariosCliente: 'Se aprueba el diagrama de red VPC, subredes públicas y privadas y políticas IAM.',
        },
      },
      {
        id: 'A4',
        label: 'Aprobación',
        status: 'completed',
        completedAt: '2026-06-15T12:00:00Z',
        checklist: [
          { id: 'a4-1', text: 'Enviar propuesta de diseño final para aprobación', completed: true },
          { id: 'a4-2', text: 'Confirmar aceptación formal de requerimientos y alcance (Scope Lock)', completed: true },
          { id: 'a4-3', text: 'Verificar el pago del anticipo o validación de contrato', completed: true },
        ],
        fields: {
          aprobador: 'Ricardo Toro (CTO)',
          metodoAprobacion: 'Firmado mediante DocuSign de corporativo Globex.',
        },
      },
      {
        id: 'A5',
        label: 'Sprint',
        status: 'completed',
        completedAt: '2026-07-10T18:00:00Z',
        checklist: [
          { id: 'a5-1', text: 'Crear backlog de tareas en Jira / GitHub Projects', completed: true },
          { id: 'a5-2', text: 'Configurar repositorio en GitHub con CI/CD', completed: true },
          { id: 'a5-3', text: 'Desarrollar la API e integraciones de base de datos', completed: true },
          { id: 'a5-4', text: 'Construir vistas del cliente (Frontend SPA)', completed: true },
        ],
        fields: {
          repoUrl: 'https://github.com/globex-infra/aws-rds-migration',
          estadoDesarrollo: 'La automatización de Terraform y scripts de volcado pg_dump/pg_restore están listos y validados.',
        },
      },
      {
        id: 'A6',
        label: 'QA',
        status: 'active',
        completedAt: null,
        checklist: [
          { id: 'a6-1', text: 'Escribir casos de prueba funcionales', completed: true },
          { id: 'a6-2', text: 'Ejecutar pruebas en entorno de staging', completed: true },
          { id: 'a6-3', text: 'Registrar y solucionar bugs críticos encontrados', completed: false },
          { id: 'a6-4', text: 'Realizar sesión de pruebas de aceptación (UAT) con cliente', completed: false },
        ],
        fields: {
          entornoTest: 'https://staging.globex-db.net',
          bugsPendientes: 'Se detectó lentitud en la sincronización del índice "idx_transactions_date" en tablas particionadas. Optimización en progreso.',
        },
      },
      {
        id: 'A7',
        label: 'Entrega',
        status: 'pending',
        completedAt: null,
        checklist: [
          { id: 'a7-1', text: 'Realizar despliegue en producción final', completed: false },
          { id: 'a7-2', text: 'Entregar documentación técnica y manuales de usuario', completed: false },
          { id: 'a7-3', text: 'Capacitar al equipo administrador del cliente', completed: false },
          { id: 'a7-4', text: 'Cerrar formalmente el proyecto y firmar acta de entrega', completed: false },
        ],
        fields: {
          urlProduccion: 'https://rds.globex.com',
          notesEntrega: 'Planeado para el fin de semana del 25 de Julio.',
        },
      },
    ],
  },
];
