
import { parsePdfToText } from './src/lib/parsers/cvParser';
import fs from 'fs';

async function testPdfParser() {
  console.log('--- Testing PDF Parser ---');
  
  // Minimal valid PDF (1.1)
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
    const text = await parsePdfToText(minimalPdf);
    console.log('Extracted text:', text);
    if (text.includes('This is a test PDF')) {
      console.log('✅ PDF Parsing successful!');
    } else {
      console.error('❌ PDF Parsing failed: Text mismatch.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ PDF Parsing failed with error:', error);
    process.exit(1);
  }

  // Test with invalid buffer
  console.log('\n--- Testing Invalid PDF Buffer ---');
  try {
    await parsePdfToText(Buffer.from('not a pdf'));
    console.error('❌ Parser should have failed but did not.');
    process.exit(1);
  } catch (error: any) {
    console.log('✅ Correctly caught error:', error.message);
    if (error.message.includes('CV_PARSE_ERROR')) {
      console.log('✅ Error follows expected format.');
    } else {
      console.error('❌ Error message does not follow expected format.');
      process.exit(1);
    }
  }
}

testPdfParser();
