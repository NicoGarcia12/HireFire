import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

const DEFAULT_JOBS_ACTOR = 'curious_coder/linkedin-jobs-scraper';

/** APIFY_JOBS_ACTORS (coma-separada) tiene prioridad; si no está, cae a la variable legacy APIFY_JOBS_ACTOR. */
function parseJobsActors(): readonly string[] {
  const raw = optional('APIFY_JOBS_ACTORS', optional('APIFY_JOBS_ACTOR', DEFAULT_JOBS_ACTOR));
  return raw
    .split(',')
    .map((actorId) => actorId.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(optional('PORT', '3000')),
  databaseUrl: required('DATABASE_URL'),
  apify: {
    token: required('APIFY_TOKEN'),
    /** Actores Apify a probar para LinkedIn, en orden. Se combinan los resultados de todos los que respondan. */
    jobsActors: parseJobsActors(),
  },
  groq: {
    apiKey: required('GROQ_API_KEY'),
    baseUrl: optional('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
    model: optional('GROQ_MODEL', 'llama-3.3-70b-versatile'),
  },
} as const;
