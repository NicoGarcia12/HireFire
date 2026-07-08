import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HomeProfilePayload, HomeSearchPayload } from './home-data.port';
import { HomeDataPort } from './home-data.port';
import { HomeFacade } from './home.facade';
import { StorageService } from '../../core/storage.service';

const PROFILE = {
  id: 'p1',
  headline: 'Dev',
  summary: '',
  skills: [] as string[],
  experience: [] as never[],
  preferences: { locations: [] as string[], remote: false },
};
const RESULTS = {
  count: 2,
  results: [
    {
      id: 'r1',
      title: 'Dev',
      company: 'Acme',
      location: 'BA',
      score: 90,
      remote: true,
      description: '',
      url: '',
      reasons: [] as string[],
      gaps: [] as string[],
    },
    {
      id: 'r2',
      title: 'Lead',
      company: 'Corp',
      location: 'BA',
      score: 60,
      remote: false,
      description: '',
      url: '',
      reasons: [] as string[],
      gaps: [] as string[],
    },
  ],
};

function makeDataPortMock(): HomeDataPort {
  return {
    saveProfile: vi.fn().mockReturnValue(of(PROFILE)),
    importLinkedIn: vi
      .fn()
      .mockReturnValue(of({ headline: '', summary: '', skills: [], experience: [] })),
    analyzeProfile: vi
      .fn()
      .mockReturnValue(of({ score: 80, strengths: [], gaps: [], recommendations: [] })),
    search: vi.fn().mockReturnValue(of(RESULTS)),
    getSavedSearches: vi.fn().mockReturnValue(of([])),
    saveSearch: vi.fn().mockReturnValue(of({ id: 's1' })),
    deleteSavedSearch: vi.fn().mockReturnValue(of(undefined)),
    getHistory: vi.fn().mockReturnValue(of([])),
    deleteHistory: vi.fn().mockReturnValue(of(undefined)),
  } as unknown as HomeDataPort;
}

function makeStorageMock(storedProfileId: string | null = null): StorageService {
  const store: Record<string, string> = {};
  if (storedProfileId) store['hirefire_profile_id'] = storedProfileId;
  return {
    get: vi.fn((key: string) => store[key] ?? null),
    set: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    remove: vi.fn(),
  } as unknown as StorageService;
}

function setup(storedProfileId: string | null = null): {
  facade: HomeFacade;
  dataPort: HomeDataPort;
  storage: StorageService;
} {
  const dataPort = makeDataPortMock();
  const storage = makeStorageMock(storedProfileId);

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      HomeFacade,
      { provide: HomeDataPort, useValue: dataPort },
      { provide: StorageService, useValue: storage },
    ],
  });

  return { facade: TestBed.inject(HomeFacade), dataPort, storage };
}

const SEARCH_PAYLOAD: Omit<HomeSearchPayload, 'profileId'> = {
  keywords: 'dev',
  location: undefined,
  remote: false,
  limit: 10,
  allowedLanguages: [],
};

const PROFILE_PAYLOAD: HomeProfilePayload = {
  headline: 'Dev',
  summary: '',
  skills: [],
  experience: [],
  preferences: { locations: [], remote: false },
};

describe('HomeFacade — initial state', () => {
  it('profileId is null when storage is empty', () => {
    const { facade } = setup(null);
    expect(facade.profileId()).toBeNull();
  });

  it('profileId is loaded from storage on construction', () => {
    const { facade } = setup('profile-123');
    expect(facade.profileId()).toBe('profile-123');
  });

  it('loads saved and history on construction when profileId exists in storage', () => {
    const { dataPort } = setup('p1');
    expect(dataPort.getSavedSearches).toHaveBeenCalledWith('p1');
    expect(dataPort.getHistory).toHaveBeenCalledWith('p1');
  });

  it('does not call API when no profileId in storage', () => {
    const { dataPort } = setup(null);
    expect(dataPort.getSavedSearches).not.toHaveBeenCalled();
    expect(dataPort.getHistory).not.toHaveBeenCalled();
  });

  it('starts with empty signals', () => {
    const { facade } = setup(null);
    expect(facade.searching()).toBe(false);
    expect(facade.results()).toEqual([]);
    expect(facade.error()).toBeNull();
    expect(facade.searched()).toBe(false);
  });
});

describe('HomeFacade — saveProfile()', () => {
  it('sets profileId from API response', () => {
    const { facade } = setup(null);
    facade.saveProfile(PROFILE_PAYLOAD);
    expect(facade.profileId()).toBe('p1');
  });

  it('persists profileId to storage', () => {
    const { facade, storage } = setup(null);
    facade.saveProfile(PROFILE_PAYLOAD);
    expect(storage.set).toHaveBeenCalledWith('hirefire_profile_id', 'p1');
  });

  it('clears error before saving', () => {
    const { facade } = setup(null);
    facade.saveProfile(PROFILE_PAYLOAD);
    expect(facade.error()).toBeNull();
  });
});

describe('HomeFacade — runSearch()', () => {
  it('populates results after successful search', () => {
    const { facade } = setup('p1');
    facade.runSearch(SEARCH_PAYLOAD);
    expect(facade.results()).toHaveLength(2);
  });

  it('sets searched=true after search completes', () => {
    const { facade } = setup('p1');
    facade.runSearch(SEARCH_PAYLOAD);
    expect(facade.searched()).toBe(true);
  });

  it('sets searching=true during async request, then false on complete', () => {
    const { facade, dataPort } = setup('p1');
    const subject = new Subject<typeof RESULTS>();
    vi.mocked(dataPort.search).mockReturnValue(subject.asObservable());

    facade.runSearch(SEARCH_PAYLOAD);
    expect(facade.searching()).toBe(true);

    subject.next(RESULTS);
    subject.complete();
    expect(facade.searching()).toBe(false);
  });

  it('does nothing when profileId is null', () => {
    const { facade, dataPort } = setup(null);
    facade.runSearch(SEARCH_PAYLOAD);
    expect(dataPort.search).not.toHaveBeenCalled();
  });

  it('passes profileId to search payload', () => {
    const { facade, dataPort } = setup('p1');
    facade.runSearch({ ...SEARCH_PAYLOAD, keywords: 'backend' });
    expect(dataPort.search).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 'p1', keywords: 'backend' }),
    );
  });

  it('sets error and searched=true on API error', () => {
    const { facade, dataPort } = setup('p1');
    const subject = new Subject<typeof RESULTS>();
    vi.mocked(dataPort.search).mockReturnValue(subject.asObservable());

    facade.runSearch(SEARCH_PAYLOAD);
    subject.error(new Error('Network error'));

    expect(facade.error()).toContain('Network error');
    expect(facade.searched()).toBe(true);
    expect(facade.searching()).toBe(false);
  });
});

describe('HomeFacade — delete operations', () => {
  it('deleteSaved() calls API and reloads saved list', () => {
    const { facade, dataPort } = setup('p1');
    const getSavedCallsBefore = (dataPort.getSavedSearches as ReturnType<typeof vi.fn>).mock.calls
      .length;
    facade.deleteSaved('s1');
    expect(dataPort.deleteSavedSearch).toHaveBeenCalledWith('s1');
    expect(
      (dataPort.getSavedSearches as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThan(getSavedCallsBefore);
  });

  it('deleteHistory() calls API and reloads history', () => {
    const { facade, dataPort } = setup('p1');
    const histCallsBefore = (dataPort.getHistory as ReturnType<typeof vi.fn>).mock.calls.length;
    facade.deleteHistory('h1');
    expect(dataPort.deleteHistory).toHaveBeenCalledWith('h1');
    expect((dataPort.getHistory as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
      histCallsBefore,
    );
  });
});
