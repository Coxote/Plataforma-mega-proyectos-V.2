import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Project } from './types';
import { generateObsidianMarkdownBundle } from './obsidianExporter';

export async function exportProjectToZip(project: Project) {
  const zip = new JSZip();

  // 1. Crear carpeta Obsidian y meter los Markdowns
  const obsidianFolder = zip.folder("01_Obsidian_SecondBrain");
  const markdownFiles = generateObsidianMarkdownBundle(project);
  markdownFiles.forEach(file => {
    obsidianFolder?.file(file.fileName, file.content);
  });

  // 2. Generar Documento del Historial de Auditoría Completo
  const auditContent = (project.auditLog || []).map(log => {
    const timestampStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
    return `[${timestampStr}] ${log.username || 'Usuario'} (${log.userRole || 'rol'}) -> ${log.action || 'Acción'} en ${log.entityType || 'Entidad'}:\n  Detalle: ${log.details || 'N/A'}\n`;
  }).join('\n----------------------------------------\n');
  
  zip.file("02_Historial_Auditoria_Completo.txt", auditContent || "Sin registros de auditoría.");

  // 3. Generar Reporte de Entregables y Feedback del Cliente
  let feedbackContent = `# Registro de Entregables y Comentarios - ${project.clientName}\n\n`;
  if (project.deliverables && project.deliverables.length > 0) {
    project.deliverables.forEach(d => {
      feedbackContent += `## 📦 ${d.title} (${d.type})\n`;
      feedbackContent += `- Link: ${d.fileUrl || d.externalUrl || 'N/A'}\n`;
      feedbackContent += `- Visible para cliente: ${d.isVisibleToClient ? 'Sí' : 'No'}\n\n`;
      
      const annotations = d.annotations || [];
      if (annotations.length > 0) {
        feedbackContent += `### Comentarios del Cliente:\n`;
        annotations.forEach(ann => {
          feedbackContent += `> **${ann.authorName} (${ann.date}):** ${ann.comment} [Status: ${ann.status}]\n\n`;
        });
      } else {
        feedbackContent += `*Sin comentarios registrados.*\n\n`;
      }
    });
  } else {
    feedbackContent += `*No se han publicado entregables para este proyecto.*\n`;
  }

  zip.file("03_Entregables_y_Feedback.md", feedbackContent);

  // 4. Exportar el JSON crudo como respaldo de base de datos
  zip.file("04_Backup_Datos_Proyecto.json", JSON.stringify(project, null, 2));

  // 5. Compilar y Descargar el ZIP
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `Cierre_Proyecto_${project.name.replace(/\s+/g, '_')}.zip`);
}
