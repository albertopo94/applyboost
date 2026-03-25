import puppeteer from "puppeteer";
import { buildCvHtml } from "./cvTemplate";
import type { CVDataObject } from "@/lib/llm/types";

/**
 * Document Engine: Core PDF Generator
 * SDD §7.3: Renders CV locally using Native Puppeteer (designed for VPS deployment context, avoids lambda restrictions).
 */
export async function generatePDF(cvData: CVDataObject): Promise<Buffer> {
  // 1. Compile the HTML strictly locally
  const htmlContent = buildCvHtml(cvData);

  // 2. Launch Puppeteer (in a headless vps environment)
  // We add standard flags for linux environments like dokploy
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    
    // Inject HTML. Wait until DOM is fully registered, omitting external resources.
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

    // 3. Generate PDF pixel-perfect (A4, no margins on body since CSS has them)
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
  } finally {
    // 4. Always close the browser, preventing zombie process memory leaks on the VPS
    await browser.close();
  }
}
