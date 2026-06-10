import type { Request, Response, NextFunction } from 'express';
import { searchJobsController } from '../../controllers/jobs/search-jobs-controller.js';
import { filterJobsByEnglishPreference, filterJobsByLanguagePreferences } from '../../controllers/matching/language-filter-controller.js';
import type { Job, JobSearchParams } from '../../types/job.types.js';
import type { JobSearchInput } from './jobs.schema.js';

function applyLanguageFilters(jobs: Job[], params: JobSearchParams): Job[] {
  if (params.allowedLanguages) {
    return filterJobsByLanguagePreferences(jobs, { allowedLanguages: params.allowedLanguages });
  }
  return filterJobsByEnglishPreference(jobs, {
    allowEnglishRequirements: params.allowEnglishRequirements ?? true,
    maxEnglishLevelEnabled: params.maxEnglishLevelEnabled ?? false,
    maxEnglishLevel: params.maxEnglishLevel,
  });
}

/** Búsqueda cruda en Apify, sin ranking semántico. */
export async function searchJobsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.body ya viene validado por validateBody(jobSearchSchema)
    const params = req.body as JobSearchInput;
    const jobs = await searchJobsController(params);
    const filteredJobs = applyLanguageFilters(jobs, params);
    res.json({ count: filteredJobs.length, jobs: filteredJobs });
  } catch (err) {
    next(err);
  }
}
