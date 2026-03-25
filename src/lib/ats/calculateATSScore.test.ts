import { describe, it, expect } from "bun:test";
import { normalizeScoreText, calculateATSScore } from "./calculateATSScore";

describe("ATS Score Calculator", () => {
  it("normalizes text correctly (removes accents, lowercase)", () => {
    const raw = "Hábílídádës y EXPeriencía";
    const expected = "habilidades y experiencia";
    expect(normalizeScoreText(raw)).toBe(expected);
  });

  it("calculates 0 if no keywords or text", () => {
    expect(calculateATSScore("", ["React"])).toBe(0);
    expect(calculateATSScore("I know React", [])).toBe(0);
  });

  it("assigns 1.5x weight for keywords in the summary/top zone", () => {
    // total chars < 500, so "React" is in the summary zone.
    const cvText = "Soy un desarrollador con 5 años de experiencia. Trabajo con React y Node.js todos los días.";
    const keywords = ["React", "Node.js", "Docker"];
    
    // Max possible score = 3 * 1.5 = 4.5
    // "React" found in top zone (1.5)
    // "Node.js" found in top zone (1.5)
    // "Docker" not found (0)
    // Raw total = 3.0. Percentage = (3.0 / 4.5) * 100 = 66.66% -> 67
    
    const score = calculateATSScore(cvText, keywords);
    expect(score).toBe(67);
  });

  it("assigns 1.0 weight for keywords outside critical zones", () => {
    // Create a long text to push the keyword out of the first 500 chars 
    // and avoid any explicit "skills" headers.
    const filler = "texto de relleno ".repeat(50); // ~850 chars
    const cvText = filler + " Además, he usado React en algunos proyectos viejos.";
    
    const keywords = ["React"];
    // Max possible score = 1 * 1.5 = 1.5
    // "React" found in standard zone (1.0)
    // Raw total = 1.0. Percentage = (1.0 / 1.5) * 100 = 66.66% -> 67

    const score = calculateATSScore(cvText, keywords);
    expect(score).toBe(67);
  });

  it("caps score at exactly 100", () => {
    const cvText = "Habilidades: React, Node.js, Docker, Kubernetes.";
    const keywords = ["React", "Node.js", "Docker", "Kubernetes"];
    
    // Everything found in skills zone. Total 1.5 * 4 = 6.0
    // Max possible = 6.0. Percentage = 100
    const score = calculateATSScore(cvText, keywords);
    expect(score).toBe(100);
  });
});
