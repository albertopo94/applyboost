import { GroqService } from "../src/lib/llm/groq";
import { CerebrasService } from "../src/lib/llm/cerebras";
import { GeminiService } from "../src/lib/llm/gemini";
import { OpenRouterService } from "../src/lib/llm/openrouter";

/**
 * HEALTH DIAGNOSTIC FOR LLM PROVIDERS
 * Runs each service and reports status, timing, and error details.
 */

function mask(key: string | undefined) {
  if (!key) return "MISSING";
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function testService(service: any) {
  const start = performance.now();
  console.log(`\n[${service.name.toUpperCase()}] Testing...`);
  
  // Log config (internal properties)
  const apiKey = (service as any).apiKey;
  const model = (service as any).model;
  console.log(`[${service.name.toUpperCase()}] Config: Model=${model}, APIKey=${mask(apiKey)}`);

  try {
    const response = await service.chat("Return JSON: {\"status\": \"ok\"}");
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.log(`[${service.name.toUpperCase()}] ✅ OK (${duration}ms)`);
    // console.log(`[${service.name.toUpperCase()}] Response: ${response.trim()}`);
    
    return {
      name: service.name,
      status: "ok",
      duration,
      response
    };
  } catch (err: any) {
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.error(`[${service.name.toUpperCase()}] ❌ FAILED (${duration}ms)`);
    console.error(`[${service.name.toUpperCase()}] Error: ${err.message}`);
    
    return {
      name: service.name,
      status: "error",
      duration,
      error: err.message
    };
  }
}

async function run() {
  console.log("=== LLM PROVIDER HEALTH CHECK ===");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("---------------------------------");

  const services = [
    new GroqService(),
    new CerebrasService(),
    new GeminiService(),
    new OpenRouterService()
  ];

  const results = [];
  for (const service of services) {
    results.push(await testService(service));
  }

  console.log("\n---------------------------------");
  console.log("SUMMARY REPORT:");
  results.forEach(r => {
    const status = r.status === "ok" ? "✅" : "❌";
    console.log(`${status} ${r.name.padEnd(12)}: ${r.status === "ok" ? r.duration + "ms" : r.error}`);
  });
  console.log("---------------------------------");
}

run().catch(console.error);
