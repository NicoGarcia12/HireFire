import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Job } from '../src/types/job.types.js';

const LEGACY_ACTOR = 'bebity~linkedin-jobs-scraper';
const URL_SEARCH_ACTOR = 'curious_coder/linkedin-jobs-scraper';

const calls: { actorCalls: { actorId: string; input: unknown }[] } = { actorCalls: [] };
let datasetItemsQueue: unknown[][] = [];
let failNextCallWithRentalError = false;

mock.module('../src/config/env.js', {
  namedExports: {
    env: {
      port: 3000,
      databaseUrl: 'postgres://fake',
      apify: { token: 'fake-token', jobsActor: LEGACY_ACTOR },
      groq: { apiKey: 'fake-key', baseUrl: 'https://fake', model: 'fake-model' },
    },
  },
});

mock.module('../src/utils/apify-client.js', {
  namedExports: {
    apify: {
      actor: (actorId: string) => ({
        call: async (input: unknown) => {
          calls.actorCalls.push({ actorId, input });
          if (failNextCallWithRentalError) {
            failNextCallWithRentalError = false;
            throw new Error('You must rent a paid Actor to run it.');
          }
          return { defaultDatasetId: 'dataset-1' };
        },
      }),
      dataset: () => ({
        listItems: async () => ({ items: datasetItemsQueue.shift() ?? [] }),
      }),
    },
  },
});

const { searchJobsController } = await import('../src/controllers/jobs/search-jobs-controller.js');

beforeEach(() => {
  calls.actorCalls = [];
  datasetItemsQueue = [];
  failNextCallWithRentalError = false;
});

afterEach(() => mock.reset());

describe('searchJobsController() — normalization', () => {
  it('maps known Apify field variants and detects remote work', async () => {
    datasetItemsQueue.push([
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

    assert.deepEqual(jobs[0], {
      id: 'j1',
      title: 'Backend Dev',
      company: 'Acme',
      location: 'Buenos Aires',
      remote: true,
      description: 'desc1',
      url: 'https://x/j1',
      postedAt: undefined,
    } satisfies Job);
  });

  it('falls back to safe defaults when fields are missing', async () => {
    datasetItemsQueue.push([{}]);

    const jobs = await searchJobsController({ keywords: 'normalize-test-2', limit: 10 });

    assert.equal(jobs[0]?.title, 'Sin título');
    assert.equal(jobs[0]?.company, 'Empresa desconocida');
    assert.equal(jobs[0]?.remote, false);
  });
});

describe('searchJobsController() — legacy actor fallback', () => {
  it('retries with the URL-search actor when the legacy actor requires a paid rental', async () => {
    failNextCallWithRentalError = true;
    datasetItemsQueue.push([{ id: 'j1', title: 'Backend Dev' }]);

    const jobs = await searchJobsController({ keywords: 'fallback-test-1', limit: 10 });

    assert.equal(calls.actorCalls.length, 2);
    assert.equal(calls.actorCalls[0]?.actorId, LEGACY_ACTOR);
    assert.equal(calls.actorCalls[1]?.actorId, URL_SEARCH_ACTOR);
    assert.equal(jobs.length, 1);
  });
});

describe('searchJobsController() — cache', () => {
  it('serves identical search params from cache without calling Apify again', async () => {
    datasetItemsQueue.push([{ id: 'j1', title: 'Backend Dev' }]);
    const params = { keywords: 'cache-test-1', limit: 10 };

    const first = await searchJobsController(params);
    const second = await searchJobsController(params);

    assert.equal(calls.actorCalls.length, 1);
    assert.deepEqual(second, first);
  });
});
