import type { Request, Response, NextFunction } from 'express';
import { listApplicationsController } from '../../controllers/applications/list-applications-controller.js';

export async function listApplicationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profileId = req.query['profileId'];
    if (typeof profileId !== 'string' || !profileId) {
      res.status(400).json({ error: 'profileId requerido' });
      return;
    }

    const statusQuery = req.query['status'];
    const status = typeof statusQuery === 'string' && statusQuery ? statusQuery : undefined;

    res.json(await listApplicationsController(profileId, status));
  } catch (err) {
    next(err);
  }
}
