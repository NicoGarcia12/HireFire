import type { Profile } from '../../../domain/profile/entities/profile.entity.js';
import type { SaveProfileDto } from '../dto/profile.dto.js';

/**
 * Normaliza el payload validado a entidad persistible.
 * Mantiene defaults defensivos para que casos de uso y repositorios no dependan de Zod.
 */
export function toSaveProfileEntity(input: SaveProfileDto): Omit<Profile, 'id'> & { id?: string } {
  return {
    id: input.id,
    headline: input.headline,
    summary: input.summary,
    skills: input.skills,
    experience: input.experience,
    preferences: input.preferences,
  };
}
