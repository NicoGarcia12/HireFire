import type { AllowedLanguage } from '../../../domain/matching/models/allowed-language.model';
import type { EnglishLevel } from '../../../domain/matching/enums/language-level.enum';

export interface SearchPayload {
  profileId: string;
  keywords: string;
  location?: string;
  remote?: boolean;
  limit?: number;
  allowedLanguages: AllowedLanguage[];
  allowEnglishRequirements?: boolean;
  maxEnglishLevelEnabled?: boolean;
  maxEnglishLevel?: EnglishLevel;
}
