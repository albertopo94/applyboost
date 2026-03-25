import type { CVDataObject } from "@/lib/llm/types";

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

export function buildCvHtml(cv: CVDataObject): string {
  return `<html><body><h1>${escapeHtml(cv.name)}</h1></body></html>`;
}

/**
 * MODERN 2-COLUMN PDF TEMPLATE
 * Uses Table Header trick to maintain vertical margins across pages while keeping full-bleed background.
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

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; }
        
        @page {
          size: A4;
          margin: 0; /* Necessary for Full Bleed background */
        }
        
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          color: #1f2937;
          font-size: 10pt;
          line-height: 1.5;
          background: linear-gradient(to right, #f8fafc 35%, white 35%);
          min-height: 297mm;
          -webkit-print-color-adjust: exact;
        }

        /* --- THE MAGIC TABLE --- */
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead {
          height: 25mm; /* Fixed top margin for EVERY page */
        }
        tfoot {
          height: 25mm; /* Fixed bottom margin for EVERY page */
        }

        /* --- CONTENT WRAPPER --- */
        .page-content {
          display: block;
          position: relative;
          width: 100%;
        }

        .sidebar {
          position: absolute;
          left: 0;
          width: 35%;
          padding: 0 30px;
        }

        .main-content {
          margin-left: 35%;
          width: 65%;
          padding: 0 40px 0 30px;
        }

        /* --- STYLES --- */
        .sidebar h3 {
          font-size: 11pt;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #0f172a;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 4px;
          margin-top: 0;
          margin-bottom: 12px;
        }
        .contact-item { margin-bottom: 12px; font-size: 9pt; color: #475569; }
        .contact-item strong { color: #0f172a; font-weight: 600; }
        .sidebar-section { margin-top: 30px; }
        .sidebar-list { list-style: none; padding: 0; margin: 0; }
        .sidebar-list li { margin-bottom: 6px; color: #475569; font-size: 9pt; }

        .name-header { margin-bottom: 30px; margin-top: 0; }
        .name-header h1 { font-size: 25pt; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.1; }
        
        .main-section { margin-bottom: 25px; }
        .main-section h2 {
          font-size: 13pt; color: #1e40af; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px; text-transform: uppercase;
        }
        .summary-text { text-align: justify; margin-top: 0; color: #334155; font-size: 9.5pt; }

        .experience-item { margin-bottom: 18px; page-break-inside: avoid; }
        .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
        .role { font-weight: 700; font-size: 10.5pt; color: #0f172a; }
        .dates { font-size: 8.5pt; color: #64748b; font-weight: 500; }
        .company { font-style: italic; color: #475569; margin-bottom: 6px; font-size: 9.5pt; }
        
        ul { margin: 0; padding-left: 18px; color: #334155; }
        li { margin-bottom: 4px; text-align: justify; font-size: 9.5pt; }

        /* Alignment for sidebar to match main content profile */
        .sidebar-first-section { margin-top: 67px; }
      </style>
    </head>
    <body>
      <table>
        <thead><tr><td><!-- Spacer for top margin --></td></tr></thead>
        <tbody>
          <tr>
            <td>
              <div class="page-content">
                <div class="sidebar">
                  <div class="sidebar-section sidebar-first-section">
                    <h3>Contacto</h3>
                    ${renderContact()}
                  </div>
                  ${renderSkills()}
                  ${renderLanguages()}
                </div>
                <div class="main-content">
                  <div class="name-header">
                    <h1>${escapeHtml(cv.name)}</h1>
                  </div>
                  ${cv.summary ? `<div class="main-section"><h2>Perfil Profesional</h2><p class="summary-text">${escapeHtml(cv.summary)}</p></div>` : ""}
                  ${renderExperience()}
                  ${renderEducation()}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot><tr><td><!-- Spacer for bottom margin --></td></tr></tfoot>
      </table>
    </body>
    </html>
  `;
}
