import type { LanguageLevel } from '../enums/language-level.enum';
import type { AllowedLanguageCode } from '../types/allowed-language-code.type';

export interface AllowedLanguage {
  language: AllowedLanguageCode;
  maxLevel: LanguageLevel;
}
