# HireFire 🔥

Buscador inteligente de postulaciones laborales. Cargás tu perfil y palabras clave,
recupera ofertas de LinkedIn vía **Apify** y las rankea con **Groq (Llama 3.3 70B)**
según cuánto encajan con tu experiencia.

> Diseño detallado → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
> Obtener API keys y costos → [`docs/SETUP.md`](docs/SETUP.md)

---

## Stack

| Capa         | Tecnología                                          |
|--------------|-----------------------------------------------------|
| Backend      | Node.js 22 + Express + TypeScript                   |
| Base de datos| PostgreSQL 16 (instalado en Windows) + Prisma ORM   |
| Datos jobs   | Apify — LinkedIn Jobs Scraper                       |
| Matching     | Groq API — `llama-3.3-70b-versatile` (tier gratuito)|
| Validación   | Zod                                                 |
| Frontend     | Angular 21 (standalone + signals)                   |

---

## Estado del proyecto

- [x] **Fase 1** — Backend Express + API REST + Apify + matching con Groq/Llama
- [x] **Fase 2a** — UI Angular (perfil, búsqueda, resultados rankeados)
- [x] **Fase 2b** — Persistencia PostgreSQL + Prisma
- [ ] **Fase 3** — Auth, historial de búsquedas, alertas por keywords
- [ ] **Fase 4** — Importador del export ZIP de LinkedIn

---

## Prerequisitos

- **Node.js 22+** — verificar con `node --version`
- **PostgreSQL 16** instalado en Windows — ver paso 1 abajo
- **API keys** de Apify y Groq — ambas tienen **tier gratuito**

---

## Cómo levantar todo

### 1. Instalar PostgreSQL en Windows (solo la primera vez)

1. Descargar el instalador desde **https://www.postgresql.org/download/windows/**
2. Ejecutar el installer — cuando pida password para el usuario `postgres`, anotarla.
3. Dejar el puerto por defecto: **5432**.
4. Una vez instalado, abrir **pgAdmin** o **SQL Shell (psql)** y crear el usuario y la base:

```sql
CREATE USER hirefire WITH PASSWORD 'hirefire';
CREATE DATABASE hirefire OWNER hirefire;
```

5. Verificar que esté corriendo:

```powershell
Get-Service postgresql*   # debe mostrar "Running"
```

### 2. Obtener las API keys (ambas gratuitas)

#### Apify — ofertas de LinkedIn
1. Crear cuenta en **https://console.apify.com/sign-up**
2. Ir a Settings → Integrations → API tokens
3. Copiar el token (empieza con `apify_api_...`)
4. El plan Free incluye **$5 USD de crédito mensual** — suficiente para uso personal.

#### Groq — ranking inteligente
1. Crear cuenta en **https://console.groq.com**
2. Ir a API Keys → Create API Key
3. Copiar la key (empieza con `gsk_...`)
4. El tier gratuito incluye **requests generosos por minuto** — más que suficiente.

### 3. Configurar variables de entorno

```bash
cd backend
copy .env.example .env
```

Editar `backend/.env`:

```ini
DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire?schema=public
APIFY_TOKEN=apify_api_...    # de https://console.apify.com/account/integrations
GROQ_API_KEY=gsk_...         # de https://console.groq.com/keys
```

Las demás variables ya tienen valores por defecto correctos.

### 4. Instalar dependencias y crear las tablas

```bash
cd backend
npm install
npm run db:push
```

Salida esperada: `Your database is now in sync with your Prisma schema.`

### 5. Iniciar el backend

```bash
npm run dev
```

Salida esperada: `HireFire backend escuchando en http://localhost:3000`

### 6. Iniciar el frontend

En una terminal aparte:

```bash
cd frontend
npm install
npm start
```

Abrí **http://localhost:4200** en el navegador.

---

## Cómo probar lo construido hasta ahora

### Verificación rápida — healthcheck

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","service":"hirefire-backend"}
```

### Opción A — Desde la UI (recomendado)

1. Abrí `http://localhost:4200`.
2. **"1 · Tu perfil"** — completá headline, skills y experiencia. Clic en **Guardar perfil** → aparece badge `Guardado ✓`.
3. **"2 · Buscar ofertas"** — ingresá keywords (ej. `backend node`), ubicación, límite. Clic en **Buscar**.
4. En unos segundos aparece la lista rankeada con **score 0–100**, razones de match y gaps por oferta.

### Opción B — Desde la terminal (cURL)

```bash
# Paso 1: crear perfil
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
# Guardá el "id" que devuelve

# Paso 2: buscar y rankear
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "<id-del-paso-1>",
    "keywords": "backend node typescript",
    "location": "Argentina",
    "remote": true,
    "limit": 20
  }'

# Verificar persistencia: reiniciá el backend y consultá el perfil
curl http://localhost:3000/api/profile/<id-del-paso-1>
# → devuelve el perfil (guardado en Postgres)
```

---

## Variables de entorno

| Variable            | Requerida | Default                              | Descripción                      |
|---------------------|-----------|--------------------------------------|----------------------------------|
| `PORT`              | No        | `3000`                               | Puerto del servidor              |
| `DATABASE_URL`      | **Sí**    | —                                    | Cadena de conexión PostgreSQL    |
| `APIFY_TOKEN`       | **Sí**    | —                                    | Token de Apify                   |
| `APIFY_JOBS_ACTOR`  | No        | `bebity~linkedin-jobs-scraper`       | Actor de LinkedIn Jobs           |
| `GROQ_API_KEY`      | **Sí**    | —                                    | API key de Groq (gratuita)       |
| `GROQ_BASE_URL`     | No        | `https://api.groq.com/openai/v1`     | Base URL de Groq                 |
| `GROQ_MODEL`        | No        | `llama-3.3-70b-versatile`            | Modelo de Groq                   |

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
