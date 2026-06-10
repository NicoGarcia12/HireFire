import OpenAI from 'openai';
import { env } from '../config/env.js';

/** Cliente OpenAI-compatible apuntando a Groq. */
export const groq = new OpenAI({
  apiKey: env.groq.apiKey,
  baseURL: env.groq.baseUrl,
});
