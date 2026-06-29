import type { Request, Response, NextFunction } from 'express';
import { createApplicationController } from '../../controllers/applications/create-application-controller.js';
import type { CreateApplicationInput } from '../../types/application.types.js';

export async function createApplicationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // req.body ya viene validado por validateBody(createApplicationSchema)
    const input = req.body as CreateApplicationInput;
    res.status(201).json(await createApplicationController(input));
  } catch (err) {
    next(err);
  }
}
