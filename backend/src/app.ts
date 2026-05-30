import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { historyRouter } from './modules/history/history.routes.js';
import { jobsRouter, searchRouter } from './modules/jobs/jobs.routes.js';
import { linkedInImportRouter } from './modules/profile/linkedin-import.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { savedSearchesRouter } from './modules/saved-searches/saved-searches.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hirefire-backend' });
  });

  app.use('/api/profile', profileRouter);
  app.use('/api/profile/import-linkedin', linkedInImportRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/saved-searches', savedSearchesRouter);

  app.use(errorHandler);

  return app;
}
