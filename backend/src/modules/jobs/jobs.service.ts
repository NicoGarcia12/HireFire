import { apify } from '../../config/clients.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { Job, JobSearchParams } from '../../types/domain.js';

/**
 * Forma cruda esperada de cada item del actor de LinkedIn Jobs en Apify.
 * Los actores varían en nombres de campos, por eso normalizamos defensivamente.
 */
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

function isRemote(raw: RawApifyJob): boolean {
  const haystack = `${raw.workplaceType ?? ''} ${raw.location ?? ''}`.toLowerCase();
  return /remote|remoto|teletrabajo|home\s?office/.test(haystack);
}

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
 * Busca ofertas en LinkedIn a través del actor de Apify configurado.
 * Devuelve ofertas normalizadas al contrato de dominio `Job`.
 */
export async function searchJobs(params: JobSearchParams): Promise<Job[]> {
  const limit = params.limit ?? 50;

  const input: Record<string, unknown> = {
    keywords: params.keywords,
    location: params.location ?? '',
    rows: limit,
    proxy: { useApifyProxy: true },
  };

  if (params.remote) input.workType = 'remote';
  if (params.seniority) input.experienceLevel = params.seniority;

  logger.info('Apify: ejecutando actor de jobs', {
    actor: env.apify.jobsActor,
    keywords: params.keywords,
    limit,
  });

  const run = await apify.actor(env.apify.jobsActor).call(input);
  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  const jobs = (items as RawApifyJob[]).map(normalize);
  logger.info(`Apify: ${jobs.length} ofertas recuperadas`);
  return jobs;
}
