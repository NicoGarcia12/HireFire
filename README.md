# HireFire 🔥

Buscador inteligente de postulaciones laborales. Cargás tu perfil y palabras clave,
recupera ofertas de LinkedIn vía **Apify** y las rankea con **Groq (Llama 3.3 70B)**
según cuánto encajan con tu experiencia.

> Diseño detallado → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
> Keys y costos → [`docs/SETUP.md`](docs/SETUP.md)

---

## Stack

| Capa          | Tecnología                                          |
|---------------|-----------------------------------------------------|
| Backend       | Node.js 22 + Express + TypeScript                   |
| Base de datos | PostgreSQL 16 + Prisma ORM                          |
| Datos jobs    | Apify — LinkedIn Jobs Scraper                       |
| Matching      | Groq API — `llama-3.3-70b-versatile` (tier gratuito)|
| Validación    | Zod                                                 |
| Frontend      | Angular 21 (standalone + signals)                   |

---

## Estado del proyecto

- [x] **Fase 1** — Backend Express + API REST + Apify + matching con Groq/Llama
- [x] **Fase 2a** — UI Angular (perfil, búsqueda, resultados rankeados)
- [x] **Fase 2b** — Persistencia PostgreSQL + Prisma
- [x] **Fase 3** — Historial de búsquedas + búsquedas guardadas (alertas)
- [x] **Fase 4** — Importador del export ZIP de LinkedIn → auto-fill del perfil

---

## Prerequisitos

Antes de empezar, asegurate de tener instalado:

- **Git** — `git --version`
- **Node.js 22+** — `node --version` (recomendado instalar via [nvm](https://github.com/nvm-sh/nvm))
- **PostgreSQL 16** — ver paso 1 abajo
- **Cuentas gratuitas** en Apify y Groq — ver paso 3 abajo

---

## Instalación y puesta en marcha

### Paso 1 — Instalar PostgreSQL

**Linux (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql   # para que arranque con el sistema
```

**Windows**
Descargar el installer desde https://www.postgresql.org/download/windows/ e instalarlo dejando el puerto por defecto (5432).

---

Crear el usuario y la base de datos (igual en ambos sistemas):

**Linux**
```bash
sudo -u postgres psql -c "CREATE USER hirefire WITH PASSWORD 'hirefire';"
sudo -u postgres psql -c "CREATE DATABASE hirefire OWNER hirefire;"
```

**Windows** — abrir **SQL Shell (psql)** o **pgAdmin → Query Tool**:
```sql
CREATE USER hirefire WITH PASSWORD 'hirefire';
CREATE DATABASE hirefire OWNER hirefire;
```

Verificar que Postgres esté corriendo:
```bash
# Linux
sudo systemctl status postgresql

# Windows (PowerShell)
Get-Service postgresql*
```

---

### Paso 2 — Clonar el repositorio

```bash
git clone git@github.com:NicoGarcia12/HireFire.git
cd HireFire
```

---

### Paso 3 — Obtener las API keys (ambas gratuitas)

#### Apify — datos de ofertas de LinkedIn
1. Crear cuenta en https://console.apify.com/sign-up
2. Ir a **Settings → Integrations → API tokens**
3. Copiar el token (empieza con `apify_api_...`)
> El plan Free incluye $5 USD de crédito mensual, suficiente para uso personal.

#### Groq — ranking inteligente con IA
1. Crear cuenta en https://console.groq.com
2. Ir a **API Keys → Create API Key**
3. Copiar la key (empieza con `gsk_...`)
> El tier gratuito tiene límites de requests por minuto más que suficientes.

---

### Paso 4 — Configurar variables de entorno

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env` y completar las tres líneas marcadas:

```ini
# Base de datos (ya creada en Paso 1)
DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire?schema=public

# Apify (obtenida en Paso 3)
APIFY_TOKEN=apify_api_...

# Groq (obtenida en Paso 3)
GROQ_API_KEY=gsk_...
```

El resto de variables tienen valores por defecto y no hace falta tocarlos.

> ⚠️ `.env` está en `.gitignore` — nunca se sube al repositorio.

---

### Paso 5 — Instalar dependencias y crear las tablas

```bash
cd backend
npm install
npm run db:push
```

Salida esperada al final: `Your database is now in sync with your Prisma schema.`

---

### Paso 6 — Iniciar el backend

```bash
npm run dev
```

Salida esperada: `HireFire backend escuchando en http://localhost:3000`

---

### Paso 7 — Iniciar el frontend

Abrir una **segunda terminal** en la raíz del repo:

```bash
cd frontend
npm install
npm start
```

Salida esperada: `Local: http://localhost:4200`

Abrir **http://localhost:4200** en el navegador.

---

## Importar tu perfil desde LinkedIn

1. En LinkedIn: **Configuración → Privacidad de datos → Obtener una copia de tus datos**
2. Seleccioná la opción rápida (Parte 1) — llega en minutos u horas.
3. Subí el ZIP directamente — el importador toma solo `Profile.csv`, `Positions.csv` y `Skills.csv` e ignora el resto.
4. En la UI: clic en **⬆ Importar LinkedIn ZIP** → seleccionás el archivo.
5. El formulario se pre-llena automáticamente. Revisás, ajustás y clic en **Guardar perfil**.

> El ZIP se procesa en el backend local — nunca sale de tu máquina.

---

## Cómo probar

### Verificación rápida

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","service":"hirefire-backend"}
```

---

### Desde la UI (recomendado)

1. Abrí `http://localhost:4200`.
2. **"1 · Tu perfil"** — completá headline, skills y experiencia. Clic en **Guardar perfil** → aparece badge `Guardado ✓`.
3. **"2 · Buscar ofertas"** — ingresá keywords (ej. `backend node`), ubicación y cantidad. Clic en **Buscar**.
4. En unos segundos aparece la lista rankeada con **score 0–100**, razones de match y gaps por oferta.

---

### Desde la terminal (cURL)

```bash
# 1) Crear perfil
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Backend Developer Node.js",
    "summary": "Especializado en Node.js y TypeScript",
    "skills": ["Node.js", "TypeScript", "Express", "PostgreSQL"],
    "experience": [
      { "title": "Backend Dev", "company": "Acme", "description": "APIs REST" }
    ],
    "preferences": { "locations": ["Argentina"], "remote": true }
  }'
# → guarda el "id" que devuelve

# 2) Buscar y rankear
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "<id-del-paso-1>",
    "keywords": "backend node typescript",
    "location": "Argentina",
    "remote": true,
    "limit": 20
  }'

# 3) Verificar persistencia (reiniciá el backend primero)
curl http://localhost:3000/api/profile/<id-del-paso-1>
# → devuelve el perfil (guardado en Postgres, no en memoria)
```

---

## Variables de entorno

| Variable            | Requerida | Default                          | Descripción                     |
|---------------------|-----------|----------------------------------|---------------------------------|
| `PORT`              | No        | `3000`                           | Puerto del servidor             |
| `DATABASE_URL`      | **Sí**    | —                                | Cadena de conexión PostgreSQL   |
| `APIFY_TOKEN`       | **Sí**    | —                                | Token de Apify                  |
| `APIFY_JOBS_ACTOR`  | No        | `bebity~linkedin-jobs-scraper`   | Actor de LinkedIn Jobs          |
| `GROQ_API_KEY`      | **Sí**    | —                                | API key de Groq                 |
| `GROQ_BASE_URL`     | No        | `https://api.groq.com/openai/v1` | Base URL de Groq                |
| `GROQ_MODEL`        | No        | `llama-3.3-70b-versatile`        | Modelo de Groq                  |

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
