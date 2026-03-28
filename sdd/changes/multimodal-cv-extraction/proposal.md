# Proposal: Multimodal CV Extraction (Ojo de Dios)

## Intent
Replace the legacy `pdf-parse` library with **Gemini 3 Flash Preview** (Multimodal) via REST API to achieve superior extraction quality, including visual reasoning (progress bars, layouts) and image support, while staying within the 768MB RAM limit of the VPS.

## Scope

### In Scope
- Implement `GeminiVisionService` using REST API (v1beta).
- Update `cvParser.ts` to orchestrate between Mammoth (DOCX) and Gemini (PDF/Images).
- Add support for `.jpg`, `.jpeg`, and `.png` CV uploads.
- Implement 5MB file size validation in `CVInput.tsx`.
- Remove `pdf-parse` dependency and its types.

### Out of Scope
- Converting DOCX to PDF for Gemini processing (Mammoth is faster/cheaper for Word).
- Direct "One-Shot" generation (we keep the current Extraction -> Optimization flow for traceability).

## Approach
We will use the **REST API (v1beta)** to avoid the overhead of the official SDK. The extraction will force a JSON output containing `markdown_content` and `visual_metadata` (for skill levels).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/parsers/cvParser.ts` | Modified | New orchestration logic; remove `pdf-parse`. |
| `src/lib/llm/gemini-vision.ts` | New | REST implementation for multimodal OCR. |
| `src/components/wizard/CVInput.tsx` | Modified | Add image support and 5MB validation. |
| `package.json` | Modified | Remove `pdf-parse` and `@types/pdf-parse`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API Latency | Med | Use Gemini 1.5 Flash (fast) and maintain 90s timeouts. |
| RAM Overhead (Base64) | Med | Process Buffers in-flight; limit to 5MB. |
| API Cost (Tokens) | Low | Use Flash model (cheaper) and Keep Mammoth for DOCX. |

## Rollback Plan
Keep `pdf-parse` in `package.json` until fully verified. Reverting `cvParser.ts` to the previous version will restore legacy behavior.

## Dependencies
- `GEMINI_API_KEY` (AI Studio / Key 1) must be valid.

## Success Criteria
- [ ] PDFs with columns/tables are extracted as structured Markdown.
- [ ] Visual skill bars (e.g., in `CV_Alberto_perez_Ojeda.pdf`) are interpreted as text/percentages.
- [ ] Images (.jpg/.png) are correctly parsed into text.
- [ ] Files > 5MB are rejected in the Frontend.
