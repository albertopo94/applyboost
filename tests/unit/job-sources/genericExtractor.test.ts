import { describe, it, expect, spyOn, jest } from "bun:test";
import { extractGeneric } from "../../../src/lib/job-sources/extractors/genericExtractor";
import * as indeedExtractor from "../../../src/lib/job-sources/extractors/indeedExtractor";

describe("genericExtractor - extractGeneric (Tiered Strategy)", () => {
  it("should attempt markdown.new (Tier 1) FIRST and return it on success", async () => {
    // Mock Tier 1 success
    const mockResult = {
      status: "ok",
      text: "Markdown content from Tier 1",
      domain: "generic",
      extractor: "markdown-v3",
      confidence: 0.95,
      strategyPath: "B_fail_C_ok"
    };
    
    const t1Spy = spyOn(indeedExtractor, "extractViaMarkdownNew").mockResolvedValue(mockResult as any);
    
    // Mock fetch to ensure Tier 2 is NOT called
    const fetchSpy = spyOn(global, "fetch");

    const input = { url: "https://example.com/job", requestId: "test-id" };
    const result = await extractGeneric(input);

    expect(t1Spy).toHaveBeenCalled();
    expect(result.text).toBe("Markdown content from Tier 1");
    
    // Tier 2 (fetch local) should NOT have been called
    expect(fetchSpy).not.toHaveBeenCalled();

    t1Spy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("should fallback to Cheerio (Tier 2) when markdown.new (Tier 1) fails", async () => {
    // Mock Tier 1 Failure
    const t1Spy = spyOn(indeedExtractor, "extractViaMarkdownNew").mockResolvedValue({
      status: "unreadable",
      domain: "generic",
      extractor: "markdown-v3",
      confidence: 0.1,
      strategyPath: "B_fail_C_fail_A"
    } as any);

    // Mock Tier 2 (fetch local) success with enough content
    const fetchSpy = spyOn(global, "fetch").mockImplementation(async () => {
      const longContent = "Job Title. ".repeat(10) + "This is a very detailed job description from Cheerio fallback that needs to be longer than 250 characters to pass the quality check implemented in the generic extractor logic. ".repeat(5);
      return new Response(`<html><body><h1>Job Title</h1><p>${longContent}</p></body></html>`, {
        status: 200
      });
    });

    const input = { url: "https://example.com/job", requestId: "test-fallback" };
    const result = await extractGeneric(input);

    expect(t1Spy).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
    expect(result.extractor).toBe("generic-t2-cheerio");
    expect(result.text).toContain("Job Title");
    expect(result.text).toContain("job description");

    t1Spy.mockRestore();
    fetchSpy.mockRestore();
  });
});
