// Bridge legacy: los modelos ahora viven en domain/** y DTOs HTTP en infrastructure/api/dto/**.
// Mantener este barrel mínimo evita churn en imports existentes sin reintroducir un archivo catch-all.
export type { LanguageLevel, EnglishLevel } from '../domain/matching/enums/language-level.enum';
export type { AllowedLanguage } from '../domain/matching/models/allowed-language.model';
export type { LanguageWarning } from '../domain/matching/models/language-warning.model';
export type { MatchResult } from '../domain/matching/models/match-result.model';
export type {
  AllowedLanguageCode,
  SupportedLanguage,
} from '../domain/matching/types/allowed-language-code.type';
export type { LanguageWarningReason } from '../domain/matching/types/language-warning-reason.type';
export type { LinkedInImport } from '../domain/profile/models/linkedin-import.model';
export type {
  ProfileAnalysis,
  ProfileSuggestion,
} from '../domain/profile/models/profile-analysis.model';
export type {
  Profile,
  ProfileExperience,
  ProfilePreferences,
} from '../domain/profile/models/profile.model';
export type { SavedSearch } from '../domain/search/models/saved-search.model';
export type { SearchRecord } from '../domain/search/models/search-record.model';
export type { SearchResponse } from '../infrastructure/api/dto/search-response.dto';
