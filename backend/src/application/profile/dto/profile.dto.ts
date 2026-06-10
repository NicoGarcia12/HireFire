import type { Profile } from '../../../domain/profile/entities/profile.entity.js';

export type SaveProfileDto = Omit<Profile, 'id'> & { id?: string };
export type ProfileDto = Profile;
