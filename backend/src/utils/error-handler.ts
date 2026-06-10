import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger.js';

/** Handler de errores centralizado. Debe registrarse al final de la cadena. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : 'Error interno';
  logger.error('Error no controlado', err);
  res.status(500).json({ error: message });
}
