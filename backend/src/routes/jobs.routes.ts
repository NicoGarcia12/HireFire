import { Router } from 'express';
import { validateBody } from '../utils/validate.js';
import { jobSearchSchema, fullSearchSchema } from '../handlers/jobs/jobs.schema.js';
import { searchJobsHandler } from '../handlers/jobs/search-jobs-handler.js';
import { fullSearchHandler } from '../handlers/jobs/full-search-handler.js';

export const jobsRouter = Router();
export const searchRouter = Router();

/** Búsqueda cruda en Apify, sin ranking semántico. */
jobsRouter.post('/search', validateBody(jobSearchSchema), searchJobsHandler);

/** Flujo completo: perfil + jobs + filtrado + ranking. */
searchRouter.post('/', validateBody(fullSearchSchema), fullSearchHandler);
