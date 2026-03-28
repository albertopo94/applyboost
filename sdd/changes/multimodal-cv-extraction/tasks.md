# Tasks: Multimodal CV Extraction (Ojo de Dios)

## Phase 1: Foundation & Types
- [x] 1.1 Create `src/lib/llm/gemini-vision.ts` with `CVExtractionResult` interface and `GeminiVisionService` skeleton.
- [x] 1.2 Implement `GeminiVisionService.extractTextFromFile` using native `fetch` (REST v1beta).
- [x] 1.3 Add `AbortController` with a strict **25s timeout** in the REST call.
- [x] 1.4 Implement detailed logging ("soplones") with `requestId` at start, payload size, and response/error.

## Phase 2: Orchestration & Logic
- [x] 2.1 Update `src/lib/parsers/cvParser.ts` to include `image/jpeg` and `image/png` in `parseCV` logic.
- [x] 2.2 Refactor `parseCV` to bifurcate: `.docx` (Mammoth) vs `.pdf/.jpg/.png` (Gemini Vision).
- [x] 2.3 Ensure `requestId` is passed from `api/generate` down to `GeminiVisionService`.
- [x] 2.4 Update `src/app/api/generate/route.ts` to handle `OCR_FAILED_TIMEOUT` and map it to a user-friendly message.

## Phase 3: UI & Validation
- [x] 3.1 Modify `src/components/wizard/CVInput.tsx` to add `image/*` to the file input `accept` attribute.
- [x] 3.2 Implement client-side file size validation in `CVInput.tsx` (Reject files > **5MB**).
- [x] 3.3 Add localized error messages for "File too large" and "OCR Failure" in `en.json`, `es.json`, `it.json`.

## Phase 4: Verification & Testing
- [ ] 4.1 Unit Test: Mock Gemini REST API response and verify Markdown extraction.
- [ ] 4.2 Integration Test: Verify `cvParser` correctly routes different MIME types.
- [ ] 4.3 Manual Test: Upload `CV_Alberto_perez_Ojeda.pdf` and verify skill percentages interpretation.
- [ ] 4.4 Stress Test: Upload a 6MB file and verify it's rejected before hitting the server.

## Phase 5: Cleanup
- [x] 5.1 Uninstall `pdf-parse` and `@types/pdf-parse` from `package.json`.
- [x] 5.2 Remove `pdf-parse` imports and unused legacy code in `cvParser.ts`.
- [x] 5.3 Final audit of logs in Dokploy to ensure "soplones" are providing high-signal data.
