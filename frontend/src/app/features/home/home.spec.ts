import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { HomeDataPort, type HomeSearchPayload } from '../../application/home/home-data.port';
import { Home } from './home';

type HomeDataPortMock = Pick<HomeDataPort, 'search' | 'getHistory' | 'getSavedSearches'>;

describe('Home search language filters', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let homeDataPortMock: HomeDataPortMock;
  let receivedSearchPayload: HomeSearchPayload | null;

  beforeEach(async () => {
    receivedSearchPayload = null;
    homeDataPortMock = {
      search: (payload: HomeSearchPayload) => {
        receivedSearchPayload = payload;
        return of({ count: 0, results: [] });
      },
      getHistory: () => of([]),
      getSavedSearches: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HomeDataPort, useValue: homeDataPortMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  /** Busca el selector real para validar que la UI quite o devuelva opciones según el FormArray. */
  function languageSelect(): HTMLSelectElement | null {
    return fixture.nativeElement.querySelector('[data-testid="language-select"]');
  }

  function addLanguageButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('[data-testid="add-language-button"]');
  }

  function selectedLanguageItem(
    language: 'english' | 'portuguese' | 'spanish' | 'french' | 'german',
  ): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="allowed-language-${language}"]`);
  }

  function selectedLanguageLevel(
    language: 'english' | 'portuguese' | 'spanish' | 'french' | 'german',
  ): HTMLSelectElement | null {
    return fixture.nativeElement.querySelector(
      `[data-testid="allowed-language-${language}-level"]`,
    );
  }

  function removeLanguageButton(
    language: 'english' | 'portuguese' | 'spanish' | 'french' | 'german',
  ): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="remove-language-${language}"]`);
  }

  function selectLanguage(
    language: 'english' | 'portuguese' | 'spanish' | 'french' | 'german',
  ): void {
    const select = languageSelect();
    if (!select) throw new Error('language select not found');
    select.value = language;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function clickAddLanguage(): void {
    const button = addLanguageButton();
    if (!button) throw new Error('add language button not found');
    button.click();
    fixture.detectChanges();
  }

  /** Simula el flujo usuario: elegir idioma y presionar Agregar, no manipular el FormArray directo. */
  function addLanguage(language: 'english' | 'portuguese' | 'spanish' | 'french' | 'german'): void {
    selectLanguage(language);
    clickAddLanguage();
  }

  it('renders a language selector with all supported languages available initially', () => {
    fixture.detectChanges();

    const available = component.availableLanguages().map((o) => o.code);
    expect(available).toEqual(['english', 'portuguese', 'spanish', 'french', 'german']);
  });

  it('removes English from available options and shows it in the allowed-languages list', () => {
    fixture.detectChanges();

    component.onLanguageSelectionChange('english');
    component.addSelectedLanguage();
    fixture.detectChanges();

    const available = component.availableLanguages().map((o) => o.code);
    expect(available).toEqual(['portuguese', 'spanish', 'french', 'german']);
    expect(selectedLanguageItem('english')).toBeTruthy();
    expect(removeLanguageButton('english')).toBeTruthy();
  });

  it('returns English to available options when removing it from the allowed-languages list', () => {
    fixture.detectChanges();

    component.onLanguageSelectionChange('english');
    component.addSelectedLanguage();
    component.removeAllowedLanguage(0);
    fixture.detectChanges();

    const available = component.availableLanguages().map((o) => o.code);
    expect(available).toEqual(['english', 'portuguese', 'spanish', 'french', 'german']);
  });

  it('hides the language selector when every supported language is already allowed', () => {
    fixture.detectChanges();

    addLanguage('english');
    addLanguage('portuguese');
    addLanguage('spanish');
    addLanguage('french');
    addLanguage('german');

    expect(languageSelect()).toBeNull();
  });

  it('sends allowedLanguages when running a search', () => {
    fixture.detectChanges();
    addLanguage('english');
    const englishLevel = selectedLanguageLevel('english');
    if (!englishLevel) throw new Error('English level select not found');
    englishLevel.value = 'B1';
    englishLevel.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    component.setProfileIdForTesting('profile-1');
    component.searchForm.patchValue({
      keywords: 'backend',
      location: 'Argentina',
      remote: true,
      limit: 10,
    });

    component.runSearch();

    expect(receivedSearchPayload).toEqual({
      profileId: 'profile-1',
      keywords: 'backend',
      location: 'Argentina',
      remote: true,
      limit: 10,
      allowedLanguages: [{ language: 'english', maxLevel: 'B1' }],
    });
  });
});

describe('Home dark/light theme toggle', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let homeDataPortMock: HomeDataPortMock;

  beforeEach(async () => {
    localStorage.removeItem('hirefire_theme');
    document.documentElement.classList.remove('light-mode');

    homeDataPortMock = {
      search: () => of({ count: 0, results: [] }),
      getHistory: () => of([]),
      getSavedSearches: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HomeDataPort, useValue: homeDataPortMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem('hirefire_theme');
    document.documentElement.classList.remove('light-mode');
  });

  it('starts in dark mode by default without a stored preference', () => {
    fixture.detectChanges();

    expect(component.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('light-mode')).toBe(false);
  });

  it('switches to light mode and persists the preference', () => {
    fixture.detectChanges();

    component.toggleTheme();

    expect(component.isDarkMode()).toBe(false);
    expect(document.documentElement.classList.contains('light-mode')).toBe(true);
    expect(localStorage.getItem('hirefire_theme')).toBe('light');
  });

  it('switches back to dark mode on a second toggle', () => {
    fixture.detectChanges();

    component.toggleTheme();
    component.toggleTheme();

    expect(component.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('light-mode')).toBe(false);
    expect(localStorage.getItem('hirefire_theme')).toBe('dark');
  });

  it('restores light mode from a stored preference on init', async () => {
    localStorage.setItem('hirefire_theme', 'light');

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [Home],
        providers: [
          provideZonelessChangeDetection(),
          { provide: HomeDataPort, useValue: homeDataPortMock },
        ],
      })
      .compileComponents();

    const reloadedFixture = TestBed.createComponent(Home);
    reloadedFixture.detectChanges();

    expect(reloadedFixture.componentInstance.isDarkMode()).toBe(false);
    expect(document.documentElement.classList.contains('light-mode')).toBe(true);
  });
});

type FullHomeDataPortMock = Pick<
  HomeDataPort,
  'search' | 'getHistory' | 'getSavedSearches' | 'saveProfile' | 'importLinkedIn'
>;

function setupHomeWithMock(mock: FullHomeDataPortMock): Home {
  TestBed.configureTestingModule({
    imports: [Home],
    providers: [provideZonelessChangeDetection(), { provide: HomeDataPort, useValue: mock }],
  });
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('Home — pure helper methods', () => {
  let component: Home;

  beforeEach(() => {
    component = setupHomeWithMock({
      search: () => of({ count: 0, results: [] }),
      getHistory: () => of([]),
      getSavedSearches: () => of([]),
      saveProfile: () => of({}) as never,
      importLinkedIn: () => of({}) as never,
    });
  });

  it('priorityClass() returns the high class for "alta"', () => {
    expect(component.priorityClass('alta')).toBe('hf-priority--high');
  });

  it('priorityClass() returns the mid class for "media"', () => {
    expect(component.priorityClass('media')).toBe('hf-priority--mid');
  });

  it('priorityClass() returns the low class for anything else', () => {
    expect(component.priorityClass('baja')).toBe('hf-priority--low');
  });

  it('scoreClass() returns score--high for scores >= 75', () => {
    expect(component.scoreClass(80)).toBe('score--high');
  });

  it('scoreClass() returns score--mid for scores between 50 and 74', () => {
    expect(component.scoreClass(60)).toBe('score--mid');
  });

  it('scoreClass() returns score--low for scores below 50', () => {
    expect(component.scoreClass(30)).toBe('score--low');
  });

  it('sectionLabel() maps known section keys to Spanish labels', () => {
    expect(component.sectionLabel('headline')).toBe('Headline');
  });

  it('sectionLabel() falls back to the raw key when unknown', () => {
    expect(component.sectionLabel('unknown-section')).toBe('unknown-section');
  });
});

describe('Home — exportResults()', () => {
  it('builds a CSV blob with one row per result and escapes embedded quotes', async () => {
    // Arrange
    const component = setupHomeWithMock({
      search: () =>
        of({
          count: 1,
          results: [
            {
              id: 'job-1',
              title: 'Dev "Senior"',
              company: 'Acme',
              location: 'CABA',
              remote: true,
              description: '',
              url: 'https://example.com/job',
              score: 90,
              reasons: [],
              gaps: [],
            },
          ],
        }),
      getHistory: () => of([]),
      getSavedSearches: () => of([]),
      saveProfile: () => of({}) as never,
      importLinkedIn: () => of({}) as never,
    });
    component.setProfileIdForTesting('profile-1');
    component.runSearch({ keywords: 'dev', remote: false, limit: 30 });
    let capturedBlob: Blob | undefined;
    if (!('createObjectURL' in URL)) {
      Object.defineProperty(URL, 'createObjectURL', {
        value: () => '',
        writable: true,
        configurable: true,
      });
    }
    if (!('revokeObjectURL' in URL)) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: () => {},
        writable: true,
        configurable: true,
      });
    }
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob as Blob;
      return 'blob:mock';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Act
    component.exportResults();

    // Assert
    const csv = await capturedBlob?.text();
    expect(csv).toContain('"Dev ""Senior"""');
    expect(csv).toContain('Título,Empresa,Ubicación,Score,URL');
  });
});

describe('Home — patchProfileImport() via onFileChange()', () => {
  it('patches the profile form with the imported LinkedIn data', () => {
    // Arrange
    const importedData = {
      headline: 'Imported headline',
      summary: 'Imported summary',
      skills: ['Node.js', 'TypeScript'],
      experience: [{ title: 'Dev', company: 'Acme', description: 'Built things' }],
    };
    const component = setupHomeWithMock({
      search: () => of({ count: 0, results: [] }),
      getHistory: () => of([]),
      getSavedSearches: () => of([]),
      saveProfile: () => of({}) as never,
      importLinkedIn: () => of(importedData) as never,
    });
    const file = new File(['zip'], 'profile.zip');
    const input = { files: [file] } as unknown as HTMLInputElement;

    // Act
    component.onFileChange({ target: input } as unknown as Event);

    // Assert
    expect(component.profileForm.value.headline).toBe('Imported headline');
    expect(component.profileForm.value.skills).toBe('Node.js, TypeScript');
    expect(component.experience.length).toBe(1);
    expect(component.experience.at(0).value.title).toBe('Dev');
  });
});
