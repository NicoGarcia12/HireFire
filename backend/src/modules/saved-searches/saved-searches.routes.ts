import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../../middleware/validate.js';
import {
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
} from './saved-searches.service.js';

export const savedSearchesRouter = Router();

const savedSearchSchema = z.object({
  profileId: z.string().min(1),
  name: z.string().min(1),
  keywords: z.string().min(1),
  location: z.string().optional(),
  remote: z.boolean().default(false),
  limit: z.number().int().min(1).max(200).default(30),
});

savedSearchesRouter.get('/', async (req, res, next) => {
  try {
    const profileId = req.query['profileId'] as string;
    if (!profileId) {
      res.status(400).json({ error: 'profileId requerido' });
      return;
    }
    res.json(await listSavedSearches(profileId));
  } catch (err) {
    next(err);
  }
});

savedSearchesRouter.post('/', validateBody(savedSearchSchema), async (req, res, next) => {
  try {
    res.status(201).json(await createSavedSearch(req.body));
  } catch (err) {
    next(err);
  }
});

savedSearchesRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteSavedSearch(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
