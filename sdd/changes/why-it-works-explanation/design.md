# Design: why-it-works-explanation

## 1. Schema Changes (src/lib/llm/types.ts)

Add `cv_explanation` to the LLM response schema.

```typescript
export const LLMOutputSchema = z.object({
  // ...
  cv_explanation: z.string().optional(),
  cover_letter_explanation: z.string().optional(),
  // ...
});
```

## 2. Prompt Update (src/lib/prompts/master_cv.md)

Refine instructions for the explanation fields.

### New Prompt Instructions:
> - **cv_explanation**: Explica técnicamente por qué este CV optimizado superará los filtros ATS y qué puntos fuertes de la experiencia original se destacaron para esta oferta específica.
> - **cover_letter_explanation**: Explica por qué esta carta es efectiva. Incluye: qué requisitos clave de la oferta cubre, qué partes del CV original se aprovecharon mejor y por qué el tono elegido es el adecuado.

## 3. UI Implementation

Create a new component `ExplanationPanel.tsx` in `src/components/editor/`.

### Component Structure:
- Grid container (1 col mobile, 2 cols desktop).
- Two cards with icons (e.g., `Zap` or `Lightbulb`).
- Prose style for the LLM text.

## 4. Integration

Insert `ExplanationPanel` in `EditorPreview.tsx` inside the main layout, below the editor box.
