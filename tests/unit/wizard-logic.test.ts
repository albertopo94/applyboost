import { describe, expect, it } from "bun:test";
import { getWizardInputStates } from "@/lib/utils/wizard-logic";

describe("Wizard Input Exclusivity Logic", () => {
  describe("CV Inputs", () => {
    it("should disable text input when a file is provided", () => {
      const mockFile = new File([""], "cv.pdf");
      const states = getWizardInputStates({
        cvFile: mockFile,
        cvText: "",
        jobUrl: "",
        jobText: ""
      });
      expect(states.isCvTextDisabled).toBe(true);
      expect(states.isCvFileDisabled).toBe(false);
    });

    it("should disable file input when text is provided", () => {
      const states = getWizardInputStates({
        cvFile: null,
        cvText: "My experience...",
        jobUrl: "",
        jobText: ""
      });
      expect(states.isCvFileDisabled).toBe(true);
      expect(states.isCvTextDisabled).toBe(false);
    });

    it("should enable both when both are empty", () => {
      const states = getWizardInputStates({
        cvFile: null,
        cvText: "",
        jobUrl: "",
        jobText: ""
      });
      expect(states.isCvFileDisabled).toBe(false);
      expect(states.isCvTextDisabled).toBe(false);
    });
  });

  describe("Job Inputs", () => {
    it("should disable job description when a URL is provided", () => {
      const states = getWizardInputStates({
        cvFile: null,
        cvText: "",
        jobUrl: "https://linkedin.com/jobs/123",
        jobText: ""
      });
      expect(states.isJobTextDisabled).toBe(true);
      expect(states.isJobUrlDisabled).toBe(false);
    });

    it("should disable job URL when description text is provided", () => {
      const states = getWizardInputStates({
        cvFile: null,
        cvText: "",
        jobUrl: "",
        jobText: "Looking for a senior architect..."
      });
      expect(states.isJobUrlDisabled).toBe(true);
      expect(states.isJobTextDisabled).toBe(false);
    });

    it("should enable both when both are empty", () => {
      const states = getWizardInputStates({
        cvFile: null,
        cvText: "",
        jobUrl: "",
        jobText: ""
      });
      expect(states.isJobUrlDisabled).toBe(false);
      expect(states.isJobTextDisabled).toBe(false);
    });
  });
});
