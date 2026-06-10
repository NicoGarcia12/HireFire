import type { Request, Response, NextFunction } from 'express';
import { getProfileController } from '../../controllers/profile/get-profile-controller.js';

export async function getProfileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id ?? '');
    if (!id) {
      res.status(400).json({ error: 'id requerido' });
      return;
    }

    const profile = await getProfileController(id);
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
}
