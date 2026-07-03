import type { Request, Response, NextFunction } from 'express';
import { updateApplicationStatusController } from '../../controllers/applications/update-application-status-controller.js';
import type { UpdateApplicationStatusInput } from '../../types/application.types.js';

export async function updateApplicationStatusHandler(
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

    // req.body ya viene validado por validateBody(updateApplicationStatusSchema)
    const { status } = req.body as UpdateApplicationStatusInput;
    res.json(await updateApplicationStatusController(id, status));
  } catch (err) {
    next(err);
  }
}
