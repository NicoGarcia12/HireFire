import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from '../src/types/job.types.js';

const mocks = vi.hoisted(() => {
  const LEGACY_ACTOR = 'bebity~linkedin-jobs-scraper';
  const URL_SEARCH_ACTOR = 'curious_coder/linkedin-jobs-scraper';
  const state: {
    actorCalls: { actorId: string; input: unknown }[];
    datasetItemsQueue: unknown[][];
    failNextCallWithRentalError: boolean;
    failNextCallWithGenericError: boolean;
  } = {
    actorCalls: [],
    datasetItemsQueue: [],
    failNextCallWithRentalError: false,
    failNextCallWithGenericError: false,
  };

  return {
    LEGACY_ACTOR,
    URL_SEARCH_ACTOR,
    state,
    actor: (actorId: string) => ({
      call: async (input: unknown) => {
        state.actorCalls.push({ actorId, input });
        if (state.failNextCallWithRentalError) {
          state.failNextCallWithRentalError = false;
          throw new Error('You must rent a paid Actor to run it.');
        }
        if (state.failNextCallWithGenericError) {
          state.failNextCallWithGenericError = false;
          throw new Error('Apify: timeout de red');
        }
        return { defaultDatasetId: 'dataset-1' };
      },
    }),
    dataset: () => ({
      listItems: async () => ({ items: state.datasetItemsQueue.shift() ?? [] }),
    }),
  };
});

vi.mock('../src/config/env.js', () => ({
  env: {
    port: 3000,
    databaseUrl: 'postgres://fake',
    apify: { token: 'fake-token', jobsActor: mocks.LEGACY_ACTOR },
    groq: { apiKey: 'fake-key', baseUrl: 'https://fake', model: 'fake-model' },
  },
}));

vi.mock('../src/utils/apify-client.js', () => ({
  apify: { actor: mocks.actor, dataset: mocks.dataset },
}));

// Las fuentes gratuitas no son el foco de este archivo (ver providers.test.ts) — se apagan
// para que estos tests de LinkedIn/Apify no dependan de la red.
vi.mock('../src/utils/http-client.js', () => ({
  fetchJson: vi.fn().mockRejectedValue(new Error('red deshabilitada en este test')),
}));

import { searchJobsController } from '../src/controllers/jobs/search-jobs-controller.js';
import { fetchJson } from '../src/utils/http-client.js';

beforeEach(() => {
  mocks.state.actorCalls = [];
  mocks.state.datasetItemsQueue = [];
  mocks.state.failNextCallWithRentalError = false;
  mocks.state.failNextCallWithGenericError = false;
  vi.mocked(fetchJson).mockReset().mockRejectedValue(new Error('red deshabilitada en este test'));
});

describe('searchJobsController() — normalization', () => {
  it('maps known Apify field variants and detects remote work', async () => {
    mocks.state.datasetItemsQueue.push([
      {
        id: 'j1',
        title: 'Backend Dev',
        companyName: 'Acme',
        location: 'Buenos Aires',
        descriptionText: 'desc1',
        jobUrl: 'https://x/j1',
        workplaceType: 'Remote',
      },
    ]);

    const jobs = await searchJobsController({ keywords: 'normalize-test-1', limit: 10 });

    expect(jobs[0]).toEqual({
      id: 'j1',
      title: 'Backend Dev',
      company: 'Acme',
      location: 'Buenos Aires',
      remote: true,
      description: 'desc1',
      url: 'https://x/j1',
      postedAt: undefined,
      provider: 'linkedin',
    } satisfies Job);
  });

  it('falls back to safe defaults when fields are missing', async () => {
    mocks.state.datasetItemsQueue.push([{}]);

    const jobs = await searchJobsController({ keywords: 'normalize-test-2', limit: 10 });

    expect(jobs[0]?.title).toBe('Sin título');
    expect(jobs[0]?.company).toBe('Empresa desconocida');
    expect(jobs[0]?.remote).toBe(false);
  });
});

describe('searchJobsController() — legacy actor fallback', () => {
  it('retries with the URL-search actor when the legacy actor requires a paid rental', async () => {
    mocks.state.failNextCallWithRentalError = true;
    mocks.state.datasetItemsQueue.push([{ id: 'j1', title: 'Backend Dev' }]);

    const jobs = await searchJobsController({ keywords: 'fallback-test-1', limit: 10 });

    expect(mocks.state.actorCalls.length).toBe(2);
    expect(mocks.state.actorCalls[0]?.actorId).toBe(mocks.LEGACY_ACTOR);
    expect(mocks.state.actorCalls[1]?.actorId).toBe(mocks.URL_SEARCH_ACTOR);
    expect(jobs.length).toBe(1);
  });
});

describe('searchJobsController() — resilience', () => {
  it('keeps free-provider results when the LinkedIn actor fails with a non-rental error', async () => {
    mocks.state.failNextCallWithGenericError = true;
    vi.mocked(fetchJson).mockResolvedValueOnce({
      data: [
        {
          slug: 'dev-1',
          company_name: 'FreeCo',
          title: 'Resilience Dev',
          description: 'desc',
          remote: true,
          url: 'https://arbeitnow.test/dev-1',
          tags: [],
          location: 'Remote',
          created_at: 1700000000,
        },
      ],
    });

    const jobs = await searchJobsController({ keywords: 'resilience', limit: 10 });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.provider).toBe('arbeitnow');
  });
});

describe('searchJobsController() — cache', () => {
  it('serves identical search params from cache without calling Apify again', async () => {
    mocks.state.datasetItemsQueue.push([{ id: 'j1', title: 'Backend Dev' }]);
    const params = { keywords: 'cache-test-1', limit: 10 };

    const first = await searchJobsController(params);
    const second = await searchJobsController(params);

    expect(mocks.state.actorCalls.length).toBe(1);
    expect(second).toEqual(first);
  });
});
