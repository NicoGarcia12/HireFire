import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile, SaveProfileInput } from '../src/types/profile.types.js';

const mocks = vi.hoisted(() => {
  const profileRow = {
    id: 'profile-1',
    headline: 'Backend Developer',
    summary: 'Experienced dev',
    skills: ['Node.js'],
    locations: ['CABA'],
    remote: true,
    seniority: 'senior',
    experience: [{ title: 'Dev', company: 'Acme', description: 'Built things' }],
  };
  return {
    profileRow,
    findUnique: vi.fn(async (args: { where: { id: string } }) =>
      args.where.id === 'missing-profile' ? null : profileRow,
    ),
    findMany: vi.fn(async () => [profileRow]),
    update: vi.fn(async () => profileRow),
    create: vi.fn(async () => profileRow),
    deleteMany: vi.fn(async () => undefined),
    analyzeProfileWithGroq: vi.fn(async () => ({ score: 80, strengths: [], suggestions: [] })),
  };
});

vi.mock('../src/config/db.js', () => ({
  prisma: {
    profile: {
      findUnique: mocks.findUnique,
      findMany: mocks.findMany,
      update: mocks.update,
      create: mocks.create,
    },
    experience: { deleteMany: mocks.deleteMany },
  },
}));

vi.mock('../src/controllers/matching/groq-analysis-controller.js', () => ({
  analyzeProfileWithGroq: mocks.analyzeProfileWithGroq,
}));

import { findProfileById, findAllProfiles } from '../src/helpers/profile/find-profile-helper.js';
import { upsertProfile } from '../src/helpers/profile/upsert-profile-helper.js';
import { saveProfileController } from '../src/controllers/profile/save-profile-controller.js';
import { getProfileController } from '../src/controllers/profile/get-profile-controller.js';
import { analyzeProfileController } from '../src/controllers/profile/analyze-profile-controller.js';

beforeEach(() => {
  mocks.findUnique.mockClear();
  mocks.findMany.mockClear();
  mocks.update.mockClear();
  mocks.create.mockClear();
  mocks.deleteMany.mockClear();
  mocks.analyzeProfileWithGroq.mockClear();
});

describe('findProfileById()', () => {
  it('maps the Prisma row to the domain Profile shape', async () => {
    const profile = (await findProfileById('profile-1')) as Profile;

    expect(profile.id).toBe('profile-1');
    expect(profile.preferences).toEqual({ locations: ['CABA'], remote: true, seniority: 'senior' });
  });
});

describe('findAllProfiles()', () => {
  it('returns every profile mapped to the domain shape', async () => {
    const profiles = await findAllProfiles();

    expect(profiles.length).toBe(1);
    expect(profiles[0]?.id).toBe('profile-1');
  });
});

describe('upsertProfile()', () => {
  it('creates a new profile when no id is given', async () => {
    const input: SaveProfileInput = {
      headline: 'Dev',
      summary: '',
      skills: [],
      experience: [],
      preferences: { locations: [], remote: false },
    };

    await upsertProfile(input);

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('replaces the experience and updates the existing profile when an id is given', async () => {
    const input: SaveProfileInput = {
      id: 'profile-1',
      headline: 'Dev',
      summary: '',
      skills: [],
      experience: [],
      preferences: { locations: [], remote: false },
    };

    await upsertProfile(input);

    expect(mocks.deleteMany).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });
});

describe('saveProfileController()', () => {
  it('delegates to upsertProfile', async () => {
    await saveProfileController({
      headline: 'Dev',
      summary: '',
      skills: [],
      experience: [],
      preferences: { locations: [], remote: false },
    });

    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
});

describe('getProfileController()', () => {
  it('delegates to findProfileById', async () => {
    const profile = await getProfileController('profile-1');

    expect(profile?.id).toBe('profile-1');
  });
});

describe('analyzeProfileController()', () => {
  it('returns found:false when the profile does not exist', async () => {
    const result = await analyzeProfileController('missing-profile');

    expect(result).toEqual({ found: false });
  });

  it('returns found:true with the Groq analysis when the profile exists', async () => {
    const result = await analyzeProfileController('profile-1');

    expect(result.found).toBe(true);
    if (result.found) expect(result.analysis.score).toBe(80);
  });
});
