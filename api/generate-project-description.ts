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
  } = req.body || {};

  const totalHours = (roleHours?.coordinador || 0) + (roleHours?.sac || 0) + (roleHours?.contents || 0) + (roleHours?.contentd || 0);

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `
        Eres un Director de Proyectos y Estratega Digital Senior en una agencia SaaS boutique.
        Genera un borrador de descripcion / brief operativo ejecutivo (en espanol, 2 a 3 parrafos bien estructurados) para un nuevo proyecto con los siguientes parametros:

        - Nombre del Proyecto: ${projectName || 'Sin especificar'}
        - Cliente: ${clientName || 'Sin especificar'}
        - Modo/Plantilla: ${projectMode === 'template' ? selectedTemplate : 'Personalizado (Builder)'}
        - Entregables Estimados: ${deliverablesCount || 'No especificados'}
        - Etiquetas/Categorias: ${tags && tags.length > 0 ? tags.join(', ') : 'Ninguna'}
        - Fecha Inicio: ${startDate || 'N/A'}
        - Fecha Finalizacion: ${endDate || 'N/A'}
        - Horas Totales Estimadas: ${totalHours} hrs (Coordinador: ${roleHours?.coordinador || 0}h, SAC: ${roleHours?.sac || 0}h, ContentS: ${roleHours?.contents || 0}h, ContentD: ${roleHours?.contentd || 0}h)
        - Presupuesto/Ingreso: ${totalIncome ? `${totalIncome} ${currency || 'USD'}` : 'No definido'}

        INSTRUCCIONES DE FORMATO:
        - Redacta una descripcion clara, motivadora y profesional que resuma el alcance principal, el valor para el cliente y el enfoque de trabajo del escuadron.
        - Utiliza parrafos concisos sin tecnicismos innecesarios.
        - Devuelve UNICAMENTE un objeto JSON con la clave "description" conteniendo el texto formateado.
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
          },
          required: ['description'],
        },
      },
    });

    if (!response.text) throw new Error('No se recibio respuesta de Gemini.');
    return sendJson(res, 200, JSON.parse(response.text));
  } catch (error: any) {
    console.error('Error generating project description with Gemini:', error);
    return sendJson(res, 500, { error: error.message || 'Error al generar la descripcion del proyecto.' });
  }
}
