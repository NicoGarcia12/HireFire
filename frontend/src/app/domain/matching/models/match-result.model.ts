import type { LanguageWarning } from './language-warning.model';

export interface MatchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  postedAt?: string;
  score: number;
  reasons: string[];
  gaps: string[];
  languageWarnings?: LanguageWarning[];
}
