import { Router } from 'express';
import { getProfileUseCase } from '../../../application/profile/use-cases/get-profile.use-case.js';
import { saveProfileUseCase } from '../../../application/profile/use-cases/save-profile.use-case.js';
import { profileRepository } from '../../../infrastructure/db/repositories/prisma-profile.repository.js';
import { validateBody } from '../middleware/validate.js';
import { profileSchema } from './profile.schema.js';

export const profileRouter = Router();

profileRouter.post('/', validateBody(profileSchema), async (req, res, next) => {
  try {
    const profile = await saveProfileUseCase(profileRepository, req.body);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

profileRouter.get('/:id', async (req, res, next) => {
  try {
    const profile = await getProfileUseCase(profileRepository, req.params.id);
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});
