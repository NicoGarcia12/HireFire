/** Contratos de dominio compartidos por todos los módulos. */

export interface ProfileExperience {
  title: string;
  company: string;
  description: string;
}

export interface ProfilePreferences {
  locations: string[];
  remote: boolean;
  seniority?: string;
}

export interface Profile {
  id: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  preferences: ProfilePreferences;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  postedAt?: string;
}

/** Una oferta con su evaluación semántica contra el perfil. */
export interface MatchResult extends Job {
  /** 0–100 */
  score: number;
  /** Razones por las que la oferta encaja con el perfil. */
  reasons: string[];
  /** Brechas: qué le falta al perfil para el puesto. */
  gaps: string[];
}

export interface JobSearchParams {
  keywords: string;
  location?: string;
  remote?: boolean;
  seniority?: string;
  /** Cuántas ofertas traer de Apify. */
  limit?: number;
}
