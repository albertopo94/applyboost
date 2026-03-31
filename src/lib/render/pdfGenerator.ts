import { getBrowser } from "./browserManager";
import { buildCvHtml } from "./cvTemplate";
import type { CVDataObject } from "@/lib/llm/types";

/**
 * Document Engine: Core PDF Generator
 * SDD §7.3: Renders CV locally using Native Puppeteer.
 * Optimized with Singleton Browser instance for VPS context.
 */
export async function generatePDF(cvData: CVDataObject): Promise<Buffer> {
  // 1. Compile the HTML strictly locally
  const htmlContent = buildCvHtml(cvData);

  // 2. Access the shared browser instance from the Manager
  const browser = await getBrowser();

  let page;
  try {
    // 3. Create a NEW PAGE (isolated tab), much lighter than a NEW BROWSER
    page = await browser.newPage();
    
    // Inject HTML. Wait until DOM is fully registered.
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

    // 4. Generate PDF pixel-perfect (A4)
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("[pdfGenerator] Error generating PDF:", error);
    throw error;
  } finally {
    // 5. IMPORTANT: ALWAYS CLOSE THE PAGE (TAB), NEVER THE BROWSER
    if (page) {
      await page.close();
    }
  }
}
