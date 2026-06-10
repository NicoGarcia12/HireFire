import type { Profile } from '../../domain/profile/entities/profile.entity.js';
import { getProfileUseCase } from '../../application/profile/use-cases/get-profile.use-case.js';
import { listProfilesUseCase } from '../../application/profile/use-cases/list-profiles.use-case.js';
import { saveProfileUseCase } from '../../application/profile/use-cases/save-profile.use-case.js';
import { profileRepository } from '../../infrastructure/db/repositories/prisma-profile.repository.js';

/** Bridge legacy: mantener imports existentes mientras las rutas viven en presentation/http. */
export async function saveProfile(input: Omit<Profile, 'id'> & { id?: string }): Promise<Profile> {
  return saveProfileUseCase(profileRepository, input);
}

export async function getProfile(id: string): Promise<Profile | null> {
  return getProfileUseCase(profileRepository, id);
}

export async function listProfiles(): Promise<Profile[]> {
  return listProfilesUseCase(profileRepository);
}
