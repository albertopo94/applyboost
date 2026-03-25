import type { CVDataObject } from "@/lib/llm/types";
import { modernTemplate } from "./templates/modern";

/**
 * Basic security html escape for injections
 */
function escapeHtml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * MODERN 2-COLUMN PDF TEMPLATE ORCHESTRATOR
 * Separates data logic from presentation.
 */
export function buildModernCvHtml(cv: CVDataObject): string {
  const renderContact = () => {
    let html = "";
    if (cv.contact.email) html += `<div class="contact-item"><strong>Email:</strong><br/>${escapeHtml(cv.contact.email)}</div>`;
    if (cv.contact.phone) html += `<div class="contact-item"><strong>Teléfono:</strong><br/>${escapeHtml(cv.contact.phone)}</div>`;
    if (cv.contact.location) html += `<div class="contact-item"><strong>Ubicación:</strong><br/>${escapeHtml(cv.contact.location)}</div>`;
    if (cv.contact.linkedin) html += `<div class="contact-item"><strong>LinkedIn:</strong><br/>${escapeHtml(cv.contact.linkedin)}</div>`;
    return html;
  };

  const renderSkills = () => {
    if (!cv.skills || cv.skills.length === 0) return "";
    return `
      <div class="sidebar-section">
        <h3>Habilidades</h3>
        <ul class="sidebar-list">
          ${cv.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ul>
      </div>
    `;
  };

  const renderLanguages = () => {
    if (!cv.languages || cv.languages.length === 0) return "";
    return `
      <div class="sidebar-section">
        <h3>Idiomas</h3>
        <ul class="sidebar-list">
          ${cv.languages.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
        </ul>
      </div>
    `;
  };

  const renderExperience = () => {
    if (!cv.experience || cv.experience.length === 0) return "";
    return `
      <div class="main-section">
        <h2>Experiencia Profesional</h2>
        ${cv.experience.map(exp => `
          <div class="experience-item">
            <div class="exp-header">
              <span class="role">${escapeHtml(exp.role)}</span>
              <span class="dates">${escapeHtml(exp.dates)}</span>
            </div>
            <div class="company">${escapeHtml(exp.company)}</div>
            <ul>
              ${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    `;
  };

  const renderEducation = () => {
    if (!cv.education || cv.education.length === 0) return "";
    return `
      <div class="main-section">
        <h2>Educación</h2>
        ${cv.education.map(edu => `
          <div class="experience-item">
            <div class="exp-header">
              <span class="role">${escapeHtml(edu.degree)}</span>
              <span class="dates">${escapeHtml(edu.dates)}</span>
            </div>
            <div class="company">${escapeHtml(edu.institution)}</div>
          </div>
        `).join("")}
      </div>
    `;
  };

  return modernTemplate({
    name: escapeHtml(cv.name),
    contactHtml: renderContact(),
    skillsHtml: renderSkills(),
    languagesHtml: renderLanguages(),
    summaryHtml: cv.summary ? `<div class="main-section"><h2>Perfil Profesional</h2><p class="summary-text">${escapeHtml(cv.summary)}</p></div>` : "",
    experienceHtml: renderExperience(),
    educationHtml: renderEducation()
  });
}

/**
 * Legacy/Simple HTML Builder
 */
export function buildCvHtml(cv: CVDataObject): string {
  return `<html><body><h1>${escapeHtml(cv.name)}</h1></body></html>`;
}
