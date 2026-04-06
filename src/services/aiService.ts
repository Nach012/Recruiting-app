import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Candidate } from '../types';

// 1. Configuración de la API (Consolidado: gemini-3-flash-preview)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

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
 * Analiza el texto del CV usando directamente el motor consolidado: gemini-3-flash-preview.
 * Extrae los datos del candidato siguiendo los protocolos de evidencia y neutralidad.
 */
export async function simulateCVAnalysis(
  pdfText: string
): Promise<Partial<Candidate>> {
  if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY no encontrada en .env");
    throw new Error("API Key missing");
  }

  try {
    // Motor consolidado para este entorno: gemini-3-flash-preview
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const prompt = `Analiza este currículum y extrae la información requerida siguiendo estrictamente las reglas del sistema:\n\n${pdfText}`;

    // Generación de contenido con parámetros de respuesta JSON
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    
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
      expectedSalary: '', // Entrada manual del reclutador
      interviewNotes: '',
      tags: data.skills || [],
      status: "PRESELECCIONADOS" // Estado inicial por defecto para el pipeline con sync case-sensitive
    };

  } catch (error: any) {
    const errorMsg = error?.message || "";
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      throw new Error("Límite de cuota excedido en Gemini. Por favor, reintenta en un minuto o contacta a soporte técnico.");
    }
    
    console.error("Gemini 3 Flash Preview Analysis Error:", error);
    throw new Error("El modelo de IA no respondió adecuadamente. Revisa tu conexión o el estado de la API.");
  }
}