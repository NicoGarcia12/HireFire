# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).
## [1.0.0] - 2026-08-17

### Added

- Forzar 1.0.0 como primera release real

- Sumar fuentes gratuitas de empleo (Arbeitnow, RemoteOK, Remotive, Jobicy, Himalayas)

- Probar varios actores Apify de LinkedIn en cascada


### Changed

- Aplicar formato Prettier a los providers nuevos


### Fixed

- Manejar changelog inexistente en el primer release

## [0.1.0] - 2026-07-08

### Added

- MVP backend HireFire (Express + TS + Apify + Claude)

- UI Angular con perfil, busqueda y ranking de ofertas

- Persistencia PostgreSQL + Prisma (Fase 2b)

- Migrar de Claude API a Groq (llama-3.3-70b-versatile, gratuito)

- Fase 3 (historial + busquedas guardadas) y Fase 4 (importador LinkedIn ZIP)

- Analizador de perfil LinkedIn con Groq

- Implement language filter with English and Portuguese support

- Add 768px tablet breakpoint for tight grids

- Show validation error messages on required fields

- Persist profileId in localStorage across sessions

- Add confirm dialog before deleting saved searches and history

- Show empty state when search returns no results

- Replace loading text with animated skeleton cards

- Add visual stepper for profile → search → results flow

- Add CSV export button for ranked results

- Add two-column layout for wide screens (≥1200px)

- Replace score box with circular SVG progress ring

- Migrate home component to Angular Material 20

- Migrate home to Angular Material 20

- Favicon, componentize, score filter, MatDialog confirm, CI/CD

- Add Cypress with 3 test suites (home, results, language filters)

- Add Application model for job applications tracking

- Add applications CRUD endpoints

- Add data layer for applications (model, port, facade)

- Add applications dashboard with status pipeline

- Add apply-from-search button on job cards

- Add manual application form and edit dialog

- Cache Apify job search results with 1h TTL

- Add spanish, french and german to the language filter

- Add dark/light theme toggle persisted in localStorage

- Add delete action for applications


### Changed

- Implement clean/hexagonal architecture layers

- Slim down modules to thin adapters and update wiring

- Implement clean/hexagonal architecture layers

- Update app bootstrap, core layer and home wrapper

- Add routes/handlers/controllers/helpers structure

- Remove clean architecture layers and update wiring

- Split inline component templates/styles into separate files

- Isolate automatic formatting changes


### Fixed

- Resolver /api/search con fallback y actor vigente de Apify

- Add contextual aria-label to remove-experience buttons

- Align frontend package versions (animations, vitest, @eslint/js)

- Enable zoneless change detection for Angular 20 + signals

- Replace emoji-text SVG with vector flame, remove 🔥 from title

- Align add-language button vertically with mat-form-field

- Repair frontend and backend CI

- Merge fixup after bringing in feat/language-support

- Merge fixup after bringing in test/e2e-playwright


