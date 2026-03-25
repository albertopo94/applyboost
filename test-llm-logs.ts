
import { callLLM } from "./src/lib/llm";
import { LLMOutputSchema } from "./src/lib/llm/types";

async function main() {
  console.log("=== Testing callLLM directly with Bun ===");
  const prompt = "Generate a JSON with: cv_optimizado (string > 100 chars), cover_letter (string > 50 chars), cover_letter_explanation (string > 20 chars), diff (array of 1 object with cambio, motivo, impacto), and keywords (array of 5 strings). Return ONLY JSON.";
  
  try {
    const result = await callLLM(prompt);
    console.log("SUCCESS: Result received from callLLM");
  } catch (err) {
    console.error("ERROR in callLLM:", err);
  }
}

main();
