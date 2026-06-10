import { Router } from 'express';
import { saveSearchHistoryUseCase } from '../../../application/history/use-cases/save-search-history.use-case.js';
import type { Job } from '../../../domain/jobs/entities/job.entity.js';
import type { JobSearchParams } from '../../../domain/jobs/interfaces/job-search-params.interface.js';
import { searchHistoryRepository } from '../../../infrastructure/db/repositories/prisma-search-history.repository.js';
import { profileRepository } from '../../../infrastructure/db/repositories/prisma-profile.repository.js';
import { rankJobs } from '../../../infrastructure/ai/groq-matching.service.js';
import { searchJobs } from '../../../infrastructure/scraping/linkedin-jobs.client.js';
import {
  filterJobsByEnglishPreference,
  filterJobsByLanguagePreferences,
} from '../../../modules/matching/language-filter.js';
import { getProfileUseCase } from '../../../application/profile/use-cases/get-profile.use-case.js';
import { validateBody } from '../middleware/validate.js';
import { fullSearchSchema, jobSearchSchema } from './jobs.schema.js';

export const jobsRouter = Router();
export const searchRouter = Router();

/** Aplica el contrato nuevo multi-idioma o el fallback legacy de inglés según el payload recibido. */
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
jobsRouter.post('/search', validateBody(jobSearchSchema), async (req, res, next) => {
  try {
    const jobs = await searchJobs(req.body);
    const filteredJobs = applyLanguageFilters(jobs, req.body);
    res.json({ count: filteredJobs.length, jobs: filteredJobs });
  } catch (err) {
    next(err);
  }
});

/** Flujo completo: obtiene perfil, busca jobs, filtra por idioma, rankea y dispara historial no bloqueante. */
searchRouter.post('/', validateBody(fullSearchSchema), async (req, res, next) => {
  try {
    const { profileId, ...searchParams } = req.body;
    const profile = await getProfileUseCase(profileRepository, profileId);
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }

    const jobs = await searchJobs(searchParams);
    const filteredJobs = applyLanguageFilters(jobs, searchParams);
    const ranked = await rankJobs(profile, filteredJobs);

    saveSearchHistoryUseCase(searchHistoryRepository, {
      profileId,
      keywords: searchParams.keywords,
      location: searchParams.location,
      remote: searchParams.remote ?? false,
      limit: searchParams.limit ?? 30,
      results: ranked,
    }).catch(() => { /* historial no es crítico para la respuesta */ });

    res.json({ count: ranked.length, results: ranked });
  } catch (err) {
    next(err);
  }
});
