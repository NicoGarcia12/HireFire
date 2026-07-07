import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from '../src/types/job.types.js';
import type { MatchResult } from '../src/types/matching.types.js';
import type { Profile } from '../src/types/profile.types.js';

const profile: Profile = {
  id: 'profile-1',
  headline: 'Backend Developer',
  summary: '',
  skills: [],
  experience: [],
  preferences: { locations: [], remote: false },
};

const rawJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Backend Dev',
    company: 'Acme',
    location: 'CABA',
    remote: true,
    description: '',
    url: 'https://example.com/job-1',
  },
];

const rankedJobs: MatchResult[] = rawJobs.map((job) => ({
  ...job,
  score: 80,
  reasons: ['great fit'],
  gaps: [],
}));

const mocks = vi.hoisted(() => ({
  findProfileById: vi.fn(async () => profile),
  searchJobsController: vi.fn(async () => rawJobs),
  filterJobsByEnglishPreference: vi.fn((jobs: Job[]) => jobs),
  filterJobsByLanguagePreferences: vi.fn((jobs: Job[]) => jobs),
  rankJobsController: vi.fn(async () => rankedJobs),
  saveSearchHistory: vi.fn(async () => undefined),
}));

vi.mock('../src/helpers/profile/find-profile-helper.js', () => ({
  findProfileById: mocks.findProfileById,
}));
vi.mock('../src/helpers/history/search-history-helper.js', () => ({
  saveSearchHistory: mocks.saveSearchHistory,
}));
vi.mock('../src/controllers/jobs/search-jobs-controller.js', () => ({
  searchJobsController: mocks.searchJobsController,
}));
vi.mock('../src/controllers/matching/rank-jobs-controller.js', () => ({
  rankJobsController: mocks.rankJobsController,
}));
vi.mock('../src/controllers/matching/language-filter-controller.js', () => ({
  filterJobsByEnglishPreference: mocks.filterJobsByEnglishPreference,
  filterJobsByLanguagePreferences: mocks.filterJobsByLanguagePreferences,
}));

import { fullSearchController } from '../src/controllers/jobs/full-search-controller.js';

beforeEach(() => {
  mocks.findProfileById.mockClear();
  mocks.searchJobsController.mockClear();
  mocks.filterJobsByEnglishPreference.mockClear();
  mocks.filterJobsByLanguagePreferences.mockClear();
  mocks.rankJobsController.mockClear();
  mocks.saveSearchHistory.mockClear();
  mocks.findProfileById.mockResolvedValue(profile);
});

describe('fullSearchController() — profile not found', () => {
  it('returns found:false without searching for jobs', async () => {
    mocks.findProfileById.mockResolvedValueOnce(null);

    const result = await fullSearchController({
      profileId: 'missing-profile',
      keywords: 'backend',
    });

    expect(result).toEqual({ found: false });
    expect(mocks.searchJobsController).not.toHaveBeenCalled();
  });
});

describe('fullSearchController() — happy path', () => {
  it('searches, filters by the legacy English preference, ranks and returns the results', async () => {
    const result = await fullSearchController({ profileId: 'profile-1', keywords: 'backend' });

    expect(result).toEqual({ found: true, count: 1, results: rankedJobs });
    expect(mocks.filterJobsByEnglishPreference).toHaveBeenCalledWith(rawJobs, expect.anything());
    expect(mocks.filterJobsByLanguagePreferences).not.toHaveBeenCalled();
    expect(mocks.rankJobsController).toHaveBeenCalledWith(profile, rawJobs);
  });

  it('uses the multi-language filter when allowedLanguages is provided', async () => {
    await fullSearchController({
      profileId: 'profile-1',
      keywords: 'backend',
      allowedLanguages: [{ language: 'english', maxLevel: 'B1' }],
    });

    expect(mocks.filterJobsByLanguagePreferences).toHaveBeenCalledWith(rawJobs, {
      allowedLanguages: [{ language: 'english', maxLevel: 'B1' }],
    });
    expect(mocks.filterJobsByEnglishPreference).not.toHaveBeenCalled();
  });

  it('saves search history without blocking the response, even if saving fails', async () => {
    mocks.saveSearchHistory.mockRejectedValueOnce(new Error('db down'));

    const result = await fullSearchController({ profileId: 'profile-1', keywords: 'backend' });

    expect(result).toEqual({ found: true, count: 1, results: rankedJobs });
    expect(mocks.saveSearchHistory).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 'profile-1', keywords: 'backend', results: rankedJobs }),
    );
  });
});
