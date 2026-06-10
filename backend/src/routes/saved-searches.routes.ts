import { Router } from 'express';
import { validateBody } from '../utils/validate.js';
import { savedSearchSchema } from '../handlers/saved-searches/saved-searches.schema.js';
import { listSavedSearchesHandler } from '../handlers/saved-searches/list-saved-searches-handler.js';
import { createSavedSearchHandler } from '../handlers/saved-searches/create-saved-search-handler.js';
import { deleteSavedSearchHandler } from '../handlers/saved-searches/delete-saved-search-handler.js';

export const savedSearchesRouter = Router();

savedSearchesRouter.get('/', listSavedSearchesHandler);
savedSearchesRouter.post('/', validateBody(savedSearchSchema), createSavedSearchHandler);
savedSearchesRouter.delete('/:id', deleteSavedSearchHandler);
