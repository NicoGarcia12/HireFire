import { Router } from 'express';
import { deleteSearchHistoryUseCase } from '../../../application/history/use-cases/delete-search-history.use-case.js';
import { listSearchHistoryUseCase } from '../../../application/history/use-cases/list-search-history.use-case.js';
import { searchHistoryRepository } from '../../../infrastructure/db/repositories/prisma-search-history.repository.js';

export const historyRouter = Router();

historyRouter.get('/', async (req, res, next) => {
  try {
    const profileId = req.query['profileId'];
    if (typeof profileId !== 'string' || !profileId) {
      res.status(400).json({ error: 'profileId requerido' });
      return;
    }

    const searches = await listSearchHistoryUseCase(searchHistoryRepository, profileId);
    res.json(searches);
  } catch (err) {
    next(err);
  }
});

historyRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteSearchHistoryUseCase(searchHistoryRepository, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
