// Bridge legacy: los imports nuevos deben apuntar a application/domain/infrastructure.
// Este archivo existe para no romper consumidores previos durante la migración Clean Architecture.
export type { LanguageLevel, EnglishLevel } from '../domain/matching/enums/language-level.enum';
export type { AllowedLanguage } from '../domain/matching/models/allowed-language.model';
export type { AllowedLanguageCode, SupportedLanguage } from '../domain/matching/types/allowed-language-code.type';
export { ApiService } from '../infrastructure/api/hirefire-api.service';
export type { ProfilePayload } from '../infrastructure/api/dto/profile-payload.dto';
export type { SavedSearchPayload } from '../infrastructure/api/dto/saved-search-payload.dto';
export type { SearchPayload } from '../infrastructure/api/dto/search-payload.dto';
export type { SearchResponse } from '../infrastructure/api/dto/search-response.dto';
