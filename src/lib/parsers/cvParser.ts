import mammoth from "mammoth";
import { GeminiVisionService } from "@/lib/llm/gemini-vision";

/**
 * Validates if the extracted text meets the minimum requirements.
 * SDD §7.1: Text < 50 chars is considered an unparseable CV.
 */
function validateExtractedText(text: string): string {
  const clean = text.trim();
  if (clean.length < 50) {
    throw new Error("CV_PARSE_ERROR: Extracted text is too short or empty.");
  }
  return clean;
}

/**
 * Result of CV Parsing
 */
export interface CVParseResult {
  text: string;
  usedKeyIndex: number; // -1 if no Gemini key was used (e.g., DOCX or Plain Text)
}

/**
 * Extracts raw text from a PDF or Image using Gemini Vision (Ojo de Dios).
 */
export async function parseWithGemini(
  buffer: Buffer, 
  mimeType: string, 
  requestId: string
): Promise<CVParseResult> {
  try {
    const result = await GeminiVisionService.extractTextFromFile(buffer, mimeType, requestId);
    
    if (!result.is_cv) {
      console.warn(`[parseWithGemini][${requestId}] Validation failed: Document is NOT a CV.`);
      throw new Error("INVALID_CV_CONTENT");
    }

    if (!result || !result.markdown_content) {
      throw new Error("CV_PARSE_ERROR: Gemini returned empty extraction.");
    }

    // We combine markdown content with visual metadata (e.g. skill levels) 
    // to give the optimizer more context.
    let enrichedText = result.markdown_content;
    if (result.visual_metadata && result.visual_metadata.length > 0) {
      enrichedText += "\n\n### Visual Metadata (Interpreted Levels)\n" + result.visual_metadata.join("\n");
    }

    return {
      text: validateExtractedText(enrichedText),
      usedKeyIndex: result.usedKeyIndex
    };
  } catch (error: any) {
    // Propagate specific OCR errors
    if (error.message.includes("OCR_FAILED_TIMEOUT") || error.message.includes("OCR_FAILED_QUOTA")) {
      throw error;
    }
    
    console.error(`[parseWithGemini][${requestId}] Error:`, error);
    throw new Error(`CV_PARSE_ERROR: Failed to extract content using Multimodal AI.`);
  }
}

/**
 * Extracts raw text from a DOC/DOCX Buffer.
 * Relies on mammoth. Note: mammoth only supports .docx officially.
 */
export async function parseDocxToText(buffer: Buffer): Promise<string> {
  try {
    // mammoth extracts raw text, ignoring styles
    const result = await mammoth.extractRawText({ buffer });
    return validateExtractedText(result.value);
  } catch (error) {
    if (error instanceof Error && error.message.includes("CV_PARSE_ERROR")) {
      throw error;
    }
    throw new Error("CV_PARSE_ERROR: Failed to parse DOCX file.");
  }
}

/**
 * Orchestrator for CV parsing based on file type.
 * SDD: Bifurcates between local parsing (Mammoth) and AI-based OCR (Gemini Vision).
 */
export async function parseCV(
  buffer: Buffer, 
  mimeType: string, 
  requestId: string = "unknown"
): Promise<CVParseResult> {
  // 1. DOCX Path (Mammoth - Local, instant, free)
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const text = await parseDocxToText(buffer);
    return { text, usedKeyIndex: -1 };
  }

  // 2. Multimodal Path (PDF, JPG, PNG via Gemini Vision)
  if (
    mimeType === "application/pdf" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp"
  ) {
    return parseWithGemini(buffer, mimeType, requestId);
  }

  // 3. Plain Text Path
  if (mimeType === "text/plain") {
    const text = validateExtractedText(buffer.toString("utf-8"));
    return { text, usedKeyIndex: -1 };
  }

  throw new Error(`CV_PARSE_ERROR: Unsupported file format (${mimeType}).`);
}
