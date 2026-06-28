import type { Request, Response, NextFunction } from 'express';
import { analyzeProfileController } from '../../controllers/profile/analyze-profile-controller.js';

export async function analyzeProfileHandler(
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

    const result = await analyzeProfileController(id);
    if (!result.found) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }

    res.json(result.analysis);
  } catch (err) {
    next(err);
  }
}
