import type { Request, Response, NextFunction } from 'express';
import { listSavedSearchesController } from '../../controllers/saved-searches/list-saved-searches-controller.js';

export async function listSavedSearchesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profileId = req.query['profileId'];
    if (typeof profileId !== 'string' || !profileId) {
      res.status(400).json({ error: 'profileId requerido' });
      return;
    }

    res.json(await listSavedSearchesController(profileId));
  } catch (err) {
    next(err);
  }
}
