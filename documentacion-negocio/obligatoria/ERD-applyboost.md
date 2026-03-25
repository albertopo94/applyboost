# ERD — Entity Relationship Document — Magic Generar PDF

## 1. Información del Documento

| Campo | Valor |
| --- | --- |
| Título | ERD — Entity Relationship Document — Magic Generar PDF |
| Versión | 1.0 |
| Fecha de creación | 20 marzo 2026 |
| Última actualización | 20 marzo 2026 |
| Autor(es) | Fundador / Tech Lead |
| Revisado por | — |
| Aprobado por | — |
| Estado | Borrador |
| Documentos relacionados | HLD / SDD / PRD — Magic Generar PDF |

---

## 2. Historial de Cambios

| Versión | Fecha | Autor | Descripción del cambio |
| --- | --- | --- | --- |
| 1.0 | 20 mar 2026 | Fundador | Versión inicial — MVP Módulo 1: CV & Cover Letter Dinámico |

---

## 3. Alcance y Contexto

Este ERD cubre el modelo de datos completo del MVP del Módulo 1 de Magic Generar PDF. El sistema persiste datos en PostgreSQL gestionado por Supabase (Frankfurt, EU West). El almacenamiento de archivos temporales (CVs subidos antes de parsear) usa Supabase Storage con TTL de 1 hora.

El modelo se diseña con tres objetivos fundamentales:

1. **Aislamiento por usuario:** RLS (Row Level Security) en cada tabla garantiza que un usuario solo puede acceder a sus propios registros a nivel de base de datos.
2. **Moat de datos desde el día 1:** La tabla `generation_logs` registra el comportamiento de uso por generación para alimentar el feedback loop del prompt maestro a largo plazo.
3. **Cumplimiento GDPR:** Los datos sensibles del CV no se persisten en texto plano más allá de lo necesario. El borrado de cuenta es un hard delete en cascada.

El ERD cubre las siguientes tablas: `users`, `generations`, `cv_versions`, `generation_logs`, `user_exports`, `stripe_events`.

---

## 4. Diagrama ER

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            auth.users (Supabase)                              │
│  id (UUID, PK)                                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │ 1
                               trigger on_auth_user_created
                                     │
                     ┌─────────────┴─────────────┐
                     │              │              │
                     ▼ 1            ▼ 1            ▼ 1
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│      users             │ │    user_exports        │ │    stripe_events        │
│  id (UUID, PK, FK)      │ │  id (UUID, PK)         │ │  id (UUID, PK)         │
│  email                  │ │  user_id (UUID, FK)    │ │  payment_intent_id     │
│  full_name              │ │  exports_available     │ │  user_id (UUID, FK)    │
│  exports_available      │ │  subscription_active   │ │  tier                  │
│  subscription_active    │ │  subscription_expires  │ │  processed_at          │
│  subscription_expires   │ │  updated_at            │ └──────────────────────┘
│  created_at             │ └──────────────────────┘
│  updated_at             │
└───────────┬──────────┘
                 │ 1
                 │
                 ▼ N
┌────────────────────────────┐
│         generations            │
│  id (UUID, PK)                 │
│  user_id (UUID, FK)            │
│  cv_text                       │
│  job_description               │
│  job_url                       │
│  output_language               │
│  tone                          │
│  focus                         │
│  generate_cv                   │
│  generate_cover                │
│  interview_result              │
│  created_at                    │
└───────────┬────────────────┘
                 │ 1
         ┌───────┴───────┐
         ▼ 1          ▼ 1
┌───────────────────┐ ┌───────────────────┐
│   cv_versions       │ │  generation_logs     │
│  id (UUID, PK)      │ │  id (UUID, PK)      │
│  generation_id (FK) │ │  generation_id (FK) │
│  cv_optimizado      │ │  falta_dato_fields  │
│  cover_letter       │ │  falta_dato_filled  │
│  cover_explanation  │ │  manual_edits       │
│  diff (JSONB)       │ │  regenerations      │
│  keywords (TEXT[])  │ │  time_in_preview    │
│  score_original     │ │  export_format      │
│  score_optimizado   │ │  created_at         │
│  falta_dato_fields  │ └───────────────────┘
│  created_at         │
└───────────────────┘

Cardinalidades:
  auth.users  1 ────────────────────── 1  users          (trigger)
  users       1 ────────────────────── 1  user_exports
  users       1 ────────────────────── N  generations
  users       1 ────────────────────── N  stripe_events
  generations 1 ────────────────────── 1  cv_versions
  generations 1 ────────────────────── 1  generation_logs
```

> Para una vista visual interactiva, importar el DBML de la sección 5 en [dbdiagram.io](http://dbdiagram.io).
> 

**DBML (para importar en [dbdiagram.io](http://dbdiagram.io)):**

```
Table users {
  id uuid [pk, not null, note: 'FK a auth.users']
  email text [not null]
  full_name text
  exports_available integer [not null, default: 1]
  subscription_active boolean [not null, default: false]
  subscription_expires_at timestamptz
  created_at timestamptz [not null, default: 'now()']
  updated_at timestamptz [not null, default: 'now()']
}

Table user_exports {
  id uuid [pk, not null]
  user_id uuid [not null, unique, ref: - users.id]
  exports_available integer [not null, default: 0]
  subscription_active boolean [not null, default: false]
  subscription_expires_at timestamptz
  updated_at timestamptz [not null, default: 'now()']
}

Table generations {
  id uuid [pk, not null]
  user_id uuid [not null, ref: > users.id]
  cv_text text [not null]
  job_description text [not null]
  job_url text
  output_language char(2) [not null]
  tone text
  focus text
  generate_cv boolean [not null, default: true]
  generate_cover boolean [not null, default: true]
  interview_result text [note: 'yes | no | pending']
  created_at timestamptz [not null, default: 'now()']
}

Table cv_versions {
  id uuid [pk, not null]
  generation_id uuid [not null, unique, ref: - generations.id]
  cv_optimizado text [not null]
  cover_letter text
  cover_letter_explanation text
  diff jsonb [not null]
  keywords text[] [not null]
  score_original integer [not null]
  score_optimizado integer [not null]
  falta_dato_fields text[]
  created_at timestamptz [not null, default: 'now()']
}

Table generation_logs {
  id uuid [pk, not null]
  generation_id uuid [not null, unique, ref: - generations.id]
  falta_dato_fields text[]
  falta_dato_filled text[]
  manual_edits boolean [not null, default: false]
  regenerations integer [not null, default: 0]
  time_in_preview_seconds integer
  export_format text [note: 'pdf | doc | text | none']
  created_at timestamptz [not null, default: 'now()']
}

Table stripe_events {
  id uuid [pk, not null]
  payment_intent_id text [not null, unique]
  user_id uuid [not null, ref: > users.id]
  tier text [not null]
  processed_at timestamptz [not null, default: 'now()']
}
```

---

## 5. Diccionario de Entidades

### Entidad: users

**Descripción:** Perfil del usuario de la aplicación. Complementa la tabla `auth.users` de Supabase (que gestiona autenticación) con datos de negocio: exportaciones disponibles y estado de suscripción. Se crea automáticamente vía trigger al registrarse con Google OAuth.

**Tabla:** `users` | **Motor:** PostgreSQL (Supabase, Frankfurt EU)

| Atributo | Tipo de dato | Nulable | Único | Descripción |
| --- | --- | --- | --- | --- |
| id | UUID | No | Sí (PK) | FK a `auth.users.id`. El mismo UUID que gestiona Supabase Auth |
| email | TEXT | No | No | Email del usuario. Copiado de `auth.users` al registrarse |
| full_name | TEXT | Sí | No | Nombre completo obtenido del perfil de Google OAuth |
| exports_available | INTEGER | No | No | Número de exportaciones disponibles. Default: 1 (exportación gratuita de bienvenida) |
| subscription_active | BOOLEAN | No | No | True si el usuario tiene suscripción mensual activa. Default: false |
| subscription_expires_at | TIMESTAMPTZ | Sí | No | Fecha de vencimiento de la suscripción mensual. NULL si no hay suscripción |
| created_at | TIMESTAMPTZ | No | No | Fecha de creación del registro. Default: NOW() |
| updated_at | TIMESTAMPTZ | No | No | Última modificación del registro. Default: NOW() |

**Índices:**

| Nombre del índice | Columnas | Tipo | Propósito |
| --- | --- | --- | --- |
| users_pkey | id | PRIMARY KEY | Acceso directo por ID |
| idx_users_email | email | INDEX | Búsqueda por email (soporte a posibles consultas admin) |

**Restricciones adicionales:**

- `id` tiene FK a `auth.users(id)` con `ON DELETE CASCADE`: si se elimina el usuario de auth, se elimina en cascada este registro.
- `exports_available >= 0`: constraint CHECK para evitar valores negativos.
- RLS habilitado: `auth.uid() = id`

---

### Entidad: user_exports

**Descripción:** Control de exportaciones disponibles por usuario. Tabla separada de `users` para facilitar actualizaciones atómicas del contador sin bloquear la fila completa del usuario. Relación 1:1 con `users`.

**Tabla:** `user_exports` | **Motor:** PostgreSQL (Supabase)

| Atributo | Tipo de dato | Nulable | Único | Descripción |
| --- | --- | --- | --- | --- |
| id | UUID | No | Sí (PK) | Identificador único |
| user_id | UUID | No | Sí (UNIQUE) | FK a `users.id`. Único: un registro por usuario |
| exports_available | INTEGER | No | No | Contador de exportaciones disponibles. Default: 0 |
| subscription_active | BOOLEAN | No | No | Redundancia controlada con `users.subscription_active` para consultas rápidas en el momento del export |
| subscription_expires_at | TIMESTAMPTZ | Sí | No | Redundancia con `users.subscription_expires_at` |
| updated_at | TIMESTAMPTZ | No | No | Última actualización del contador |

**Índices:**

| Nombre del índice | Columnas | Tipo | Propósito |
| --- | --- | --- | --- |
| user_exports_pkey | id | PRIMARY KEY | Acceso por ID |
| user_exports_user_id_key | user_id | UNIQUE | Garantiza 1 registro por usuario |

**Restricciones adicionales:**

- `exports_available >= 0`: constraint CHECK.
- RLS habilitado: `auth.uid() = user_id`
- Las columnas de suscripción son redundantes respecto a `users` de forma intencional para evitar JOINs en la verificación de exportaciones (operación crítica en el hot path).

> ⚠️ **Fuente de verdad de exportaciones:** `user_exports` es la tabla autoritativa para `exports_available` y el estado de suscripción. La función `canExport()` lee únicamente de `user_exports`. El webhook de Stripe **debe actualizar `user_exports` en primer lugar** y sincronizar `users` a continuación para mantener consistencia. Si solo se actualiza `users`, el paywall no se desbloquea. Ver SDD sección 7.7 para el detalle de implementación.
> 

---

### Entidad: generations

**Descripción:** Registro de cada generación realizada por un usuario. Contiene los inputs usados (CV, oferta, preferencias) y los metadatos de la candidatura. El texto del CV y la oferta se persiste aquí para permitir el historial y la reutilización. El resultado generado se almacena en `cv_versions`.

**Tabla:** `generations` | **Motor:** PostgreSQL (Supabase)

| Atributo | Tipo de dato | Nulable | Único | Descripción |
| --- | --- | --- | --- | --- |
| id | UUID | No | Sí (PK) | Identificador único de la generación |
| user_id | UUID | No | No | FK a `users.id`. El usuario que realizó la generación |
| cv_text | TEXT | No | No | Texto completo del CV original normalizado. Dato personal sensible (PII) |
| job_description | TEXT | No | No | Texto completo de la oferta normalizada |
| job_url | TEXT | Sí | No | URL original de la oferta si se proporcionó. NULL si se pegó el texto |
| output_language | CHAR(2) | No | No | Código de idioma de la salida: 'es', 'en', 'it' |
| tone | TEXT | Sí | No | Tono seleccionado: 'technical', 'senior', 'direct'. NULL si no se especificó |
| focus | TEXT | Sí | No | Enfoque seleccionado: 'backend', 'frontend', 'fullstack'. NULL si no se especificó |
| generate_cv | BOOLEAN | No | No | True si el usuario solicitó generar CV optimizado. Default: true |
| generate_cover | BOOLEAN | No | No | True si el usuario solicitó generar cover letter. Default: true |
| interview_result | TEXT | Sí | No | Resultado de la candidatura: 'yes', 'no', 'pending'. Campo opcional rellenable por el usuario. Default: 'pending' |
| created_at | TIMESTAMPTZ | No | No | Fecha de creación. Default: NOW() |

**Índices:**

| Nombre del índice | Columnas | Tipo | Propósito |
| --- | --- | --- | --- |
| generations_pkey | id | PRIMARY KEY | Acceso por ID |
| idx_generations_user_id | user_id | INDEX | Listado del historial del usuario |
| idx_generations_created_at | created_at DESC | INDEX | Ordenación cronológica del historial |

**Restricciones adicionales:**

- `output_language IN ('es', 'en', 'it')`: constraint CHECK.
- `interview_result IN ('yes', 'no', 'pending')`: constraint CHECK.
- RLS habilitado: `auth.uid() = user_id`
- `ON DELETE CASCADE` desde `users`: si se elimina el usuario, se eliminan todas sus generaciones.

---

### Entidad: cv_versions

**Descripción:** Almacena el resultado generado por el Motor de Contenido para cada generación: el CV optimizado, la cover letter, la explicación, el diff, las keywords y los scores ATS. Relación 1:1 con `generations`: cada generación tiene exactamente una versión de resultado.

**Tabla:** `cv_versions` | **Motor:** PostgreSQL (Supabase)

| Atributo | Tipo de dato | Nulable | Único | Descripción |
| --- | --- | --- | --- | --- |
| id | UUID | No | Sí (PK) | Identificador único |
| generation_id | UUID | No | Sí (UNIQUE) | FK a `generations.id`. UNIQUE: una versión por generación |
| cv_optimizado | TEXT | No | No | Texto completo del CV optimizado por el LLM |
| cover_letter | TEXT | Sí | No | Texto de la cover letter generada. NULL si no se solicitó |
| cover_letter_explanation | TEXT | Sí | No | Sección "Por qué funciona esta cover letter". NULL si no se generó cover |
| diff | JSONB | No | No | Array JSON de cambios: `[{"cambio": "", "motivo": "", "impacto": ""}]` |
| keywords | TEXT[] | No | No | Array de keywords extraídas de la oferta para el Score ATS |
| score_original | INTEGER | No | No | Score ATS del CV original antes de optimizar (0-100) |
| score_optimizado | INTEGER | No | No | Score ATS del CV optimizado (0-100) |
| falta_dato_fields | TEXT[] | Sí | No | Array de campos marcados como FALTA_DATO por el LLM. NULL si no hay |
| created_at | TIMESTAMPTZ | No | No | Fecha de creación. Default: NOW() |

**Índices:**

| Nombre del índice | Columnas | Tipo | Propósito |
| --- | --- | --- | --- |
| cv_versions_pkey | id | PRIMARY KEY | Acceso por ID |
| cv_versions_generation_id_key | generation_id | UNIQUE | Garantiza 1 resultado por generación |
| idx_cv_versions_score | score_optimizado | INDEX | Consultas analíticas sobre distribución de scores (moat de datos) |

**Restricciones adicionales:**

- `score_original BETWEEN 0 AND 100`: constraint CHECK.
- `score_optimizado BETWEEN 0 AND 100`: constraint CHECK.
- `ON DELETE CASCADE` desde `generations`.
- RLS: heredada a través de `generation_id` (el usuario debe ser dueño de la generación referenciada).

---

### Entidad: generation_logs

**Descripción:** Log de comportamiento de uso por generación. Es la tabla del moat de datos: registra cómo interactuó el usuario con el resultado (qué editó, cuánto tardó, qué descargó). Esta información retroalimenta el prompt maestro y los validadores a largo plazo. Relación 1:1 con `generations`.

**Tabla:** `generation_logs` | **Motor:** PostgreSQL (Supabase)

| Atributo | Tipo de dato | Nulable | Único | Descripción |
| --- | --- | --- | --- | --- |
| id | UUID | No | Sí (PK) | Identificador único |
| generation_id | UUID | No | Sí (UNIQUE) | FK a `generations.id`. UNIQUE: un log por generación |
| falta_dato_fields | TEXT[] | Sí | No | Campos que tenían marca FALTA_DATO en el resultado original |
| falta_dato_filled | TEXT[] | Sí | No | Campos FALTA_DATO que el usuario rellenó manualmente antes de exportar |
| manual_edits | BOOLEAN | No | No | True si el usuario editó alguna parte del texto del resultado. Default: false |
| regenerations | INTEGER | No | No | Número de veces que el usuario regeneró con otro tono o idioma. Default: 0 |
| time_in_preview_seconds | INTEGER | Sí | No | Tiempo en segundos que el usuario pasó en la Pantalla 2 antes de exportar. Medido en el frontend |
| export_format | TEXT | Sí | No | Formato exportado: 'pdf', 'doc', 'text', 'none' (si no exportó). NULL si la sesión se abandonó |
| created_at | TIMESTAMPTZ | No | No | Fecha de creación. Default: NOW() |

**Índices:**

| Nombre del índice | Columnas | Tipo | Propósito |
| --- | --- | --- | --- |
| generation_logs_pkey | id | PRIMARY KEY | Acceso por ID |
| generation_logs_generation_id_key | generation_id | UNIQUE | Garantiza 1 log por generación |
| idx_generation_logs_export_format | export_format | INDEX | Consultas analíticas sobre tasas de conversión por formato |
| idx_generation_logs_manual_edits | manual_edits | INDEX | Consultas sobre tasa de edición manual |

**Restricciones adicionales:**

- `export_format IN ('pdf', 'doc', 'text', 'none')`: constraint CHECK.
- `regenerations >= 0`: constraint CHECK.
- `ON DELETE CASCADE` desde `generations`.
- RLS: heredada a través de `generation_id`.

---

### Entidad: user_exports

Ver descripción completa en la sección anterior.

---

### Entidad: stripe_events

**Descripción:** Registro de idempotencia para webhooks de Stripe. Cada pago procesado se registra aquí con su `payment_intent_id` único para prevenir que un mismo pago se procese dos veces (Stripe puede reenviar webhooks ante fallos de red). Esta tabla no contiene datos de pago sensibles — solo identificadores.

**Tabla:** `stripe_events` | **Motor:** PostgreSQL (Supabase)

| Atributo | Tipo de dato | Nulable | Único | Descripción |
| --- | --- | --- | --- | --- |
| id | UUID | No | Sí (PK) | Identificador único |
| payment_intent_id | TEXT | No | Sí (UNIQUE) | ID del PaymentIntent de Stripe. UNIQUE: garantiza idempotencia |
| user_id | UUID | No | No | FK a `users.id`. El usuario que realizó el pago |
| tier | TEXT | No | No | Tier adquirido: '10_exports' o 'monthly_unlimited' |
| processed_at | TIMESTAMPTZ | No | No | Fecha en que se procesó el webhook. Default: NOW() |

**Índices:**

| Nombre del índice | Columnas | Tipo | Propósito |
| --- | --- | --- | --- |
| stripe_events_pkey | id | PRIMARY KEY | Acceso por ID |
| stripe_events_payment_intent_id_key | payment_intent_id | UNIQUE | Verificación de idempotencia en el handler del webhook |
| idx_stripe_events_user_id | user_id | INDEX | Historial de pagos por usuario |

**Restricciones adicionales:**

- `tier IN ('10_exports', 'monthly_unlimited')`: constraint CHECK.
- RLS habilitado: `auth.uid() = user_id`.
- No contiene números de tarjeta, CVV ni datos de pago sensibles. Stripe gestiona esa información en sus propios servidores.

---

## 6. Diccionario de Relaciones

| Entidad A | Relación | Entidad B | Tabla intermedia | Descripción |
| --- | --- | --- | --- | --- |
| auth.users | 1:1 | users | — | Al registrarse con Google OAuth, un trigger crea automáticamente el registro en `users`. Mismo UUID como PK y FK |
| users | 1:1 | user_exports | — | Cada usuario tiene exactamente un registro de control de exportaciones. Creado por el mismo trigger |
| users | 1:N | generations | — | Un usuario puede tener múltiples generaciones (historial de candidaturas) |
| users | 1:N | stripe_events | — | Un usuario puede tener múltiples eventos de pago procesados |
| generations | 1:1 | cv_versions | — | Cada generación tiene exactamente una versión de resultado (CV optimizado + cover + diff + scores) |
| generations | 1:1 | generation_logs | — | Cada generación tiene exactamente un log de comportamiento de uso |

---

## 7. Claves Foráneas

| Tabla | Columna FK | Referencia | On Delete | On Update |
| --- | --- | --- | --- | --- |
| users | id | [auth.users.id](http://auth.users.id) | CASCADE | CASCADE |
| user_exports | user_id | [users.id](http://users.id) | CASCADE | CASCADE |
| generations | user_id | [users.id](http://users.id) | CASCADE | CASCADE |
| cv_versions | generation_id | [generations.id](http://generations.id) | CASCADE | CASCADE |
| generation_logs | generation_id | [generations.id](http://generations.id) | CASCADE | CASCADE |
| stripe_events | user_id | [users.id](http://users.id) | CASCADE | CASCADE |

**Justificación de CASCADE en todos los casos:**

El sistema debe garantizar el borrado completo en cascada de todos los datos del usuario al eliminar la cuenta (obligación GDPR — Right to Erasure, Art. 17). El CASCADE propaga el borrado desde `auth.users` → `users` → todas las tablas dependientes sin necesidad de queries manuales en el handler de borrado.

---

## 8. Consideraciones de Rendimiento

**Consultas más frecuentes y sus índices:**

| Consulta | Tabla(s) | Índice usado | Frecuencia estimada |
| --- | --- | --- | --- |
| Listado del historial del usuario (ordenado por fecha) | generations | idx_generations_user_id + idx_generations_created_at | Alta (cada visita al historial) |
| Verificación de exportaciones disponibles antes de exportar | user_exports | user_exports_user_id_key (UNIQUE scan) | Alta (cada exportación) |
| Obtener resultado de una generación específica | cv_versions | cv_versions_generation_id_key (UNIQUE scan) | Alta (carga del resultado) |
| Verificación de idempotencia de webhook Stripe | stripe_events | stripe_events_payment_intent_id_key (UNIQUE scan) | Baja (solo en pagos) |
| Consultas analíticas sobre logs de uso (moat de datos) | generation_logs | idx_generation_logs_export_format, idx_generation_logs_manual_edits | Muy baja (solo dashboard interno) |

**Volumen estimado de datos:**

| Tabla | Volumen estimado (filas) | Crecimiento estimado | Observación |
| --- | --- | --- | --- |
| users | 0 → 1.000 (MVP) | +500/mes tras tracción | Tabla pequeña, sin preocupaciones |
| user_exports | Igual que users | Igual que users | 1:1 con users |
| generations | 0 → 5.000 (MVP) | +2.000/mes tras tracción | Media de 5 generaciones por usuario activo |
| cv_versions | Igual que generations | Igual que generations | 1:1 con generations |
| generation_logs | Igual que generations | Igual que generations | 1:1 con generations |
| stripe_events | 0 → 500 (MVP) | +200/mes tras tracción | Solo pagos completados |

**Consideraciones adicionales:**

- `cv_text` y `job_description` en `generations` pueden ser TEXT largo (~5-50KB por fila). A partir de 100.000 generaciones evaluar compresión de columna o archivar generaciones antiguas.
- `diff` en `cv_versions` es JSONB: PostgreSQL lo indexa internamente con GIN si se necesitan consultas dentro del JSON. No necesario en el MVP.
- `keywords` es `TEXT[]`: se puede usar un índice GIN en el futuro si se quieren consultas del tipo "cuántas generaciones usaron la keyword X". No necesario en el MVP.
- El plan gratuito de Supabase tiene 500MB de BD. Con el volumen estimado del MVP (~5.000 generaciones × ~20KB promedio por fila de `generations` + `cv_versions`) = ~100MB. El free tier aguanta hasta ~25.000 generaciones.

---

## 9. Consideraciones de Seguridad y Privacidad

**Clasificación de datos sensibles:**

| Tabla | Campo | Clasificación | Tratamiento requerido |
| --- | --- | --- | --- |
| users | email | PII (GDPR) | No mostrar en logs. Acceso solo del propio usuario vía RLS |
| users | full_name | PII (GDPR) | No mostrar en logs. Acceso solo del propio usuario |
| generations | cv_text | PII sensible (GDPR) | El texto del CV contiene nombre, teléfono, experiencia laboral. No loguear. Cifrado en reposo vía Supabase (AES-256). Borrado en cascada al eliminar cuenta |
| generations | job_description | Potencialmente confidencial | Puede contener información interna de la empresa. No loguear |
| cv_versions | cv_optimizado | PII sensible (GDPR) | Mismo tratamiento que `cv_text` |
| cv_versions | cover_letter | PII (GDPR) | Contiene información personal del candidato |
| stripe_events | payment_intent_id | Dato financiero (referencia) | Solo IDs de referencia, no datos de tarjeta. No es PCI |

**Cumplimiento GDPR:**

- RLS habilitado en todas las tablas: cada usuario solo accede a sus propios datos a nivel de BD.
- Borrado en cascada garantizado: `ON DELETE CASCADE` propaga desde `auth.users` a todas las tablas. Un `DELETE` en `auth.users` elimina todos los datos del usuario sin queries adicionales.
- Retención de datos: los datos de generaciones se conservan mientras el usuario tenga cuenta activa. Al eliminar la cuenta, se eliminan todos los registros de forma permanente e irreversible.
- Cifrado en reposo: Supabase cifra el volumen de PostgreSQL con AES-256 de forma transparente. No se requiere cifrado a nivel de aplicación adicional para el MVP.
- Los archivos temporales (CVs subidos) se almacenan en Supabase Storage con TTL de 1 hora y se eliminan automáticamente. No están modelados en este ERD porque no tienen persistencia.

**Campos que nunca deben aparecer en logs:**

- `cv_text`, `job_description`, `cv_optimizado`, `cover_letter`: contienen PII.
- `users.email`, `users.full_name`: PII básico.
- Cualquier token JWT.

---

## 10. Historial de Decisiones de Diseño

| Decisión | Alternativas descartadas | Justificación |
| --- | --- | --- |
| UUID como PK en todas las tablas | BIGINT autoincremental | Evita enumeración de registros por usuarios maliciosos, facilita futura distribución, y es el estándar de Supabase Auth (que usa UUID) |
| Relación 1:1 entre `generations` y `cv_versions` | Guardar el resultado dentro de `generations` | Separa los inputs (generations) del output (cv_versions) facilitando la evolución independiente del esquema. Si en el futuro se permiten múltiples versiones por generación, solo cambia la cardinalidad de esta relación |
| Relación 1:1 entre `generations` y `generation_logs` | Guardar los logs dentro de `generations` | Los logs de uso son datos analíticos que no se leen en el flujo normal del usuario. Separarlos evita que las consultas del historial arrastren columnas analíticas pesadas |
| Tabla `user_exports` separada de `users` | Un campo `exports_available` en `users` | Las actualizaciones del contador de exportaciones son operaciones frecuentes y concurrentes (especialmente en el webhook de Stripe). Tener una tabla dedicada permite actualizaciones atómicas con menos contención sobre la fila completa del usuario |
| `ON DELETE CASCADE` en todas las FKs | `ON DELETE RESTRICT` o soft delete | El requisito GDPR de borrado irreversible en cascada hace que CASCADE sea la única opción correcta. Un soft delete con campo `deleted_at` no satisface el Right to Erasure del Art. 17 del GDPR |
| Persistir `cv_text` en `generations` | No persistir el CV original | El historial de versiones (RF-020) requiere que el usuario pueda ver los inputs usados en cada candidatura. Sin `cv_text`, el historial pierde contexto. La protección es RLS + cifrado en reposo + borrado en cascada |
| Campo `interview_result` en `generations` | Tabla separada de outcomes | La cardinalidad es 1:1 (un resultado por candidatura) y el campo es simple (enum de 3 valores). No justifica tabla separada. Facilita las consultas analíticas del moat de datos |

---

## 11. Aprobaciones

| Rol | Nombre | Decisión | Fecha |
| --- | --- | --- | --- |
| Arquitecto de datos / Tech Lead | — | Aprobado / Rechazado | — |
| Product Owner | — | Aprobado / Rechazado | — |
| Representante de Seguridad (GDPR) | — | Aprobado / Rechazado | — |