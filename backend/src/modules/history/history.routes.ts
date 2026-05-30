import { Router } from 'express';
import { deleteSearch, listSearches } from './history.service.js';

export const historyRouter = Router();

historyRouter.get('/', async (req, res, next) => {
  try {
    const profileId = req.query['profileId'] as string;
    if (!profileId) {
      res.status(400).json({ error: 'profileId requerido' });
      return;
    }
    const searches = await listSearches(profileId);
    res.json(searches);
  } catch (err) {
    next(err);
  }
});

historyRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteSearch(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
