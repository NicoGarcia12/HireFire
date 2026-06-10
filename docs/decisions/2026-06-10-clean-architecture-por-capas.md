# ADR-001: Adoptar Clean Architecture por capas

## Estado

Aceptado

## Fecha

2026-06-10

## Contexto

HireFire ya separa parte del backend por módulos (`modules/jobs`, `modules/matching`, `modules/profile`, `modules/history`, `modules/saved-searches`), pero todavía concentra contratos transversales en `backend/src/types/domain.ts`. En frontend, `frontend/src/app/core/models.ts` y `frontend/src/app/core/api.service.ts` concentran modelos, payloads y comunicación HTTP, mientras `features/home/home.ts` acumula bastante lógica de presentación y orquestación.

La feature reciente de filtros multi-idioma (`allowedLanguages`, `LanguageWarning`, detección inglés/portugués y UI selector/lista) expuso la necesidad de ubicar enums, interfaces, DTOs, schemas, servicios y adaptadores con reglas más explícitas para evitar archivos “catch-all” y facilitar evolución incremental.

El usuario eligió explícitamente la **Opción 2: Clean Architecture por capas** para ordenar el proyecto.

## Decisión

Vamos a ordenar HireFire con Clean Architecture por capas. La adopción se ejecutó como migración incremental y quedó aplicada en backend y frontend, conservando bridges legacy mínimos para no romper imports públicos mientras se estabiliza la estructura.

Las capas adoptadas son:

- **Backend**: `domain`, `application`, `infrastructure`, `presentation`, `shared`.
- **Frontend Angular**: `domain`, `application`, `infrastructure`, `presentation`/`features`, `shared`.

La regla principal es que las dependencias apunten hacia adentro:

```text
presentation/features -> application -> domain
infrastructure -------> application/domain
shared ---------------> domain/application/presentation/infrastructure (solo utilidades sin negocio)
```

`domain` no debe importar desde `application`, `infrastructure`, `presentation` ni frameworks externos cuando pueda evitarse.

## Referencia LTS

- **Node.js**: el repo recomienda Node 22 (`.nvmrc` en `22.22.2`), considerado dentro de la ventana LTS N/N-1 del proyecto.
- **PostgreSQL**: el README declara PostgreSQL 16+, dentro de una línea soportada para el proyecto.
- **Angular 21**: se documenta como stack actual del frontend; validar contra calendario oficial de Angular al momento de cada upgrade.
- **Express 4**: se mantiene por compatibilidad con el backend actual.

`LEGACY FALLBACK: componente fuera de ventana LTS N/N-1; se mantiene por compatibilidad temporal hasta plan de migración aprobado.`

> Nota: el fallback aplica especialmente a dependencias cuya línea mayor quede fuera de soporte activo durante la vida del proyecto. La migración de arquitectura no implica actualizar dependencias todavía.

## Estructura adoptada

### Backend

```text
backend/src/
├── domain/
│   ├── profile/
│   │   ├── entities/profile.entity.ts
│   │   ├── interfaces/profile-repository.interface.ts
│   │   └── types/profile-preferences.type.ts
│   ├── jobs/
│   │   ├── entities/job.entity.ts
│   │   └── interfaces/job-search-params.interface.ts
│   └── matching/
│       ├── entities/match-result.entity.ts
│       ├── enums/language-level.enum.ts
│       ├── enums/supported-language.enum.ts
│       └── interfaces/
│           ├── allowed-language-preference.interface.ts
│           ├── language-filtered-job.interface.ts
│           └── language-warning.interface.ts
├── application/
│   ├── profile/
│   │   ├── dto/profile.dto.ts
│   │   ├── mappers/profile.mapper.ts
│   │   └── use-cases/save-profile.use-case.ts
│   ├── history/
│   └── saved-searches/
├── infrastructure/
│   ├── db/
│   │   ├── prisma.service.ts
│   │   └── repositories/
│   │       ├── prisma-profile.repository.ts
│   │       ├── prisma-saved-search.repository.ts
│   │       └── prisma-search-history.repository.ts
│   ├── ai/
│   │   ├── groq.client.ts
│   │   ├── groq-matching.service.ts
│   │   └── groq-profile-analysis.service.ts
│   ├── parsers/linkedin-profile-archive.parser.ts
│   └── scraping/
│       ├── apify.client.ts
│       └── linkedin-jobs.client.ts
├── presentation/http/
│   ├── profile/
│   │   ├── profile.routes.ts
│   │   ├── profile.schema.ts
│   │   ├── profile-analysis.routes.ts
│   │   └── linkedin-import.routes.ts
│   ├── jobs/
│   │   ├── jobs.routes.ts
│   │   └── jobs.schema.ts
│   ├── history/history.routes.ts
│   ├── saved-searches/
│   │   ├── saved-searches.routes.ts
│   │   └── saved-searches.schema.ts
│   └── middleware/validate.ts
├── modules/          # bridges legacy mínimos + helper language-filter
└── utils/
```

#### Reglas backend

- `domain/**/entities`: modelos de negocio puros. No dependen de Express, Prisma, Zod, Groq ni Apify.
- `domain/**/enums`: enums o constantes enum-like del dominio. Ejemplo: niveles de idioma, seniority, modalidad.
- `domain/**/interfaces`: puertos/contratos del dominio, por ejemplo repositorios o gateways como abstracciones.
- `domain/**/types`: aliases y tipos compuestos que no justifican una entidad o interfaz.
- `application/**/use-cases`: orquestan reglas de negocio y puertos. No conocen HTTP ni detalles de Prisma/Apify/Groq.
- `application/**/dto`: datos de entrada/salida de casos de uso. Evitar mezclar con DTOs HTTP si tienen forma distinta.
- `application/**/mappers`: conversión entre DTOs, entidades y respuestas de aplicación.
- `infrastructure/**`: implementaciones concretas de puertos: Prisma repositories, clientes Groq/OpenAI-compatible, clientes Apify, filesystem/parsers externos.
- `presentation/http/**`: routes, controllers/handlers, schemas Zod de request/response HTTP y middleware específico de transporte.
- `shared/**`: utilidades transversales sin reglas de negocio: errores base, logger, helpers genéricos, validadores reutilizables.
- Backend usa ESM (`"type": "module"`): los imports relativos que terminan compilando a JS deben mantener extensión `.js` cuando corresponda, por ejemplo `import { x } from './x.js';`.

### Frontend Angular

```text
frontend/src/app/
├── domain/
│   ├── profile/models/profile.model.ts
│   ├── search/models/
│   └── matching/
│       ├── enums/language-level.enum.ts
│       ├── models/
│       └── types/
├── application/home/
│   ├── home-data.port.ts
│   └── home.facade.ts
├── infrastructure/api/
│   ├── hirefire-api.service.ts
│   └── dto/
├── presentation/features/home/
│   ├── home.ts
│   ├── home.html
│   ├── home.scss
│   └── home.types.ts
├── core/             # bridges legacy mínimos
└── features/home/    # bridge legacy mínimo
```

#### Reglas frontend

- `domain/**/models`: modelos de dominio consumidos por la UI y casos de uso. No deben depender de Angular ni `HttpClient`.
- `domain/**/enums`: enums o constantes enum-like por entidad/feature. Ejemplo: `language-level.enum.ts`, `job-language.enum.ts`.
- `domain/**/interfaces`: contratos que la aplicación consume, por ejemplo repositorios o gateways.
- `domain/**/types`: aliases y tipos derivados de formularios, filtros o estados cuando no sean contrato externo.
- `application/**/services`: facades o servicios de aplicación para orquestar flujos entre UI, repositorios y mappers.
- `application/**/dto`: payloads de entrada/salida usados por casos de uso frontend; si representan HTTP puro, ubicarlos en `infrastructure/api/dto`.
- `application/**/mappers`: conversión entre API DTOs, models y view models.
- `infrastructure/api`: `HttpClient`, tokens de configuración, API clients y DTOs específicos de transporte HTTP.
- `infrastructure/repositories`: implementaciones HTTP de interfaces definidas en `domain`.
- `presentation/features`: componentes standalone, templates, estilos y lógica estrictamente visual/interactiva.
- `shared`: UI reutilizable, pipes, directives y helpers sin negocio.

## Convenciones de naming

| Tipo de archivo | Sufijo obligatorio | Ejemplo |
|-----------------|--------------------|---------|
| Enum / enum-like constants | `.enum.ts` | `language-level.enum.ts` |
| Interface / puerto | `.interface.ts` | `profile-repository.interface.ts` |
| Type alias | `.type.ts` | `search-filters.type.ts` |
| DTO | `.dto.ts` | `search-request.dto.ts` |
| Zod schema | `.schema.ts` | `search-request.schema.ts` |
| Use case | `.use-case.ts` | `run-search.use-case.ts` |
| Service / facade | `.service.ts` | `profile-facade.service.ts` |
| Mapper | `.mapper.ts` | `job.mapper.ts` |
| Entity/model de backend | `.entity.ts` | `profile.entity.ts` |
| Model frontend | `.model.ts` | `profile.model.ts` |
| Controller HTTP backend | `.controller.ts` | `profile.controller.ts` |
| Routes backend | `.routes.ts` | `profile.routes.ts` |

Regla adicional: evitar archivos genéricos como `domain.ts`, `models.ts` o `types.ts` para contratos nuevos. Si existen, tratarlos como legado a migrar gradualmente.

## Reglas de imports y dependencias

### Permitido

- `domain` puede importar de `domain` y, excepcionalmente, de `shared` si el helper es puro y sin dependencia de framework.
- `application` puede importar de `domain` y `shared`.
- `infrastructure` puede importar de `application`, `domain` y `shared` para implementar puertos.
- `presentation` puede importar de `application`, `domain` y `shared`.
- `shared` no debe importar de capas de negocio ni de infraestructura.

### Prohibido

- `domain` importando `Express`, `Prisma`, `HttpClient`, `Zod`, `OpenAI`, `Apify` o componentes Angular.
- `application` importando `Express.Request`, `Express.Response`, `PrismaClient`, `HttpClient` o componentes Angular.
- `presentation` accediendo directo a Prisma, Groq, Apify o almacenamiento externo.
- `frontend/presentation/features` llamando `HttpClient` directo salvo código legacy no migrado.
- Imports circulares entre features, especialmente vía barrels globales.

## Barrels (`index.ts`)

Al inicio de la migración se evitan barrels globales para prevenir ciclos y dependencias implícitas.

Si se usan barrels, deben ser:

- locales a una carpeta pequeña,
- simples re-exports sin lógica,
- sin mezclar capas,
- revisados ante cualquier ciclo detectado por build/test.

Ejemplo permitido:

```text
domain/matching/enums/index.ts
```

Ejemplo no recomendado al inicio:

```text
src/domain/index.ts
src/application/index.ts
src/shared/index.ts
```

## Estado de implementación

Al 2026-06-10, la migración está aplicada en la estructura principal:

- Backend usa `domain`, `application`, `infrastructure` y `presentation/http` como ubicación primaria de entidades, puertos, use-cases, adapters y routes/schemas.
- Frontend usa `domain`, `application`, `infrastructure` y `presentation/features` como ubicación primaria de modelos, puertos/facades, adapters HTTP y componentes.
- Persisten bridges legacy mínimos en `backend/src/modules/**`, `frontend/src/app/core/**` y `frontend/src/app/features/home/**` para compatibilidad de imports existentes.
- Los helpers de filtro de idioma permanecen en `backend/src/modules/matching/language-filter.ts` hasta definir si migran a `domain/matching` o `application/matching` sin mezclar reglas de negocio con transporte.

## Estrategia incremental usada

1. **Congelar contratos nuevos**: todo contrato nuevo debe crearse en la capa/carpeta objetivo, no en archivos concentradores.
2. **Migrar por feature vertical**: mover una feature a la vez (`matching`, después `jobs`, después `profile`, etc.), evitando PRs gigantes.
3. **Empezar por dominio estable**: extraer enums, interfaces y types de `backend/src/types/domain.ts` y `frontend/src/app/core/models.ts` hacia carpetas por entidad.
4. **Separar transporte de negocio**: mover schemas Zod a `presentation/http/**` y DTOs/use-cases a `application/**`.
5. **Introducir puertos antes que adapters**: definir interfaces en `domain` antes de mover implementaciones Prisma, Groq y Apify a `infrastructure`.
6. **Adelgazar componentes Angular**: mover lógica de `features/home/home.ts` a facades/services de `application` y mappers.
7. **Mantener compatibilidad pública**: no cambiar endpoints ni payloads sin ADR o nota de cambio específica.
8. **Eliminar legado al final**: borrar `domain.ts`, `models.ts` o servicios concentradores solo cuando no tengan consumidores; si quedan bridges, deben tener comentarios breves que expliquen compatibilidad y no ownership nuevo.

## Quality gates

Antes de considerar completa cada migración incremental:

- Backend:
  - `npm run typecheck`
  - `npm run build`
  - `npm run lint` si está operativo en el entorno
  - Smoke API: `GET /api/health`
  - Smoke funcional para la feature tocada, por ejemplo `POST /api/search` si se migró matching/jobs
- Frontend:
  - `npm run build`
  - `npm test` si está operativo en el entorno
  - Validación manual de UI para el flujo tocado
- Arquitectura:
  - No quedan imports prohibidos hacia capas externas.
  - No se agregaron barrels globales.
  - Nuevos enums/interfaces/types respetan carpeta y sufijo.
  - Backend ESM conserva extensiones `.js` en imports relativos donde aplique.
  - La documentación se actualiza si cambia una regla o estructura objetivo.

## Alternativas evaluadas

### Alternativa 1: Mantener arquitectura por módulos actual

- **Pros**: menor costo inmediato, menos movimiento de archivos.
- **Contras**: sostiene archivos concentradores y mezcla contratos, transporte e infraestructura.

### Alternativa 2: Clean Architecture por capas

- **Pros**: dependencias explícitas, mejor testabilidad, ubicación clara para enums/interfaces/DTOs/adapters.
- **Contras**: requiere migración incremental y disciplina en imports.

### Alternativa 3: Refactor masivo inmediato

- **Pros**: estructura objetivo completa en un solo cambio.
- **Contras**: alto riesgo de romper flujos existentes y generar PR difícil de revisar.

## Consecuencias

### Positivas

- Menos archivos “bolsa” (`domain.ts`, `models.ts`) para contratos no relacionados.
- Mejor separación entre dominio, casos de uso, transporte HTTP y proveedores externos.
- Más fácil testear use-cases sin Express/Angular/Prisma/Groq/Apify.
- Reglas concretas para ubicar filtros multi-idioma y futuras features.

### Negativas

- Aumenta la cantidad de archivos y carpetas.
- Durante la transición final pueden coexistir bridges legacy mínimos con estructura nueva.
- Requiere revisar imports ESM del backend para no romper build.

### Riesgos

- Bridges legacy pueden volver a crecer si no se documenta que son solo compatibilidad.
- Migraciones parciales futuras pueden duplicar tipos si no se controla el ownership.
- Barrels globales pueden introducir ciclos difíciles de detectar.
- Mover DTOs sin mapear correctamente puede cambiar contratos HTTP accidentalmente.

## Supuestos y pendientes de verificación

- Se asume que los endpoints actuales se mantienen estables después de la migración.
- Falta validar con el equipo si se numerarán ADRs retrospectivos o si este documento queda como `ADR-001` inicial.
- Falta definir tooling específico para detectar imports prohibidos (por ejemplo ESLint boundaries) si se quiere automatizar el gate de arquitectura.
- El helper multi-idioma `modules/matching/language-filter.ts` importa tipos desde `domain/matching/` (enums e interfaces), pero su lógica de filtrado convive con el bridge legacy. Queda pendiente decidir si migra a `application/matching/` (como use-case/servicio de aplicación) o permanece en `modules/` como helper compartido.

## Bloque estructurado portable

```yaml
id: ADR-001
title: Adoptar Clean Architecture por capas
status: accepted
date: 2026-06-10
decision: Clean Architecture aplicada para backend Express/TypeScript y frontend Angular, con bridges legacy mínimos.
backend_layers:
  - domain
  - application
  - infrastructure
  - presentation
  - shared
frontend_layers:
  - domain
  - application
  - infrastructure
  - presentation/features
  - shared
naming:
  enum: .enum.ts
  interface: .interface.ts
  type: .type.ts
  dto: .dto.ts
  schema: .schema.ts
  use_case: .use-case.ts
  service: .service.ts
  mapper: .mapper.ts
constraints:
  - No global barrels at migration start.
  - Backend ESM relative imports keep .js extension when required by compiled output.
  - Domain does not depend on frameworks or infrastructure.
  - Legacy bridges are compatibility-only and must not receive new ownership.
quality_gates:
  backend:
    - npm run typecheck
    - npm run build
    - npm run lint when available
  frontend:
    - npm run build
    - npm test when available
```
