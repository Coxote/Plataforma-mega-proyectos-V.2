import { RoleHoursAllocation } from '../types';

export interface ParsedOrdenVenta {
  numero?: string;
  subtotal?: number;
  impuestos?: number;
  comisiones?: number;
  monto?: number;
  moneda?: string;
  fechaEmision?: string;
  descripcion?: string;
  horasPorRol?: Partial<RoleHoursAllocation>;
  error?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadAndParseOV(file: File): Promise<ParsedOrdenVenta> {
  const fileData = await readFileAsDataUrl(file);
  const res = await fetch('/api/parse-ov-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-auth-token': 'mega-proyectos-secure-token-2026',
    },
    body: JSON.stringify({
      fileData,
      mimeType: file.type || 'application/pdf',
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo analizar el archivo con la IA.');
  }

  return data;
}
