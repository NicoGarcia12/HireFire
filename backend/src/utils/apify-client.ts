import { ApifyClient } from 'apify-client';
import { env } from '../config/env.js';

/** Cliente Apify para ejecutar actores externos. */
export const apify = new ApifyClient({ token: env.apify.token });
