import { randomUUID } from 'node:crypto';
import type { Profile } from '../../types/domain.js';

/**
 * Almacén de perfiles en memoria (Fase 1).
 * En Fase 2 se reemplaza por PostgreSQL + Prisma sin tocar la interfaz pública.
 */
const store = new Map<string, Profile>();

export function saveProfile(input: Omit<Profile, 'id'> & { id?: string }): Profile {
  const id = input.id ?? randomUUID();
  const profile: Profile = { ...input, id };
  store.set(id, profile);
  return profile;
}

export function getProfile(id: string): Profile | undefined {
  return store.get(id);
}

export function listProfiles(): Profile[] {
  return [...store.values()];
}
