import { Router } from 'express';
import { getProfileUseCase } from '../../../application/profile/use-cases/get-profile.use-case.js';
import { profileRepository } from '../../../infrastructure/db/repositories/prisma-profile.repository.js';
import { analyzeProfile } from '../../../infrastructure/ai/groq-profile-analysis.service.js';

export const profileAnalysisRouter = Router();

profileAnalysisRouter.post('/:id/analyze', async (req, res, next) => {
  try {
    const profile = await getProfileUseCase(profileRepository, req.params.id);
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
