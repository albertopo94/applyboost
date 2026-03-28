/**
 * CV Extraction Result Interface
 * Ensures consistent structured data from Gemini OCR.
 */
export interface CVExtractionResult {
  markdown_content: string; // The full structured CV text in Markdown
  personal_info: {
    full_name: string;
    email: string;
    phone?: string;
    linkedin?: string;
  };
  visual_metadata?: string[]; // Interpreted data (e.g., skill percentages from bars)
  detected_language: string;
}

/**
 * Gemini Vision Service (Ojo de Dios)
 * 
 * Uses the REST API (v1beta) directly to minimize RAM overhead on the VPS (768MB).
 * Implements strict timeouts and detailed logging (soplones) for observability.
 */
export class GeminiVisionService {
  private static readonly API_KEY = process.env.GEMINI_API_KEY;
  private static readonly MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  private static readonly ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GeminiVisionService.MODEL}:generateContent`;

  /**
   * Extracts text and structured data from a file (PDF or Image) using Gemini Multimodal.
   */
  static async extractTextFromFile(
    buffer: Buffer,
    mimeType: string,
    requestId: string
  ): Promise<CVExtractionResult> {
    if (!this.API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const payloadSize = (buffer.length / 1024).toFixed(2);
    console.log(`[OCR_START][${requestId}] Multimodal extraction started. Size: ${payloadSize}KB, MIME: ${mimeType}`);

    // Base64 conversion
    const base64Data = buffer.toString("base64");
    
    // Strict 25s timeout to prevent infinite hangs in Dokploy/VPS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[OCR_TIMEOUT][${requestId}] Gemini API took more than 25s. Aborting.`);
      controller.abort();
    }, 25000);

    try {
      const response = await fetch(`${this.ENDPOINT}?key=${this.API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Actuá como un experto en OCR y reclutamiento. Transcribí este CV a Markdown estructurado. 
                  Respetá la jerarquía de títulos, las listas de viñetas y las tablas. 
                  Si hay secciones en columnas, ordenalas lógicamente. 
                  No resumas, transcribí palabra por palabra.
                  Interpretá elementos visuales como barras de progreso o niveles de idiomas en porcentajes o categorías claras.
                  
                  IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido siguiendo este esquema:
                  {
                    "markdown_content": "contenido en markdown",
                    "personal_info": { "full_name": "...", "email": "...", "phone": "..." },
                    "visual_metadata": ["interpretación visual 1", "..."],
                    "detected_language": "idioma detectado"
                  }`
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1, // Low temperature for higher fidelity in OCR
            responseMimeType: "application/json"
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[OCR_ERROR][${requestId}] Gemini API returned ${response.status}:`, JSON.stringify(errorData));
        throw new Error(`GEMINI_API_ERROR: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[OCR_SUCCESS][${requestId}] Extraction completed successfully.`);

      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error("GEMINI_API_ERROR: Empty response from Gemini.");
      }

      return JSON.parse(textResponse) as CVExtractionResult;

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        throw new Error("OCR_FAILED_TIMEOUT: El procesamiento del archivo tardó demasiado tiempo.");
      }

      console.error(`[OCR_FATAL][${requestId}] Unexpected error during extraction:`, error);
      throw error;
    }
  }
}
