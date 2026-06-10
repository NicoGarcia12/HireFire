import type { AllowedLanguagePreference } from '../../matching/interfaces/allowed-language-preference.interface.js';
import type { EnglishLevel } from '../../matching/enums/language-level.enum.js';

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
