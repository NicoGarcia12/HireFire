import type { Job, JobProviderId, JobSearchParams } from '../types/job.types.js';

/** Contrato que implementa cada fuente externa de ofertas (además del scraper de LinkedIn vía Apify). */
export interface JobProvider {
  id: JobProviderId;
  search(params: JobSearchParams): Promise<Job[]>;
}
