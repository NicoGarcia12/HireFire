# HireFire — Diseño de la aplicación

> Buscador inteligente de postulaciones laborales. A partir de tu perfil y un set de
> palabras clave, recupera ofertas de LinkedIn (vía Apify) y las rankea semánticamente
> contra tu perfil usando **Groq** con el modelo configurado en `GROQ_MODEL`.

---

## 1. Objetivo

1. **Capturar tu perfil** cargándolo manualmente o importándolo desde un ZIP de LinkedIn.
2. **Buscar ofertas** en LinkedIn por keywords + filtros (ubicación, modalidad, seniority e inglés).
3. **Rankear** cada oferta contra tu perfil con un score de _match_ (0–100) explicable.
4. **Analizar el perfil** con IA para detectar fortalezas y sugerencias accionables.
5. Persistir **perfiles**, **historial de búsquedas** y **búsquedas guardadas** en PostgreSQL.
6. Exponer todo vía una **API REST** y una **UI Angular** de una sola pantalla.

---

## 2. Stack

| Capa         | Tecnología                                                  |
|--------------|-------------------------------------------------------------|
| Backend      | Node.js 20+ + Express 4 + TypeScript                        |
| Datos jobs   | Apify (`apify-client`)                                      |
| IA / matching| Groq vía cliente OpenAI-compatible (`openai`)               |
| Validación   | Zod                                                         |
| Frontend     | Angular 21 (standalone components + signals + forms)        |
| Persistencia | PostgreSQL + Prisma ORM                                     |

---

## 3. Arquitectura (alto nivel)

> Decisión vigente: HireFire adopta **Clean Architecture por capas**. La migración quedó aplicada
> en backend y frontend, con bridges legacy mínimos para preservar imports existentes.
> Ver convenio y reglas prácticas en [`ADR-001`](decisions/2026-06-10-clean-architecture-por-capas.md).

```
┌────────────┐   perfil / búsquedas / ZIP   ┌──────────────────────────────┐
│  Angular   │ ───────────────────────────► │       Express API (TS)        │
│  (UI)      │ ◄─────────────────────────── │                                │
└────────────┘     resultados / historial   │  ┌──────────────────────────┐  │
                                            │  │ profile                  │  │
                                            │  │ jobs ────────────────────┼──┼──► Apify
                                            │  │ matching / analysis ─────┼──┼──► Groq
                                            │  │ history / saved-searches │  │
                                            │  └──────────────────────────┘  │
                                            │              │                 │
                                            │              └─────────────────┼──► PostgreSQL (Prisma)
                                            └────────────────────────────────┘
```

### Flujo principal (`POST /api/search`)

1. La UI envía `{ keywords, location, remote, seniority, limit }` + `profileId` y filtros opcionales de idioma.
2. `presentation/http/jobs` valida el request y delega la búsqueda a `infrastructure/scraping/linkedin-jobs.client`.
3. Antes del matching, el backend aplica dos capas de filtro de idioma: (a) filtro legacy de inglés según `allowEnglishRequirements`, `maxEnglishLevelEnabled` y `maxEnglishLevel`; (b) filtro multi-idioma según `allowedLanguages` (array de `{ language: 'english' | 'portuguese', maxLevel }`) que excluye ofertas que requieren un idioma o nivel no permitido, y también detecta avisos escritos íntegramente en inglés o portugués aunque no lo declaren explícitamente. Los requisitos marcados como deseables no bloquean la oferta pero generan warnings en el resultado. Ambos filtros se aplican antes de enviar ofertas a Groq.
4. `infrastructure/ai/groq-matching.service` toma el `Profile` + cada `Job` remanente, procesa en lotes de 8 y pide a Groq un score + razones + gaps.
5. `application/history/save-search-history.use-case` guarda de manera asíncrona un preview de los 10 mejores resultados mediante el repositorio Prisma.
6. La API devuelve las ofertas ordenadas por score descendente.

### Flujo de importación (`POST /api/profile/import-linkedin`)

1. El frontend sube un ZIP por `multipart/form-data` en el campo `file`.
2. `infrastructure/parsers/linkedin-profile-archive.parser` lee `Profile.csv`, `Positions.csv` y `Skills.csv` si existen.
3. La API devuelve datos parseados para prellenar el formulario; no persiste nada automáticamente.

### Flujo de análisis (`POST /api/profile/:id/analyze`)

1. Se recupera el perfil persistido por `profileId`.
2. `infrastructure/ai/groq-profile-analysis.service` arma un prompt estructurado y llama a Groq.
3. La API devuelve `{ score, strengths, suggestions[] }`.

---

## 4. Módulos del backend

```
backend/src/
├── app.ts            # composición de middlewares y routers
├── config/           # env y wiring compartido
├── domain/           # entidades, interfaces/puertos, enums y types puros
├── application/      # DTOs, mappers y use-cases por feature
├── infrastructure/   # Prisma repositories, clientes Groq/Apify y parsers externos
├── middleware/       # validación Zod y manejo de errores
├── presentation/http/# routers, schemas Zod y middleware HTTP
├── modules/          # bridges legacy mínimos + helpers todavía compartidos
└── utils/            # logger
```

### Contratos de dominio (`domain/**`)

Los contratos que antes vivían agrupados en `backend/src/types/domain.ts` se separaron por feature:

- `domain/profile/entities/profile.entity.ts` y `profile-experience.entity.ts`.
- `domain/jobs/entities/job.entity.ts` y `interfaces/job-search-params.interface.ts`.
- `domain/matching/entities/match-result.entity.ts`, `enums/language-level.enum.ts` (niveles A1–C2), `enums/supported-language.enum.ts` (english/portuguese) e interfaces `language-warning`, `language-filtered-job` y `allowed-language-preference`.
- `domain/history` y `domain/saved-searches` para historial y búsquedas guardadas.

Forma conceptual vigente:

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
  reasons: string[];    // por qué matchea
  gaps: string[];       // qué te falta para el puesto
}

type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

interface SearchParams {
  profileId: string;
  keywords: string;
  location?: string;
  remote?: boolean;
  seniority?: string;
  limit?: number;
  allowEnglishRequirements?: boolean; // default: true  (filtro legacy de inglés)
  maxEnglishLevelEnabled?: boolean;    // default: false (filtro legacy de inglés)
  maxEnglishLevel?: EnglishLevel;      // filtro legacy de inglés
  allowedLanguages?: { language: 'english' | 'portuguese'; maxLevel: EnglishLevel }[]; // filtro multi-idioma
}
```

---

## 5. Endpoints vigentes

| Método | Ruta                         | Descripción                                                |
|--------|------------------------------|------------------------------------------------------------|
| GET    | `/api/health`                | Healthcheck                                                |
| POST   | `/api/profile`               | Crea o actualiza el perfil                                 |
| GET    | `/api/profile/:id`           | Devuelve un perfil                                         |
| POST   | `/api/profile/:id/analyze`   | Analiza el perfil con IA                                   |
| POST   | `/api/profile/import-linkedin` | Parsea un ZIP de LinkedIn                                |
| POST   | `/api/jobs/search`           | Búsqueda cruda en Apify                                    |
| POST   | `/api/search`                | Búsqueda completa + ranking + guardado en historial        |
| GET    | `/api/history?profileId=...` | Lista hasta 30 búsquedas recientes de un perfil            |
| DELETE | `/api/history/:id`           | Elimina una búsqueda del historial                         |
| GET    | `/api/saved-searches?profileId=...` | Lista búsquedas guardadas                          |
| POST   | `/api/saved-searches`        | Crea una búsqueda guardada                                 |
| DELETE | `/api/saved-searches/:id`    | Elimina una búsqueda guardada                              |

---

## 6. Integración con Apify

- Actor configurable vía `APIFY_JOBS_ACTOR` (default: `curious_coder/linkedin-jobs-scraper`).
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

- `remote` se traduce a `workType = 'remote'` y `seniority` a `experienceLevel`.
- La respuesta se normaliza defensivamente porque los actores pueden variar los nombres de campos.

---

## 7. Matching y análisis con Groq

- Variables: `GROQ_API_KEY`, `GROQ_BASE_URL`, `GROQ_MODEL`.
- Cliente: SDK `openai` apuntando a la base URL compatible de Groq.
- El matching procesa ofertas en lotes de 8 (`BATCH_SIZE = 8`).
- Cada descripción se recorta a 1.500 caracteres antes de enviarla al modelo.
- El filtro de inglés se aplica antes del matching Groq: puede excluir ofertas que pidan inglés o limitar el nivel máximo permitido (`A1`–`C2`).
- Tanto el matching como el análisis de perfil exigen respuesta JSON y hacen parseo defensivo.
- Si el modelo responde algo inválido, el backend degrada a score `0` o listas vacías en lugar de romper el flujo.

---

## 8. Variables de entorno

```
PORT=3000
DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire?schema=public
APIFY_TOKEN=apify_api_xxx
APIFY_JOBS_ACTOR=curious_coder/linkedin-jobs-scraper
GROQ_API_KEY=gsk_xxx
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## 8b. Persistencia (Prisma)

- En desarrollo, la app asume una instancia local de PostgreSQL accesible por `DATABASE_URL` (sin dependencia obligatoria de Docker).
- Schema en `backend/prisma/schema.prisma`: modelos `Profile` y `Experience`
  más `Search` y `SavedSearch`.
- Cliente Prisma singleton en `infrastructure/db/prisma.service.ts` (reutilizado en dev para no agotar el pool). `config/db.ts` es un re-export de compatibilidad hacia ese módulo.
- `profile.service.ts` conserva su interfaz pública (`saveProfile`/`getProfile`), ahora
  asíncrona y respaldada por la DB → las rutas no cambiaron su contrato.
- `Search.topResults` guarda solo un preview JSON de los 10 mejores resultados.
- `SavedSearch` permite re-ejecutar búsquedas desde la UI, pero no dispara alertas automáticas.
- Crear tablas: `npm run db:push` (rápido) o `npm run prisma:migrate` (con historial).

---

## 9. Frontend actual

- Aplicación Angular 21 con un único feature principal: `Home`.
- `presentation/features/home/Home` mantiene formularios, templates y estado estrictamente visual.
- `application/home/HomeFacade` concentra loading/error states y orquestación de flujos.
- `application/home/HomeDataPort` define el puerto que consume la facade.
- `infrastructure/api/ApiService` implementa ese puerto con `HttpClient`.
- `core/models.ts`, `core/api.service.ts` y `features/home/*` son bridges legacy mínimos para imports existentes.
- El estado efímero de UI se maneja con `signal()`; los formularios usan `ReactiveFormsModule`.
- La pantalla permite:
  - editar/guardar perfil,
  - importar ZIP de LinkedIn,
  - analizar el perfil con IA,
  - ejecutar búsquedas,
  - configurar filtros de idioma por búsqueda (inglés y portugués),
  - guardar búsquedas reutilizables,
  - consultar y re-ejecutar historial.

---

## 10. Mejoras recomendadas

Estas mejoras están pendientes/recomendadas; no asumirlas como implementadas:

1. **Persistencia de filtros de idioma**: extender historial y búsquedas guardadas para conservar `allowEnglishRequirements`, `maxEnglishLevelEnabled`, `maxEnglishLevel` y `allowedLanguages` al re-ejecutar.
2. **Cobertura frontend con DOM real**: agregar tests que validen rendering, cambios de controles y payload real desde Angular.
3. **Cobertura de schemas de búsqueda**: agregar tests de Zod para defaults y valores inválidos de `maxEnglishLevel` y `allowedLanguages`.

## 11. Restricciones y observaciones

- No hay autenticación ni multiusuario: todo el flujo trabaja sobre `profileId` explícito.
- `POST /api/search` guarda historial en segundo plano; si falla esa persistencia, no bloquea la respuesta principal.
- La base de la API en frontend está hardcodeada en `http://localhost:3000/api`.

---

## 12. Notas legales

- No se usa la API oficial de LinkedIn (gated a partners enterprise).
- Apify scrapea **datos públicos** de ofertas. Uso personal y razonable.
- El perfil propio se carga manualmente o desde tu propio export de datos.
