import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/http-client.js', () => ({ fetchJson: vi.fn() }));

import { fetchJson } from '../src/utils/http-client.js';
import { searchArbeitnow } from '../src/external-apis/providers/arbeitnow.provider.js';
import { searchHimalayas } from '../src/external-apis/providers/himalayas.provider.js';
import { searchJobicy } from '../src/external-apis/providers/jobicy.provider.js';
import { searchRemoteOk } from '../src/external-apis/providers/remoteok.provider.js';
import { searchRemotive } from '../src/external-apis/providers/remotive.provider.js';

beforeEach(() => {
  vi.mocked(fetchJson).mockReset();
});

describe('searchArbeitnow()', () => {
  it('normaliza y filtra por keyword contra título y tags', async () => {
    vi.mocked(fetchJson).mockResolvedValue({
      data: [
        {
          slug: 'react-dev',
          company_name: 'Acme',
          title: 'React Developer',
          description: 'desc',
          remote: true,
          url: 'https://arbeitnow.test/react-dev',
          tags: ['react'],
          location: 'Berlin',
          created_at: 1700000000,
        },
        {
          slug: 'sales-rep',
          company_name: 'Acme',
          title: 'Sales Rep',
          description: 'desc',
          remote: false,
          url: 'https://arbeitnow.test/sales-rep',
          tags: [],
          location: 'Berlin',
          created_at: 1700000000,
        },
      ],
    });

    const jobs = await searchArbeitnow({ keywords: 'react' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ id: 'arbeitnow-react-dev', provider: 'arbeitnow', remote: true });
  });
});

describe('searchRemoteOk()', () => {
  it('descarta el primer item (aviso legal) y normaliza el resto', async () => {
    vi.mocked(fetchJson).mockResolvedValue([
      { legal: 'API Terms of Service' },
      {
        id: '123',
        position: 'Backend Engineer',
        company: 'RemoteCo',
        location: 'Worldwide',
        description: 'desc',
        tags: ['backend'],
        url: 'https://remoteok.test/123',
      },
    ]);

    const jobs = await searchRemoteOk({ keywords: 'backend' });

    expect(jobs).toEqual([
      {
        id: 'remoteok-123',
        title: 'Backend Engineer',
        company: 'RemoteCo',
        location: 'Worldwide',
        remote: true,
        description: 'desc',
        url: 'https://remoteok.test/123',
        postedAt: undefined,
        provider: 'remoteok',
      },
    ]);
  });
});

describe('searchRemotive()', () => {
  it('normaliza las ofertas devueltas por la API', async () => {
    vi.mocked(fetchJson).mockResolvedValue({
      jobs: [
        {
          id: 7,
          url: 'https://remotive.test/7',
          title: 'Frontend Dev',
          company_name: 'RemotiveCo',
          candidate_required_location: 'Anywhere',
          description: 'desc',
          publication_date: '2026-08-01T00:00:00Z',
        },
      ],
    });

    const jobs = await searchRemotive({ keywords: 'frontend' });

    expect(jobs[0]).toMatchObject({ id: 'remotive-7', provider: 'remotive', remote: true });
  });
});

describe('searchJobicy()', () => {
  it('filtra por keyword contra título e industria', async () => {
    vi.mocked(fetchJson).mockResolvedValue({
      jobs: [
        {
          id: 1,
          url: 'https://jobicy.test/1',
          jobTitle: 'Data Analyst',
          companyName: 'JobicyCo',
          jobIndustry: ['data'],
          jobGeo: 'Europe',
          jobExcerpt: 'excerpt',
          jobDescription: 'desc',
          pubDate: '2026-08-01',
        },
      ],
    });

    const jobs = await searchJobicy({ keywords: 'design' });

    expect(jobs).toHaveLength(0);
  });
});

describe('searchHimalayas()', () => {
  it('normaliza las ofertas devueltas por la API', async () => {
    vi.mocked(fetchJson).mockResolvedValue({
      jobs: [
        {
          guid: 'abc',
          title: 'Product Designer',
          companyName: 'HimalayasCo',
          locationRestrictions: ['Worldwide'],
          description: 'desc',
          pubDate: '2026-08-01',
          applicationLink: 'https://himalayas.test/abc',
        },
      ],
    });

    const jobs = await searchHimalayas({ keywords: 'designer' });

    expect(jobs[0]).toMatchObject({ id: 'himalayas-abc', provider: 'himalayas', remote: true });
  });
});
