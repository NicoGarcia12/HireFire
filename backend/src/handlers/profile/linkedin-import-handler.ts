import type { Request, Response, NextFunction } from 'express';
import { parseLinkedInZip } from '../../utils/linkedin-profile-parser.js';

/** Acepta un ZIP de LinkedIn y devuelve datos parseados sin persistirlos. */
export function linkedInImportHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Falta el archivo ZIP' });
      return;
    }

    const data = parseLinkedInZip(req.file.buffer);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
