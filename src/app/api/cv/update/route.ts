export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { requireOwnership } from "@/lib/auth/auth-utils";

/**
 * API para actualizar el contenido del CV/CL editado por el usuario.
 * Requiere autenticación y propiedad del recurso.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { generation_id, cv_text, cl_text } = body;

    if (!generation_id) {
      return NextResponse.json({ error: "Missing generation_id" }, { status: 400 });
    }

    try {
      // 1. Verificar propiedad y autenticación
      await requireOwnership(generation_id);

      // [POST-MVP]: Habilitar guardado persistente aquí cuando se decida guardar contenido de CVs
      /*
      const supabase = await createClient();
      const { error } = await supabase
        .from("cv_versions")
        .update({
          cv_optimizado: cv_text,
          cover_letter: cl_text,
        })
        .eq("generation_id", generation_id);

      if (error) {
        console.error("[API_CV_UPDATE] Supabase Error:", error);
        return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
      }
      */

      return NextResponse.json({ 
        message: "CV persistence skipped (minimal data policy active)", 
        skipped: true 
      }, { status: 200 });

    } catch (authError: any) {
      if (authError.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (authError.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      throw authError;
    }

  } catch (error) {
    console.error("[API_CV_UPDATE] Fatal Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
