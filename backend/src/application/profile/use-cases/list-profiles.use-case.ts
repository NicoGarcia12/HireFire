import type { Profile } from '../../../domain/profile/entities/profile.entity.js';
import type { ProfileRepository } from '../../../domain/profile/interfaces/profile-repository.interface.js';

export async function listProfilesUseCase(repository: ProfileRepository): Promise<Profile[]> {
  return repository.findMany();
}
