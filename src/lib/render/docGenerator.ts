import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import type { CVDataObject } from "@/lib/llm/types";

/**
 * Document Engine: Core Docx Generator
 * SDD §7.4: Exports CV format optimized for manual edition using standard MS Word parameters.
 */
export async function generateDOCX(cvData: CVDataObject): Promise<Buffer> {
  const sections = [];

  // 1. Header (Name + Contact info)
  sections.push(
    new Paragraph({
      text: cvData.name,
      heading: HeadingLevel.TITLE,
      alignment: "center",
      spacing: { after: 200 },
    }),
  );

  const contactText = [
    cvData.contact.email,
    cvData.contact.phone,
    cvData.contact.location,
    cvData.contact.linkedin,
  ]
    .filter(Boolean)
    .join(" | ");

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: contactText, color: "555555" })],
      alignment: "center",
      spacing: { after: 400 },
    }),
  );

  // 2. Summary
  if (cvData.summary) {
    sections.push(createSectionHeader("Resumen Profesional"));
    sections.push(
      new Paragraph({
        text: cvData.summary,
        spacing: { after: 300 },
      }),
    );
  }

  // 3. Experience
  if (cvData.experience && cvData.experience.length > 0) {
    sections.push(createSectionHeader("Experiencia Profesional"));
    
    for (const exp of cvData.experience) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.role, bold: true }),
            new TextRun({ text: `\t${exp.dates}` }), // Basic tab spacing
          ],
          tabStops: [{ type: "right", position: 9000 }],
        }),
      );
      
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: exp.company, italics: true })],
          spacing: { after: 100 },
        }),
      );

      for (const bullet of exp.bullets) {
        sections.push(
          new Paragraph({
            text: bullet,
            bullet: { level: 0 },
            spacing: { after: 50 },
          }),
        );
      }
      
      sections.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer
    }
  }

  // 4. Education
  if (cvData.education && cvData.education.length > 0) {
    sections.push(createSectionHeader("Educación"));
    
    for (const edu of cvData.education) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true }),
            new TextRun({ text: `\t${edu.dates}` }),
          ],
          tabStops: [{ type: "right", position: 9000 }],
        }),
      );
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: edu.institution, italics: true })],
          spacing: { after: 200 },
        }),
      );
    }
  }

  // 5. Skills
  if (cvData.skills && cvData.skills.length > 0) {
    sections.push(createSectionHeader("Habilidades Principales"));
    sections.push(
      new Paragraph({
        text: cvData.skills.join(" • "),
      }),
    );
  }

  // Generate Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// Reusable styling header for docx sections
function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    text: title.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    border: {
      bottom: { color: "BDBDBD", space: 1, style: BorderStyle.SINGLE, size: 6 },
    },
    spacing: { before: 200, after: 150 },
  });
}
