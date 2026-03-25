import { POST } from "./src/app/api/generate/route";
import { NextResponse } from "next/server";

async function testApiGenerate() {
  console.log("Testing /api/generate environment guard...");
  
  // Mock request
  const req = new Request("http://localhost:3000/api/generate", {
    method: "POST",
    body: new FormData()
  });

  // Call the POST handler
  const response = await POST(req);
  const data = await response.json();

  console.log("Response status:", response.status);
  console.log("Response data:", JSON.stringify(data, null, 2));

  if (response.status === 500 && data.error.code === "ENV_ERROR") {
    console.log("✅ Environment guard test passed!");
  } else {
    console.log("❌ Environment guard test failed!");
  }
}

testApiGenerate().catch(console.error);
