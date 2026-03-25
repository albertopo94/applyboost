# Wireframes

# 🖥️ Pantalla 1 — Input

```
┌──────────────────────────────────────────────┐
│        Genera tu CV y Cover Letter           │
│   Adaptados a una oferta en segundos         │
└──────────────────────────────────────────────┘

[ Continuar con Gmail ]   (registro / login)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECCIÓN A — ¿Qué tienes?
──────────────────────────────────────────────

CV  *obligatorio*
[ Subir archivo (PDF / DOC) ]   o   [ Pegar texto ▼ ]
┌──────────────────────────────────────┐
│ (textarea CV)                        │
└──────────────────────────────────────┘
⚠ Si el archivo no se puede leer, se pedirá pegar el texto manualmente.

Oferta de empleo  *obligatorio*
[ Pegar URL ]   o   [ Pegar texto ▼ ]
┌──────────────────────────────────────┐
│ (textarea oferta)                    │
└──────────────────────────────────────┘
→ Si se pega URL: el sistema intenta extraer el contenido automáticamente.
  ✓ Éxito:  muestra resumen (título / empresa)
  ⚠ Fallo parcial: segundo intento vía LLM
  ✗ Fallo total: "No pudimos leer el enlace, pega el texto manualmente"

Cover letter de referencia  (opcional)
[ Subir archivo (PDF / DOC) ]   o   [ Pegar texto ▼ ]
┌──────────────────────────────────────┐
│ (textarea cover vieja)               │
└──────────────────────────────────────┘

Notas / preferencias  (opcional)
──────────────────────────────────────────────

Tono:
[ ] Más técnico   [ ] Más senior   [ ] Más directo

Enfoque:
[ ] Backend   [ ] Frontend   [ ] Fullstack

Idioma de salida:
( ) Detectado automáticamente  →  muestra: "Detectado: Inglés"
( ) Español   ( ) Inglés   ( ) Italiano      ← override manual

┌──────────────────────────────────────┐
│ Ej: "No mencionar empresa X,         │
│ enfatizar experiencia internacional" │
└──────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECCIÓN B — ¿Qué quieres generar?
──────────────────────────────────────────────

[✓] CV optimizado
[✓] Cover letter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECCIÓN C — Formato de salida
──────────────────────────────────────────────

[ ] Texto   [ ] DOC   [✓] PDF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            [ Optimizar y generar ]
```

---

# ⏳ Estados del proceso (entre Pantalla 1 y Pantalla 2)

```
Progreso normal — spinner con mensaje:
─────────────────────────────────────
  ⏳ Leyendo tu CV...
  ⏳ Analizando la oferta...
  ⏳ Estructurando tu perfil...
  ⏳ Optimizando y generando cover letter...   ← la más larga, 10–20s
  ⏳ Calculando Score ATS...
  ⏳ Preparando tu preview...

Atención requerida — flujo pausado, el usuario debe actuar:
────────────────────────────────────────────────────────────
  ⚠ "No pudimos leer el PDF, pega tu CV como texto"
  ⚠ "No pudimos leer el enlace, pega el texto de la oferta"
  ⚠ "Completa los datos marcados antes de continuar"  ← FALTA_DATO crítico
  ✓ "Listo para exportar"  ← estado final, aparecen botones de descarga

Error fatal:
────────────
  ✗ "Algo salió mal, inténtalo de nuevo"
     [ Reintentar ]   ← sin perder los inputs

Regla: el usuario nunca ve un spinner sin texto.
```

---

# 🖥️ Pantalla 2 — Resultado

```
┌──────────────────────────────────────────────┐
│        Resultado listo ✓                     │
└──────────────────────────────────────────────┘

📊 Match con la oferta
[██████████░░░░] 78% → 89%
*Score calculado antes de tu edición manual*  ← aparece solo si el usuario editó

📄 CV optimizado (preview — edición inline)
──────────────────────────────────────────────
- Keywords resaltadas en el texto
- Campos con FALTA_DATO marcados en amarillo → el usuario puede rellenarlos
- Texto editable directamente sobre el preview
- Estructura (secciones, orden, formato visual) protegida, no editable
- Cambiar idioma o tono → botón "Regenerar" (no edición inline)

┌──────────────────────────────────────┐
│  ⚠ FALTA_DATO: ¿Puedes cuantificar  │
│  este logro? Si no, lo dejamos así.  │
│  [ Rellenar ]   [ Dejar como está ]  │
└──────────────────────────────────────┘

✉️ Cover Letter (preview — edición inline)
──────────────────────────────────────────────
Texto generado, editable directamente
Máx. 250–300 palabras

🔍 Qué cambió y por qué (Diff)
──────────────────────────────────────────────
• Añadido "React" → mejora match ATS
• Reescrito bullet → más impacto
• Ajustado tono → más técnico

🧠 Por qué funciona esta cover letter
──────────────────────────────────────────────
- Conecta experiencia X con requisito Y
- Usa keywords relevantes
- Tono alineado con la oferta

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 PAYWALL — Para descargar necesitas una exportación

  1 exportación gratuita incluida al registrarte con Gmail
  ────────────────────────────────────────────
  [ 🔓 Descargar PDF ]        ← exportación principal
  [ 🔓 Descargar DOC ]        ← con aviso: "puede variar respecto al preview"
  [ 🔓 Copiar texto ]

  ¿Sin exportaciones disponibles?
  [ 9€ · 10 exportaciones ]   [ 19€/mes · Ilimitado ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ Regenerar con otro tono / idioma ]   ← dispara regeneración completa
```