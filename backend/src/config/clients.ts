import { ApifyClient } from 'apify-client';
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env.js';

/** Cliente único de Apify para invocar actores. */
export const apify = new ApifyClient({ token: env.apify.token });

/** Cliente único de Claude para el matching semántico. */
export const anthropic = new Anthropic({ apiKey: env.claude.apiKey });
