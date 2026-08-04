import { Project, Phase, ProjectBudget, RaciTask } from './types';

export function createDefaultPhases(): Phase[] {
  return [
    {
      id: 'A1',
      label: 'Kickoff',
      status: 'completed',
      completedAt: '2026-07-20T10:00:00.000Z',
      checklist: [
        { id: 'a1-1', text: 'Realizar reunión de inicio formal con el cliente', completed: true },
        { id: 'a1-2', text: 'Definir objetivos principales y criterios de éxito', completed: true },
        { id: 'a1-3', text: 'Presentar formalmente al equipo de trabajo', completed: true },
        { id: 'a1-4', text: 'Solicitar accesos a herramientas iniciales e infraestructura', completed: true },
      ],
      fields: {
        minuta: 'Kickoff completado con éxito. Objetivos y equipo aprobados.',
        stakeholders: 'Equipo asignado del cliente y Operations Atelier.',
      },
    },
    {
      id: 'A2',
      label: 'Cronograma',
      status: 'completed',
      completedAt: '2026-07-22T15:00:00.000Z',
      checklist: [
        { id: 'a2-1', text: 'Establecer fecha de inicio oficial y fecha estimada de entrega', completed: true },
        { id: 'a2-2', text: 'Establecer hitos de entrega para cada una de las fases', completed: true },
        { id: 'a2-3', text: 'Asignar responsabilidades de equipo', completed: true },
        { id: 'a2-4', text: 'Validar disponibilidad de recursos técnicos', completed: true },
      ],
      fields: {
        fechaInicio: '2026-07-20',
        fechaEntrega: '2026-08-25',
        hitosClave: 'Hito 1: Concepto aprobado - 28 Julio\nHito 2: Sprint finalizado - 12 Agosto\nHito 3: Entrega final - 25 Agosto',
      },
    },
    {
      id: 'A3',
      label: 'Revisión',
      status: 'completed',
      completedAt: '2026-07-24T18:00:00.000Z',
      checklist: [
        { id: 'a3-1', text: 'Diseñar propuesta de baja y alta fidelidad', completed: true },
        { id: 'a3-2', text: 'Presentar propuesta visual', completed: true },
        { id: 'a3-3', text: 'Recopilar feedback estructurado del cliente', completed: true },
        { id: 'a3-4', text: 'Ajustar propuestas según correcciones acordadas', completed: true },
      ],
      fields: {
        linkPrototipo: 'https://figma.com/file/demo-operations-atelier',
        comentariosCliente: 'Aprobado sin observaciones mayores.',
      },
    },
    {
      id: 'A4',
      label: 'Aprobación',
      status: 'completed',
      completedAt: '2026-07-25T12:00:00.000Z',
      checklist: [
        { id: 'a4-1', text: 'Enviar propuesta final para aprobación formal', completed: true },
        { id: 'a4-2', text: 'Confirmar aceptación formal de requerimientos', completed: true },
        { id: 'a4-3', text: 'Verificar anticipo o validación de contrato', completed: true },
      ],
      fields: {
        aprobador: 'Gerencia General del Cliente',
        metodoAprobacion: 'Aprobación por correo corporativo y contrato firmado.',
      },
    },
    {
      id: 'A5',
      label: 'Sprint',
      status: 'active',
      completedAt: null,
      checklist: [
        { id: 'a5-1', text: 'Crear backlog de tareas en sistema', completed: true },
        { id: 'a5-2', text: 'Ejecutar diseño y desarrollo de entregables', completed: true },
        { id: 'a5-3', text: 'Revisión técnica de calidad interna', completed: false },
        { id: 'a5-4', text: 'Preparar versión para pruebas con cliente', completed: false },
      ],
      fields: {
        repoUrl: 'https://github.com/operations-atelier/demo-project',
        estadoDesarrollo: 'Desarrollo de entregables en avance del 70%.',
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
        { id: 'a6-3', text: 'Registrar y solucionar observaciones', completed: false },
        { id: 'a6-4', text: 'Pruebas de aceptación con el cliente', completed: false },
      ],
      fields: {
        entornoTest: 'https://staging.operations-atelier.com',
        bugsPendientes: 'En preparación para inicio de fase QA.',
      },
    },
    {
      id: 'A7',
      label: 'Entrega',
      status: 'pending',
      completedAt: null,
      checklist: [
        { id: 'a7-1', text: 'Realizar despliegue o entrega final', completed: false },
        { id: 'a7-2', text: 'Entregar documentación técnica y manuales', completed: false },
        { id: 'a7-3', text: 'Capacitar al equipo del cliente', completed: false },
        { id: 'a7-4', text: 'Cerrar formalmente el proyecto y firmar acta', completed: false },
      ],
      fields: {
        urlProduccion: 'https://cliente-demo.com',
        notesEntrega: 'Programado para cierre de mes.',
      },
    },
    {
      id: 'A8',
      label: 'SLA & Retainer',
      status: 'pending',
      completedAt: null,
      checklist: [
        { id: 'a8-1', text: 'Configurar canal de soporte continuo', completed: false },
        { id: 'a8-2', text: 'Establecer SLA de atención a incidencias', completed: false },
        { id: 'a8-3', text: 'Programar reuniones mensuales de seguimiento', completed: false },
      ],
      fields: {
        slaInfo: 'Bolsa de horas de soporte y mantenimiento mensual.',
      },
    },
  ];
}

export function createDefaultBudget(totalHours: number = 100): ProjectBudget {
  const coord = Math.round(totalHours * 0.25);
  const sac = Math.round(totalHours * 0.35);
  const contentd = Math.round(totalHours * 0.40);
  return {
    supervisor: { allocated: 0, consumed: 0 },
    coordinador: { allocated: coord, consumed: Math.round(coord * 0.6) },
    sac: { allocated: sac, consumed: Math.round(sac * 0.5) },
    contents: { allocated: 0, consumed: 0 },
    contentd: { allocated: contentd, consumed: Math.round(contentd * 0.7) },
    invitado: { allocated: 0, consumed: 0 },
  };
}

export function createDefaultRaci(): RaciTask[] {
  return [
    {
      id: 'raci-1',
      taskName: 'Supervisión y Dirección Estratégica',
      responsible: ['coordinador'],
      accountable: 'coordinador',
      consulted: ['sac'],
      informed: ['invitado'],
    },
    {
      id: 'raci-2',
      taskName: 'Gestión de Proyecto y Seguimiento con Cliente',
      responsible: ['sac'],
      accountable: 'sac',
      consulted: ['coordinador'],
      informed: ['invitado'],
    },
    {
      id: 'raci-3',
      taskName: 'Diseño y Creación de Entregables Visuales',
      responsible: ['contentd'],
      accountable: 'contentd',
      consulted: ['sac'],
      informed: ['invitado'],
    },
  ];
}

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Rediseño de Marca y Empaques',
    clientName: 'Famosa',
    clientContact: 'Contacto Famosa',
    description: 'Estrategia gráfica, rediseño de identidad de marca y nuevos empaques corporativos.',
    ovNumber: 'OV-FAM-2026-01',
    saleOrderNumber: 'OV-FAM-2026-01',
    totalIncome: 4800,
    currency: 'USD',
    ordenesVenta: [
      {
        id: 'ov-p1-1',
        numero: 'OV-FAM-2026-01',
        monto: 3600,
        moneda: 'USD',
        horasAsociadas: 70,
        fechaEmision: '2026-07-01',
        estado: 'facturada'
      },
      {
        id: 'ov-p1-2',
        numero: 'OV-FAM-2026-01-ADD1',
        monto: 1200,
        moneda: 'USD',
        horasAsociadas: 20,
        fechaEmision: '2026-07-20',
        estado: 'facturada'
      }
    ],
    activePhaseId: 'A5',
    health: 95,
    hoursTotal: 90,
    budget: {
      coordinador: { allocated: 25, consumed: 20 },
      sac: { allocated: 35, consumed: 30 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 50, consumed: 40 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm1-1', name: 'Rodrigo', role: 'Supervisor' },
      { id: 'm1-2', name: 'Lourdes', role: 'PM' },
      { id: 'm1-3', name: 'Eduardo', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te1-1', userId: 'u-rodrigo', username: 'rodrigo', role: 'coordinador', hours: 20, date: '2026-07-20', description: 'Supervisión y directriz de diseño', phaseId: 'A1', type: 'normal' },
      { id: 'te1-2', userId: 'u-lourdes', username: 'lourdes', role: 'sac', hours: 30, date: '2026-07-22', description: 'Gestión de entregables y reunión con Famosa', phaseId: 'A2', type: 'normal' },
      { id: 'te1-3', userId: 'u-eduardo', username: 'eduardo', role: 'contentd', hours: 40, date: '2026-07-25', description: 'Elaboración de empaques e ilustración 3D', phaseId: 'A5', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-15',
    endDate: '2026-08-20',
    deliverables: [],
    createdAt: '2026-07-15T08:00:00Z',
    objective: 'Renovar la imagen de empaques de Famosa para puntos de venta principales.',
    alcance: 'Manual de marca, empaques primarios y secundarios, artes finales.',
    riesgos: 'Tiempos reducidos de impresión en proveedor externo.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p2',
    name: 'Campaña Digital Q3',
    clientName: 'Famosa',
    clientContact: 'Contacto Famosa',
    description: 'Campaña omnicanal de posicionamiento para lanzamientos del tercer trimestre.',
    activePhaseId: 'A3',
    health: 90,
    hoursTotal: 70,
    budget: {
      coordinador: { allocated: 20, consumed: 15 },
      sac: { allocated: 30, consumed: 25 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 40, consumed: 30 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm2-1', name: 'Alejandra', role: 'Supervisor' },
      { id: 'm2-2', name: 'Maylin', role: 'PM' },
      { id: 'm2-3', name: 'Jeremy', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te2-1', userId: 'u-alejandra', username: 'alejandra', role: 'coordinador', hours: 15, date: '2026-07-18', description: 'Aprobación de concepto creativo', phaseId: 'A1', type: 'normal' },
      { id: 'te2-2', userId: 'u-maylin', username: 'maylin', role: 'sac', hours: 25, date: '2026-07-21', description: 'Coordinación con agencia de medios y cliente', phaseId: 'A2', type: 'normal' },
      { id: 'te2-3', userId: 'u-jeremy', username: 'jeremy', role: 'contentd', hours: 30, date: '2026-07-24', description: 'Diseño de piezas adaptables social media', phaseId: 'A3', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-18',
    endDate: '2026-08-25',
    deliverables: [],
    createdAt: '2026-07-18T08:00:00Z',
    objective: 'Captación de clientes mediante campaña omnicanal.',
    alcance: 'Banners estáticos, videos animados de 15s y landing page.',
    riesgos: 'Cambios de requerimiento en fechas de lanzamiento.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p3',
    name: 'Catálogo Digital 2026',
    clientName: 'El tejar',
    clientContact: 'Contacto El Tejar',
    description: 'Portal interactivo para consulta de inventario y fichas técnicas de materiales.',
    activePhaseId: 'A4',
    health: 88,
    hoursTotal: 73,
    budget: {
      coordinador: { allocated: 20, consumed: 18 },
      sac: { allocated: 25, consumed: 20 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 45, consumed: 35 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm3-1', name: 'Fabiola', role: 'Supervisor' },
      { id: 'm3-2', name: 'Noemi', role: 'PM' },
      { id: 'm3-3', name: 'Edgar', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te3-1', userId: 'u-fabiola', username: 'fabiola', role: 'coordinador', hours: 18, date: '2026-07-15', description: 'Revisión de arquitectura de información', phaseId: 'A1', type: 'normal' },
      { id: 'te3-2', userId: 'u-noemi', username: 'noemi', role: 'sac', hours: 20, date: '2026-07-19', description: 'Validación de categorías con El Tejar', phaseId: 'A2', type: 'normal' },
      { id: 'te3-3', userId: 'u-edgar', username: 'edgar', role: 'contentd', hours: 35, date: '2026-07-23', description: 'Maquetación de páginas de producto', phaseId: 'A4', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-12',
    endDate: '2026-07-20',
    deliverables: [],
    createdAt: '2026-07-12T08:00:00Z',
    objective: 'Facilitar la búsqueda de materiales a arquitectos y constructores.',
    alcance: 'UI/UX del catálogo interactivo y fichas PDF descargables.',
    riesgos: 'Retraso en entrega de fotografías de producto.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p4',
    name: 'E-commerce B2B Portal',
    clientName: 'El tejar',
    clientContact: 'Contacto El Tejar',
    description: 'Plataforma de compras al por mayor y pedidos recurrentes de construcción.',
    activePhaseId: 'A5',
    health: 82,
    hoursTotal: 120,
    budget: {
      coordinador: { allocated: 35, consumed: 30 },
      sac: { allocated: 45, consumed: 40 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 60, consumed: 50 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm4-1', name: 'Rodrigo', role: 'Supervisor' },
      { id: 'm4-2', name: 'Luis', role: 'PM' },
      { id: 'm4-3', name: 'Eduardo', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te4-1', userId: 'u-rodrigo', username: 'rodrigo', role: 'coordinador', hours: 30, date: '2026-07-10', description: 'Definición de requerimientos técnicos B2B', phaseId: 'A1', type: 'normal' },
      { id: 'te4-2', userId: 'u-luis', username: 'luis', role: 'sac', hours: 40, date: '2026-07-16', description: 'Seguimiento de integración ERP y pasarela', phaseId: 'A3', type: 'normal' },
      { id: 'te4-3', userId: 'u-eduardo', username: 'eduardo', role: 'contentd', hours: 50, date: '2026-07-24', description: 'Diseño UI/UX de checkout y cotizador', phaseId: 'A5', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-08',
    endDate: '2026-08-30',
    deliverables: [],
    createdAt: '2026-07-08T08:00:00Z',
    objective: 'Automatización de ventas al por mayor.',
    alcance: 'Módulo de cotización, catálogo B2B y panel de cuentas.',
    riesgos: 'Integración compleja con el ERP existente.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p5',
    name: 'Lanzamiento Nueva Línea SUV',
    clientName: 'Fajonda',
    clientContact: 'Contacto Fajonda',
    description: 'Estrategia de lanzamiento, showroom digital y materiales para concesionarios.',
    activePhaseId: 'A2',
    health: 96,
    hoursTotal: 105,
    budget: {
      coordinador: { allocated: 30, consumed: 25 },
      sac: { allocated: 40, consumed: 35 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 55, consumed: 45 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm5-1', name: 'Alejandra', role: 'Supervisor' },
      { id: 'm5-2', name: 'Lourdes', role: 'PM' },
      { id: 'm5-3', name: 'Jeremy', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te5-1', userId: 'u-alejandra', username: 'alejandra', role: 'coordinador', hours: 25, date: '2026-07-22', description: 'Estructuración de campaña y directriz Fajonda', phaseId: 'A1', type: 'normal' },
      { id: 'te5-2', userId: 'u-lourdes', username: 'lourdes', role: 'sac', hours: 35, date: '2026-07-25', description: 'Elaboración de roadmap de eventos e impresos', phaseId: 'A2', type: 'normal' },
      { id: 'te5-3', userId: 'u-jeremy', username: 'jeremy', role: 'contentd', hours: 45, date: '2026-07-27', description: 'Modelado y renders de catálogo vehicular', phaseId: 'A2', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-20',
    endDate: '2026-09-05',
    deliverables: [],
    createdAt: '2026-07-20T08:00:00Z',
    objective: 'Posicionar la nueva SUV de Fajonda en el mercado regional.',
    alcance: 'Showroom 3D, folletería impresa y campaña digital.',
    riesgos: 'Disponibilidad de vehículos de prueba para sesión fotográfica.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p6',
    name: 'Renovación Puntos de Venta',
    clientName: 'ADOC',
    clientContact: 'Contacto ADOC',
    description: 'Actualización de señalética, vitrinas y manual de tienda para la red de calzado.',
    activePhaseId: 'A6',
    health: 91,
    hoursTotal: 90,
    budget: {
      coordinador: { allocated: 25, consumed: 20 },
      sac: { allocated: 35, consumed: 30 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 50, consumed: 40 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm6-1', name: 'Fabiola', role: 'Supervisor' },
      { id: 'm6-2', name: 'Maylin', role: 'PM' },
      { id: 'm6-3', name: 'Edgar', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te6-1', userId: 'u-fabiola', username: 'fabiola', role: 'coordinador', hours: 20, date: '2026-07-12', description: 'Revisión técnica de POP y vitrinismo', phaseId: 'A1', type: 'normal' },
      { id: 'te6-2', userId: 'u-maylin', username: 'maylin', role: 'sac', hours: 30, date: '2026-07-18', description: 'Coordinación con imprenta y gerencia ADOC', phaseId: 'A4', type: 'normal' },
      { id: 'te6-3', userId: 'u-edgar', username: 'edgar', role: 'contentd', hours: 40, date: '2026-07-26', description: 'Pruebas de impresión y artes finales QA', phaseId: 'A6', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-10',
    endDate: '2026-08-18',
    deliverables: [],
    createdAt: '2026-07-10T08:00:00Z',
    objective: 'Modernizar la imagen de vitrinas de ADOC.',
    alcance: 'Manual de vitrinismo, artes POP y señalética de tienda.',
    riesgos: 'Diferencias en dimensiones de vitrinas por sucursal.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p7',
    name: 'Estrategia Social Media 2026',
    clientName: 'ADOC',
    clientContact: 'Contacto ADOC',
    description: 'Plan mensual de contenidos, reels, parrilla editorial e influencers.',
    activePhaseId: 'A3',
    health: 94,
    hoursTotal: 70,
    budget: {
      coordinador: { allocated: 20, consumed: 15 },
      sac: { allocated: 30, consumed: 25 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 40, consumed: 30 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm7-1', name: 'Rodrigo', role: 'Supervisor' },
      { id: 'm7-2', name: 'Noemi', role: 'PM' },
      { id: 'm7-3', name: 'Eduardo', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te7-1', userId: 'u-rodrigo', username: 'rodrigo', role: 'coordinador', hours: 15, date: '2026-07-21', description: 'Aprobación de pilares de contenido', phaseId: 'A1', type: 'normal' },
      { id: 'te7-2', userId: 'u-noemi', username: 'noemi', role: 'sac', hours: 25, date: '2026-07-23', description: 'Calendario de publicaciones y minutas', phaseId: 'A2', type: 'normal' },
      { id: 'te7-3', userId: 'u-eduardo', username: 'eduardo', role: 'contentd', hours: 30, date: '2026-07-26', description: 'Diseño de carruseles y reels en video', phaseId: 'A3', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-15',
    endDate: '2026-08-22',
    deliverables: [],
    createdAt: '2026-07-15T08:00:00Z',
    objective: 'Incrementar la interacción comunitaria de ADOC.',
    alcance: 'Parrilla mensual de 24 contenidos visuales y 4 reels.',
    riesgos: 'Retraso en aprobación de textos legales de promociones.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p8',
    name: 'Optimización Logística Impelsa',
    clientName: 'Impelsa',
    clientContact: 'Contacto Impelsa',
    description: 'Sistema de monitoreo de entregas en tiempo real y catálogo de distribución.',
    activePhaseId: 'A1',
    health: 98,
    hoursTotal: 85,
    budget: {
      coordinador: { allocated: 25, consumed: 20 },
      sac: { allocated: 35, consumed: 30 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 45, consumed: 35 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm8-1', name: 'Alejandra', role: 'Supervisor' },
      { id: 'm8-2', name: 'Luis', role: 'PM' },
      { id: 'm8-3', name: 'Jeremy', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te8-1', userId: 'u-alejandra', username: 'alejandra', role: 'coordinador', hours: 20, date: '2026-07-24', description: 'Kickoff estratégico con gerencia Impelsa', phaseId: 'A1', type: 'normal' },
      { id: 'te8-2', userId: 'u-luis', username: 'luis', role: 'sac', hours: 30, date: '2026-07-26', description: 'Definición de requerimientos del portal', phaseId: 'A1', type: 'normal' },
      { id: 'te8-3', userId: 'u-jeremy', username: 'jeremy', role: 'contentd', hours: 35, date: '2026-07-28', description: 'Wireframes iniciales de la app logística', phaseId: 'A1', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-22',
    endDate: '2026-09-10',
    deliverables: [],
    createdAt: '2026-07-22T08:00:00Z',
    objective: 'Optimizar la visibilidad de entregas de distribuidora Impelsa.',
    alcance: 'Prototipo UI de seguimiento y panel administrativo.',
    riesgos: 'Resistencia al cambio en personal de ruta.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p9',
    name: 'Portal BI-Credid Express',
    clientName: 'BI-Credid',
    clientContact: 'Contacto BI-Credid',
    description: 'Plataforma de cotización y solicitud de créditos en línea para clientes BI.',
    activePhaseId: 'A5',
    health: 89,
    hoursTotal: 130,
    budget: {
      coordinador: { allocated: 40, consumed: 35 },
      sac: { allocated: 50, consumed: 45 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 60, consumed: 50 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm9-1', name: 'Fabiola', role: 'Supervisor' },
      { id: 'm9-2', name: 'Lourdes', role: 'PM' },
      { id: 'm9-3', name: 'Edgar', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te9-1', userId: 'u-fabiola', username: 'fabiola', role: 'coordinador', hours: 35, date: '2026-07-14', description: 'Supervisión de cumplimiento normativo y UX', phaseId: 'A2', type: 'normal' },
      { id: 'te9-2', userId: 'u-lourdes', username: 'lourdes', role: 'sac', hours: 45, date: '2026-07-20', description: 'Coordinación de sprints de interfaz bancaria', phaseId: 'A3', type: 'normal' },
      { id: 'te9-3', userId: 'u-edgar', username: 'edgar', role: 'contentd', hours: 50, date: '2026-07-27', description: 'Diseño de flujos de crédito y simulador', phaseId: 'A5', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-07-05',
    endDate: '2026-08-28',
    deliverables: [],
    createdAt: '2026-07-05T08:00:00Z',
    objective: 'Reducir el tiempo de aprobación de microcréditos a menos de 5 minutos.',
    alcance: 'Simulador, formulario KYC y firma electrónica.',
    riesgos: 'Validaciones de seguridad bancaria estrictas.',
    phases: createDefaultPhases(),
  },
  {
    id: 'p10',
    name: 'Campaña Microcréditos 2026',
    clientName: 'BI-Credid',
    clientContact: 'Contacto BI-Credid',
    description: 'Materiales promocionales, landing page e integración con canales bancarios.',
    activePhaseId: 'A8',
    health: 100,
    hoursTotal: 62,
    budget: {
      coordinador: { allocated: 15, consumed: 12 },
      sac: { allocated: 25, consumed: 22 },
      contents: { allocated: 0, consumed: 0 },
      contentd: { allocated: 35, consumed: 28 },
      invitado: { allocated: 0, consumed: 0 }
    },
    raciMatrix: createDefaultRaci(),
    members: [
      { id: 'm10-1', name: 'Rodrigo', role: 'Supervisor' },
      { id: 'm10-2', name: 'Maylin', role: 'PM' },
      { id: 'm10-3', name: 'Jeremy', role: 'Diseñador' }
    ],
    timeEntries: [
      { id: 'te10-1', userId: 'u-rodrigo', username: 'rodrigo', role: 'coordinador', hours: 12, date: '2026-07-01', description: 'Aprobación de entregables finales', phaseId: 'A7', type: 'normal' },
      { id: 'te10-2', userId: 'u-maylin', username: 'maylin', role: 'sac', hours: 22, date: '2026-07-10', description: 'Reporte mensual de rendimiento de campaña', phaseId: 'A8', type: 'normal' },
      { id: 'te10-3', userId: 'u-jeremy', username: 'jeremy', role: 'contentd', hours: 28, date: '2026-07-15', description: 'Ajustes gráficos para soportes regionales', phaseId: 'A8', type: 'normal' }
    ],
    auditLog: [],
    startDate: '2026-06-20',
    endDate: '2026-07-25',
    deliverables: [],
    createdAt: '2026-06-20T08:00:00Z',
    objective: 'Promoción de líneas de crédito pyme en canales BI.',
    alcance: 'Landing page, adaptaciones digitales y piezas de agencia.',
    riesgos: 'Ninguno, fase de mantenimiento SLA activo.',
    phases: createDefaultPhases(),
  },
];
