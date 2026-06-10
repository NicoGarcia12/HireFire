import type { FormControl } from '@angular/forms';
import type { LanguageLevel } from '../../../domain/matching/enums/language-level.enum';
import type { AllowedLanguage } from '../../../domain/matching/models/allowed-language.model';
import type { AllowedLanguageCode } from '../../../domain/matching/types/allowed-language-code.type';

export interface SearchRunParams {
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
  allowedLanguages?: AllowedLanguage[];
}

export interface AvailableLanguageOption {
  code: AllowedLanguageCode;
  label: string;
}

export type AllowedLanguageForm = {
  language: FormControl<AllowedLanguageCode>;
  maxLevel: FormControl<LanguageLevel>;
};
