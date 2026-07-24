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
        Eres un Risk Manager Senior y Director de Operaciones especializado en agencias digitales y desarrollo SaaS.
        Analiza los parametros operativos y financieros de este nuevo proyecto para identificar los riesgos potenciales mas criticos y proponer planes de mitigacion concretos y accionables.

        PARAMETROS DEL PROYECTO:
        - Nombre del Proyecto: ${projectName || 'Sin especificar'}
        - Cliente: ${clientName || 'Sin especificar'}
        - Modo/Plantilla: ${projectMode === 'template' ? selectedTemplate : 'Personalizado'}
        - Entregables Esperados: ${deliverablesCount || 'Sin definir'}
        - Etiquetas: ${tags && tags.length > 0 ? tags.join(', ') : 'Ninguna'}
        - Periodo: Del ${startDate || 'N/A'} al ${endDate || 'N/A'}
        - Presupuesto Horas: Total ${totalHours} hrs (Coordinador: ${roleHours?.coordinador || 0}h, SAC: ${roleHours?.sac || 0}h, ContentS: ${roleHours?.contents || 0}h, ContentD: ${roleHours?.contentd || 0}h)
        - Ingreso Total: ${totalIncome ? `${totalIncome} ${currency || 'USD'}` : 'Sin definir'}
        - Descripcion actual: ${description || 'Sin descripcion redactada'}

        OBJETIVO:
        Identifica entre 3 y 4 riesgos operativos, temporales, de alcance o financieros.
        Proporciona para cada riesgo una estrategia de mitigacion realista y preventiva.

        Devuelve la informacion en formato JSON siguiendo estrictamente el esquema especificado.
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
