export interface ModernTemplateParams {
  name: string;
  contactHtml: string;
  skillsHtml: string;
  languagesHtml: string;
  summaryHtml: string;
  experienceHtml: string;
  educationHtml: string;
}

export function modernTemplate(params: ModernTemplateParams): string {
  const { name, contactHtml, skillsHtml, languagesHtml, summaryHtml, experienceHtml, educationHtml } = params;

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
          margin: 0;
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

        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead { height: 25mm; }
        tfoot { height: 25mm; }

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
                    ${contactHtml}
                  </div>
                  ${skillsHtml}
                  ${languagesHtml}
                </div>
                <div class="main-content">
                  <div class="name-header">
                    <h1>${name}</h1>
                  </div>
                  ${summaryHtml}
                  ${experienceHtml}
                  ${educationHtml}
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
