# HireFire 🔥

Buscador inteligente de postulaciones laborales. Cargás tu perfil y palabras clave,
recupera ofertas de LinkedIn vía **Apify** y las rankea con **Claude** según cuánto
encajan con tu experiencia.

> Diseño detallado → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
> Obtener API keys y costos → [`docs/SETUP.md`](docs/SETUP.md)

---

## Stack

| Capa         | Tecnología                                      |
|--------------|-------------------------------------------------|
| Backend      | Node.js 22 + Express + TypeScript               |
| Base de datos| PostgreSQL 16 (Docker) + Prisma ORM             |
| Datos jobs   | Apify — LinkedIn Jobs Scraper                   |
| Matching     | Claude API `claude-sonnet-4-6` (prompt caching) |
| Validación   | Zod                                             |
| Frontend     | Angular 21 (standalone + signals)               |

---

## Estado del proyecto

- [x] **Fase 1** — Backend Express + API REST + Apify + matching con Claude
- [x] **Fase 2a** — UI Angular (perfil, búsqueda, resultados rankeados)
- [x] **Fase 2b** — Persistencia PostgreSQL + Prisma
- [ ] **Fase 3** — Auth, historial de búsquedas, alertas por keywords
- [ ] **Fase 4** — Importador del export ZIP de LinkedIn

---

## Prerequisitos

- **Node.js 22+** (`node --version`)
- **Docker Desktop** corriendo (`docker --version`)
- **API keys** de Apify y Anthropic — ver [`docs/SETUP.md`](docs/SETUP.md) para obtenerlas

---

## Cómo levantar todo

### 1. Clonar y configurar variables de entorno

```bash
git clone git@github.com:NicoGarcia12/HireFire.git
cd HireFire

cd backend
copy .env.example .env   # Windows CMD/PowerShell
# cp .env.example .env   # bash/Git Bash
```

Editar `backend/.env` y completar:

```ini
DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire?schema=public
APIFY_TOKEN=apify_api_...        # de https://console.apify.com/account/integrations
ANTHROPIC_API_KEY=sk-ant-...     # de https://console.anthropic.com/settings/keys
```

### 2. Levantar la base de datos

```bash
# Desde la raíz del repo
docker compose up -d
```

Verificar que esté sana:

```bash
docker ps   # debe mostrar hirefire-postgres con estado "healthy"
```

### 3. Instalar dependencias y crear las tablas

```bash
cd backend
npm install
npm run db:push   # crea las tablas Profile y Experience en Postgres
```

Salida esperada: `Your database is now in sync with your Prisma schema.`

### 4. Iniciar el backend

```bash
npm run dev
```

Salida esperada: `HireFire backend escuchando en http://localhost:3000`

### 5. Iniciar el frontend

En una terminal aparte:

```bash
cd frontend
npm install
npm start   # ng serve → http://localhost:4200
```

---

## Cómo probar lo construido hasta ahora

### Verificación rápida — healthcheck

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","service":"hirefire-backend"}
```

---

### Opción A — Desde la UI (recomendado)

1. Abrí `http://localhost:4200` en el navegador.
2. **Sección "1 · Tu perfil"** — completá headline, skills, experiencia y preferencias. Hacé clic en **Guardar perfil**. Aparece el badge `Guardado ✓`.
3. **Sección "2 · Buscar ofertas"** — ingresá keywords (ej. `backend node`), ubicación y límite de resultados. Hacé clic en **Buscar**.
4. Esperás unos segundos (Apify scrapea + Claude rankea) y aparece la lista de ofertas ordenada por **score 0–100**, con razones de match y gaps por cada una.

---

### Opción B — Desde la terminal (cURL)

#### Paso 1 — Crear perfil

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Backend Developer Node.js",
    "summary": "Especializado en Node.js y TypeScript",
    "skills": ["Node.js", "TypeScript", "Express", "PostgreSQL"],
    "experience": [
      { "title": "Backend Dev", "company": "Acme", "description": "APIs REST con Express" }
    ],
    "preferences": { "locations": ["Argentina"], "remote": true }
  }'
```

Guardá el `"id"` que devuelve, lo necesitás en el siguiente paso.

#### Paso 2 — Buscar y rankear

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "<id-del-paso-1>",
    "keywords": "backend node typescript",
    "location": "Argentina",
    "remote": true,
    "limit": 20
  }'
```

Respuesta: array de ofertas ordenadas por `score` (0–100), cada una con `reasons` y `gaps`.

#### Verificar que el perfil persiste

Reiniciá el backend (`Ctrl+C` y `npm run dev`) y luego:

```bash
curl http://localhost:3000/api/profile/<id-del-paso-1>
# → debe devolver el perfil (vive en Postgres, no en memoria)
```

---

## Variables de entorno

| Variable            | Requerida | Descripción                                          |
|---------------------|-----------|------------------------------------------------------|
| `PORT`              | No        | Puerto del servidor (default `3000`)                 |
| `DATABASE_URL`      | **Sí**    | Cadena de conexión PostgreSQL                        |
| `APIFY_TOKEN`       | **Sí**    | Token de Apify para scrapear ofertas                 |
| `APIFY_JOBS_ACTOR`  | No        | Actor (default `bebity~linkedin-jobs-scraper`)       |
| `ANTHROPIC_API_KEY` | **Sí**    | API key de Claude para el ranking                    |
| `CLAUDE_MODEL`      | No        | Modelo (default `claude-sonnet-4-6`)                 |

---

## Endpoints de la API

| Método | Ruta                | Descripción                                       |
|--------|---------------------|---------------------------------------------------|
| GET    | `/api/health`       | Healthcheck                                       |
| POST   | `/api/profile`      | Crea o actualiza el perfil (persiste en Postgres) |
| GET    | `/api/profile/:id`  | Devuelve el perfil por id                         |
| POST   | `/api/jobs/search`  | Busca ofertas en Apify sin rankear                |
| POST   | `/api/search`       | Busca + rankea contra el perfil (flujo completo)  |

---

## Notas legales

- No se usa la API oficial de LinkedIn (restringida a partners enterprise, $10k+/año).
- Apify scrapea **datos públicos** de ofertas. Uso personal y razonable.
- El perfil se carga manualmente; en Fase 4 se agregará el importador del export propio de LinkedIn.
