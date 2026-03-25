import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

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
 * Extracts raw text from a PDF Buffer.
 * Relies on pdf-parse (v2.4.5 fork with class syntax).
 */
export async function parsePdfToText(buffer: Buffer): Promise<string> {
  let parser: PDFParse | null = null;
  try {
    // In this environment (Bun + Next.js 15), the class syntax is the stable one
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    
    if (!result || !result.text) {
      throw new Error("CV_PARSE_ERROR: PDF parser returned empty result.");
    }

    return validateExtractedText(result.text);
  } catch (error: any) {
    console.error("[parsePdfToText] Error details:", error);
    
    // Already wrapped in our custom error
    if (error instanceof Error && error.message.includes("CV_PARSE_ERROR")) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`CV_PARSE_ERROR: Failed to parse PDF file. ${errorMessage}`);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (err) {
        // Non-fatal, just log it
        console.warn("[parsePdfToText] Error destroying parser:", err);
      }
    }
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
 */
export async function parseCV(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return parsePdfToText(buffer);
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return parseDocxToText(buffer);
  }

  if (mimeType === "text/plain") {
    return validateExtractedText(buffer.toString("utf-8"));
  }

  throw new Error("CV_PARSE_ERROR: Unsupported file format.");
}
