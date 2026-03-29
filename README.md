# ApplyBoost - MVP

**Convierte ofertas de empleo en CVs y cartas de presentación adaptadas en segundos.**

ApplyBoost es una herramienta que permite adaptar cada candidatura a una oferta concreta sin tener que reescribir todo manualmente.

---

## 🚀 Visión

Aplicar a empleos está roto.

Los candidatos hacen una de dos:

* envían el mismo CV a todas las ofertas → pocas respuestas
* o adaptan cada candidatura a mano → lento y agotador

ApplyBoost automatiza ese proceso.

Nuestra visión es simple:

> Un input → una candidatura optimizada → lista para enviar.

A largo plazo, ApplyBoost busca convertirse en la **capa intermedia entre el candidato y la oferta**, controlando todo el flujo de aplicación.

---

## 🎯 Problema

Aplicar bien a una oferta requiere adaptación:

* los sistemas ATS filtran por palabras clave
* los reclutadores buscan relevancia, no perfiles genéricos

Pero las herramientas actuales fallan porque:

* requieren edición manual
* dependen de prompts
* rompen el formato
* no entregan algo listo para enviar

Resultado:
👉 el usuario pierde tiempo o envía candidaturas débiles

---

## 💡 Solución

ApplyBoost convierte un proceso fragmentado en un flujo simple:

**Entrada**

* CV (texto, PDF o imagen)
* oferta de empleo (texto o URL)

**Procesamiento**

* extracción de estructura
* optimización para ATS
* adaptación de tono e idioma

**Salida**

* CV optimizado
* carta de presentación personalizada
* vista previa editable
* PDF limpio listo para enviar

Sin prompts. Sin problemas de formato. Sin fricción.

---

## 🧠 Insight clave

El valor no está en “generar PDFs”.

El valor está en controlar el flujo completo:

* entender los datos del usuario
* adaptarlos al contexto (la oferta)
* generar un resultado fiable

ApplyBoost separa:

* IA → transformación del contenido
* Código → estructura, validación y formato

Esto permite:

* evitar alucinaciones
* mantener coherencia
* generar confianza en el usuario

---

## 📊 Mercado

Usuario inicial:

* candidatos junior y mid
* personas que aplican a muchas ofertas
* perfiles tech y digitales

Por qué este segmento:

* mayor dolor (fatiga de adaptación manual)
* mayor apertura a probar herramientas
* ROI claro (más entrevistas)

Expansión:

* mercados multi-idioma (Europa)
* freelancers (propuestas en lugar de CVs)
* reclutadores (flujo inverso)

---

## ⚙️ Alcance del producto (MVP)

Enfocado en un caso de uso concreto:

* optimización de CV por oferta
* generación de cover letter
* mejora de keywords ATS
* preview editable
* exportación a PDF

Sin marketplace de plantillas
Sin chat genérico
Sin complejidad innecesaria

---

## 🛣️ Roadmap

### Fase 1 — MVP (actual)

* CV + cover dinámicos
* optimización ATS
* preview editable
* exportación PDF

### Fase 2 — Confianza y retención

* historial por candidatura
* adaptación multi-idioma
* mejoras en explicación de cambios (diff)

### Fase 3 — Control del flujo

* perfil estructurado persistente
* generación en un clic
* extensión de navegador (LinkedIn, portales)

### Fase 4 — Expansión

* propuestas para freelancers

---

## ⚠️ Riesgos

* alucinaciones de la IA → mitigado con validación estricta
* sobre-optimización → CV poco creíble
* competencia (IA generalista) → ventaja en UX + output final

---

## 🧪 Estado

MVP en desarrollo
Fase de validación inicial

---

## 🧭 Posicionamiento

ApplyBoost no es:

* un creador de CVs
* un generador de PDFs
* un chatbot

ApplyBoost es:
👉 un optimizador de candidaturas

---

### 🌐 Infraestructura y Gestión de Servidor (**CubePath** - https://cubepath.com/)

ApplyBoost utiliza un entorno de producción basado en **Auto-alojamiento (Self-hosting)** sobre un VPS de **CubePath**, lo que permite un control total sobre las dependencias del sistema (especialmente Chromium para Puppeteer).

#### Especificaciones y Recursos
*   **Proveedor**: CubePath (Plan `gp.micro` en Barcelona, ES).
*   **Hardware**: 2 vCPU, 4 GB RAM, 80 GB SSD.
*   **Gestión**: Panel **Dokploy** para orquestación de contenedores Docker.
*   **Proxy Inverso**: **Traefik** (integrado en Dokploy) gestionando la terminación de certificados SSL automáticos vía **Let's Encrypt**.
*   **Red**: Configuración de **Zonas DNS** en el panel de CubePath, vinculadas al dominio gratuito `applyboost.eu.org` (registrado en NIC.eu.org) mediante los nameservers `atlas.ns.cubepath.com` y `titan.ns.cubepath.com`.

#### Configuraciones Críticas y Peculiaridades
Durante la puesta en marcha, se implementaron soluciones técnicas específicas para este entorno:
*   **Networking (Filtro IPv4)**: Se forzó el uso de IPv4 en el gestor de paquetes (`Acquire::ForceIPv4 "true"`) para evitar fallos de resolución de espejos en el datacenter de Barcelona.
*   **Gestión de RAM Estricta**: Dado que el VPS opera con ~2.5GB de RAM utilizada en estado estable, se configuró un límite estricto de **1024MB - 1536MB** (`NODE_OPTIONS`) y la activación de `webpackMemoryOptimizations` para el proceso de compilación de Next.js 15, evitando el bloqueo del sistema por falta de memoria (OOM).
*   **Mantenimiento de Almacenamiento**: Debido al alto volumen de datos generado por las capas de Docker y los binarios de Chromium, se requiere una política de limpieza periódica (`docker system prune -af --volumes`) para evitar la saturación del SSD de 80GB.
*   **Build stand-alone**: Optimización del `next.config.ts` y el `Dockerfile` para generar un bundle mínimo que reduzca el I/O Wait en el disco del VPS durante el despliegue.

---

## 🔗 Resumen

Pega una oferta.
Sube tu CV.
Recibe una candidatura lista para enviar.

Sin fricción.

