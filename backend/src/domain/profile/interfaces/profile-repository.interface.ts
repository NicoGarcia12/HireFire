import type { Profile } from '../entities/profile.entity.js';

export type SaveProfileEntity = Omit<Profile, 'id'> & { id?: string };

/** Puerto de persistencia para perfiles; la capa de aplicación no conoce Prisma. */
export interface ProfileRepository {
  save(input: SaveProfileEntity): Promise<Profile>;
  findById(id: string): Promise<Profile | null>;
  findMany(): Promise<Profile[]>;
}
