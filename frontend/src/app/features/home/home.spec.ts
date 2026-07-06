import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HomeDataPort, type HomeSearchPayload } from '../../application/home/home-data.port';
import { ApplicationsDataPort } from '../../application/applications/applications-data.port';
import { Home } from './home';

type HomeDataPortMock = Pick<HomeDataPort, 'search' | 'getHistory' | 'getSavedSearches'>;
type ApplicationsDataPortMock = Pick<ApplicationsDataPort, 'list'>;

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
    const applicationsDataPortMock: ApplicationsDataPortMock = {
      list: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: HomeDataPort, useValue: homeDataPortMock },
        { provide: ApplicationsDataPort, useValue: applicationsDataPortMock }
      ]
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

    const available = component.availableLanguages().map((o) => o.code);
    expect(available).toEqual(['english', 'portuguese']);
  });

  it('removes English from available options and shows it in the allowed-languages list', () => {
    fixture.detectChanges();

    component.onLanguageSelectionChange('english');
    component.addSelectedLanguage();
    fixture.detectChanges();

    const available = component.availableLanguages().map((o) => o.code);
    expect(available).toEqual(['portuguese']);
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
    expect(available).toEqual(['english', 'portuguese']);
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

});
