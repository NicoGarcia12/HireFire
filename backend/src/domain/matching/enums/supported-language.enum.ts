export const SUPPORTED_LANGUAGES = ['english', 'portuguese'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
