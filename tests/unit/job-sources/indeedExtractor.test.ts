import { describe, it, expect, spyOn } from "bun:test";
import { extractViaMarkdownNew } from "../../../src/lib/job-sources/extractors/indeedExtractor";

describe("indeedExtractor - extractViaMarkdownNew", () => {
  it("should send method: 'browser' in the POST body to markdown.new", async () => {
    // Mock fetch globally for this test
    const fetchSpy = spyOn(global, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ markdown: "Successful extraction with enough length for quality check to pass the 250 character limit if needed, but here we just want to verify the body of the request sent to the API." }), {
        status: 200,
        headers: { "x-rate-limit-remaining": "499" }
      });
    });

    const input = { url: "https://it.indeed.com/viewjob?jk=7ea8efcca3b19565", requestId: "test-id" };
    
    await extractViaMarkdownNew(input);

    // Verify the body of the first call to fetch
    const lastCall = fetchSpy.mock.calls[0];
    const body = JSON.parse(lastCall[1].body as string);

    // This expectation should FAIL with current code
    expect(body).toHaveProperty("method", "browser");
    
    fetchSpy.mockRestore();
  });

  it("should return status 'ok' when content quality is good (> 250 chars)", async () => {
    const longMarkdown = "A".repeat(300);
    const fetchSpy = spyOn(global, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ markdown: longMarkdown }), {
        status: 200,
        headers: { "x-rate-limit-remaining": "499" }
      });
    });

    const input = { url: "https://example.com/job", requestId: "test-ok" };
    const result = await extractViaMarkdownNew(input);

    expect(result.status).toBe("ok");
    expect(result.text).toBe(longMarkdown);
    
    fetchSpy.mockRestore();
  });

  it("should return status 'unreadable' when content quality is bad (< 250 chars)", async () => {
    const shortMarkdown = "Short content";
    const fetchSpy = spyOn(global, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ markdown: shortMarkdown }), {
        status: 200,
        headers: { "x-rate-limit-remaining": "499" }
      });
    });

    const input = { url: "https://example.com/job", requestId: "test-bad" };
    const result = await extractViaMarkdownNew(input);

    expect(result.status).toBe("unreadable");
    
    fetchSpy.mockRestore();
  });
});
