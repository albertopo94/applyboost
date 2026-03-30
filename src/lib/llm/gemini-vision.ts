import { GeminiKeyManager } from "./gemini-key-manager";
import { loadPrompt } from "../prompt/loader";

/**
 * CV Extraction Result Interface
 * Ensures consistent structured data from Gemini OCR.
 */
export interface CVExtractionResult {
  markdown_content: string; // The full structured CV text in Markdown
  is_cv: boolean; // Validation flag: true if it's a CV, false otherwise
  personal_info: {
    full_name: string;
    email: string;
    phone?: string;
    linkedin?: string;
  };
  visual_metadata?: string[]; // Interpreted data (e.g., skill percentages from bars)
  detected_language: string;
  usedKeyIndex: number; // The index of the Gemini API Key that succeeded
}

/**
 * Gemini Vision Service (Ojo de Dios)
 * 
 * Uses the REST API (v1beta) directly to minimize RAM overhead on the VPS (768MB).
 * Implements strict timeouts and detailed logging (soplones) for observability.
 * Now supports automatic API Key rotation.
 */
export class GeminiVisionService {
  private static readonly MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  private static readonly BASE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GeminiVisionService.MODEL}:generateContent`;

  /**
   * Extracts text and structured data from a file (PDF or Image) using Gemini Multimodal.
   * Automatically rotates through available API keys if Rate Limits (429) occur.
   */
  static async extractTextFromFile(
    buffer: Buffer,
    mimeType: string,
    requestId: string
  ): Promise<CVExtractionResult> {
    const keys = GeminiKeyManager.getKeys();
    if (keys.length === 0) {
      throw new Error("No Gemini API keys are configured (GEMINI_API_KEYS).");
    }

    const payloadSize = (buffer.length / 1024).toFixed(2);
    console.log(`[OCR_START][${requestId}] Multimodal extraction started. Size: ${payloadSize}KB, MIME: ${mimeType}. Available Keys: ${keys.length}`);

    const base64Data = buffer.toString("base64");
    let keysAttempted = 0;
    
    // Iterate through available keys
    for (let i = 0; i < keys.length; i++) {
      // Pre-emptive cooldown check
      if (!GeminiKeyManager.isKeyAvailable(i)) {
        // If it's the ONLY key, we have to try it even if it's in cooldown
        if (keys.length > 1) {
          console.log(`[GEMINI_COOLDOWN][${requestId}] Skipping Key #${i} (exhausted, waiting for reset).`);
          continue;
        }
        console.warn(`[GEMINI_COOLDOWN][${requestId}] Key #${i} is the only one, trying despite cooldown.`);
      }

      const apiKey = keys[i];
      keysAttempted++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`[OCR_TIMEOUT][${requestId}][Key #${i}] Gemini API took too long. Aborting.`);
        controller.abort();
      }, 90000); // 90 seconds per key attempt

      try {
        if (i > 0) {
          console.log(`[OCR_ROTATION][${requestId}] Retrying with Key #${i} due to previous Rate Limit.`);
        }

        const response = await fetch(`${this.BASE_ENDPOINT}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: loadPrompt("ocr_validation.md")
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
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle Rate Limit (429) or Server Overload (503) by continuing the loop
        if (response.status === 429 || response.status === 503) {
          const reason = response.status === 429 ? "Rate Limit" : "Server Overload (503)";
          console.warn(`[OCR_RETRY][${requestId}][Key #${i}] ${reason} reached. Rotating...`);
          GeminiKeyManager.markAsExhausted(i, response.status === 429 ? 60000 : 10000); // 60s for 429, 10s for 503
          continue; // Try next key
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`[OCR_ERROR][${requestId}][Key #${i}] Gemini API returned ${response.status}:`, JSON.stringify(errorData));
          throw new Error(`GEMINI_API_ERROR: ${response.statusText}`);
        }

        const result = await response.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
          throw new Error("GEMINI_API_ERROR: Empty response from Gemini.");
        }

        const parsedResult = JSON.parse(textResponse);
        console.log(`[OCR_SUCCESS][${requestId}][Key #${i}] Extraction completed.`);

        return {
          ...parsedResult,
          usedKeyIndex: i // We return the index so the chat engine can exclude it
        };

      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // If it's a timeout or structural error, we don't necessarily want to rotate 
        // (unless it's a 429 inside the fetch catch, which is rare for native fetch)
        if (error.name === "AbortError") {
          throw new Error("OCR_FAILED_TIMEOUT");
        }

        // If we have more keys and it's a 429 or network glitch, we could continue,
        // but for now we only rotate on explicit 429 status codes.
        if (i === keys.length - 1) {
          console.error(`[OCR_FATAL][${requestId}] All keys exhausted or unexpected error:`, error);
          throw error;
        }
      }
    }

    if (keysAttempted === 0) {
      throw new Error("OCR_FAILED_QUOTA");
    }

    throw new Error("OCR_FAILED_QUOTA");
  }
}
