import type { Job } from '../../jobs/entities/job.entity.js';
import type { LanguageWarning } from './language-warning.interface.js';

export interface LanguageFilteredJob extends Job {
  languageWarnings?: LanguageWarning[];
}
