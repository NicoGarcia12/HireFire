import { upsertProfile } from '../../helpers/profile/upsert-profile-helper.js';
import type { Profile, SaveProfileInput } from '../../types/profile.types.js';

/** Crea o actualiza el perfil de un candidato. */
export async function saveProfileController(input: SaveProfileInput): Promise<Profile> {
  return upsertProfile(input);
}
