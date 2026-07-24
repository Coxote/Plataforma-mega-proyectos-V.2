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

export interface RiskItem {
  risk: string;
  severity: 'Alta' | 'Media' | 'Baja' | string;
  category: string;
  mitigation: string;
}

export interface RiskAnalysisResult {
  summary: string;
  risks: RiskItem[];
}

/**
  * Genera un borrador de descripción / brief para un nuevo proyecto usando Gemini en el Wizard.
  */
export async function generateProjectDescriptionWithGemini(projectParams: any): Promise<string> {
  try {
    const response = await fetch('/api/generate-project-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectParams),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    return data.description || '';
  } catch (error) {
    console.error('Error al generar descripción con Gemini:', error);
    throw error;
  }
}

/**
  * Analiza los parámetros del proyecto en el Wizard y genera sugerencias de mitigación de riesgos.
  */
export async function generateRiskMitigationWithGemini(projectParams: any): Promise<RiskAnalysisResult> {
  try {
    const response = await fetch('/api/generate-risk-mitigation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectParams),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    return await response.json() as RiskAnalysisResult;
  } catch (error) {
    console.error('Error al generar mitigación de riesgos con Gemini:', error);
    throw error;
  }
}

