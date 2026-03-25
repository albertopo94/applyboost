
import { PDFParse } from 'pdf-parse';

async function testPdfParseDirectly() {
  console.log('--- Testing PDFParse Class Directly ---');
  
  const minimalPdf = Buffer.from(
    '%PDF-1.1\n' +
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
    '3 0 obj << /Type /Page /Parent 2 0 R /Resources << >> /Contents 4 0 R >> endobj\n' +
    '4 0 obj << /Length 51 >> stream\n' +
    'BT /F1 12 Tf 70 700 Td (This is a test PDF with enough characters to pass validation.) Tj ET\n' +
    'endstream endobj\n' +
    'xref\n' +
    '0 5\n' +
    '0000000000 65535 f\n' +
    '0000000009 00000 n\n' +
    '0000000058 00000 n\n' +
    '0000000115 00000 n\n' +
    '0000000193 00000 n\n' +
    'trailer << /Size 5 /Root 1 0 R >>\n' +
    'startxref\n' +
    '293\n' +
    '%%EOF'
  );

  try {
    const parser = new PDFParse({ data: minimalPdf });
    const result = await parser.getText();
    console.log('Extracted text:', result.text);
    if (result.text.includes('This is a test PDF')) {
      console.log('✅ PDFParse class works correctly!');
    } else {
      console.error('❌ PDFParse class failed: Text mismatch.');
      process.exit(1);
    }
    await parser.destroy();
  } catch (error) {
    console.error('❌ PDFParse class failed with error:', error);
    process.exit(1);
  }
}

testPdfParseDirectly();
