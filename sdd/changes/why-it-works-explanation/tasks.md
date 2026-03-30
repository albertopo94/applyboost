# Tasks: why-it-works-explanation

## Phase 1: Data Contract & Prompt
- [ ] 1.1. Update `src/lib/llm/types.ts`:
  - [ ] Add `cv_explanation` to `LLMOutputSchema`.
  - [ ] Add `cv_explanation` to `GenerateResponse` interface.
- [ ] 1.2. Update `src/lib/prompts/master_cv.md`:
  - [ ] Add specific instructions for `cv_explanation` and `cover_letter_explanation`.
  - [ ] Update the JSON output example.

## Phase 2: UI Components
- [ ] 2.1. Create `src/components/editor/ExplanationPanel.tsx`.
- [ ] 2.2. Integrate `ExplanationPanel` into `src/components/EditorPreview.tsx`.

## Phase 3: Verification
- [ ] 3.1. Run unit tests to ensure schema validation passes.
- [ ] 3.2. (Manual) Verify UI layout on desktop and mobile.
