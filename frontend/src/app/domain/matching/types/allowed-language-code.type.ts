export const ALLOWED_LANGUAGE_CODES = [
  'english',
  'portuguese',
  'spanish',
  'french',
  'german',
] as const;

export type AllowedLanguageCode = (typeof ALLOWED_LANGUAGE_CODES)[number];

export type SupportedLanguage = AllowedLanguageCode;
