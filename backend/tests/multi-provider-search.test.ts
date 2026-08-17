import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/http-client.js', () => ({ fetchJson: vi.fn() }));

import { fetchJson } from '../src/utils/http-client.js';
import { searchFreeProviders } from '../src/external-apis/multi-provider-search.js';

beforeEach(() => {
  vi.mocked(fetchJson).mockReset();
});

describe('searchFreeProviders()', () => {
  it('combina resultados de las fuentes que responden y descarta las que fallan', async () => {
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes('arbeitnow.com')) {
        return {
          data: [
            {
              slug: 'ok-1',
              company_name: 'Acme',
              title: 'multi-source-test',
              description: 'desc',
              remote: true,
              url: 'https://arbeitnow.test/ok-1',
              tags: [],
              location: 'Remote',
              created_at: 1700000000,
            },
          ],
        };
      }
      throw new Error('fuente caída');
    });

    const jobs = await searchFreeProviders({ keywords: 'multi-source-test' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.provider).toBe('arbeitnow');
  });

  it('devuelve un array vacío sin lanzar si todas las fuentes fallan', async () => {
    vi.mocked(fetchJson).mockRejectedValue(new Error('todas caídas'));

    const jobs = await searchFreeProviders({ keywords: 'anything' });

    expect(jobs).toEqual([]);
  });
});
