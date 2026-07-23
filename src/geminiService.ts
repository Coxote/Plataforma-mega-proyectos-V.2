import { BrandBibleData } from './types';

/**
 * Analiza un texto de brief o documento subido y extrae la Brand Bible automáticamente.
 * Envía la petición a nuestro servidor seguro Express para procesarla con Gemini 3.6-Flash.
 */
export async function analyzeBriefWithGemini(briefText: string): Promise<BrandBibleData> {
  try {
    const response = await fetch('/api/analyze-brief', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ briefText }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    return await response.json() as BrandBibleData;
  } catch (error) {
    console.error('Error al procesar con Gemini:', error);
    throw error;
  }
}
