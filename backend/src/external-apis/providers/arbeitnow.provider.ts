import type { Job, JobSearchParams } from '../../types/job.types.js';
import { fetchJson } from '../../utils/http-client.js';
import { matchesKeywords } from '../keyword-filter.js';

const API_URL = 'https://www.arbeitnow.com/api/job-board-api';

interface RawArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  location: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: RawArbeitnowJob[];
}

function normalize(raw: RawArbeitnowJob): Job {
  return {
    id: `arbeitnow-${raw.slug}`,
    title: raw.title,
    company: raw.company_name,
    location: raw.location || (raw.remote ? 'Remoto' : 'No especificada'),
    remote: raw.remote,
    description: raw.description,
    url: raw.url,
    postedAt: new Date(raw.created_at * 1000).toISOString(),
    provider: 'arbeitnow',
  };
}

/** Arbeitnow no soporta búsqueda por keyword en la API, así que filtramos del lado del cliente. */
export async function searchArbeitnow(params: JobSearchParams): Promise<Job[]> {
  const limit = params.limit ?? 50;
  const response = await fetchJson<ArbeitnowResponse>(API_URL);

  return response.data
    .filter((raw) => matchesKeywords(`${raw.title} ${raw.tags.join(' ')}`, params.keywords))
    .slice(0, limit)
    .map(normalize);
}
