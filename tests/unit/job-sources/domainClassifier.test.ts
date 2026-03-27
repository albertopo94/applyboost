import { describe, expect, it } from "bun:test";
import { classifyJobSourceDomain } from "../../../src/lib/job-sources/domainClassifier";

describe("domainClassifier", () => {
  it("should classify LinkedIn URLs correctly", () => {
    expect(classifyJobSourceDomain("https://www.linkedin.com/jobs/view/123")).toBe("linkedin");
    expect(classifyJobSourceDomain("https://linkedin.com/jobs/view/123")).toBe("linkedin");
    expect(classifyJobSourceDomain("https://www.linkedin.com/jobs/collections/recommended/?currentJobId=123")).toBe("linkedin");
  });

  it("should classify Indeed URLs correctly", () => {
    expect(classifyJobSourceDomain("https://www.indeed.com/viewjob?jk=123")).toBe("indeed");
    expect(classifyJobSourceDomain("https://it.indeed.com/viewjob?jk=123")).toBe("indeed");
    expect(classifyJobSourceDomain("https://indeed.com/rc/clk?jk=123")).toBe("indeed");
  });

  it("should classify InfoJobs URLs correctly", () => {
    expect(classifyJobSourceDomain("https://www.infojobs.net/madrid/puesto-de-trabajo/of-123")).toBe("infojobs");
    expect(classifyJobSourceDomain("https://www.infojobs.it/milano/puesto-de-trabajo/of-123")).toBe("infojobs");
  });

  it("should classify other URLs as generic", () => {
    expect(classifyJobSourceDomain("https://github.com/jobs/123")).toBe("generic");
    expect(classifyJobSourceDomain("https://google.com")).toBe("generic");
  });

  it("should classify invalid URLs as unknown", () => {
    expect(classifyJobSourceDomain("not-a-url")).toBe("unknown");
    expect(classifyJobSourceDomain("")).toBe("unknown");
  });
});
