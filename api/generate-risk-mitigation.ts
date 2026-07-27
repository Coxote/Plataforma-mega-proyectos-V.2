import { Type } from '@google/genai';
import { getGeminiClient, methodNotAllowed, sendJson } from './_gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const {
    projectName,
    clientName,
    projectMode,
    selectedTemplate,
    deliverablesCount,
    tags,
    startDate,
    endDate,
    roleHours,
    totalIncome,
    currency,
    description,
  } = req.body || {};

  const totalHours = (roleHours?.coordinador || 0) + (roleHours?.sac || 0) + (roleHours?.contents || 0) + (roleHours?.contentd || 0);

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `
        Eres un Risk Manager Senior especializado en agencias digitales y desarrollo SaaS.
        Identifica 3 a 4 riesgos operativos, temporales, de alcance o financieros y propone mitigaciones accionables.

        PARAMETROS:
        - Proyecto: ${projectName || 'Sin especificar'}
        - Cliente: ${clientName || 'Sin especificar'}
        - Modo: ${projectMode === 'template' ? selectedTemplate : 'Personalizado'}
        - Entregables: ${deliverablesCount || 'Sin definir'}
        - Etiquetas: ${tags && tags.length > 0 ? tags.join(', ') : 'Ninguna'}
        - Periodo: ${startDate || 'N/A'} a ${endDate || 'N/A'}
        - Horas totales: ${totalHours}
        - Ingreso: ${totalIncome ? `${totalIncome} ${currency || 'USD'}` : 'Sin definir'}
        - Descripcion: ${description || 'Sin descripcion redactada'}

        Devuelve JSON siguiendo el esquema solicitado.
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING },
                  severity: { type: Type.STRING, description: 'Alta, Media o Baja' },
                  category: { type: Type.STRING, description: 'Plazos, Alcance, Carga de Trabajo, Cliente, Financiero' },
                  mitigation: { type: Type.STRING },
                },
                required: ['risk', 'severity', 'category', 'mitigation'],
              },
            },
          },
          required: ['summary', 'risks'],
        },
      },
    });

    if (!response.text) throw new Error('No se recibio respuesta de Gemini.');
    return sendJson(res, 200, JSON.parse(response.text));
  } catch (error: any) {
    console.error('Error generating risk mitigation with Gemini:', error);
    return sendJson(res, 500, { error: error.message || 'Error al generar mitigaciones de riesgos.' });
  }
}
