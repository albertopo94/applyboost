# Informe Comparativo: Benchmarking OCR y Extracción Visual (Gemini 3 vs Vision API)

Este documento resume las pruebas realizadas sobre el archivo `CV_Alberto_perez_Ojeda.pdf` utilizando dos API Keys de distintos entornos de Google y 7 métodos de implementación técnica para evaluar la calidad del Reconocimiento Óptico de Caracteres (OCR) y el Razonamiento Visual.

---

## 1. Configuración de la Prueba
*   **Caso de Prueba:** CV con layout de dos columnas, barras de progreso visuales para idiomas y texto multilingüe.
*   **Modelo Utilizado:** `gemini-3-flash-preview` (para métodos generativos).
*   **Entornos:**
    *   **KEY 1 (Google AI Studio):** Acceso directo a modelos generativos experimentales.
    *   **KEY 2 (Google Cloud Platform):** Entorno con Vision API activada y cuotas de GCP.

---

## 2. Matriz de Métodos y Resultados

### KEY 1: Google AI Studio (Gemini 3 Flash Preview)
| Método | Descripción Técnica | Resultado / Comportamiento |
| :--- | :--- | :--- |
| **M1: Basic SDK** | `generateContent` simple con PDF base64. | Transcripción fluida. Inventó etiquetas de nivel (ej. "Livello alto") basándose en las barras. |
| **M2: REST API** | Petición POST directa al endpoint v1beta. | Muy fiel al texto. Menos tendencia a alucinar etiquetas que el SDK básico. |
| **M3: Role/Parts** | Estructura `{role: "user", parts: [...]}`. | **El más riguroso.** Respetó saltos de línea y diseño original de forma literal. |
| **M4: Array format** | Prompt y PDF como elementos de un array. | Interpretó visualmente las barras ("Livello nativo") e infirió datos de contacto (Skype). |
| **M5: JSON Output** | `responseMimeType: "application/json"`. | **GANADOR EN EXTRACCIÓN.** Detectó porcentajes exactos de las barras (100%, 70%, 30%). |

### KEY 2: Google Cloud Platform (Vision API Activada)
| Método | Descripción Técnica | Resultado / Comportamiento |
| :--- | :--- | :--- |
| **M1 al M4** | Mismos métodos que KEY 1. | Resultados consistentes pero **más conservadores**. Interpretó idiomas como "alto/medio/bajo" en lugar de porcentajes. |
| **M5 (JSON)** | Extracción estructurada. | Funcionó perfecto, pero con menor detalle visual que la KEY 1 de AI Studio. |
| **M6: Vision REST** | `vision.googleapis.com/v1/images:annotate`. | **FALLO (PDF nativo):** Vision API tradicional requiere conversión previa de PDF a imagen o uso de GCS para PDFs. |
| **M7: Vision SDK** | `client.textDetection(file)`. | **FALLO (PDF nativo):** Mismo comportamiento que M6. Gemini 3 maneja PDFs "inline" mucho mejor. |

---

## 3. Conclusiones Técnicas (Veredicto de Arquitectura)

### A. "OCR Tradicional" vs "Razonamiento Visual"
*   **Vision API (Key 2 / M6-M7):** Es un OCR puro. Busca caracteres y coordenadas. Excelente para volumen masivo de fotos, pero "ciego" ante el significado de elementos gráficos como barras de progreso.
*   **Gemini 3 (Key 1 / M1-M5):** Es un modelo multimodal. No solo "lee", sino que **entiende** lo que ve. Fue capaz de convertir un gráfico (barra de color) en un dato numérico (porcentaje).

### B. Diferencia entre AI Studio y GCP
*   **AI Studio (Key 1):** Parece tener una configuración de temperatura o parámetros de decodificación visual más "agudos". Detectó detalles que GCP simplificó.
*   **GCP (Key 2):** Es más estable para producción a gran escala, pero en esta prueba demostró una interpretación más cualitativa y menos detallada.

### C. Recomendación de Uso
1.  **Si necesitas precisión extrema y extracción de datos complejos (Document AI):** Usá **Gemini 3 vía AI Studio (Key 1)** con el **Método 5 (JSON)**.
2.  **Si necesitas fidelidad absoluta al texto sin interpretaciones:** Usá el **Método 3 (Role/Parts)** con el prompt "Transcribe exactamente como aparece".
3.  **Para integración en sistemas legacy:** El **Método 2 (REST API)** es el más seguro para evitar dependencias de SDKs cambiantes.

---

## 4. Resumen de Aprendizajes
*   **El prompt es el 50% del OCR:** Pedir "JSON puro" fuerza al modelo a analizar la estructura semántica del documento, no solo a leer palabras.
*   **Manejo de PDFs:** Gemini 3 elimina la necesidad de pre-procesar PDFs a imágenes (rasterización), lo cual ahorra muchísima latencia y costos de infraestructura.
*   **Alucinaciones Visuales:** Los modelos generativos pueden "inventar" niveles o categorías si ven gráficos. Es vital usar prompts negativos (ej: "No inventes niveles, solo transcribe") si se busca fidelidad 100%.
