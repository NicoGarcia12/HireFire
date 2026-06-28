# HireFire

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
- **Node.js 22** — el repo está pinneado con `.nvmrc` en `22.22.2`. Requiere [nvm](https://github.com/nvm-sh/nvm) o instalar manualmente.
- **PostgreSQL 16+**
- **Dos cuentas gratuitas**: Apify (scraping) y Groq (ranking con IA)

---

## 🚀 Instalación rápida

**Opción 1: Script automatizado** (recomendado)

**Linux / macOS**:
```bash
git clone git@github.com:NicoGarcia12/HireFire.git
cd HireFire
bash scripts/setup.sh
```

**Windows** (cmd.exe o PowerShell):
```batch
git clone git@github.com:NicoGarcia12/HireFire.git
cd HireFire
scripts\setup.bat
```

> El script verifica Node.js, PostgreSQL, crea usuario/BD, instala dependencias y migra la BD automáticamente.

**Opción 2: Manual paso a paso**

### 1 · Instalar PostgreSQL

**Linux (Ubuntu/Debian)**
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql && sudo systemctl enable postgresql
```

**Windows** — descargar el installer desde [postgresql.org](https://www.postgresql.org/download/windows/), instalar con puerto por defecto (5432).

Luego, crear usuario y base de datos:
```bash
# Linux
sudo -u postgres psql -c "CREATE USER hirefire WITH PASSWORD 'hirefire';"
sudo -u postgres psql -c "CREATE DATABASE hirefire OWNER hirefire;"
```

```powershell
# Windows (cmd.exe o PowerShell)
psql -U postgres
# Dentro de psql:
CREATE USER hirefire WITH PASSWORD 'hirefire';
CREATE DATABASE hirefire OWNER hirefire;
\q
```

---

### 2 · Clonar y preparar el repo

```bash
git clone git@github.com:NicoGarcia12/HireFire.git
cd HireFire
nvm use          # activa Node 22.22.2 (o instalar si no usás nvm)
```

---

### 3 · Crear cuentas gratuitas y obtener API keys

| Servicio | Cuenta | Dónde copiar la key | Nota |
|----------|--------|-------------------|------|
| **Apify** | [console.apify.com/sign-up](https://console.apify.com/sign-up) | **Settings → Integrations → API tokens** | Formato: `apify_api_...` |
| **Groq** | [console.groq.com](https://console.groq.com) | **API Keys → Create API Key** | Formato: `gsk_...` |

> **Límites gratuitos**: Apify incluye $5 USD/mes (suficiente para 20–50 búsquedas). Groq tiene límites por minuto holgados.

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

### 6 · Iniciar la app

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

## 📖 Flujo de uso

El stepper al tope de la página guía los 3 pasos:

### 1 · Cargar tu perfil

- Completar **Headline**, **Skills** (separadas por coma), **Ubicaciones** y **Experiencia**.
- Alternativamente, hacer clic en **Importar LinkedIn ZIP** para auto-completar desde tu export de LinkedIn.
- Clic **Guardar perfil** → aparece badge `Guardado ✓`.
- Opcional: **Analizar perfil** genera un informe con score 0–100 y sugerencias.

### 2 · Buscar ofertas

- Ingresar **palabras clave** (ej. `backend node typescript`), ubicación y cantidad de resultados.
- Configurar **Idiomas permitidos** si querés pre-filtrar por idioma (ahorra tokens de Groq).
- Clic **Buscar** → Apify trae ofertas, Groq las rankea según tu perfil.

### 3 · Revisar y exportar resultados

- Cada oferta muestra: **score 0–100**, razones de match, gaps y advertencias de idioma.
- **Guardar búsqueda** reutiliza la combinación de filtros para futuras búsquedas.
- **Exportar CSV** descarga todos los resultados.
- **Historial** permite re-ejecutar búsquedas anteriores.

---

## 🌐 Filtro de idioma

Pre-filtra ofertas antes del ranking con IA, ahorrando tokens de Groq:

1. Agregar idiomas al array **Idiomas permitidos** con el selector → botón **Agregar**.
2. Elegir **nivel máximo aceptado** (A1 → C2) para cada idioma.
3. Ofertas **escritas íntegramente** en idioma no permitido → excluidas.
4. Requisitos **deseables** generan warning sin bloquear la oferta.

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

## 🔧 Troubleshooting

### PostgreSQL

| Error | Causa | Solución |
|-------|-------|----------|
| `psql: command not found` | PostgreSQL no en el PATH | Agregar `/usr/lib/postgresql/16/bin` al PATH o usar ruta completa |
| `FATAL: Ident authentication failed` | Usuario/contraseña incorrecto | Revisar `.env`: `DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire` |
| `FATAL: database "hirefire" does not exist` | BD no creada | Ejecutar `CREATE DATABASE hirefire OWNER hirefire;` en psql |
| `Connection refused (127.0.0.1:5432)` | PostgreSQL no está corriendo | Linux: `sudo systemctl start postgresql`. Windows: iniciar desde Services. |

### Node.js / npm

| Error | Causa | Solución |
|-------|-------|----------|
| `command not found: node` | Node no instalado o no en PATH | Instalar desde [nodejs.org](https://nodejs.org) o usar nvm: `nvm install 22.22.2` |
| `port 3000 already in use` | Otro proceso usa 3000 | Backend: cambiar puerto en `.env` (`PORT=3001`). Frontend: `npm start -- --port 4201` |
| `Cannot find module 'X'` | Dependencias no instaladas | Correr `npm ci` en `backend/` y `frontend/` |

### API Keys

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized: APIFY_TOKEN` | Token inválido o expirado | Verificar en [console.apify.com/account/integrations](https://console.apify.com/account/integrations) |
| `401 Unauthorized: GROQ_API_KEY` | Key inválida o deshabilitada | Verificar en [console.groq.com/keys](https://console.groq.com/keys). Crear una nueva si es necesario. |
| `Rate limit exceeded` | Límites diarios agotados | Apify: esperar a mañana o upgradear plan. Groq: esperar 1 minuto. |

### General

| Problema | Solución |
|----------|----------|
| Frontend no conecta al backend | Verificar que backend está en `http://localhost:3000` (o el puerto configurado). Revisar CORS en `backend/src/middleware/cors.ts` |
| Cambios en código no se reflejan | Ambos tienen hot-reload. Si no: detener servidor y reiniciar. |
| Export CSV no funciona | Verificar navegador permite descargas. En modo incógnito, permitir pop-ups. |

---

## ⚖️ Notas legales

- No se usa la API oficial de LinkedIn (restringida a partners enterprise).
- Apify scrapea **datos públicos** de ofertas. Uso personal y razonable.
- El perfil puede cargarse manualmente o importarse desde tu propio export ZIP de LinkedIn.
