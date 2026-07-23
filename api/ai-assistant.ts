import { GoogleGenAI } from '@google/genai';

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

  const { prompt, users, projects, history } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt es requerido y debe ser un texto valido.' });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY no esta configurada. Agregala en las variables de entorno de Vercel.',
    });
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

  const systemInstruction = `
    Eres el Co-Piloto de Operaciones IA y Director de Gestion de un escuadron de desarrollo en una agencia boutique SaaS.
    Tienes acceso en tiempo real a la informacion de los proyectos, presupuestos de horas, estados de las fases, y a los colaboradores del equipo con sus puestos de trabajo.

    Tu objetivo es responder de forma clara, accionable, amigable, profesional y ejecutiva a cualquier duda que tenga el usuario sobre la carga de trabajo, solapes, avance de proyectos, disponibilidad del personal, o procesar dictados de avance de tareas.

    CONTEXTO OPERATIVO DEL EQUIPO:
    - Lista de colaboradores: ${JSON.stringify(formattedUsers)}
    - Lista de proyectos activos y sus presupuestos: ${JSON.stringify(formattedProjects)}

    PAUTAS DE COMPORTAMIENTO:
    1. Responde de manera profesional y directa. Evita tecnicismos innecesarios o palabreria de ventas.
    2. Si te preguntan quien tiene mas carga de trabajo o solapes, analiza el presupuesto asignado de cada rol e infiere quien podria estar mas saturado.
    3. Si el usuario te dicta un avance, felicitalo brevemente, formatea los datos clave del avance estructuradamente para que el coordinador los confirme e indica como impactara esto en el proyecto.
    4. Proporciona siempre respuestas estructuradas usando vinetas o negritas para facilitar la lectura rapida en la interfaz.
  `;

  const contents: any[] = [];

  if (history && Array.isArray(history)) {
    history.forEach((msg: any) => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    if (response.text) {
      return res.status(200).json({ reply: response.text });
    }

    throw new Error('No se recibio una respuesta valida de Gemini.');
  } catch (error: any) {
    console.error('Error in AI Assistant endpoint:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar la consulta con Gemini' });
  }
}
