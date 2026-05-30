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

export const env = {
  port: Number(optional('PORT', '3000')),
  databaseUrl: required('DATABASE_URL'),
  apify: {
    token: required('APIFY_TOKEN'),
    jobsActor: optional('APIFY_JOBS_ACTOR', 'bebity~linkedin-jobs-scraper'),
  },
  groq: {
    apiKey: required('GROQ_API_KEY'),
    baseUrl: optional('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
    model: optional('GROQ_MODEL', 'llama-3.3-70b-versatile'),
  },
} as const;
