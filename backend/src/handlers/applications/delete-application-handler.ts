import type { Request, Response, NextFunction } from 'express';
import { deleteApplicationController } from '../../controllers/applications/delete-application-controller.js';

export async function deleteApplicationHandler(
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

    await deleteApplicationController(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
