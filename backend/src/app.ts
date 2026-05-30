import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { jobsRouter, searchRouter } from './modules/jobs/jobs.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hirefire-backend' });
  });

  app.use('/api/profile', profileRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/search', searchRouter);

  app.use(errorHandler);

  return app;
}
