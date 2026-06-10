import { findProfileById } from '../../helpers/profile/find-profile-helper.js';
import type { Profile } from '../../types/profile.types.js';

/** Obtiene un perfil por ID. Devuelve null si no existe. */
export async function getProfileController(id: string): Promise<Profile | null> {
  return findProfileById(id);
}
