import { Type } from '@google/genai';
import { getGeminiClient, methodNotAllowed, sendJson } from './_gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { briefText } = req.body || {};

  if (!briefText || typeof briefText !== 'string' || !briefText.trim()) {
    return sendJson(res, 400, { error: 'briefText es requerido y debe ser un texto valido.' });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `
        Analiza el siguiente texto/brief de proyecto de marca y extrae los elementos clave para construir una Brand Bible.
        Devuelve la informacion procesada y estructurada estrictamente bajo el esquema JSON solicitado.

        TEXTO DEL BRIEF:
        """
        ${briefText}
        """
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            onePager: {
              type: Type.OBJECT,
              properties: {
                mission: { type: Type.STRING },
                vision: { type: Type.STRING },
                uvp: { type: Type.STRING },
              },
            },
            positioning: {
              type: Type.OBJECT,
              properties: {
                statement: { type: Type.STRING },
                competitors: { type: Type.STRING },
              },
            },
            valuesAndPersonality: {
              type: Type.OBJECT,
              properties: {
                values: { type: Type.STRING },
                archetype: { type: Type.STRING },
              },
            },
            targetAudience: {
              type: Type.OBJECT,
              properties: {
                personas: { type: Type.STRING },
              },
            },
            visualIdentity: {
              type: Type.OBJECT,
              properties: {
                logoGuidelines: { type: Type.STRING },
                colorPalette: { type: Type.STRING },
                typographySystem: { type: Type.STRING },
              },
            },
            voiceAndTone: {
              type: Type.OBJECT,
              properties: {
                guidelines: { type: Type.STRING },
                vocabulary: { type: Type.STRING },
              },
            },
          },
        },
      },
    });

    if (!response.text) throw new Error('No se recibio respuesta valida de Gemini.');
    return sendJson(res, 200, JSON.parse(response.text));
  } catch (error: any) {
    console.error('Error al procesar con Gemini:', error);
    return sendJson(res, 500, { error: error.message || 'Error al procesar el brief con Gemini' });
  }
}
