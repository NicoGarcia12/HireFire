# HireFire — Diseño de la aplicación

> Buscador inteligente de postulaciones laborales. A partir de tu perfil y un set de
> palabras clave, recupera ofertas de LinkedIn (vía Apify) y las rankea semánticamente
> contra tu perfil usando la API de Claude.

---

## 1. Objetivo

1. **Analizar tu perfil** (exportado de LinkedIn o cargado manualmente) para tener un
   modelo estructurado de tu experiencia, skills y preferencias.
2. **Buscar ofertas** en LinkedIn por keywords + filtros (ubicación, modalidad, seniority).
3. **Rankear** cada oferta contra tu perfil con un score de _match_ (0–100) explicable,
   generado por Claude.
4. Exponer todo vía una **API REST** y una **UI Angular** donde guardás búsquedas,
   ves el ranking y marcás postulaciones.

---

## 2. Stack

| Capa        | Tecnología                                   |
|-------------|----------------------------------------------|
| Backend     | Node.js + Express + TypeScript               |
| Datos jobs  | Apify (LinkedIn Jobs Scraper actor)          |
| Matching    | Claude API (`@anthropic-ai/sdk`)             |
| Validación  | Zod                                          |
| Frontend    | Angular (standalone components + signals)    |
| Persistencia| Fase 1: en memoria/JSON · Fase 2: PostgreSQL + Prisma |

---

## 3. Arquitectura (alto nivel)

```
┌────────────┐     keywords/filtros      ┌──────────────────────────┐
│  Angular   │ ────────────────────────► │   Express API (TS)        │
│  (UI)      │ ◄──────────────────────── │                           │
└────────────┘     jobs rankeados        │  ┌─────────────────────┐  │
                                         │  │ modules/profile     │  │
                                         │  │ modules/jobs ───────┼──┼──► Apify
                                         │  │ modules/matching ───┼──┼──► Claude API
                                         │  └─────────────────────┘  │
                                         └──────────────────────────┘
```

### Flujo principal (`POST /api/search`)

1. La UI envía `{ keywords, location, remote, seniority }` + `profileId`.
2. `jobs.service` llama al actor de Apify y normaliza las ofertas a `Job`.
3. `matching.service` toma el `Profile` + cada `Job` y pide a Claude un score + razones.
4. La API devuelve las ofertas ordenadas por score descendente.

---

## 4. Módulos del backend

```
backend/src/
├── config/          # env, clientes Apify y Anthropic
├── modules/
│   ├── profile/     # cargar/parsear perfil (export LinkedIn o manual)
│   ├── jobs/        # cliente Apify + normalización de ofertas
│   └── matching/    # scoring semántico con Claude
├── middleware/      # errores, validación
├── types/           # contratos de dominio (Profile, Job, Match)
└── utils/           # logger, helpers
```

### Contratos de dominio (`types`)

```ts
interface Profile {
  id: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; description: string }[];
  preferences: { locations: string[]; remote: boolean; seniority?: string };
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  postedAt?: string;
}

interface MatchResult extends Job {
  score: number;        // 0–100
  reasons: string[];    // por qué matchea (de Claude)
  gaps: string[];       // qué te falta para el puesto
}
```

---

## 5. Endpoints (Fase 1)

| Método | Ruta                  | Descripción                                  |
|--------|-----------------------|----------------------------------------------|
| POST   | `/api/profile`        | Carga/actualiza el perfil del usuario        |
| GET    | `/api/profile/:id`    | Devuelve el perfil                           |
| POST   | `/api/jobs/search`    | Busca ofertas en Apify (sin ranking)         |
| POST   | `/api/search`         | Busca + rankea contra el perfil (flujo full) |
| GET    | `/api/health`         | Healthcheck                                  |

---

## 6. Integración con Apify

- Actor: **LinkedIn Jobs Scraper** (`bebity/linkedin-jobs-scraper` o equivalente).
- Se invoca con el SDK `apify-client`.
- Input típico:

```json
{
  "keywords": "backend developer",
  "location": "Argentina",
  "rows": 50,
  "proxy": { "useApifyProxy": true }
}
```

- Costo: modelo pay-per-result (recomendado para uso personal).

---

## 7. Matching con Claude

- Modelo por defecto: `claude-sonnet-4-6`.
- **Prompt caching** sobre el bloque del perfil (es estable entre llamadas) → ahorro de tokens.
- Se procesan las ofertas en lotes y se pide salida JSON estructurada:
  `{ score, reasons[], gaps[] }`.
- El perfil va en un bloque cacheado; cada oferta es el input variable.

---

## 8. Variables de entorno

```
PORT=3000
APIFY_TOKEN=apify_api_xxx
APIFY_JOBS_ACTOR=bebity~linkedin-jobs-scraper
ANTHROPIC_API_KEY=sk-ant-xxx
CLAUDE_MODEL=claude-sonnet-4-6
```

---

## 9. Roadmap

- **Fase 1 (MVP)** — Backend Express + Apify + Claude, perfil en memoria, endpoints REST.
- **Fase 2** — UI Angular (búsqueda, ranking, guardar postulaciones), persistencia PostgreSQL + Prisma.
- **Fase 3** — Auth (login propio), historial de búsquedas, alertas por keywords nuevas.
- **Fase 4** — Importador del ZIP de export de LinkedIn → autocompletar el perfil.

---

## 10. Notas legales

- No se usa la API oficial de LinkedIn (gated a partners enterprise).
- Apify scrapea **datos públicos** de ofertas. Uso personal y razonable.
- El perfil propio se carga manualmente o desde tu propio export de datos.
