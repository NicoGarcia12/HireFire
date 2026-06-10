import { env } from '../../config/env.js';
import { apify } from '../../utils/apify-client.js';
import type { Job, JobSearchParams } from '../../types/job.types.js';
import { logger } from '../../utils/logger.js';

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
  };
}

/**
 * Busca ofertas en LinkedIn por Apify con fallback al actor por URL si el actor legacy requiere alquiler.
 */
export async function searchJobsController(params: JobSearchParams): Promise<Job[]> {
  const actor = getJobsActorConfig(env.apify.jobsActor);

  logger.info('Apify: ejecutando actor de jobs', {
    actor: actor.actorId,
    keywords: params.keywords,
    limit: params.limit ?? 50,
  });

  try {
    const items = await loadActorItems(actor, params);
    const jobs = (items as RawApifyJob[]).map(normalize);
    logger.info(`Apify: ${jobs.length} ofertas recuperadas`);
    return jobs;
  } catch (error) {
    if (!shouldFallbackToUrlActor(actor, error)) throw error;

    logger.warn(`Apify: actor legacy no disponible. Fallback automático a ${URL_SEARCH_ACTOR}.`);
    const fallbackActor: JobsActorConfig = { actorId: URL_SEARCH_ACTOR, strategy: 'linkedin-search-url' };
    const items = await loadActorItems(fallbackActor, params);
    const jobs = (items as RawApifyJob[]).map(normalize);
    logger.info(`Apify fallback: ${jobs.length} ofertas recuperadas`);
    return jobs;
  }
}
