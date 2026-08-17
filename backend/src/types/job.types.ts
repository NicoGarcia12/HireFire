export const JOB_PROVIDER_IDS = [
  'linkedin',
  'arbeitnow',
  'remoteok',
  'remotive',
  'jobicy',
  'himalayas',
] as const;
export type JobProviderId = (typeof JOB_PROVIDER_IDS)[number];

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  postedAt?: string;
  /** Fuente externa de la que se obtuvo la oferta. */
  provider: JobProviderId;
}

export interface JobSearchParams {
  keywords: string;
  location?: string;
  remote?: boolean;
  seniority?: string;
  /** Cuántas ofertas traer de Apify. */
  limit?: number;
  /** Cuando es false, descarta ofertas que pidan inglés. Default compatible: true. */
  allowEnglishRequirements?: boolean;
  /** Activa el filtro por nivel máximo de inglés requerido por la oferta. */
  maxEnglishLevelEnabled?: boolean;
  /** Nivel máximo de inglés que el usuario quiere aceptar. */
  maxEnglishLevel?: EnglishLevel;
  /** Idiomas permitidos por la búsqueda y nivel máximo aceptado por idioma. */
  allowedLanguages?: AllowedLanguagePreference[];
}

// --- Language types ---

export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];
export type EnglishLevel = LanguageLevel;

export const SUPPORTED_LANGUAGES = [
  'english',
  'portuguese',
  'spanish',
  'french',
  'german',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface AllowedLanguagePreference {
  language: SupportedLanguage;
  maxLevel: LanguageLevel;
}

export interface LanguageWarning {
  language: SupportedLanguage;
  requestedLevel?: LanguageLevel;
  allowedLevel?: LanguageLevel;
  reason: 'desirable-language-not-allowed' | 'desirable-language-level-exceeds-allowed';
}

export interface LanguageFilteredJob extends Job {
  languageWarnings?: LanguageWarning[];
}
