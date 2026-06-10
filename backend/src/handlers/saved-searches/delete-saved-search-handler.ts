import type { Request, Response, NextFunction } from 'express';
import { deleteSavedSearchController } from '../../controllers/saved-searches/delete-saved-search-controller.js';

export async function deleteSavedSearchHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id ?? '');
    if (!id) {
      res.status(400).json({ error: 'id requerido' });
      return;
    }

    await deleteSavedSearchController(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
