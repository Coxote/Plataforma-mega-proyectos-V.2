import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo no permitido.' });
  }

  const { briefText } = req.body || {};

  if (!briefText || typeof briefText !== 'string' || !briefText.trim()) {
    return res.status(400).json({ error: 'briefText es requerido y debe ser un texto valido.' });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY no esta configurada. Agregala en las variables de entorno de Vercel.',
    });
  }

  const prompt = `
    Analiza el siguiente texto/brief de proyecto de marca y extrae los elementos clave para construir una Brand Bible.
    Devuelve la informacion procesada y estructurada estrictamente bajo el esquema JSON solicitado.

    TEXTO DEL BRIEF:
    """
    ${briefText}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
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

    if (response.text) {
      return res.status(200).json(JSON.parse(response.text));
    }

    throw new Error('No se recibio respuesta valida de Gemini.');
  } catch (error: any) {
    console.error('Error al procesar con Gemini:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar el brief con Gemini' });
  }
}
