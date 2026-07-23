import { Project } from './types';

export interface ExportedFile {
  fileName: string;
  content: string;
}

/**
 * Convierte el estado actual del proyecto en notas Markdown para Obsidian
 */
export function generateObsidianMarkdownBundle(project: Project): ExportedFile[] {
  const files: ExportedFile[] = [];

  const timeEntries = project.timeEntries || [];
  const totalHours = timeEntries.reduce((acc, t) => acc + t.hours, 0);

  // 1. Archivo Cierre / Project Note
  const projectNote = `---
tipo: Project Note
proyecto: "${project.name}"
cliente: "${project.clientName}"
fecha_exportacion: "${new Date().toISOString().split('T')[0]}"
tags: [proyecto, repositorio, obsidian]
---

# 🚀 ${project.name} — Resumen General

## 📊 Información Básica
- **Cliente:** ${project.clientName}
- **Contacto:** ${project.clientContact}
- **Horas Totales Invertidas:** ${totalHours}h / ${project.hoursTotal}h

## 🎯 Objetivos y Alcance
### Objetivo
${project.objective || 'Sin especificar.'}

### Alcance
${project.alcance || 'Sin especificar.'}

## ⚠️ Riesgos Identificados
${project.riesgos || 'Sin riesgos registrados.'}

## ⏱️ Desglose de Horas por Equipo
${timeEntries.length > 0 
  ? timeEntries.map(t => `- **[${t.role.toUpperCase()}] ${t.username}:** ${t.hours}h — ${t.description} (${t.date})`).join('\n')
  : 'No hay registro de horas.'}
`;
  files.push({ fileName: `00_Project_Note_${project.name.replace(/\s+/g, '_')}.md`, content: projectNote });

  // 2. Archivo Brand Bible
  if (project.brandBible) {
    const bb = project.brandBible;
    const brandBibleContent = `---
tipo: Brand Bible
cliente: "${project.clientName}"
tags: [brand, identidad, figma, estrategia]
---

# 🎨 Brand Bible — ${project.clientName}

## 1. Fundamentos y Contexto Corporativo
- **Historia y Antecedentes:** ${bb.companyContext?.historyAndBackground || 'N/A'}
- **Misión, Visión & UVP:** ${bb.companyContext?.missionVisionUvp || bb.onePager?.mission || 'N/A'}

## 2. Arquetipo y Audiencia
- **Arquetipo de Marca:** ${bb.brandPersona?.archetype || bb.valuesAndPersonality?.archetype || 'N/A'}
- **Buyer Personas (Audiencia):** ${bb.brandPersona?.buyerPersonas || bb.targetAudience?.personas || 'N/A'}

## 3. Voz y Tono
- **Rasgos de Personalidad:** ${bb.voiceAndTone?.personalityTraits?.join(', ') || 'N/A'}
- **Do's & Don'ts (Qué decir y qué NO decir):** 
${bb.voiceAndTone?.dosAndDonts || 'N/A'}
- **Mensajes Clave:** ${bb.voiceAndTone?.coreMessages || 'N/A'}
- **Lineamientos de Voz:** ${bb.voiceAndTone?.guidelines || 'N/A'}
- **Vocabulario Recomendado:** ${bb.voiceAndTone?.vocabulary || 'N/A'}

## 4. Identidad Visual
- **Reglas del Logotipo:** ${bb.visualIdentity?.logoRules || bb.visualIdentity?.logoGuidelines || 'N/A'}
- **Paleta de Colores (Hex):** ${bb.visualIdentity?.colorPaletteHex?.join(', ') || bb.visualIdentity?.colorPalette || 'N/A'}
- **Jerarquía Tipográfica:** ${bb.visualIdentity?.typographyHierarchy || bb.visualIdentity?.typographySystem || 'N/A'}
- **Moodboard Links:** ${bb.visualIdentity?.moodboardLinks?.join(', ') || 'N/A'}

## 5. Recursos Externos
- **Carpeta Google Drive:** ${bb.resources?.driveFolderUrl || 'N/A'}
- **Archivo Figma:** ${bb.resources?.figmaUrl || 'N/A'}
`;
    files.push({ fileName: `01_Brand_Bible_${project.clientName.replace(/\s+/g, '_')}.md`, content: brandBibleContent });
  }

  return files;
}

/**
 * Función auxiliar para descargar los archivos generados en el navegador
 */
export function downloadObsidianFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
