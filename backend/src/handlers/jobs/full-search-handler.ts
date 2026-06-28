import type { Request, Response, NextFunction } from 'express';
import { fullSearchController } from '../../controllers/jobs/full-search-controller.js';
import type { FullSearchInput } from './jobs.schema.js';

/** Flujo completo: obtiene perfil, busca jobs, filtra por idioma, rankea y dispara historial no bloqueante. */
export async function fullSearchHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // req.body ya viene validado por validateBody(fullSearchSchema)
    const input = req.body as FullSearchInput;
    const result = await fullSearchController(input);

    if (!result.found) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }

    res.json({ count: result.count, results: result.results });
  } catch (err) {
    next(err);
  }
}
