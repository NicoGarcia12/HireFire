import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { profileSchema } from './profile.schema.js';
import { getProfile, saveProfile } from './profile.service.js';

export const profileRouter = Router();

profileRouter.post('/', validateBody(profileSchema), async (req, res, next) => {
  try {
    const profile = await saveProfile(req.body);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

profileRouter.get('/:id', async (req, res, next) => {
  try {
    const profile = await getProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});
