import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { saveSearch } from '../history/history.service.js';
import { rankJobs } from '../matching/matching.service.js';
import { getProfile } from '../profile/profile.service.js';
import { fullSearchSchema, jobSearchSchema } from './jobs.schema.js';
import { searchJobs } from './jobs.service.js';

export const jobsRouter = Router();

/** Búsqueda cruda en Apify, sin ranking. */
jobsRouter.post('/search', validateBody(jobSearchSchema), async (req, res, next) => {
  try {
    const jobs = await searchJobs(req.body);
    res.json({ count: jobs.length, jobs });
  } catch (err) {
    next(err);
  }
});

/** Flujo completo: buscar en Apify + rankear + guardar en historial. */
export const searchRouter = Router();

searchRouter.post('/', validateBody(fullSearchSchema), async (req, res, next) => {
  try {
    const { profileId, ...searchParams } = req.body;
    const profile = await getProfile(profileId);
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }

    const jobs = await searchJobs(searchParams);
    const ranked = await rankJobs(profile, jobs);

    // Guardar en historial de forma silenciosa (no bloquea la respuesta).
    saveSearch({
      profileId,
      keywords: searchParams.keywords,
      location: searchParams.location,
      remote: searchParams.remote ?? false,
      limit: searchParams.limit ?? 30,
      results: ranked,
    }).catch(() => {/* historial no es crítico */});

    res.json({ count: ranked.length, results: ranked });
  } catch (err) {
    next(err);
  }
});
