import type { Job, JobSearchParams } from '../../types/job.types.js';
import { fetchJson } from '../../utils/http-client.js';

const API_URL = 'https://himalayas.app/jobs/api/search';

interface RawHimalayasJob {
  guid: string;
  title: string;
  companyName: string;
  locationRestrictions?: string[];
  description: string;
  pubDate: string;
  applicationLink: string;
}

interface HimalayasResponse {
  jobs: RawHimalayasJob[];
}

function normalize(raw: RawHimalayasJob): Job {
  return {
    id: `himalayas-${raw.guid}`,
    title: raw.title,
    company: raw.companyName,
    location: raw.locationRestrictions?.join(', ') || 'Remoto',
    remote: true,
    description: raw.description,
    url: raw.applicationLink,
    postedAt: raw.pubDate,
    provider: 'himalayas',
  };
}

export async function searchHimalayas(params: JobSearchParams): Promise<Job[]> {
  const limit = params.limit ?? 50;
  const url = new URL(API_URL);
  url.searchParams.set('q', params.keywords);

  const response = await fetchJson<HimalayasResponse>(url.toString());
  return response.jobs.slice(0, limit).map(normalize);
}
