# HireFire — Instructivo de configuración y costos

Guía paso a paso para obtener las dos API keys, dónde ponerlas, y cuánto cuesta cada búsqueda.

---

## 1. Las dos llaves que necesitás

HireFire usa **dos servicios externos de pago por uso**. Sin ellos el backend arranca
pero rechaza el inicio pidiendo las variables.

```
┌─────────────────────────────────────────────────────────────┐
│                      backend/.env                            │
│                                                              │
│   APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxx   ◄── ofertas    │
│   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxx   ◄── ranking    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Dónde poner las keys (paso a paso)

```
backend/
├── .env.example   ← plantilla versionada (NO tiene secretos)
└── .env           ← TU archivo real (NO se sube a git, está en .gitignore)
```

### Paso 1 — Copiar la plantilla

```bash
cd E:\Repositorios\HireFire\backend
copy .env.example .env        # Windows (CMD/PowerShell)
# o en bash:  cp .env.example .env
```

### Paso 2 — Editar `.env` y pegar tus claves

```ini
PORT=3000

# Apify
APIFY_TOKEN=apify_api_TU_TOKEN_REAL_ACA
APIFY_JOBS_ACTOR=bebity~linkedin-jobs-scraper

# Claude
ANTHROPIC_API_KEY=sk-ant-TU_KEY_REAL_ACA
CLAUDE_MODEL=claude-sonnet-4-6
```

> ⚠️ **Nunca** subas el `.env` a GitHub ni lo pegues en un chat. Ya está protegido por
> `.gitignore`, pero la regla es: las keys viven solo en tu máquina.

---

## 3. De dónde sacar cada key

### 🔑 Apify (`APIFY_TOKEN`)

```
1. Crear cuenta gratis ──► https://console.apify.com/sign-up
2. Ir a:  Settings ─► Integrations ─► API tokens
   URL directa: https://console.apify.com/account/integrations
3. Copiar el "Personal API token"  (empieza con apify_api_...)
4. Pegarlo en .env  →  APIFY_TOKEN=...
```

El plan **Free** de Apify viene con **$5 USD de crédito mensual** que se renueva. Para uso
personal probablemente nunca lo gastes.

### 🔑 Claude / Anthropic (`ANTHROPIC_API_KEY`)

```
1. Crear cuenta ──► https://console.anthropic.com/
2. Cargar saldo:  Settings ─► Billing  (mínimo ~$5)
3. Ir a:  Settings ─► API Keys ─► Create Key
   URL directa: https://console.anthropic.com/settings/keys
4. Copiar la key (empieza con sk-ant-...) ── solo se muestra UNA vez
5. Pegarla en .env  →  ANTHROPIC_API_KEY=...
```

> La API de Claude es **prepaga**: cargás saldo y se descuenta por uso. No hay tier gratis,
> pero el costo por búsqueda es de centavos (ver abajo).

---

## 4. Costo estimado por búsqueda

Una búsqueda = traer N ofertas de Apify + que Claude las rankee contra tu perfil.

### 4.1. Apify (los datos)

- Modelo **pay-per-result**: pagás por oferta traída.
- Con el crédito gratis de $5/mes, una búsqueda de 30–50 ofertas es **prácticamente $0**.
- Si superaras el free tier: ~**$0.001–0.005 por oferta** según el actor.

### 4.2. Claude (el ranking) — el costo principal

Tarifa de `claude-sonnet-4-6` (referencia): **~$3 por millón de tokens de entrada** y
**~$15 por millón de tokens de salida**. El perfil va **cacheado** (lectura ~$0.30/M).

Cómo procesa HireFire una búsqueda de **30 ofertas**:

```
30 ofertas ÷ 8 por lote  ≈  4 llamadas a Claude

Por búsqueda (aprox.):
  • Entrada (descripciones de ofertas) : ~14.000 tokens  → ~$0.043
  • Salida (score + razones + gaps)    : ~4.000  tokens  → ~$0.060
  • Perfil cacheado                    : casi gratis
  ────────────────────────────────────────────────────────
  TOTAL Claude por búsqueda            ≈  $0.08 – $0.12
```

### 4.3. Tabla resumen

| Ofertas por búsqueda | Apify        | Claude        | **Total estimado** |
|----------------------|--------------|---------------|--------------------|
| 10                   | ~$0 (free)   | ~$0.03–0.05   | **~$0.05**         |
| 30                   | ~$0 (free)   | ~$0.08–0.12   | **~$0.10**         |
| 50                   | ~$0 (free)   | ~$0.15–0.25   | **~$0.20**         |

```
Proyección de uso:
  3 búsquedas/día × 30 ofertas ≈ $0.30/día ≈ ~$9 USD/mes en Claude
  (Apify cubierto por el free tier)
```

> 💡 Los números son estimaciones: el costo real sube/baja según **cuán largas** sean las
> descripciones de las ofertas (es lo que más tokens consume). Por eso el código recorta
> cada descripción a 1.500 caracteres antes de enviarla a Claude.

---

## 5. Cómo bajar el costo si hiciera falta

| Palanca                         | Efecto                                              |
|---------------------------------|-----------------------------------------------------|
| Bajar `limit` de la búsqueda    | Menos ofertas = menos tokens (lineal)               |
| Recorte de descripción (ya activo, 1.500 chars) | Menos tokens de entrada por oferta  |
| Prompt caching del perfil (ya activo) | El perfil no se re-cobra en cada lote         |
| Usar `claude-haiku-4-5` para pre-filtrar | Modelo más barato para descartar lo obvio    |

---

## 6. Verificar que quedó bien

```bash
cd E:\Repositorios\HireFire\backend
npm run dev
```

- ✅ Si ves `HireFire backend escuchando en http://localhost:3000` → las keys están OK.
- ❌ Si ves `Falta la variable de entorno requerida: APIFY_TOKEN` → revisá el `.env`.
