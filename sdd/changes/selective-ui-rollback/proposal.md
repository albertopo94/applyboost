# Proposal: selective-ui-rollback

## Intent
Restaurar la estética original (commit `fbabc97`) de 4 componentes que perdieron su "personalidad" durante el refactor de estandarización visual. El usuario prefiere los detalles artesanales previos sobre la versión actual.

## Scope

### In Scope
- `src/components/layout/UserMenu.tsx`: Restaurar logo de Google con colores por letra y estilo minimalista.
- `src/components/auth/AuthModal.tsx`: Restaurar diseño "SaaS Premium" con bordes `2.5rem`, rotación de iconos y sombras suaves.
- `src/components/layout/QuotaBanner.tsx`: Restaurar banner de cuota ultra-delgado (`10px`).
- `src/components/wizard/WizardHero.tsx`: Restaurar estilo de círculos con números (paso a paso) con bordes y fondos sutiles.

### Out of Scope
- No se modificarán otros componentes del sistema de tokens (ExplanationPanel, etc.).
- No se cambiará la lógica de autenticación ni de cuotas, solo la visual.

## Approach
Reemplazo quirúrgico del contenido de los 4 archivos por su versión exacta en el commit `fbabc97`. Se verificará que las props requeridas por el sistema actual (Next.js 15) sigan siendo compatibles.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/layout/UserMenu.tsx` | Modified | Reversión visual. |
| `src/components/auth/AuthModal.tsx` | Modified | Reversión visual. |
| `src/components/layout/QuotaBanner.tsx` | Modified | Reversión visual. |
| `src/components/wizard/WizardHero.tsx` | Modified | Reversión visual. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad de props | Low | Verificación de tipos y ejecución de `tsc` post-cambio. |
| Rotura de layout | Low | Validación visual con screenshots. |

## Rollback Plan
Si el resultado no es el esperado, se revertirán los cambios al commit actual (`816ade7`) usando `git checkout`.

## Success Criteria
- [ ] Los componentes se ven idénticos a la versión del commit `fbabc97`.
- [ ] No hay errores de tipos en la compilación.
- [ ] La funcionalidad de login y cuotas sigue operativa.
