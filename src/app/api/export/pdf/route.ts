export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import { parseTextToStructuredCV } from "@/lib/llm/structuredParser";
import { buildModernCvHtml } from "@/lib/render/cvTemplate";
import { requireAuth } from "@/lib/auth/auth-utils";
import { checkPaywall } from "@/lib/auth/paywall";
import puppeteer from "puppeteer";

/**
 * PDF Export API Route (SDD §7.3, §8.4)
 * Method: POST
 * Payload: { text: string, filename: string, templateMode: "simple" | "modern" }
 * Returns: PDF Binary or 401/402/500
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar Autenticación
    const user = await requireAuth();

    // 2. Verificar Paywall
    const paywall = await checkPaywall(user.id);
    if (!paywall.allowed) {
      return NextResponse.json({ 
        error: "PAYWALL: No exports available",
        reason: paywall.reason 
      }, { status: 402 });
    }

    const body = await req.json();
    const templateMode = body.templateMode || "simple";
    const text = body.text;

    if (!text) {
      return NextResponse.json({ error: "Missing text content" }, { status: 400 });
    }
    
    // 3. Generar HTML según el template
    let html = "";

    if (templateMode === "modern") {
      // MAGIC PARSER: Convert plain text to structured JSON using fast LLM
      console.log(`[PDF_EXPORT] Generating MODERN PDF for user ${user.id}...`);
      const structuredData = await parseTextToStructuredCV(text);
      html = buildModernCvHtml(structuredData);
    } else {
      // SIMPLE TEMPLATE (Markdown-ish to HTML)
      console.log(`[PDF_EXPORT] Generating SIMPLE PDF for user ${user.id}...`);
      const formattedHtml = text
        .split('\n')
        .map((line: string) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) return `<h1 style="font-size: 24pt; margin-bottom: 10pt; color: #111; border-bottom: 2px solid #3b82f6; padding-bottom: 5pt;">${trimmed.substring(2)}</h1>`;
          if (trimmed.startsWith('## ')) return `<h2 style="font-size: 18pt; margin-top: 20pt; margin-bottom: 8pt; color: #1e40af; font-weight: bold;">${trimmed.substring(3)}</h2>`;
          if (trimmed.startsWith('### ')) return `<h3 style="font-size: 14pt; margin-top: 15pt; margin-bottom: 5pt; color: #111; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${trimmed.substring(4)}</h3>`;
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return `<li style="margin-bottom: 4pt;">${trimmed.substring(2)}</li>`;
          if (trimmed === "") return '<br/>';
          return `<p style="margin-bottom: 8pt;">${trimmed}</p>`;
        })
        .join('\n')
        .replace(/(<li.*<\/li>)/g, '<ul style="margin-bottom: 10pt;">$1</ul>')
        .replace(/<\/ul>\n<ul.*?>/g, '');

      html = `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
              @page { size: A4; margin: 2.54cm; }
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                color: #1f2937; line-height: 1.6; background: white; font-size: 11pt; margin: 0;
              }
              h1, h2, h3 { font-family: 'Inter', sans-serif; line-height: 1.2; break-after: avoid; }
              p, li { margin: 0; text-align: justify; break-inside: avoid; }
              ul { padding-left: 1.5rem; }
              li { list-style-type: disc; margin-bottom: 4pt; }
              br { content: ""; display: block; margin: 10pt 0; }
            </style>
          </head>
          <body>${formattedHtml}</body>
        </html>`;
    }
      
    // 4. Renderizar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    
    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const buffer = await page.pdf({ 
        format: "A4", 
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      });
      pdfBuffer = Buffer.from(buffer);
    } finally {
      await browser.close();
    }

    // 5. Post-Procesamiento (Consumir crédito y stats)
    const supabase = await createClient();
    
    // Solo descontar si no es suscriptor
    const { data: exportData } = await supabase
      .from("user_exports")
      .select("exports_available, subscription_active")
      .eq("user_id", user.id)
      .single();

    if (exportData && !exportData.subscription_active) {
      await supabase
        .from("user_exports")
        .update({ exports_available: exportData.exports_available - 1 })
        .eq("user_id", user.id);
    }

    await supabase.rpc('increment_platform_stat', { stat_name: 'cvs_downloaded' });

    // 6. Retornar PDF
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.filename || "CV_Optimizado.pdf"}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PDF_EXPORT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
