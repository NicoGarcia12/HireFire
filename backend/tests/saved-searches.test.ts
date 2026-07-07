import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateSavedSearchInput } from '../src/types/saved-search.types.js';

const mocks = vi.hoisted(() => {
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
  return {
    savedSearchRow,
    create: vi.fn(async () => savedSearchRow),
    findMany: vi.fn(async () => [savedSearchRow]),
    delete: vi.fn(async () => undefined),
  };
});

vi.mock('../src/config/db.js', () => ({
  prisma: {
    savedSearch: { create: mocks.create, findMany: mocks.findMany, delete: mocks.delete },
  },
}));

import {
  createSavedSearch,
  listSavedSearchesByProfile,
  deleteSavedSearch,
} from '../src/helpers/saved-searches/saved-searches-helper.js';
import { createSavedSearchController } from '../src/controllers/saved-searches/create-saved-search-controller.js';
import { listSavedSearchesController } from '../src/controllers/saved-searches/list-saved-searches-controller.js';
import { deleteSavedSearchController } from '../src/controllers/saved-searches/delete-saved-search-controller.js';

beforeEach(() => {
  mocks.create.mockClear();
  mocks.findMany.mockClear();
  mocks.delete.mockClear();
});

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

    expect(mocks.create.mock.calls[0]?.[0].data.location).toBe(null);
  });
});

describe('listSavedSearchesByProfile()', () => {
  it('lists saved searches ordered by most recent first', async () => {
    const result = await listSavedSearchesByProfile('profile-1');

    expect(result.length).toBe(1);
    expect(mocks.findMany.mock.calls[0]?.[0].orderBy.createdAt).toBe('desc');
  });
});

describe('deleteSavedSearch()', () => {
  it('deletes the saved search by id', async () => {
    await deleteSavedSearch('saved-1');

    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: 'saved-1' } });
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

    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it('listSavedSearchesController() delegates to the helper', async () => {
    await listSavedSearchesController('profile-1');

    expect(mocks.findMany).toHaveBeenCalledTimes(1);
  });

  it('deleteSavedSearchController() delegates to the helper', async () => {
    await deleteSavedSearchController('saved-1');

    expect(mocks.delete).toHaveBeenCalledTimes(1);
  });
});
