import type { AllowedLanguageCode } from '../types/allowed-language-code.type';
import type { LanguageWarningReason } from '../types/language-warning-reason.type';

export type LanguageWarning =
  | string
  | {
      language: AllowedLanguageCode;
      requestedLevel?: string;
      allowedLevel?: string;
      reason: LanguageWarningReason;
    };
