import { env } from '../../config/env.js';
import { apify } from '../../utils/apify-client.js';
import type { Job, JobSearchParams } from '../../types/job.types.js';
import { logger } from '../../utils/logger.js';
import { getCached, searchCacheKey, setCached } from '../../utils/search-cache.js';
import { searchFreeProviders } from '../../external-apis/multi-provider-search.js';

const LEGACY_KEYWORD_ACTOR = 'bebity~linkedin-jobs-scraper';
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

function isActorRentalError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('You must rent a paid Actor');
}

function shouldFallbackToUrlActor(actor: JobsActorConfig, error: unknown): boolean {
  return (
    actor.actorId === LEGACY_KEYWORD_ACTOR &&
    actor.strategy === 'keyword-input' &&
    isActorRentalError(error)
  );
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
    provider: 'linkedin',
  };
}

/** Corre un actor puntual, con fallback al actor por URL si el actor legacy requiere alquiler. */
async function loadJobsFromActor(actorId: string, params: JobSearchParams): Promise<Job[]> {
  const actor = getJobsActorConfig(actorId);

  try {
    const items = await loadActorItems(actor, params);
    return (items as RawApifyJob[]).map(normalize);
  } catch (error) {
    if (!shouldFallbackToUrlActor(actor, error)) throw error;

    logger.warn(`Apify: actor legacy no disponible. Fallback automático a ${URL_SEARCH_ACTOR}.`);
    const fallbackActor: JobsActorConfig = {
      actorId: URL_SEARCH_ACTOR,
      strategy: 'linkedin-search-url',
    };
    const items = await loadActorItems(fallbackActor, params);
    return (items as RawApifyJob[]).map(normalize);
  }
}

/**
 * Prueba todos los actores Apify configurados (`APIFY_JOBS_ACTORS`) para LinkedIn, en orden,
 * y combina los resultados de todos los que respondan. Si un actor falla se loguea y se sigue
 * con el siguiente — un actor bloqueado por LinkedIn no tira abajo a los demás.
 */
async function searchLinkedInJobs(params: JobSearchParams): Promise<Job[]> {
  const jobs: Job[] = [];

  for (const actorId of env.apify.jobsActors) {
    logger.info('Apify: ejecutando actor de jobs', {
      actor: actorId,
      keywords: params.keywords,
      limit: params.limit ?? 50,
    });

    try {
      const actorJobs = await loadJobsFromActor(actorId, params);
      logger.info(`Apify [${actorId}]: ${actorJobs.length} ofertas recuperadas`);
      jobs.push(...actorJobs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      logger.warn(`Apify [${actorId}]: error — ${message}`);
    }
  }

  return jobs;
}

/** Combina jobs de varias fuentes descartando duplicados por URL (o id si no hay URL). */
function dedupeByUrl(jobs: Job[]): Job[] {
  const byKey = new Map<string, Job>();
  for (const job of jobs) {
    const key = job.url || job.id;
    if (!byKey.has(key)) byKey.set(key, job);
  }
  return [...byKey.values()];
}

/**
 * Busca ofertas combinando LinkedIn (Apify) con las fuentes gratuitas sin registro.
 * Si una fuente falla, se ignora y se sigue con las demás — nunca rompe la búsqueda completa.
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
    logger.info('Busqueda de jobs: resultados servidos desde cache', { keywords: params.keywords });
    return cached;
  }

  const [linkedInResult, freeProvidersResult] = await Promise.allSettled([
    searchLinkedInJobs(params),
    searchFreeProviders(params),
  ]);

  const linkedInJobs = linkedInResult.status === 'fulfilled' ? linkedInResult.value : [];
  if (linkedInResult.status === 'rejected') {
    const message =
      linkedInResult.reason instanceof Error ? linkedInResult.reason.message : 'error desconocido';
    logger.error(`Apify: fuente no disponible — ${message}`);
  }
  const freeJobs = freeProvidersResult.status === 'fulfilled' ? freeProvidersResult.value : [];

  const jobs = dedupeByUrl([...linkedInJobs, ...freeJobs]);
  logger.info(`Busqueda de jobs: ${jobs.length} ofertas unicas combinadas`);

  setCached(cacheKey, jobs);
  return jobs;
}
