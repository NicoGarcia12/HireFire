import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { historyRouter } from './presentation/http/history/history.routes.js';
import { jobsRouter, searchRouter } from './presentation/http/jobs/jobs.routes.js';
import { linkedInImportRouter } from './presentation/http/profile/linkedin-import.routes.js';
import { profileAnalysisRouter } from './presentation/http/profile/profile-analysis.routes.js';
import { profileRouter } from './presentation/http/profile/profile.routes.js';
import { savedSearchesRouter } from './presentation/http/saved-searches/saved-searches.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hirefire-backend' });
  });

  app.use('/api/profile', profileRouter);
  app.use('/api/profile', profileAnalysisRouter);
  app.use('/api/profile/import-linkedin', linkedInImportRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/saved-searches', savedSearchesRouter);

  app.use(errorHandler);

  return app;
}
