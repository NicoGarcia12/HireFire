# HireFire 🔥

Buscador inteligente de postulaciones laborales. Cargás tu perfil, ingresás palabras clave, y la app recupera ofertas de LinkedIn vía **Apify** y las rankea con **Groq + Llama 3.3 70B** según cuánto encajan con tu experiencia.

> Documentación técnica → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 🧰 Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | Angular 20 · standalone components · signals · Angular Material 20 (M3 dark) |
| **Backend** | Node.js 22 · Express · TypeScript · ESM |
| **Base de datos** | PostgreSQL 16 + Prisma ORM |
| **Scraping** | Apify — LinkedIn Jobs Scraper |
| **IA / Ranking** | Groq API — `llama-3.3-70b-versatile` (tier gratuito) |
| **Validación** | Zod |
| **Linting** | ESLint 9 (flat config) + Prettier 3 |

---

## ✅ Qué hace

1. **Guarda tu perfil** — headline, skills, experiencia, ubicaciones y preferencias de seniority.
2. **Importa desde LinkedIn** — subís el ZIP de export de LinkedIn y el formulario se completa solo.
3. **Analiza tu perfil** — Groq/Llama evalúa fortalezas y sugiere mejoras con score 0–100.
4. **Busca y rankea** — busca ofertas en Apify con tus keywords y las ordena por compatibilidad con tu perfil.
5. **Filtros de idioma** — excluye ofertas escritas en idiomas que no aceptás (inglés, portugués, más por venir).
6. **Guarda búsquedas** — podés nombrar y reutilizar combinaciones de keywords/filtros.
7. **Historial** — todas las búsquedas quedan guardadas para re-ejecutar o revisar.
8. **Exportá CSV** — descargás los resultados rankeados en un click.

---

## 📋 Prerequisitos

- **Git**
- **Node.js 22** — el repo está pinneado con `.nvmrc` en `22.22.2`. Recomendado usar [nvm](https://github.com/nvm-sh/nvm) (`nvm use`).
- **PostgreSQL 16+**
- **Cuentas gratuitas** en Apify y Groq (instrucciones abajo)

---

## 🚀 Instalación paso a paso

### 1 · Instalar PostgreSQL

**Linux (Ubuntu/Debian)**
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql && sudo systemctl enable postgresql
```

**Windows** — descargar el installer desde postgresql.org, instalar con puerto por defecto (5432).

**Crear usuario y base de datos** (igual en ambos SO):

```bash
# Linux
sudo -u postgres psql -c "CREATE USER hirefire WITH PASSWORD 'hirefire';"
sudo -u postgres psql -c "CREATE DATABASE hirefire OWNER hirefire;"
```

```sql
-- Windows (SQL Shell o pgAdmin)
CREATE USER hirefire WITH PASSWORD 'hirefire';
CREATE DATABASE hirefire OWNER hirefire;
```

---

### 2 · Clonar el repositorio

```bash
git clone git@github.com:NicoGarcia12/HireFire.git
cd HireFire
nvm use          # activa Node 22.22.2
```

---

### 3 · Obtener API keys (ambas gratuitas)

**Apify** — datos de ofertas de LinkedIn
1. Crear cuenta en [console.apify.com](https://console.apify.com/sign-up)
2. **Settings → Integrations → API tokens** → copiar el token (`apify_api_...`)
> Plan Free: $5 USD de crédito mensual, más que suficiente para uso personal.

**Groq** — ranking con IA
1. Crear cuenta en [console.groq.com](https://console.groq.com)
2. **API Keys → Create API Key** → copiar la key (`gsk_...`)
> Tier gratuito con límites por minuto holgados para uso personal.

---

### 4 · Configurar variables de entorno

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env` y completar:

```ini
DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire?schema=public
APIFY_TOKEN=apify_api_...
GROQ_API_KEY=gsk_...
```

> ⚠️ `.env` está en `.gitignore` — nunca se sube al repositorio.

---

### 5 · Instalar dependencias y migrar la base de datos

```bash
# Backend
cd backend
npm ci
npm run db:push
# → "Your database is now in sync with your Prisma schema."

# Frontend (en otra terminal)
cd frontend
npm ci
```

---

### 6 · Iniciar los servidores

**Backend** (terminal 1):
```bash
cd backend
npm run dev
# → HireFire backend escuchando en http://localhost:3000
```

**Frontend** (terminal 2):
```bash
cd frontend
npm start
# → Local: http://localhost:4200
```

Abrir **http://localhost:4200** en el navegador.

> Si el puerto 4200 está ocupado: `npm start -- --port 4201`

---

## 📖 Cómo usar la app

El flujo tiene 3 pasos, guiados por el stepper visual al tope de la página:

### Paso 1 — Cargar tu perfil

- Completar **Headline**, **Skills** (separadas por coma), **Ubicaciones** y **Experiencia**.
- O bien hacer clic en **⬆ Importar LinkedIn ZIP** para pre-llenar automáticamente desde tu export de LinkedIn.
- Clic en **Guardar perfil** → aparece el badge `Guardado ✓`.
- Opcional: **🔍 Analizar perfil** genera un informe de fortalezas y sugerencias con score.

### Paso 2 — Buscar ofertas

- Ingresar **palabras clave** (ej. `backend node typescript`), ubicación y cantidad de resultados.
- Configurar **Idiomas permitidos** si querés filtrar por idioma antes del ranking.
- Clic en **Buscar** → Apify trae las ofertas, Groq las rankea contra tu perfil.

### Paso 3 — Resultados

- Cada oferta muestra **score 0–100**, razones de match, gaps y advertencias de idioma.
- **💾 Guardar búsqueda** para reutilizar la combinación de filtros.
- **⬇ Exportar CSV** para descargar todos los resultados.
- El **historial** queda disponible en la parte inferior para re-ejecutar búsquedas anteriores.

---

## 🌐 Filtro de idioma

Permite reducir ruido antes del ranking con IA, ahorrando tokens de Groq.

- Agregar idiomas al array **Idiomas permitidos** con el selector → botón **Agregar**.
- Para cada idioma, elegir el **nivel máximo aceptado** (A1 → C2).
- Las ofertas **escritas íntegramente** en un idioma no permitido se excluyen.
- Los requisitos marcados como **deseables** generan un warning sin bloquear la oferta.

---

## 🔌 API endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Healthcheck |
| POST | `/api/profile` | Crear o actualizar perfil |
| GET | `/api/profile/:id` | Obtener perfil por ID |
| POST | `/api/profile/:id/analyze` | Analizar perfil con IA |
| POST | `/api/profile/import-linkedin` | Importar ZIP de LinkedIn |
| POST | `/api/search` | Buscar + rankear + guardar en historial |
| GET | `/api/history?profileId=...` | Listar historial de búsquedas |
| DELETE | `/api/history/:id` | Eliminar registro del historial |
| GET | `/api/saved-searches?profileId=...` | Listar búsquedas guardadas |
| POST | `/api/saved-searches` | Guardar búsqueda reutilizable |
| DELETE | `/api/saved-searches/:id` | Eliminar búsqueda guardada |

---

## ⚙️ Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `PORT` | No | `3000` | Puerto del servidor |
| `DATABASE_URL` | **Sí** | — | Cadena de conexión PostgreSQL |
| `APIFY_TOKEN` | **Sí** | — | Token de Apify |
| `APIFY_JOBS_ACTOR` | No | `curious_coder/linkedin-jobs-scraper` | Actor de LinkedIn Jobs |
| `GROQ_API_KEY` | **Sí** | — | API key de Groq |
| `GROQ_BASE_URL` | No | `https://api.groq.com/openai/v1` | Base URL de Groq |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Modelo de Groq |

---

## 🧪 Verificación rápida (cURL)

```bash
# Healthcheck
curl http://localhost:3000/api/health
# → {"status":"ok","service":"hirefire-backend"}

# Crear perfil
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Backend Developer Node.js",
    "skills": ["Node.js", "TypeScript", "Express"],
    "experience": [{ "title": "Backend Dev", "company": "Acme", "description": "APIs REST" }],
    "preferences": { "locations": ["Argentina"], "remote": true }
  }'
# → guarda el "id" de la respuesta

# Buscar y rankear
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "<id-del-paso-anterior>",
    "keywords": "backend node typescript",
    "location": "Argentina",
    "remote": true,
    "limit": 20
  }'
```

---

## ⚖️ Notas legales

- No se usa la API oficial de LinkedIn (restringida a partners enterprise).
- Apify scrapea **datos públicos** de ofertas. Uso personal y razonable.
- El perfil puede cargarse manualmente o importarse desde tu propio export ZIP de LinkedIn.
