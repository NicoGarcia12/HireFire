import type { Request, Response, NextFunction } from 'express';
import { updateApplicationController } from '../../controllers/applications/update-application-controller.js';
import type { UpdateApplicationInput } from '../../types/application.types.js';

export async function updateApplicationHandler(
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

    // req.body ya viene validado por validateBody(updateApplicationSchema)
    const input = req.body as UpdateApplicationInput;
    res.json(await updateApplicationController(id, input));
  } catch (err) {
    next(err);
  }
}
