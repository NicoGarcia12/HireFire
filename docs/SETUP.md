# HireFire — Instructivo de configuración y costos

Guía paso a paso para preparar el entorno, obtener las credenciales externas y validar que el backend pueda arrancar.

> Runtime validado con **Node 22**. El repo incluye `.nvmrc` pinneado en `22.22.2`.

---

## 1. Variables mínimas que necesitás

El backend falla al iniciar si faltan variables obligatorias. Hoy las mínimas son:

```
┌─────────────────────────────────────────────────────────────┐
│                      backend/.env                            │
│                                                              │
│   DATABASE_URL=postgresql://...                 ◄── Prisma   │
│   APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxx   ◄── ofertas    │
│   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxx   ◄── ranking    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Dónde poner las keys (paso a paso)

```
backend/
├── .env.example   ← plantilla versionada (NO tiene secretos)
└── .env           ← TU archivo real (NO se sube a git, está en .gitignore)
```

### Paso 1 — Copiar la plantilla

```bash
cd /ruta/a/HireFire/backend
cp .env.example .env
```

### Paso 2 — Editar `.env` y pegar tus claves

```ini
PORT=3000

# PostgreSQL
DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire?schema=public

# Apify
APIFY_TOKEN=apify_api_TU_TOKEN_REAL_ACA
APIFY_JOBS_ACTOR=curious_coder/linkedin-jobs-scraper

# Groq
GROQ_API_KEY=gsk_TU_KEY_REAL_ACA
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
```

> ⚠️ **Nunca** subas el `.env` a GitHub ni lo pegues en un chat. Ya está protegido por
> `.gitignore`, pero la regla es: las keys viven solo en tu máquina.

---

## 3. De dónde sacar cada key

### 🔑 Apify (`APIFY_TOKEN`)

```
1. Crear cuenta gratis ──► https://console.apify.com/sign-up
2. Ir a:  Settings ─► Integrations ─► API tokens
   URL directa: https://console.apify.com/account/integrations
3. Copiar el "Personal API token"  (empieza con apify_api_...)
4. Pegarlo en .env  →  APIFY_TOKEN=...
```

El plan **Free** de Apify viene con **$5 USD de crédito mensual** que se renueva. Para uso
personal probablemente nunca lo gastes.

### 🔑 Groq (`GROQ_API_KEY`)

```
1. Crear cuenta ──► https://console.groq.com
2. Ir a: API Keys ─► Create API Key
3. Copiar la key (empieza con gsk_...)
4. Pegarla en .env  →  GROQ_API_KEY=...
```

> El repo asume Groq como proveedor de IA. El modelo por defecto es `llama-3.3-70b-versatile`,
> configurable desde `GROQ_MODEL`.

---

## 4. Notas de costos

Una búsqueda completa combina:

- una llamada al actor de Apify para traer ofertas,
- una o más llamadas a Groq para ranking,
- y, opcionalmente, una llamada adicional a Groq para analizar el perfil.

### 4.1. Apify

- Modelo **pay-per-result**: pagás por oferta traída.
- El crédito y el costo dependen de tu cuenta y del actor configurado en `APIFY_JOBS_ACTOR`.
- El repo no calcula ni valida precios en runtime.

### 4.2. Groq

- HireFire envía el perfil y las ofertas al modelo configurado en `GROQ_MODEL`.
- El costo real depende de tu plan, del modelo elegido y de la longitud de las descripciones.
- Desde el código se puede confirmar que cada descripción se recorta a **1.500 caracteres** y que el matching corre en lotes de **8 ofertas**.
- Para confirmar pricing vigente, revisá la documentación comercial de Groq antes de estimar costos.

### 4.3. Qué sí podés ajustar desde la app

- Bajar `limit` en la búsqueda reduce linealmente ofertas y tokens.
- Usar un modelo distinto en `GROQ_MODEL` cambia costo, latencia y calidad.
- El análisis de perfil es una llamada separada: si no lo usás, no consumís esa parte.

---

## 5. Crear la base y sincronizar Prisma

```bash
cd /ruta/a/HireFire/backend
npm ci
npm run db:push
```

`db:push` crea o sincroniza las tablas definidas en `backend/prisma/schema.prisma`:

- `Profile`
- `Experience`
- `Search`
- `SavedSearch`

---

## 6. Verificar que quedó bien

```bash
cd /ruta/a/HireFire/backend
npm run dev
```

- ✅ Si ves `HireFire backend escuchando en http://localhost:3000` → las keys están OK.
- ✅ Si `curl http://localhost:3000/api/health` responde `{"status":"ok","service":"hirefire-backend"}` → backend operativo.
- ✅ Smoke de persistencia real: `POST /api/profile` y después `GET /api/profile/:id` → confirma que Prisma/PostgreSQL están guardando y leyendo bien.
- ❌ Si ves `Falta la variable de entorno requerida: ...` → revisá el `.env`.
- ❌ Si Prisma no conecta → verificá `DATABASE_URL` y que PostgreSQL esté levantado.
