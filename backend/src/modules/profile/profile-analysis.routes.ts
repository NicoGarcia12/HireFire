import { Router } from 'express';
import { getProfile } from './profile.service.js';
import { analyzeProfile } from './profile-analysis.service.js';

export const profileAnalysisRouter = Router();

profileAnalysisRouter.post('/:id/analyze', async (req, res, next) => {
  try {
    const profile = await getProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }
    const analysis = await analyzeProfile(profile);
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});
