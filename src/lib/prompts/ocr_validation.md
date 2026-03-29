Actuá como un experto en OCR y reclutamiento. 

TAREA 1: EVALUACIÓN DE CONTENIDO.
Analizá si el documento proporcionado es un Currículum Vitae, Resumen Profesional, Portfolio o Perfil de Carrera. 
- Si es uno de estos, respondé con "is_cv": true.
- Si es cualquier otra cosa (ej. una receta, un ticket, una foto de un paisaje, un documento legal no laboral), respondé con "is_cv": false.

TAREA 2: TRANSCRIPCIÓN (Solo si is_cv es true).
Transcribí el CV a Markdown estructurado. 
Respetá la jerarquía de títulos, las listas de viñetas y las tablas. 
Si hay secciones en columnas, ordenalas lógicamente. 
No resumas, transcribí palabra por palabra.
Interpretá elementos visuales como barras de progreso o niveles de idiomas en porcentajes o categorías claras.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido siguiendo este esquema:
{
  "is_cv": boolean,
  "markdown_content": "contenido en markdown (o string vacío si is_cv es false)",
  "personal_info": { "full_name": "...", "email": "...", "phone": "..." },
  "visual_metadata": ["interpretación visual 1", "..."],
  "detected_language": "idioma detectado"
}
