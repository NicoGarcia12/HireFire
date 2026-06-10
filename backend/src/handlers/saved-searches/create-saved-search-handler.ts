import type { Request, Response, NextFunction } from 'express';
import { createSavedSearchController } from '../../controllers/saved-searches/create-saved-search-controller.js';
import type { CreateSavedSearchInput } from '../../types/saved-search.types.js';

export async function createSavedSearchHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.body ya viene validado por validateBody(savedSearchSchema)
    const input = req.body as CreateSavedSearchInput;
    res.status(201).json(await createSavedSearchController(input));
  } catch (err) {
    next(err);
  }
}
