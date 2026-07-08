import { env } from '../../config/env.js';
import { apify } from '../../utils/apify-client.js';
import type { Job, JobSearchParams } from '../../types/job.types.js';
import { logger } from '../../utils/logger.js';
import { getCached, searchCacheKey, setCached } from '../../utils/search-cache.js';

const URL_SEARCH_ACTOR = 'curious_coder/linkedin-jobs-scraper';

type JobsActorStrategy = 'keyword-input' | 'linkedin-search-url';

interface JobsActorConfig {
  actorId: string;
  strategy: JobsActorStrategy;
}

interface RawApifyJob {
  id?: string;
  jobId?: string;
  title?: string;
  position?: string;
  companyName?: string;
  company?: string;
  location?: string;
  description?: string;
  descriptionText?: string;
  jobUrl?: string;
  link?: string;
  url?: string;
  postedAt?: string;
  postedTime?: string;
  workplaceType?: string;
}

function getJobsActorConfig(actorId: string): JobsActorConfig {
  if (actorId === URL_SEARCH_ACTOR) {
    return { actorId, strategy: 'linkedin-search-url' };
  }
  return { actorId, strategy: 'keyword-input' };
}

function buildLinkedInSearchUrl(params: JobSearchParams): string {
  const url = new URL('https://www.linkedin.com/jobs/search/');
  url.searchParams.set('keywords', params.keywords);
  if (params.location) url.searchParams.set('location', params.location);
  if (params.remote) url.searchParams.set('f_WT', '2');
  return url.toString();
}

async function loadActorItems(actor: JobsActorConfig, params: JobSearchParams): Promise<unknown[]> {
  const limit = params.limit ?? 50;

  if (actor.strategy === 'linkedin-search-url') {
    const run = await apify.actor(actor.actorId).call({ urls: [buildLinkedInSearchUrl(params)] });
    const { items } = await apify.dataset(run.defaultDatasetId).listItems({ limit });
    return items;
  }

  const input: Record<string, unknown> = {
    keywords: params.keywords,
    location: params.location ?? '',
    rows: limit,
    proxy: { useApifyProxy: true },
  };

  if (params.remote) input.workType = 'remote';
  if (params.seniority) input.experienceLevel = params.seniority;

  const run = await apify.actor(actor.actorId).call(input);
  const { items } = await apify.dataset(run.defaultDatasetId).listItems({ limit });
  return items;
}

function isRemote(raw: RawApifyJob): boolean {
  const haystack = `${raw.workplaceType ?? ''} ${raw.location ?? ''}`.toLowerCase();
  return /remote|remoto|teletrabajo|home\s?office/.test(haystack);
}

/** Normaliza variantes de salida de actores Apify al contrato estable `Job`. */
function normalize(raw: RawApifyJob, index: number): Job {
  return {
    id: raw.id ?? raw.jobId ?? `job-${index}`,
    title: raw.title ?? raw.position ?? 'Sin título',
    company: raw.companyName ?? raw.company ?? 'Empresa desconocida',
    location: raw.location ?? 'No especificada',
    remote: isRemote(raw),
    description: raw.descriptionText ?? raw.description ?? '',
    url: raw.jobUrl ?? raw.link ?? raw.url ?? '',
    postedAt: raw.postedAt ?? raw.postedTime,
  };
}

/** Agrega un job al mapa de dedup si no está duplicado (por URL o ID). */
function addIfNew(jobsMap: Map<string, Job>, job: Job): void {
  const key = job.url || job.id;
  if (!jobsMap.has(key)) jobsMap.set(key, job);
}

/**
 * Busca ofertas en LinkedIn probando TODOS los actores Apify configurados.
 * Los resultados se combinan desduplicando por URL.
 * Si un actor falla, se loguea el error y se continúa con el siguiente.
 */
export async function searchJobsController(params: JobSearchParams): Promise<Job[]> {
  const cacheKey = searchCacheKey({
    keywords: params.keywords,
    location: params.location ?? '',
    remote: params.remote ?? false,
    limit: params.limit ?? 50,
  });

  const cached = getCached<Job[]>(cacheKey);
  if (cached) {
    logger.info('Apify: resultados servidos desde cache', { keywords: params.keywords });
    return cached;
  }

  const allJobs = new Map<string, Job>();
  const actors = env.apify.jobsActors;

  for (const actorId of actors) {
    const config = getJobsActorConfig(actorId);

    logger.info('Apify: ejecutando actor de jobs', {
      actor: actorId,
      keywords: params.keywords,
      limit: params.limit ?? 50,
    });

    try {
      const items = await loadActorItems(config, params);
      const jobs = (items as RawApifyJob[]).map((raw, i) => normalize(raw, i));
      logger.info(`Apify [${actorId}]: ${jobs.length} ofertas recuperadas`);

      for (const job of jobs) addIfNew(allJobs, job);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'desconocido';
      logger.warn(`Apify [${actorId}]: error — ${message}`);
      // No interrumpimos: probamos el siguiente actor
    }
  }

  const uniqueJobs = [...allJobs.values()];
  logger.info(`Apify: ${uniqueJobs.length} ofertas únicas combinadas de ${actors.length} actor(es)`);

  setCached(cacheKey, uniqueJobs);
  return uniqueJobs;
}
