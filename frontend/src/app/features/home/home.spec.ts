import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
      getSavedSearches: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [{ provide: HomeDataPort, useValue: homeDataPortMock }]
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

  function selectedLanguageItem(language: 'english' | 'portuguese'): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="allowed-language-${language}"]`);
  }

  function selectedLanguageLevel(language: 'english' | 'portuguese'): HTMLSelectElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="allowed-language-${language}-level"]`);
  }

  function removeLanguageButton(language: 'english' | 'portuguese'): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="remove-language-${language}"]`);
  }

  function selectLanguage(language: 'english' | 'portuguese'): void {
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
  function addLanguage(language: 'english' | 'portuguese'): void {
    selectLanguage(language);
    clickAddLanguage();
  }

  it('renders a language selector with English and Portuguese available initially', () => {
    fixture.detectChanges();

    const options = Array.from(languageSelect()?.options ?? []).map((option) => option.value);

    expect(options).toEqual(['english', 'portuguese']);
  });

  it('removes English from the selector and shows it in the permissions list with level and remove button', () => {
    fixture.detectChanges();

    addLanguage('english');

    const options = Array.from(languageSelect()?.options ?? []).map((option) => option.value);
    expect(options).toEqual(['portuguese']);
    expect(selectedLanguageItem('english')).toBeTruthy();
    expect(selectedLanguageLevel('english')).toBeTruthy();
    expect(removeLanguageButton('english')).toBeTruthy();
  });

  it('returns English to the selector when removing it from the permissions list', () => {
    fixture.detectChanges();

    addLanguage('english');
    removeLanguageButton('english')?.click();
    fixture.detectChanges();

    const options = Array.from(languageSelect()?.options ?? []).map((option) => option.value);
    expect(options).toEqual(['english', 'portuguese']);
  });

  it('hides the language selector when English and Portuguese are already allowed', () => {
    fixture.detectChanges();

    addLanguage('english');
    addLanguage('portuguese');

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
      limit: 10
    });

    component.runSearch();

    expect(receivedSearchPayload).toEqual({
      profileId: 'profile-1',
      keywords: 'backend',
      location: 'Argentina',
      remote: true,
      limit: 10,
      allowedLanguages: [{ language: 'english', maxLevel: 'B1' }]
    });
  });

  it('renders backend language warnings with reason and levels', () => {
    fixture.detectChanges();

    const text = component.warningText({
      language: 'english',
      requestedLevel: 'C1',
      allowedLevel: 'B1',
      reason: 'desirable-language-level-exceeds-allowed'
    });

    expect(text).toBe('Inglés C1 aparece como requisito deseable y supera el nivel permitido B1.');
  });
});
