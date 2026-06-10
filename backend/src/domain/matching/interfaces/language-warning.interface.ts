import type { LanguageLevel } from '../enums/language-level.enum.js';
import type { SupportedLanguage } from '../enums/supported-language.enum.js';

export interface LanguageWarning {
  language: SupportedLanguage;
  requestedLevel?: LanguageLevel;
  allowedLevel?: LanguageLevel;
  reason: 'desirable-language-not-allowed' | 'desirable-language-level-exceeds-allowed';
}
