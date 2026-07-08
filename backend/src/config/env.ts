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

const apifyJobsActors: readonly string[] = (() => {
  const raw =
    process.env['APIFY_JOBS_ACTORS'] ??
    process.env['APIFY_JOBS_ACTOR'] ??
    'curious_coder/linkedin-jobs-scraper';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
})();

export const env = {
  port: Number(optional('PORT', '3000')),
  databaseUrl: required('DATABASE_URL'),
  apify: {
    token: required('APIFY_TOKEN'),
    /** Primer actor de la lista (backwards-compat) */
    jobsActor: apifyJobsActors[0] ?? 'curious_coder/linkedin-jobs-scraper',
    /** Lista de actores Apify separados por coma. Se prueban en orden y se combinan resultados */
    jobsActors: apifyJobsActors,
  },
  groq: {
    apiKey: required('GROQ_API_KEY'),
    baseUrl: optional('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
    model: optional('GROQ_MODEL', 'llama-3.3-70b-versatile'),
  },
} as const;
