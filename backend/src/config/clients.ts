import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';
import { env } from './env.js';

/** Cliente único de Apify para invocar actores. */
export const apify = new ApifyClient({ token: env.apify.token });

/** Cliente OpenAI-compatible apuntando a Groq para el matching semántico. */
export const groq = new OpenAI({
  apiKey: env.groq.apiKey,
  baseURL: env.groq.baseUrl,
});
