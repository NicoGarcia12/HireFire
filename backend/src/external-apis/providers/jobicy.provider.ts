import type { Job, JobSearchParams } from '../../types/job.types.js';
import { fetchJson } from '../../utils/http-client.js';
import { matchesKeywords } from '../keyword-filter.js';

const API_URL = 'https://jobicy.com/api/v2/remote-jobs';

interface RawJobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry: string[];
  jobGeo: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
}

interface JobicyResponse {
  jobs: RawJobicyJob[];
}

function normalize(raw: RawJobicyJob): Job {
  return {
    id: `jobicy-${raw.id}`,
    title: raw.jobTitle,
    company: raw.companyName,
    location: raw.jobGeo || 'Remoto',
    remote: true,
    description: raw.jobDescription || raw.jobExcerpt,
    url: raw.url,
    postedAt: raw.pubDate,
    provider: 'jobicy',
  };
}

/** El parámetro `tag` de Jobicy no es full-text search, así que reforzamos con filtro del lado del cliente. */
export async function searchJobicy(params: JobSearchParams): Promise<Job[]> {
  const limit = params.limit ?? 50;
  const url = new URL(API_URL);
  url.searchParams.set('count', String(Math.min(limit, 100)));

  const response = await fetchJson<JobicyResponse>(url.toString());

  return response.jobs
    .filter((raw) => matchesKeywords(`${raw.jobTitle} ${raw.jobIndustry.join(' ')}`, params.keywords))
    .slice(0, limit)
    .map(normalize);
}
