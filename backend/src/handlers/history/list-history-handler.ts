import type { Request, Response, NextFunction } from 'express';
import { listHistoryController } from '../../controllers/history/list-history-controller.js';

export async function listHistoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profileId = req.query['profileId'];
    if (typeof profileId !== 'string' || !profileId) {
      res.status(400).json({ error: 'profileId requerido' });
      return;
    }

    const searches = await listHistoryController(profileId);
    res.json(searches);
  } catch (err) {
    next(err);
  }
}
