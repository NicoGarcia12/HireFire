import type { LanguageLevel } from '../enums/language-level.enum.js';
import type { SupportedLanguage } from '../enums/supported-language.enum.js';

export interface AllowedLanguagePreference {
  language: SupportedLanguage;
  maxLevel: LanguageLevel;
}
