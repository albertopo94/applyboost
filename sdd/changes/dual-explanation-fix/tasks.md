# Tasks: dual-explanation-fix

## Phase 1: Surgical Service Update
- [ ] 1.1. Update `src/lib/services/generationService.ts`:
  - [ ] Add `cv_explanation: llmResult.cv_explanation` to the return object.
  - [ ] DO NOT touch any database insert code.

## Phase 2: UI & Prompt Polish
- [ ] 2.1. Refine `src/lib/prompts/master_cv.md` for technical CV rationale.
- [ ] 2.2. Update `src/components/editor/ExplanationPanel.tsx` for icons and strict symmetry.

## Phase 3: Verification
- [ ] 3.1. Verify that no DB migration files are present.
- [ ] 3.2. Perform manual verification in production.
