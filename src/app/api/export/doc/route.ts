export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { generateDOCX } from "@/lib/render/docGenerator";
import type { CVDataObject } from "@/lib/llm/types";

/**
 * DOCX Export API Route (SDD §7.4, §8.5)
 * Method: POST
 * Payload: CVDataObject (JSON)
 * Security: Requires auth JWT + exports_available > 0
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch CV Payload
    const cvData = (await req.json()) as CVDataObject;
    if (!cvData || !cvData.name) {
      return NextResponse.json({ error: "Missing CV data payload" }, { status: 400 });
    }

    // 3. Verify Export Balance (Paywall block)
    const { data: exportData, error: dbError } = await supabase
      .from("user_exports")
      .select("exports_available, subscription_active")
      .eq("user_id", user.id)
      .single();

    if (dbError || !exportData) {
      return NextResponse.json({ error: "Internal db error" }, { status: 500 });
    }

    if (!exportData.subscription_active && exportData.exports_available <= 0) {
      return NextResponse.json({ error: "PAYWALL: No exports available" }, { status: 402 });
    }

    // 4. Document Engine: Generate Docx
    const docBuffer = await generateDOCX(cvData);

    // 5. Decrement export balance (skip if unlimited sub)
    if (!exportData.subscription_active) {
      const newBalance = exportData.exports_available - 1;
      await supabase
        .from("user_exports")
        .update({ exports_available: newBalance })
        .eq("user_id", user.id);
    }

    // 6. Return raw binary buffer with correct Content-Type (docx)
    return new NextResponse(docBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="CV_${cvData.name.replace(/\s+/g, "_")}.docx"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error) {
    console.error("[DOCX_EXPORT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error during DOCX generation" },
      { status: 500 }
    );
  }
}
