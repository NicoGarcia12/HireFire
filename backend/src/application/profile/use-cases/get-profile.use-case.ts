import type { Profile } from '../../../domain/profile/entities/profile.entity.js';
import type { ProfileRepository } from '../../../domain/profile/interfaces/profile-repository.interface.js';

/** Recupera un perfil por id sin acoplar la aplicación al transporte HTTP. */
export async function getProfileUseCase(repository: ProfileRepository, id: string): Promise<Profile | null> {
  return repository.findById(id);
}
