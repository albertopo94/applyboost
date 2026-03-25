import fs from "fs";
import path from "path";
import { parseCV } from "../src/lib/parsers/cvParser";

/**
 * PDF Extraction Debug Script
 * Usage: bun scripts/debug-pdf-extraction.ts <path-to-pdf>
 */
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: bun scripts/debug-pdf-extraction.ts <path-to-pdf>");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found at ${absolutePath}`);
    process.exit(1);
  }

  console.log(`\n🔍 Debugging PDF Extraction for: ${path.basename(filePath)}`);
  console.log(`---------------------------------------------------------`);

  try {
    const buffer = fs.readFileSync(absolutePath);
    const mimeType = "application/pdf";
    
    const startTime = performance.now();
    const extractedText = await parseCV(buffer, mimeType);
    const endTime = performance.now();

    console.log(`✅ Extraction successful in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📏 Text length: ${extractedText.length} characters`);
    console.log(`\n--- EXTRACTED TEXT PREVIEW (First 500 chars) ---\n`);
    console.log(extractedText.slice(0, 500));
    console.log(`\n--- END OF PREVIEW ---\n`);

    // Save to a .txt file for manual inspection
    const outputDir = path.join(process.cwd(), "tests/outputs/cvs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFileName = `${path.basename(filePath, ".pdf")}-extracted.txt`;
    const outputPath = path.join(outputDir, outputFileName);
    fs.writeFileSync(outputPath, extractedText, "utf-8");

    console.log(`💾 Full extracted text saved to: ${outputPath}`);
    console.log(`\n👉 Open this file and check for structural issues (e.g. mixed columns, broken tables).`);

  } catch (error: any) {
    console.error(`❌ FAILED to extract text: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

main();