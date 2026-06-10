import type { Profile } from '../../../domain/profile/entities/profile.entity.js';
import type { ProfileRepository } from '../../../domain/profile/interfaces/profile-repository.interface.js';
import type { SaveProfileDto } from '../dto/profile.dto.js';
import { toSaveProfileEntity } from '../mappers/profile.mapper.js';

/** Caso de uso de upsert de perfil: coordina negocio y delega persistencia al puerto. */
export async function saveProfileUseCase(
  repository: ProfileRepository,
  input: SaveProfileDto,
): Promise<Profile> {
  return repository.save(toSaveProfileEntity(input));
}
