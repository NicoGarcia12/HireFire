import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Profile, SaveProfileInput } from '../src/types/profile.types.js';

const calls = {
  findUnique: [] as unknown[],
  findMany: [] as unknown[],
  update: [] as unknown[],
  create: [] as unknown[],
  deleteMany: [] as unknown[],
};

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

mock.module('../src/config/db.js', {
  namedExports: {
    prisma: {
      profile: {
        findUnique: async (args: { where: { id: string } }) => {
          calls.findUnique.push(args);
          return args.where.id === 'missing-profile' ? null : profileRow;
        },
        findMany: async (args: unknown) => {
          calls.findMany.push(args);
          return [profileRow];
        },
        update: async (args: unknown) => {
          calls.update.push(args);
          return profileRow;
        },
        create: async (args: unknown) => {
          calls.create.push(args);
          return profileRow;
        },
      },
      experience: {
        deleteMany: async (args: unknown) => {
          calls.deleteMany.push(args);
        },
      },
    },
  },
});

mock.module('../src/controllers/matching/groq-analysis-controller.js', {
  namedExports: {
    analyzeProfileWithGroq: async () => ({ score: 80, strengths: [], suggestions: [] }),
  },
});

const { findProfileById, findAllProfiles } =
  await import('../src/helpers/profile/find-profile-helper.js');
const { upsertProfile } = await import('../src/helpers/profile/upsert-profile-helper.js');
const { saveProfileController } =
  await import('../src/controllers/profile/save-profile-controller.js');
const { getProfileController } =
  await import('../src/controllers/profile/get-profile-controller.js');
const { analyzeProfileController } =
  await import('../src/controllers/profile/analyze-profile-controller.js');

beforeEach(() => {
  calls.findUnique = [];
  calls.findMany = [];
  calls.update = [];
  calls.create = [];
  calls.deleteMany = [];
});

afterEach(() => {
  mock.reset();
});

describe('findProfileById()', () => {
  it('maps the Prisma row to the domain Profile shape', async () => {
    const profile = (await findProfileById('profile-1')) as Profile;

    assert.equal(profile.id, 'profile-1');
    assert.deepEqual(profile.preferences, {
      locations: ['CABA'],
      remote: true,
      seniority: 'senior',
    });
  });
});

describe('findAllProfiles()', () => {
  it('returns every profile mapped to the domain shape', async () => {
    const profiles = await findAllProfiles();

    assert.equal(profiles.length, 1);
    assert.equal(profiles[0]?.id, 'profile-1');
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

    assert.equal(calls.create.length, 1);
    assert.equal(calls.update.length, 0);
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

    assert.equal(calls.deleteMany.length, 1);
    assert.equal(calls.update.length, 1);
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

    assert.equal(calls.create.length, 1);
  });
});

describe('getProfileController()', () => {
  it('delegates to findProfileById', async () => {
    const profile = await getProfileController('profile-1');

    assert.equal(profile?.id, 'profile-1');
  });
});

describe('analyzeProfileController()', () => {
  it('returns found:false when the profile does not exist', async () => {
    const result = await analyzeProfileController('missing-profile');

    assert.deepEqual(result, { found: false });
  });

  it('returns found:true with the Groq analysis when the profile exists', async () => {
    const result = await analyzeProfileController('profile-1');

    assert.equal(result.found, true);
    if (result.found) assert.equal(result.analysis.score, 80);
  });
});
