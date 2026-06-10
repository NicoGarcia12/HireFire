import { Router } from 'express';
import multer from 'multer';
import { validateBody } from '../utils/validate.js';
import { profileSchema } from '../handlers/profile/profile.schema.js';
import { saveProfileHandler } from '../handlers/profile/save-profile-handler.js';
import { getProfileHandler } from '../handlers/profile/get-profile-handler.js';
import { analyzeProfileHandler } from '../handlers/profile/analyze-profile-handler.js';
import { linkedInImportHandler } from '../handlers/profile/linkedin-import-handler.js';

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

export const profileRouter = Router();

profileRouter.post('/', validateBody(profileSchema), saveProfileHandler);
profileRouter.get('/:id', getProfileHandler);
profileRouter.post('/:id/analyze', analyzeProfileHandler);

export const linkedInImportRouter = Router();

linkedInImportRouter.post('/', upload.single('file'), linkedInImportHandler);
