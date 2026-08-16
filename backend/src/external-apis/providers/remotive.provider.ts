import type { Job, JobSearchParams } from '../../types/job.types.js';
import { fetchJson } from '../../utils/http-client.js';

const API_URL = 'https://remotive.com/api/remote-jobs';

interface RawRemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  description: string;
  publication_date: string;
}

interface RemotiveResponse {
  jobs: RawRemotiveJob[];
}

function normalize(raw: RawRemotiveJob): Job {
  return {
    id: `remotive-${raw.id}`,
    title: raw.title,
    company: raw.company_name,
    location: raw.candidate_required_location || 'Remoto',
    remote: true,
    description: raw.description,
    url: raw.url,
    postedAt: raw.publication_date,
    provider: 'remotive',
  };
}

export async function searchRemotive(params: JobSearchParams): Promise<Job[]> {
  const limit = params.limit ?? 50;
  const url = new URL(API_URL);
  url.searchParams.set('search', params.keywords);

  const response = await fetchJson<RemotiveResponse>(url.toString());
  return response.jobs.slice(0, limit).map(normalize);
}
