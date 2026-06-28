import type { Request, Response, NextFunction } from 'express';
import { deleteHistoryController } from '../../controllers/history/delete-history-controller.js';

export async function deleteHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = String(req.params.id ?? '');
    if (!id) {
      res.status(400).json({ error: 'id requerido' });
      return;
    }

    await deleteHistoryController(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
