import { getGeminiClient, methodNotAllowed, sendJson } from './_gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { prompt, users, projects, history } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return sendJson(res, 400, { error: 'prompt es requerido y debe ser un texto valido.' });
  }

  const formattedUsers = (users || []).map((u: any) => ({
    username: u.username,
    role: u.role,
    puesto: u.puesto || u.role,
    projectId: u.projectId || 'Ninguno',
  }));

  const formattedProjects = (projects || []).map((p: any) => ({
    name: p.name,
    clientName: p.clientName,
    health: p.health,
    hoursTotal: p.hoursTotal,
    activePhase: p.phases?.find((ph: any) => ph.id === p.activePhaseId)?.label || 'Sin Fase',
    budget: p.budget || {},
  }));

  const contents = [];

  if (history && Array.isArray(history)) {
    history.forEach((msg: any) => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    });
  }

  contents.push({ role: 'user', parts: [{ text: prompt }] });

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        temperature: 0.7,
        systemInstruction: `
          Eres el Co-Piloto de Operaciones IA de una agencia boutique SaaS.
          Responde de forma clara, accionable y ejecutiva sobre carga de trabajo, solapes, avance de proyectos, disponibilidad y dictados de avance.

          Equipo: ${JSON.stringify(formattedUsers)}
          Proyectos: ${JSON.stringify(formattedProjects)}
        `,
      },
    });

    if (!response.text) throw new Error('No se recibio una respuesta valida de Gemini.');
    return sendJson(res, 200, { reply: response.text });
  } catch (error: any) {
    console.error('Error in AI Assistant endpoint:', error);
    return sendJson(res, 500, { error: error.message || 'Error al procesar la consulta con Gemini' });
  }
}
