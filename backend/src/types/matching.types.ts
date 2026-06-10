import type { Job, LanguageWarning } from './job.types.js';

/** Una oferta con su evaluación semántica contra el perfil. */
export interface MatchResult extends Job {
  /** 0–100 */
  score: number;
  /** Razones por las que la oferta encaja con el perfil. */
  reasons: string[];
  /** Brechas: qué le falta al perfil para el puesto. */
  gaps: string[];
  /** Requisitos deseables de idioma que no bloquean la oferta, pero advierten al usuario. */
  languageWarnings?: LanguageWarning[];
}
