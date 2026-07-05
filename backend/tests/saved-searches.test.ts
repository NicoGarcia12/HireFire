import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { CreateSavedSearchInput } from '../src/types/saved-search.types.js';

const calls = { create: [] as unknown[], findMany: [] as unknown[], delete: [] as unknown[] };

const savedSearchRow = {
  id: 'saved-1',
  profileId: 'profile-1',
  name: 'Backend roles',
  keywords: 'backend',
  location: null,
  remote: true,
  limit: 30,
  createdAt: new Date('2026-01-01'),
};

mock.module('../src/config/db.js', {
  namedExports: {
    prisma: {
      savedSearch: {
        create: async (args: unknown) => {
          calls.create.push(args);
          return savedSearchRow;
        },
        findMany: async (args: unknown) => {
          calls.findMany.push(args);
          return [savedSearchRow];
        },
        delete: async (args: unknown) => {
          calls.delete.push(args);
        },
      },
    },
  },
});

const { createSavedSearch, listSavedSearchesByProfile, deleteSavedSearch } =
  await import('../src/helpers/saved-searches/saved-searches-helper.js');
const { createSavedSearchController } =
  await import('../src/controllers/saved-searches/create-saved-search-controller.js');
const { listSavedSearchesController } =
  await import('../src/controllers/saved-searches/list-saved-searches-controller.js');
const { deleteSavedSearchController } =
  await import('../src/controllers/saved-searches/delete-saved-search-controller.js');

beforeEach(() => {
  calls.create = [];
  calls.findMany = [];
  calls.delete = [];
});

afterEach(() => mock.reset());

describe('createSavedSearch()', () => {
  it('creates a saved search defaulting an absent location to null', async () => {
    const input: CreateSavedSearchInput = {
      profileId: 'profile-1',
      name: 'Backend roles',
      keywords: 'backend',
      remote: true,
      limit: 30,
    };

    await createSavedSearch(input);

    assert.equal((calls.create[0] as { data: { location: null } }).data.location, null);
  });
});

describe('listSavedSearchesByProfile()', () => {
  it('lists saved searches ordered by most recent first', async () => {
    const result = await listSavedSearchesByProfile('profile-1');

    assert.equal(result.length, 1);
    assert.equal(
      (calls.findMany[0] as { orderBy: { createdAt: string } }).orderBy.createdAt,
      'desc',
    );
  });
});

describe('deleteSavedSearch()', () => {
  it('deletes the saved search by id', async () => {
    await deleteSavedSearch('saved-1');

    assert.deepEqual(calls.delete[0], { where: { id: 'saved-1' } });
  });
});

describe('saved-searches controllers', () => {
  it('createSavedSearchController() delegates to the helper', async () => {
    await createSavedSearchController({
      profileId: 'profile-1',
      name: 'x',
      keywords: 'x',
      remote: false,
      limit: 10,
    });

    assert.equal(calls.create.length, 1);
  });

  it('listSavedSearchesController() delegates to the helper', async () => {
    await listSavedSearchesController('profile-1');

    assert.equal(calls.findMany.length, 1);
  });

  it('deleteSavedSearchController() delegates to the helper', async () => {
    await deleteSavedSearchController('saved-1');

    assert.equal(calls.delete.length, 1);
  });
});
