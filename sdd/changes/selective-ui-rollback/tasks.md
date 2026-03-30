# Tasks: selective-ui-rollback

## Phase 1: Foundation & RED Phase (Testing)

- [ ] 1.1 Crear test E2E en `tests/e2e/selective-ui-rollback.spec.ts` para verificar la presencia de los elementos originales (logo Google con colores, bordes de 2.5rem, etc.).
- [ ] 1.2 Ejecutar el test y confirmar que falla (RED) con la UI actual.

## Phase 2: Core Implementation (Green Phase)

- [ ] 2.1 Restaurar `src/components/layout/UserMenu.tsx` al código del commit `fbabc97` (Logo Google coloreado).
- [ ] 2.2 Restaurar `src/components/auth/AuthModal.tsx` al código del commit `fbabc97` (Diseño SaaS Premium, bordes 2.5rem).
- [ ] 2.3 Restaurar `src/components/layout/QuotaBanner.tsx` al código del commit `fbabc97` (Banner minimalista 10px).
- [ ] 2.4 Restaurar `src/components/wizard/WizardHero.tsx` al código del commit `fbabc97` (Círculos con números originales).

## Phase 3: Verification & Polish

- [ ] 3.1 Ejecutar `tsc` para verificar que no hay errores de tipos tras la restauración.
- [ ] 3.2 Ejecutar el test E2E `tests/e2e/selective-ui-rollback.spec.ts` y confirmar que pasa (GREEN).
- [ ] 3.3 Capturar screenshots de los 4 componentes para validación visual final.
- [ ] 3.4 Eliminar el test temporal `tests/e2e/selective-ui-rollback.spec.ts` si no se desea mantener en el repo.
