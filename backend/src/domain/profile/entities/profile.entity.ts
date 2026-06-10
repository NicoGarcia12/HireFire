import type { ProfileExperience } from './profile-experience.entity.js';
import type { ProfilePreferences } from '../types/profile-preferences.type.js';

/** Perfil de candidato tal como lo entiende el dominio de HireFire. */
export interface Profile {
  id: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  preferences: ProfilePreferences;
}
