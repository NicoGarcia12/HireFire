import { Router } from 'express';
import { createSavedSearchUseCase } from '../../../application/saved-searches/use-cases/create-saved-search.use-case.js';
import { deleteSavedSearchUseCase } from '../../../application/saved-searches/use-cases/delete-saved-search.use-case.js';
import { listSavedSearchesUseCase } from '../../../application/saved-searches/use-cases/list-saved-searches.use-case.js';
import { savedSearchRepository } from '../../../infrastructure/db/repositories/prisma-saved-search.repository.js';
import { validateBody } from '../middleware/validate.js';
import { savedSearchSchema } from './saved-searches.schema.js';

export const savedSearchesRouter = Router();

savedSearchesRouter.get('/', async (req, res, next) => {
  try {
    const profileId = req.query['profileId'];
    if (typeof profileId !== 'string' || !profileId) {
      res.status(400).json({ error: 'profileId requerido' });
      return;
    }

    res.json(await listSavedSearchesUseCase(savedSearchRepository, profileId));
  } catch (err) {
    next(err);
  }
});

savedSearchesRouter.post('/', validateBody(savedSearchSchema), async (req, res, next) => {
  try {
    res.status(201).json(await createSavedSearchUseCase(savedSearchRepository, req.body));
  } catch (err) {
    next(err);
  }
});

savedSearchesRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteSavedSearchUseCase(savedSearchRepository, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
