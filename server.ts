import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initializing the server-side Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint to analyze client brief and extract Brand Bible elements
app.post('/api/analyze-brief', async (req, res) => {
  const { briefText } = req.body;

  if (!briefText || typeof briefText !== 'string' || !briefText.trim()) {
    return res.status(400).json({ error: 'briefText es requerido y debe ser un texto válido.' });
  }

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY no está configurada. Por favor configúrala en el panel de Secrets.' 
    });
  }

  // Basic Text Task using the recommended gemini-3.6-flash model
  const model = 'gemini-3.6-flash';

  const prompt = `
    Analiza el siguiente texto/brief de proyecto de marca y extrae los elementos clave para construir una Brand Bible.
    Devuelve la información procesada y estructurada estrictamente bajo el esquema JSON solicitado.

    TEXTO DEL BRIEF:
    """
    ${briefText}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
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
      const parsedData = JSON.parse(response.text);
      return res.json(parsedData);
    }
    throw new Error('No se recibió respuesta válida de Gemini.');
  } catch (error: any) {
    console.error('Error al procesar con Gemini:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar el brief con Gemini' });
  }
});

// Endpoint for AI Assistant to answer questions about the squad, capacity, workloads, and projects
app.post('/api/ai-assistant', async (req, res) => {
  const { prompt, users, projects, history } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt es requerido y debe ser un texto válido.' });
  }

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY no está configurada. Por favor configúrala en el panel de Secrets.' 
    });
  }

  const model = 'gemini-3.6-flash';

  // Construct structured information for Gemini
  const formattedUsers = (users || []).map((u: any) => ({
    username: u.username,
    role: u.role,
    puesto: u.puesto || u.role,
    projectId: u.projectId || 'Ninguno'
  }));

  const formattedProjects = (projects || []).map((p: any) => ({
    name: p.name,
    clientName: p.clientName,
    health: p.health,
    hoursTotal: p.hoursTotal,
    activePhase: p.phases?.find((ph: any) => ph.id === p.activePhaseId)?.label || 'Sin Fase',
    budget: p.budget || {}
  }));

  const systemInstruction = `
    Eres el Co-Piloto de Operaciones IA y Director de Gestión de un escuadrón de desarrollo en una agencia boutique SaaS.
    Tienes acceso en tiempo real a la información de los proyectos, presupuestos de horas, estados de las fases, y a los colaboradores del equipo con sus puestos de trabajo.
    
    Tu objetivo es responder de forma clara, accionable, amigable, profesional y ejecutiva a cualquier duda que tenga el usuario sobre la carga de trabajo, solapes, avance de proyectos, disponibilidad del personal, o procesar dictados de avance de tareas.
    
    CONTEXTO OPERATIVO DEL EQUIPO:
    - Lista de colaboradores: ${JSON.stringify(formattedUsers)}
    - Lista de proyectos activos y sus presupuestos: ${JSON.stringify(formattedProjects)}
    
    PAUTAS DE COMPORTAMIENTO:
    1. Responde de manera profesional y directa. Evita tecnicismos innecesarios o palabrería de ventas.
    2. Si te preguntan quién tiene más carga de trabajo o solapes, analiza el presupuesto asignado de cada rol e infiere quién podría estar más saturado.
    3. Si el usuario te "dicta un avance" (por ejemplo: "Dictar avance: He completado el diseño del minijuego de fútbol"), felicítalo brevemente, formatea los datos clave del avance estructuradamente para que el coordinador los confirme e indica cómo impactará esto en el proyecto.
    4. Proporciona siempre respuestas estructuradas usando viñetas o negritas para facilitar la lectura rápida en la interfaz.
  `;

  const contents: any[] = [];
  
  if (history && Array.isArray(history)) {
    history.forEach((msg: any) => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });
  }

  // Append current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    if (response.text) {
      return res.json({ reply: response.text });
    }
    throw new Error('No se recibió una respuesta válida de Gemini.');
  } catch (error: any) {
    console.error('Error in AI Assistant endpoint:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar la consulta con Gemini' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
