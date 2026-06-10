import { Router } from 'express';
import { listHistoryHandler } from '../handlers/history/list-history-handler.js';
import { deleteHistoryHandler } from '../handlers/history/delete-history-handler.js';

export const historyRouter = Router();

historyRouter.get('/', listHistoryHandler);
historyRouter.delete('/:id', deleteHistoryHandler);
