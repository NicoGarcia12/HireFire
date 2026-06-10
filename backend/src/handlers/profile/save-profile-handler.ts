import type { Request, Response, NextFunction } from 'express';
import { saveProfileController } from '../../controllers/profile/save-profile-controller.js';
import type { SaveProfileInput } from '../../types/profile.types.js';

export async function saveProfileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.body ya viene validado por validateBody(profileSchema)
    const input: SaveProfileInput = req.body as SaveProfileInput;
    const profile = await saveProfileController(input);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
}
