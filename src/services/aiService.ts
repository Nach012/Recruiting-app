import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Candidate } from '../types';

// 1. Configuración de la API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Cadena de modelos actuales (Google Gemini 3.x Flash).
// Google recomienda expresamente gemini-3.6-flash en su mensaje de respuesta.
const MODEL_CHAIN = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

// 2. Instrucciones de Sistema (Lógica de Negocio Estricta - Analista de Datos)
const SYSTEM_INSTRUCTION = `
Eres un Analista de Datos de Selección de Personal en Conectō Recruiting. Tu función es extraer datos precisos y neutrales de currículums.

REGLAS DE ORO (PROTOCOLO ANTIGRAVITY):
1. Tono neutral y descriptivo en todo momento.
2. PROHIBICIÓN TOTAL DE ADJETIVOS Y ETIQUETAS SUBJETIVAS: No uses palabras como "Experto", "Especialista", "Senior", "Líder", "Excelente", "Capacidad" ni adjetivos similares. Describe solo hitos o tareas técnicas concretas.
3. EVIDENCIA DIRECTA: Si el currículum no menciona un dato específico para un campo, devuelve null o "". No supongas ni inventes información.
4. aiSummary: Máximo 3 oraciones estrictamente descriptivas. Sin adjetivos de juicio. Ejemplo esperado: "Trayectoria de 8 años en el sector contable. Realizó conciliaciones bancarias y cierres mensuales en SAP FI/CO. Maneja normas IFRS."

FORMATO DE SALIDA (JSON):
Devuelve EXCLUSIVAMENTE un objeto JSON válido. No incluyas explicaciones ni bloques de código markdown. La estructura DEBE ser:
{
  "name": string,
  "email": string,
  "phone": string,
  "linkedin": string,
  "location": string,
  "documentId": string,
  "education": [
    { "degree": string, "institution": string, "years": string }
  ],
  "experienceYears": number,
  "skills": string[],
  "aiSummary": string
}
`;

/**
 * Espera N milisegundos (helper para backoff).
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Intenta analizar el CV con un modelo específico.
 * Reintenta hasta 2 veces con espera exponencial ante errores 503/429.
 */
async function tryWithModel(modelName: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION
  });

  const MAX_RETRIES = 2;
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      return result.response.text();
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || "";
      const isRetryable = msg.includes("503") || msg.includes("high demand") || msg.includes("overloaded");
      
      if (isRetryable && attempt < MAX_RETRIES) {
        const waitMs = 1500 * (attempt + 1); // 1.5s, luego 3s
        console.warn(`[AI] Modelo ${modelName} con alta demanda. Reintentando en ${waitMs}ms... (intento ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(waitMs);
        continue;
      }
      
      throw lastError;
    }
  }

  throw lastError;
}

/**
 * Analiza el texto del CV usando la cadena de modelos estables GA de Gemini.
 * Extrae los datos del candidato siguiendo los protocolos de evidencia y neutralidad.
 */
export async function simulateCVAnalysis(
  pdfText: string
): Promise<Partial<Candidate>> {
  if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY no encontrada en .env");
    throw new Error("API Key missing");
  }

  const prompt = `Analiza este currículum y extrae la información requerida siguiendo estrictamente las reglas del sistema:\n\n${pdfText}`;

  let lastError: any;

  // Intentar con cada modelo en la cadena hasta obtener respuesta
  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`[AI] Analizando CV con modelo: ${modelName}`);
      const responseText = await tryWithModel(modelName, prompt);

      // Limpieza de seguridad (limpia bloques de markdown si los hubiera)
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson);

      // Mapeo final a la interfaz Candidate
      return {
        name: data.name || 'Candidato sin nombre',
        email: data.email || '',
        phone: data.phone || '',
        documentId: data.documentId || '',
        location: data.location || '',
        links: {
          linkedin: data.linkedin || '',
        },
        experience: `${data.experienceYears || 0} años`,
        education: (data.education || []).map((edu: any) => ({
          degree: edu.degree || '',
          institution: edu.institution || '',
          period: edu.years || '—'
        })),
        aiSummary: data.aiSummary || '',
        expectedSalary: '',
        interviewNotes: '',
        tags: data.skills || [],
        status: "PRESELECCIONADOS"
      };

    } catch (error: any) {
      lastError = error;
      const msg = error?.message || "";
      const isModelUnavailable = 
        msg.includes("503") || 
        msg.includes("high demand") || 
        msg.includes("overloaded") || 
        msg.includes("404") || 
        msg.includes("no longer available") || 
        msg.includes("not found");
      
      if (isModelUnavailable) {
        console.warn(`[AI] Modelo ${modelName} no disponible o no encontrado. Pasando al siguiente en la cadena...`);
        continue; // Probar con el siguiente modelo de la cadena
      }

      // Para errores de cuota (429) o errores críticos, no seguir intentando
      if (msg.includes("429") || msg.includes("quota")) {
        throw new Error("Límite de cuota excedido en Gemini. Por favor, reintentá en un minuto.");
      }

      // Error desconocido: detener
      break;
    }
  }

  console.error("[AI] Todos los modelos fallaron:", lastError);
  throw new Error("El servicio de IA no está disponible en este momento. Por favor, reintentá en unos segundos.");
}