import { describe, it, expect } from "bun:test";
import { normalizeJobDescription } from "./jobParser";

describe("Job Parser (Text Normalization)", () => {
  it("removes excessive whitespace and collapses newlines", () => {
    const messyText = `
      Backend Engineer
      
      
      We are looking for   a        skilled engineer.
    `;
    const clean = normalizeJobDescription(messyText);
    expect(clean).toBe("Backend Engineer We are looking for a skilled engineer.");
  });

  it("throws JOB_TEXT_TOO_SHORT if normalized text is under 50 chars", () => {
    const shortText = "We need a dev. Apply now.";
    expect(() => normalizeJobDescription(shortText)).toThrow("JOB_TEXT_TOO_SHORT");
  });

  it("passes text that meets 50 chars after normalization", () => {
    const longText = "We need a developer who knows what they are doing. Join our team today and build cool stuff.";
    expect(() => normalizeJobDescription(longText)).not.toThrow();
    expect(normalizeJobDescription(longText)).toBe(longText);
  });
});
