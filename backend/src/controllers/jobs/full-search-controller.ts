import { findProfileById } from '../../helpers/profile/find-profile-helper.js';
import { saveSearchHistory } from '../../helpers/history/search-history-helper.js';
import { searchJobsController } from './search-jobs-controller.js';
import { rankJobsController } from '../matching/rank-jobs-controller.js';
import {
  filterJobsByEnglishPreference,
  filterJobsByLanguagePreferences,
} from '../matching/language-filter-controller.js';
import type { Job, JobSearchParams } from '../../types/job.types.js';
import type { MatchResult } from '../../types/matching.types.js';

export interface FullSearchInput extends JobSearchParams {
  profileId: string;
}

export type FullSearchResult =
  | { found: false }
  | { found: true; count: number; results: MatchResult[] };

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

/**
 * Flujo completo: obtiene perfil, busca jobs, filtra por idioma, rankea y dispara historial no bloqueante.
 */
export async function fullSearchController(input: FullSearchInput): Promise<FullSearchResult> {
  const { profileId, ...searchParams } = input;

  const profile = await findProfileById(profileId);
  if (!profile) return { found: false };

  const jobs = await searchJobsController(searchParams);
  const filteredJobs = applyLanguageFilters(jobs, searchParams);
  const ranked = await rankJobsController(profile, filteredJobs);

  saveSearchHistory({
    profileId,
    keywords: searchParams.keywords,
    location: searchParams.location,
    remote: searchParams.remote ?? false,
    limit: searchParams.limit ?? 30,
    results: ranked,
  }).catch(() => { /* historial no es crítico para la respuesta */ });

  return { found: true, count: ranked.length, results: ranked };
}
