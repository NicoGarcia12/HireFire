import { Router } from 'express';
import multer from 'multer';
import { parseLinkedInZip } from '../../../infrastructure/parsers/linkedin-profile-archive.parser.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos .zip'));
    }
  },
});

export const linkedInImportRouter = Router();

/** Acepta un ZIP de LinkedIn y devuelve datos parseados sin persistirlos. */
linkedInImportRouter.post('/', upload.single('file'), (req, res, next) => {
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
});
