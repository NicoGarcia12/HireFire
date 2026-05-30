# HireFire 🔥

Buscador inteligente de postulaciones laborales. A partir de tu **perfil** y un set de
**palabras clave**, recupera ofertas de LinkedIn (vía **Apify**) y las **rankea
semánticamente** contra tu perfil usando la **API de Claude**.

> Diseño completo en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
> Configuración de keys y costos en [`docs/SETUP.md`](docs/SETUP.md).

---

## Stack

- **Backend**: Node.js + Express + TypeScript
- **Datos de ofertas**: Apify (LinkedIn Jobs Scraper)
- **Matching**: Claude API (`claude-sonnet-4-6`) con prompt caching del perfil
- **Validación**: Zod
- **Frontend** (Fase 2): Angular (standalone + signals)

---

## Estado

- [x] **Fase 1 — MVP backend**: API REST, integración Apify, matching con Claude
- [x] **Fase 2a — UI Angular**: perfil + búsqueda + resultados rankeados
- [x] **Fase 2b — Persistencia PostgreSQL/Prisma**: el perfil ya no se pierde al reiniciar
- [ ] **Fase 3 — Auth, historial, alertas**
- [ ] **Fase 4 — Importador del export de LinkedIn**

---

## Puesta en marcha (backend)

```bash
# 1) Levantar PostgreSQL (desde la raíz del repo)
docker compose up -d

# 2) Backend
cd backend
cp .env.example .env       # completar APIFY_TOKEN y ANTHROPIC_API_KEY
npm install
npm run db:push            # crea las tablas en la DB (o: npm run prisma:migrate)
npm run dev
```

> La base corre con `docker-compose.yml` (Postgres 16). El `DATABASE_URL` del
> `.env.example` ya apunta a ese contenedor (`hirefire:hirefire@localhost:5432`).

## Puesta en marcha (frontend Angular)

```bash
cd frontend
npm install
npm start            # ng serve → http://localhost:4200
```

> El backend debe estar corriendo en `:3000` (el front pega directo vía CORS).
> Flujo en la UI: **1)** cargás tu perfil → **2)** buscás por keywords → ves las ofertas
> rankeadas con su score, razones de match y gaps.

---

### Variables de entorno

| Variable            | Descripción                                   |
|---------------------|-----------------------------------------------|
| `PORT`              | Puerto del servidor (default 3000)            |
| `DATABASE_URL`      | Cadena de conexión PostgreSQL (Prisma)        |
| `APIFY_TOKEN`       | Token de Apify                                |
| `APIFY_JOBS_ACTOR`  | Actor de jobs (default `bebity~linkedin-jobs-scraper`) |
| `ANTHROPIC_API_KEY` | API key de Claude                             |
| `CLAUDE_MODEL`      | Modelo (default `claude-sonnet-4-6`)          |

---

## API

| Método | Ruta                | Descripción                              |
|--------|---------------------|------------------------------------------|
| GET    | `/api/health`       | Healthcheck                              |
| POST   | `/api/profile`      | Carga/actualiza el perfil                |
| GET    | `/api/profile/:id`  | Devuelve el perfil                       |
| POST   | `/api/jobs/search`  | Busca ofertas en Apify (sin ranking)     |
| POST   | `/api/search`       | Busca + rankea contra el perfil (full)   |

### Ejemplo — flujo completo

```bash
# 1) Crear perfil
curl -X POST http://localhost:3000/api/profile \
  -H 'Content-Type: application/json' \
  -d '{
    "headline": "Backend Developer",
    "summary": "Especializado en Node.js y TypeScript",
    "skills": ["Node.js", "TypeScript", "Express", "PostgreSQL"],
    "experience": [
      { "title": "Backend Dev", "company": "Acme", "description": "APIs REST" }
    ],
    "preferences": { "locations": ["Argentina"], "remote": true }
  }'
# → devuelve { "id": "...", ... }

# 2) Buscar + rankear
curl -X POST http://localhost:3000/api/search \
  -H 'Content-Type: application/json' \
  -d '{
    "profileId": "<id-del-paso-1>",
    "keywords": "backend node typescript",
    "location": "Argentina",
    "remote": true,
    "limit": 30
  }'
```

---

## Notas legales

- No se usa la API oficial de LinkedIn (restringida a partners enterprise).
- Apify scrapea **datos públicos** de ofertas. Uso personal y razonable.
- El perfil propio se carga manualmente o desde tu propio export de datos de LinkedIn.
