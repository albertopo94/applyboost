import { describe, expect, it, mock } from "bun:test";
import { extractIndeed } from "../../../src/lib/job-sources/extractors/indeedExtractor";

describe("indeedExtractor", () => {
  it("should handle extraction successfully when Indeed returns HTML", async () => {
    // Mocking global fetch for this test
    const originalFetch = global.fetch;
    global.fetch = mock(async () => ({
      ok: true,
      status: 200,
      text: async () => `
        <html>
          <body>
            <div id="jobDescriptionText">
              Indeed Job Signal: React Developer Role. 
              This is a long enough description to pass the minimum length requirement of 200 characters. 
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </div>
          </body>
        </html>
      `
    })) as any;

    const result = await extractIndeed({ url: "https://it.indeed.com/viewjob?jk=123", requestId: "test-indeed-ok" });
    
    expect(result.status).toBe("ok");
    expect(result.text).toContain("Indeed Job Signal");
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.domain).toBe("indeed");
    expect(result.strategyPath).toBe("B_ok");

    global.fetch = originalFetch;
  });

  it("should handle blocked status (403)", async () => {
    const originalFetch = global.fetch;
    global.fetch = mock(async () => ({
      ok: false,
      status: 403
    })) as any;

    const result = await extractIndeed({ url: "https://it.indeed.com/viewjob?jk=123", requestId: "test-indeed-blocked" });
    
    expect(result.status).toBe("blocked");
    expect(result.sourceHttpStatus).toBe(403);
    
    global.fetch = originalFetch;
  });

  it("should handle unreadable status when text is too short", async () => {
    const originalFetch = global.fetch;
    global.fetch = mock(async () => ({
      ok: true,
      status: 200,
      text: async () => "<html><body>Too short</body></html>"
    })) as any;

    const result = await extractIndeed({ url: "https://it.indeed.com/viewjob?jk=123", requestId: "test-indeed-short" });
    
    expect(result.status).toBe("unreadable");
    expect(result.confidence).toBe(0.1);
    
    global.fetch = originalFetch;
  });
});
