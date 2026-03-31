import puppeteer, { Browser } from "puppeteer";

/**
 * Browser Manager: Singleton Pattern for Puppeteer
 * SDD §7.3: Keeps a single Chromium instance warm to save RAM and CPU on the VPS.
 * Optimized for Dokploy/Linux environments.
 */
let browserInstance: Browser | null = null;
let isInitializing = false;

export async function getBrowser(): Promise<Browser> {
  // 1. If instance exists and is still connected, return it
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  // 2. Prevent multiple simultaneous initializations
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (browserInstance && browserInstance.connected) return browserInstance;
  }

  // 3. Launch a new instance with optimized flags for VPS
  isInitializing = true;
  try {
    console.log("[BrowserManager] Launching new Chromium instance...");
    
    browserInstance = await puppeteer.launch({
      headless: true,
      // Force path from Dockerfile to avoid "WS endpoint" timeouts
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      timeout: 60000, // Increase to 60s for slow VPS starts
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });

    browserInstance.on("disconnected", () => {
      console.warn("[BrowserManager] Browser disconnected. Clearing instance.");
      browserInstance = null;
    });

    console.log("[BrowserManager] Chromium instance ready.");
    return browserInstance;
  } catch (error) {
    console.error("[BrowserManager] Failed to launch browser:", error);
    isInitializing = false;
    throw error;
  } finally {
    isInitializing = false;
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
