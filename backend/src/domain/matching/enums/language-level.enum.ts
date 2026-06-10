export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export type EnglishLevel = LanguageLevel;
