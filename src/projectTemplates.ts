import { Phase } from './types';

export const PROJECT_TEMPLATES = [
  { id: 'redes', name: 'Contenido Redes Sociales' },
  { id: 'app', name: 'Desarrollo de App' },
  { id: 'juego', name: 'Desarrollo de Juego' },
  { id: 'web', name: 'Desarrollo de Página Web' },
  { id: 'consultoria', name: 'Consultoría' },
];

export const generatePhasesForTemplate = (templateType: string, customPhasesInput?: string[]): Phase[] => {
  switch (templateType) {
    case 'redes':
      return [
        {
          id: 'A1',
          label: 'A1. Estrategia & Content Brief',
          status: 'active',
          completedAt: null,
          exitCriteria: 'Aprobación del Brand Bible y matriz de contenidos del mes.',
          checklist: [
            { id: 'c-r1-1', text: 'Entrevista de Kickoff y recopilación de Brand Bible', completed: false },
            { id: 'c-r1-2', text: 'Definición de pilares editoriales y tono de voz', completed: false },
            { id: 'c-r1-3', text: 'Benchmark y análisis de competencia', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A2',
          label: 'A2. Calendario & Copywriting',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Textos y copys validados por cliente en grilla mensual.',
          checklist: [
            { id: 'c-r2-1', text: 'Redacción de la grilla mensual de publicaciones', completed: false },
            { id: 'c-r2-2', text: 'Definición de llamadas a la acción (CTA) y hashtags', completed: false },
            { id: 'c-r2-3', text: 'Revisión y visto bueno interno de copys', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A3',
          label: 'A3. Producción Visual & Animación',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Piezas gráficas y reels exportados y aprobados por SAC y Cliente.',
          checklist: [
            { id: 'c-r3-1', text: 'Diseño de piezas estáticas y carruseles', completed: false },
            { id: 'c-r3-2', text: 'Edición de video corto / Reels / Motion Graphics', completed: false },
            { id: 'c-r3-3', text: 'Carga de bocetos al portal para revisión del cliente', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A4',
          label: 'A4. Programación & Community',
          status: 'pending',
          completedAt: null,
          exitCriteria: '100% de contenidos programados en la herramienta de gestión.',
          checklist: [
            { id: 'c-r4-1', text: 'Programación de posts en Meta Business / Metricool', completed: false },
            { id: 'c-r4-2', text: 'Validación de enlaces y etiquetado', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A5',
          label: 'A5. Reporte & Analytics Mensual',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Envío del informe de desempeño al cliente y reunión de retroalimentación.',
          checklist: [
            { id: 'c-r5-1', text: 'Consolidación de métricas de alcance e interacción', completed: false },
            { id: 'c-r5-2', text: 'Reunión de cierre con cliente y ajustes para próximo mes', completed: false },
          ],
          fields: {}
        },
      ];

    case 'app':
      return [
        {
          id: 'A1',
          label: 'A1. Arquitectura & Wireframes',
          status: 'active',
          completedAt: null,
          exitCriteria: 'Aprobación formal del mapa de navegación y wireframes en baja fidelidad.',
          checklist: [
            { id: 'c-a1-1', text: 'Kickoff y definición de casos de uso principales', completed: false },
            { id: 'c-a1-2', text: 'Creación del sitemap y flujos de pantalla', completed: false },
            { id: 'c-a1-3', text: 'Wireframing de pantallas clave en Figma', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A2',
          label: 'A2. Diseño UI/UX & Prototipo',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Prototipo interactivo navegable aprobado por el cliente.',
          checklist: [
            { id: 'c-a2-1', text: 'Design System y librería de componentes UI', completed: false },
            { id: 'c-a2-2', text: 'Diseño en alta fidelidad de todas las vistas', completed: false },
            { id: 'c-a2-3', text: 'Creación de prototipo navegable e interactivo', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A3',
          label: 'A3. Desarrollo Frontend & Backend API',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Código fuente en repositorio con endpoints y pantallas conectadas.',
          checklist: [
            { id: 'c-a3-1', text: 'Configuración del repositorio e infraestructura', completed: false },
            { id: 'c-a3-2', text: 'Desarrollo de pantallas frontend e integración de componentes', completed: false },
            { id: 'c-a3-3', text: 'Implementación de API backend y base de datos', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A4',
          label: 'A4. QA & Pruebas de Carga',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Zero bugs críticos en entorno de Staging.',
          checklist: [
            { id: 'c-a4-1', text: 'Ejecución de pruebas funcionales y de seguridad', completed: false },
            { id: 'c-a4-2', text: 'Resolución de bugs y reporte de QA', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A5',
          label: 'A5. Publicación en Stores (iOS/Android)',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'App aprobada y publicada en tiendas oficial de producción.',
          checklist: [
            { id: 'c-a5-1', text: 'Generación de builds de producción signed', completed: false },
            { id: 'c-a5-2', text: 'Ficha de App Store y Google Play', completed: false },
            { id: 'c-a5-3', text: 'Publicación y entrega de accesos finales al cliente', completed: false },
          ],
          fields: {}
        },
      ];

    case 'juego':
      return [
        {
          id: 'A1',
          label: 'A1. Game Design Document (GDD)',
          status: 'active',
          completedAt: null,
          exitCriteria: 'GDD completo con reglas y mecánicas aprobadas.',
          checklist: [
            { id: 'c-j1-1', text: 'Redacción de GDD (Core Loop, Mecánicas, Controles)', completed: false },
            { id: 'c-j1-2', text: 'Definición de estilo de arte y paleta cromática', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A2',
          label: 'A2. Sprites & Arte Pixel',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Atlas de sprites y escenarios exportados.',
          checklist: [
            { id: 'c-j2-1', text: 'Diseño de personaje y spritesheets de animación', completed: false },
            { id: 'c-j2-2', text: 'Tilemaps de niveles y assets de interfaz HUD', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A3',
          label: 'A3. Programación de Motor & Físicas',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Demo jugable funcional en motor web o ejecutable.',
          checklist: [
            { id: 'c-j3-1', text: 'Implementación de físicas, colisiones y estado de juego', completed: false },
            { id: 'c-j3-2', text: 'Lógica de puntuación, vidas y condiciones de victoria', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A4',
          label: 'A4. Diseño de Niveles & Audio',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Niveles ensamblados con efectos de sonido SFX y música.',
          checklist: [
            { id: 'c-j4-1', text: 'Construcción de niveles y curvas de dificultad', completed: false },
            { id: 'c-j4-2', text: 'Integración de audio chiptune y SFX', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A5',
          label: 'A5. Playtesting & Cierre Build',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Build estable en producción con retroalimentación aprobada.',
          checklist: [
            { id: 'c-j5-1', text: 'Sesiones de Playtesting y ajuste de balance', completed: false },
            { id: 'c-j5-2', text: 'Exportación de build final y entrega', completed: false },
          ],
          fields: {}
        },
      ];

    case 'web':
      return [
        {
          id: 'A1',
          label: 'A1. Discovery, UX & Sitemap',
          status: 'active',
          completedAt: null,
          exitCriteria: 'Aprobación del árbol de navegación y estructura de contenidos.',
          checklist: [
            { id: 'c-w1-1', text: 'Kickoff y recopilación de requerimientos técnicos', completed: false },
            { id: 'c-w1-2', text: 'Estructuración del mapa del sitio (Sitemap)', completed: false },
            { id: 'c-w1-3', text: 'Wireframes de baja fidelidad para Desktop y Mobile', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A2',
          label: 'A2. UI Design System & Figma Tokens',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Maqueta UI aprobada en Figma por el cliente.',
          checklist: [
            { id: 'c-w2-1', text: 'Definición de sistema de colores, tipografía y componentes', completed: false },
            { id: 'c-w2-2', text: 'Diseño de la Landing Page principal y páginas secundarias', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A3',
          label: 'A3. Maquetación Web & Integraciones',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Sitio maquetado en Staging con formularios e integraciones activas.',
          checklist: [
            { id: 'c-w3-1', text: 'Maquetación frontend responsive (Tailwind CSS / React)', completed: false },
            { id: 'c-w3-2', text: 'Integración de formularios de contacto y APIs', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A4',
          label: 'A4. SEO Técnico, Velocidad & Responsive',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Puntaje > 90 en Google PageSpeed y meta tags configuradas.',
          checklist: [
            { id: 'c-w4-1', text: 'Optimización de imágenes y carga diferida', completed: false },
            { id: 'c-w4-2', text: 'Configuración de meta tags, OpenGraph y Favicon', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A5',
          label: 'A5. Migración Core & Go-Live',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Sitio activo en dominio final con certificado SSL.',
          checklist: [
            { id: 'c-w5-1', text: 'Configuración de DNS y certificado SSL', completed: false },
            { id: 'c-w5-2', text: 'Despliegue a servidor de producción y pruebas finales', completed: false },
          ],
          fields: {}
        },
      ];

    case 'consultoria':
      return [
        {
          id: 'A1',
          label: 'A1. Diagnóstico & Auditoría Inicial',
          status: 'active',
          completedAt: null,
          exitCriteria: 'Informe de diagnóstico inicial validado con la dirección.',
          checklist: [
            { id: 'c-co1-1', text: 'Recopilación de documentación operativa actual', completed: false },
            { id: 'c-co1-2', text: 'Entrevistas con actores clave de la organización', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A2',
          label: 'A2. Análisis de Brechas & Oportunidades',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Matriz de brechas identificadas y priorizadas.',
          checklist: [
            { id: 'c-co2-1', text: 'Análisis de cuellos de botella y riesgos', completed: false },
            { id: 'c-co2-2', text: 'Identificación de oportunidades de automatización', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A3',
          label: 'A3. Construcción de Roadmap Estratégico',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Roadmap ejecutivo con iniciativas y KPIs acordados.',
          checklist: [
            { id: 'c-co3-1', text: 'Diseño del plan de trabajo por fases y presupuesto', completed: false },
            { id: 'c-co3-2', text: 'Definición de KPIs de éxito del programa', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A4',
          label: 'A4. Sesiones de Capacitación & Mentoría',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Talleres impartidos con actas de asistencia.',
          checklist: [
            { id: 'c-co4-1', text: 'Ejecución de talleres de alineación técnica', completed: false },
            { id: 'c-co4-2', text: 'Sesiones 1 a 1 con líderes de área', completed: false },
          ],
          fields: {}
        },
        {
          id: 'A5',
          label: 'A5. Entregable Final & Cierre',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Aprobación del informe ejecutivo final por el cliente.',
          checklist: [
            { id: 'c-co5-1', text: 'Presentación ejecutiva a junta/dirección', completed: false },
            { id: 'c-co5-2', text: 'Cierre del contrato y encuesta de satisfacción', completed: false },
          ],
          fields: {}
        },
      ];

    case 'custom':
      if (customPhasesInput && customPhasesInput.length > 0) {
        return customPhasesInput.map((pName, index) => ({
          id: `A${index + 1}`,
          label: pName.startsWith('A') ? pName : `A${index + 1}. ${pName}`,
          status: index === 0 ? 'active' : 'pending',
          completedAt: null,
          exitCriteria: 'Cumplimiento de las tareas de la fase.',
          checklist: [
            { id: `c-cust-${index + 1}-1`, text: `Inicio y planificación de ${pName}`, completed: false },
            { id: `c-cust-${index + 1}-2`, text: `Ejecución y entregable principal`, completed: false }
          ],
          fields: {}
        }));
      }
      return [
        {
          id: 'A1',
          label: 'A1. Fase Inicial / Kickoff',
          status: 'active',
          completedAt: null,
          exitCriteria: 'Documento de inicio validado.',
          checklist: [{ id: 'c-def-1-1', text: 'Kickoff inicial y asignación de equipo', completed: false }],
          fields: {}
        },
        {
          id: 'A2',
          label: 'A2. Desarrollo / Ejecución',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Entregable principal completado.',
          checklist: [{ id: 'c-def-2-1', text: 'Desarrollo del entregable acordado', completed: false }],
          fields: {}
        },
        {
          id: 'A3',
          label: 'A3. Entrega & Cierre',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Aprobación final del cliente.',
          checklist: [{ id: 'c-def-3-1', text: 'Entrega final y acta de aceptación', completed: false }],
          fields: {}
        },
      ];

    default:
      return [
        {
          id: 'A1',
          label: 'A1. Kickoff & Descubrimiento',
          status: 'active',
          completedAt: null,
          exitCriteria: 'Acuerdos de inicio registrados.',
          checklist: [{ id: 'c-def-1', text: 'Kickoff inicial', completed: false }],
          fields: {}
        },
        {
          id: 'A2',
          label: 'A2. Ejecución Técnica',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Trabajo técnico ejecutado.',
          checklist: [{ id: 'c-def-2', text: 'Desarrollo técnico', completed: false }],
          fields: {}
        },
        {
          id: 'A3',
          label: 'A3. Cierre & Entrega',
          status: 'pending',
          completedAt: null,
          exitCriteria: 'Cierre aprobado por el cliente.',
          checklist: [{ id: 'c-def-3', text: 'Cierre formal', completed: false }],
          fields: {}
        },
      ];
  }
};

