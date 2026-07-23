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
        { id: 'A1', label: 'A1. Estrategia & Content Brief', status: 'active', completedAt: null, checklist: [], fields: {} },
        { id: 'A2', label: 'A2. Calendario & Copywriting', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A3', label: 'A3. Producción Visual & Animación', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A4', label: 'A4. Programación & Community', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A5', label: 'A5. Reporte & Analytics Mensual', status: 'pending', completedAt: null, checklist: [], fields: {} },
      ];

    case 'app':
      return [
        { id: 'A1', label: 'A1. Arquitectura de Información & Wireframes', status: 'active', completedAt: null, checklist: [], fields: {} },
        { id: 'A2', label: 'A2. Diseño de Interfaz (UI/UX) & Prototype', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A3', label: 'A3. Desarrollo Frontend & Backend API', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A4', label: 'A4. QA, Pruebas de Carga & Bug Fixing', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A5', label: 'A5. Publicación en Stores (iOS / Android)', status: 'pending', completedAt: null, checklist: [], fields: {} },
      ];

    case 'juego':
      return [
        { id: 'A1', label: 'A1. Game Design Document (GDD) & Mecánicas', status: 'active', completedAt: null, checklist: [], fields: {} },
        { id: 'A2', label: 'A2. Sprites, Arte Pixel & Ilustración', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A3', label: 'A3. Programación de Físicas & HUD', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A4', label: 'A4. Diseño de Niveles & Pulido Sonoro', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A5', label: 'A5. Playtesting & Alpha/Beta Build', status: 'pending', completedAt: null, checklist: [], fields: {} },
      ];

    case 'web':
      return [
        { id: 'A1', label: 'A1. Discovery, UX & Sitemap', status: 'active', completedAt: null, checklist: [], fields: {} },
        { id: 'A2', label: 'A2. UI Design System & Figma Tokens', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A3', label: 'A3. Maquetación Web & Integraciones', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A4', label: 'A4. SEO Técnico, Velocidad & Responsive', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A5', label: 'A5. Migración Core & Go-Live', status: 'pending', completedAt: null, checklist: [], fields: {} },
      ];

    case 'consultoria':
      return [
        { id: 'A1', label: 'A1. Diagnóstico & Auditoría Inicial', status: 'active', completedAt: null, checklist: [], fields: {} },
        { id: 'A2', label: 'A2. Análisis de Brechas & Oportunidades', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A3', label: 'A3. Construcción de Roadmap Estratégico', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A4', label: 'A4. Sesiones de Capacitación & Mentoría', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A5', label: 'A5. Entregable Final & Cierre', status: 'pending', completedAt: null, checklist: [], fields: {} },
      ];

    case 'custom':
      if (customPhasesInput && customPhasesInput.length > 0) {
        return customPhasesInput.map((pName, index) => ({
          id: `A${index + 1}`,
          label: pName.startsWith('A') ? pName : `A${index + 1}. ${pName}`,
          status: index === 0 ? 'active' : 'pending',
          completedAt: null,
          checklist: [],
          fields: {}
        }));
      }
      return [
        { id: 'A1', label: 'A1. Fase Inicial / Kickoff', status: 'active', completedAt: null, checklist: [], fields: {} },
        { id: 'A2', label: 'A2. Desarrollo / Ejecución', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A3', label: 'A3. Entrega & Cierre', status: 'pending', completedAt: null, checklist: [], fields: {} },
      ];

    default:
      return [
        { id: 'A1', label: 'A1. Kickoff & Descubrimiento', status: 'active', completedAt: null, checklist: [], fields: {} },
        { id: 'A2', label: 'A2. Ejecución Técnica', status: 'pending', completedAt: null, checklist: [], fields: {} },
        { id: 'A3', label: 'A3. Cierre & Entrega', status: 'pending', completedAt: null, checklist: [], fields: {} },
      ];
  }
};
