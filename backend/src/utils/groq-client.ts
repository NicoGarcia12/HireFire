import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/** Cliente OpenAI-compatible apuntando a Groq. */
export const groq = new OpenAI({
  apiKey: env.groq.apiKey,
  baseURL: env.groq.baseUrl,
});

const openrouter = env.openrouter.apiKey
  ? new OpenAI({ apiKey: env.openrouter.apiKey, baseURL: env.openrouter.baseUrl })
  : null;

type ChatParams = Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, 'model'>;

/**
 * Llama a Groq y, si falla (modelo no disponible, rate limit, etc.), reintenta
 * con OpenRouter usando un modelo gratuito, si hay OPENROUTER_API_KEY configurada.
 */
export async function createChatCompletion(params: ChatParams) {
  try {
    return await groq.chat.completions.create({ ...params, model: env.groq.model });
  } catch (error) {
    if (!openrouter) throw error;

    logger.warn('Groq falló, reintentando con OpenRouter', {
      error: error instanceof Error ? error.message : error,
    });
    return await openrouter.chat.completions.create({ ...params, model: env.openrouter.model });
  }
}
