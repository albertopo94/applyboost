# Auditoría Técnica: De Junior a Senior Architect 🧠🚀

**Proyecto:** ApplyBoost
**Fecha:** 30 de Marzo, 2026
**Auditor:** Senior Architect (15+ years experience, GDE & MVP)

---

## 1. El Pecado Capital: Estado Global Mutable en el Servidor
### Escenario (Junior)
En `src/lib/llm/index.ts`, usás `let currentProviderIndex = 0` para manejar un Round-Robin de proveedores de LLM.

### Por qué está MAL (Análisis Técnico)
Estamos trabajando en un entorno **Serverless/Distributed** (Next.js en Vercel o similar). Las funciones lambda se levantan y mueren. Ese índice NO es compartido entre diferentes requests ni entre diferentes instancias. 
- **Resultado:** El "Round-robin" es una ilusión. Si tenés 10 instancias, cada una empieza en 0. Si una muere, perdés el estado.
- **Concepto:** Statelessness. El backend debe ser agnóstico al estado de memoria entre requests.

### Solución Senior
Si necesitás consistencia, usá un **Redis** para el estado global o, mejor aún, implementá una estrategia de **Randomized Priority** o un **Weighted Selection** basado en la salud del servicio que no dependa de un índice mutable.

---

## 2. El Patrón "God Function" en API Routes
### Escenario (Junior)
`src/app/api/generate/route.ts` maneja: Identidad, Quota, OCR, Idioma, Prompting, Generación y Persistencia en un solo bloque `async () => { ... }`.

### Por qué está MAL (Análisis Técnico)
Esto viola el **Single Responsibility Principle (SRP)**. El API Route debería ser solo un controlador: recibe input, delega a un caso de uso y devuelve output.
- **Problema de Mantenimiento:** Si querés cambiar el motor de OCR, tenés que tocar el archivo donde manejás el Streaming de la API.
- **Fragilidad:** Un error en el paso 2 (OCR) puede dejar colgado recursos del paso 5 si no se maneja con un flujo de trabajo orquestado.

### Solución Senior
Implementar el patrón **Command** o un **Use Case layer**. 
```typescript
// Ejemplo Senior
const result = await optimizeCVUseCase.execute({ file, userId, targetJob });
```
La lógica de negocio vive en servicios puros, no en los controladores de Next.js.

---

## 3. Manejo de Errores "Ciruja" (String Matching)
### Escenario (Junior)
```typescript
if (error?.message?.includes("429")) { ... }
```

### Por qué está MAL (Análisis Técnico)
Confiar en el `.message` de un error es como construir una casa sobre arena. Los mensajes cambian con las versiones de las librerías o según el proveedor. 
- **Resultado:** Tu lógica de reintento/fallback es FRÁGIL.

### Solución Senior
Usar **Custom Error Classes** con códigos de error estandarizados y chequear tipos con `instanceof` o `discriminated unions`.
```typescript
if (error instanceof LLMRateLimitError) { 
  // Lógica de fallback real
}
```

---

## 4. Acoplamiento de Infraestructura (Key Rotation)
### Escenario (Junior)
`GeminiService` tiene un loop interno que llama a `GeminiKeyManager` para rotar llaves si falla.

### Por qué está MAL (Análisis Técnico)
El servicio que habla con Gemini no debería saber que existen 10 llaves. Su única misión es enviar un prompt y recibir una respuesta.
- **Problema:** Si mañana querés usar un Proxy o un Gateway de LLMs, tenés que reescribir todos los servicios de modelos.

### Solución Senior
Usar el patrón **Proxy** o un **Interoperability Layer**. La rotación de llaves debe ser un "Middleware" o un "Provider" inyectado. El `GeminiService` recibe UN solo cliente de API ya configurado.

---

## 5. Falta de Inyección de Dependencias
### Escenario (Junior)
Instanciás los servicios con `new GroqService()` dentro del orquestador.

### Por qué está MAL (Análisis Técnico)
Hace que el código sea imposible de testear unitariamente. No podés inyectar un "Mock" sin usar librerías de parcheo de módulos.

### Solución Senior
Pasar las dependencias por constructor o usar un **Factory Pattern** que permita inyectar configuraciones. ¡Hacete amigo de **SOLID**, loco!

---

## Conclusión del Arquitecto
El código "funciona", pero no "escala". Estás construyendo un prototipo, no un producto. Un Senior diseña para el fallo, para el cambio y para el testing. 

**PONETE LAS PILAS:** Menos `any`, menos estados globales en memoria, y más arquitectura de capas. ¡Es la diferencia entre ser un programador y ser un Ingeniero de Software!

DALE, DALE.
