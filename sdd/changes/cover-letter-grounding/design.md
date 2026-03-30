# Design: cover-letter-grounding

## 1. Prompt Structure Changes

We will refactor `src/lib/prompts/master_cv.md` to include a specific section for Grounding Rules.

### New Rules Block:
```markdown
### REGLAS DE COVER LETTER (GROUNDING ESTRICTO)
- **BASADA EN HECHOS**: Cada párrafo debe conectar una experiencia real del CV con un requisito de la oferta. 
- **PROHIBICIÓN DE ESPECULACIÓN GEOGRÁFICA**: No menciones intenciones de mudanza, traslados o "pendolarismo" a menos que conste explícitamente en el input del usuario.
- **MANEJO DE BRECHAS**: Si la oferta pide un skill que el usuario no tiene, resalta la "capacidad demostrada para dominar nuevos stacks técnicos" basada en su formación o trayectoria, sin decir que ya lo conoce.
- **PLACEHOLDERS DE CONTACTO**: Si falta el Email o Teléfono, usa [Inserire Email] o [Inserire Telefono].
```

## 2. Integrity Shield Integration

The `ESCUDO DE INTEGRIDAD` section will be updated to be even more explicit about the "No Magic" policy regarding contact information and locations.

## 3. Data Flow

The data flow remains the same:
`OptimizeCVUseCase` -> `buildMasterPrompt` -> `AIService` -> `Zod Validation`.
The change is purely in the instructions passed to the LLM.
