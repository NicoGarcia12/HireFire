import type { Job, JobSearchParams } from '../types/job.types.js';
import { logger } from '../utils/logger.js';
import type { JobProvider } from './job-provider.interface.js';
import { searchArbeitnow } from './providers/arbeitnow.provider.js';
import { searchHimalayas } from './providers/himalayas.provider.js';
import { searchJobicy } from './providers/jobicy.provider.js';
import { searchRemoteOk } from './providers/remoteok.provider.js';
import { searchRemotive } from './providers/remotive.provider.js';

const FREE_PROVIDERS: JobProvider[] = [
  { id: 'arbeitnow', search: searchArbeitnow },
  { id: 'remoteok', search: searchRemoteOk },
  { id: 'remotive', search: searchRemotive },
  { id: 'jobicy', search: searchJobicy },
  { id: 'himalayas', search: searchHimalayas },
];

/**
 * Consulta todas las fuentes gratuitas sin registro en paralelo.
 * Si una fuente falla (timeout, cambio de contrato, etc.) se loguea y se ignora — nunca rompe la búsqueda.
 */
export async function searchFreeProviders(params: JobSearchParams): Promise<Job[]> {
  const settled = await Promise.allSettled(
    FREE_PROVIDERS.map((provider) => provider.search(params)),
  );

  const jobs: Job[] = [];
  settled.forEach((result, index) => {
    const provider = FREE_PROVIDERS[index]!;
    if (result.status === 'fulfilled') {
      logger.info(`${provider.id}: ${result.value.length} ofertas recuperadas`);
      jobs.push(...result.value);
    } else {
      const message = result.reason instanceof Error ? result.reason.message : 'error desconocido';
      logger.warn(`${provider.id}: error — ${message}`);
    }
  });

  return jobs;
}
