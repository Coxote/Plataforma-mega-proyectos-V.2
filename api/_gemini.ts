import { GoogleGenAI } from '@google/genai';

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada. Por favor configurala en Vercel.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function sendJson(res: any, status: number, body: unknown) {
  res.status(status).json(body);
}

export function methodNotAllowed(res: any) {
  sendJson(res, 405, { error: 'Metodo no permitido.' });
}
