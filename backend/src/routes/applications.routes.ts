import { Router } from 'express';
import { validateBody } from '../utils/validate.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
} from '../handlers/applications/applications.schema.js';
import { listApplicationsHandler } from '../handlers/applications/list-applications-handler.js';
import { createApplicationHandler } from '../handlers/applications/create-application-handler.js';
import { updateApplicationHandler } from '../handlers/applications/update-application-handler.js';
import { updateApplicationStatusHandler } from '../handlers/applications/update-application-status-handler.js';
import { deleteApplicationHandler } from '../handlers/applications/delete-application-handler.js';

export const applicationsRouter = Router();

applicationsRouter.get('/', listApplicationsHandler);
applicationsRouter.post('/', validateBody(createApplicationSchema), createApplicationHandler);
applicationsRouter.patch(
  '/:id/status',
  validateBody(updateApplicationStatusSchema),
  updateApplicationStatusHandler,
);
applicationsRouter.patch('/:id', validateBody(updateApplicationSchema), updateApplicationHandler);
applicationsRouter.delete('/:id', deleteApplicationHandler);
