import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

/** Valida `req.body` contra un schema Zod y reemplaza el body por el parseado. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
