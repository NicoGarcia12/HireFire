import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HomeFacade } from '../../../application/home/home.facade';
import type { HomeProfilePayload, HomeSearchPayload } from '../../../application/home/home-data.port';
import { LANGUAGE_LEVELS, type LanguageLevel } from '../../../domain/matching/enums/language-level.enum';
import type { AllowedLanguage } from '../../../domain/matching/models/allowed-language.model';
import type { LanguageWarning } from '../../../domain/matching/models/language-warning.model';
import type { AllowedLanguageCode } from '../../../domain/matching/types/allowed-language-code.type';
import type { LinkedInImport } from '../../../domain/profile/models/linkedin-import.model';
import type { SavedSearch } from '../../../domain/search/models/saved-search.model';
import type { SearchRecord } from '../../../domain/search/models/search-record.model';
import type { AllowedLanguageForm, AvailableLanguageOption, SearchRunParams } from './home.types';

function csvToArray(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(HomeFacade);

  public readonly profileId = this.facade.profileId;
  public readonly error = this.facade.error;
  public readonly savingProfile = this.facade.savingProfile;
  public readonly importing = this.facade.importing;
  public readonly analyzing = this.facade.analyzing;
  public readonly analysis = this.facade.analysis;
  public readonly searching = this.facade.searching;
  public readonly results = this.facade.results;
  public readonly saved = this.facade.saved;
  public readonly savingSearch = this.facade.savingSearch;
  public readonly history = this.facade.history;
  public readonly searched = this.facade.searched;

  public readonly profileForm = this.fb.group({
    headline: ['', Validators.required],
    summary: [''],
    skills: [''],
    locations: [''],
    remote: [true],
    seniority: [''],
    experience: this.fb.array([this.newExp()])
  });

  public readonly showSaveDialog = signal(false);
  public readonly saveNameValue = signal('');
  public readonly showHistory = signal(false);
  public readonly languageLevels: readonly LanguageLevel[] = LANGUAGE_LEVELS;
  public readonly languageOptions: readonly AvailableLanguageOption[] = [
    { code: 'english', label: 'Inglés' },
    { code: 'portuguese', label: 'Portugués' }
  ];
  public readonly selectedLanguage = signal<AllowedLanguageCode>('english');
  // FormArray no emite cambios estructurales como dependencia de computed(); este contador
  // fuerza recalcular opciones disponibles cuando se agregan o quitan idiomas.
  public readonly allowedLanguagesVersion = signal(0);
  public readonly availableLanguages = computed(() => {
    this.allowedLanguagesVersion();
    const selected = new Set(this.allowedLanguages.controls.map((control) => control.controls.language.value));
    return this.languageOptions.filter((option) => !selected.has(option.code));
  });

  public readonly searchForm = this.fb.group({
    keywords: ['', Validators.required],
    location: [''],
    remote: [false],
    limit: [30],
    allowedLanguages: this.fb.array<FormGroup<AllowedLanguageForm>>([])
  });

  public get experience(): FormArray {
    return this.profileForm.get('experience') as FormArray;
  }

  public get allowedLanguages(): FormArray<FormGroup<AllowedLanguageForm>> {
    return this.searchForm.controls.allowedLanguages;
  }

  public addExp(): void {
    this.experience.push(this.newExp());
  }

  public removeExp(i: number): void {
    if (this.experience.length > 1) this.experience.removeAt(i);
  }

  public saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.facade.saveProfile(this.profilePayloadFromForm());
  }

  public onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.facade.importLinkedIn(file, (data) => this.patchProfileImport(data));
  }

  public analyzeProfile(): void {
    this.facade.analyzeProfile();
  }

  public priorityClass(p: string): string {
    return p === 'alta' ? 'priority--high' : p === 'media' ? 'priority--mid' : 'priority--low';
  }

  public sectionLabel(s: string): string {
    const map: Record<string, string> = {
      headline: 'Headline',
      summary: 'Resumen',
      skills: 'Skills',
      experience: 'Experiencia',
      general: 'General'
    };
    return map[s] ?? s;
  }

  public onLanguageSelectionChange(value: string): void {
    if (this.isAllowedLanguageCode(value)) this.selectedLanguage.set(value);
  }

  /**
   * Evita duplicar idiomas permitidos: al agregar uno, desaparece del selector hasta que se lo quite.
   */
  public addSelectedLanguage(): void {
    const language = this.selectedLanguage();
    if (!this.availableLanguages().some((option) => option.code === language)) return;

    this.allowedLanguages.push(this.createAllowedLanguageForm(language));
    this.bumpAllowedLanguagesVersion();
    this.selectedLanguage.set(this.availableLanguages()[0]?.code ?? 'english');
  }

  public removeAllowedLanguage(index: number): void {
    if (index < 0 || index >= this.allowedLanguages.length) return;

    const removed = this.allowedLanguages.at(index).controls.language.value;
    this.allowedLanguages.removeAt(index);
    this.bumpAllowedLanguagesVersion();
    this.selectedLanguage.set(removed);
  }

  public languageLabel(language: AllowedLanguageCode): string {
    return this.languageOptions.find((option) => option.code === language)?.label ?? language;
  }

  public allowedLanguageData(): AllowedLanguage[] {
    return this.allowedLanguages.controls.map((control) => control.getRawValue());
  }

  /**
   * Traduce warnings backend a copy de producto manteniendo soporte para el formato legacy string.
   */
  public warningText(warning: LanguageWarning): string {
    if (typeof warning === 'string') return warning;

    const language = this.languageLabel(warning.language);

    if (warning.reason === 'desirable-language-not-allowed') {
      const requestedLevel = warning.requestedLevel ? ` ${warning.requestedLevel}` : '';
      return `${language}${requestedLevel} aparece como requisito deseable, pero no está entre los idiomas permitidos.`;
    }

    return `${language} ${warning.requestedLevel ?? 'sin nivel especificado'} aparece como requisito deseable y supera el nivel permitido ${warning.allowedLevel ?? 'configurado'}.`;
  }

  public runSearch(params?: SearchRunParams): void {
    if (!this.profileId()) return;

    const payload: Omit<HomeSearchPayload, 'profileId'> | null = params
      ? { ...params, allowedLanguages: params.allowedLanguages ?? this.allowedLanguageData() }
      : this.searchPayloadFromForm();
    if (!payload) return;

    this.facade.runSearch(payload);
  }

  public scoreClass(s: number): string {
    return s >= 75 ? 'score--high' : s >= 50 ? 'score--mid' : 'score--low';
  }

  public loadSaved(): void {
    this.facade.loadSaved();
  }

  public toggleSaveDialog(): void {
    this.showSaveDialog.update((v) => !v);
  }

  public saveCurrentSearch(): void {
    if (!this.profileId() || !this.saveNameValue().trim()) return;

    const value = this.searchForm.getRawValue();
    this.facade.saveCurrentSearch(
      {
        name: this.saveNameValue().trim(),
        keywords: value.keywords ?? '',
        location: value.location || undefined,
        remote: !!value.remote,
        limit: value.limit ?? 30
      },
      () => {
        this.showSaveDialog.set(false);
        this.saveNameValue.set('');
      }
    );
  }

  public runSaved(savedSearch: SavedSearch): void {
    this.searchForm.patchValue({
      keywords: savedSearch.keywords,
      location: savedSearch.location ?? '',
      remote: savedSearch.remote,
      limit: savedSearch.limit
    });
    this.runSearch({ keywords: savedSearch.keywords, location: savedSearch.location, remote: savedSearch.remote, limit: savedSearch.limit });
  }

  public deleteSaved(id: string): void {
    if (!confirm('¿Eliminás esta búsqueda guardada?')) return;
    this.facade.deleteSaved(id);
  }

  public loadHistory(): void {
    this.facade.loadHistory();
  }

  public rerunHistory(history: SearchRecord): void {
    this.searchForm.patchValue({ keywords: history.keywords, location: history.location ?? '', remote: history.remote, limit: history.limit });
    this.runSearch({ keywords: history.keywords, location: history.location, remote: history.remote, limit: history.limit });
  }

  public deleteHistory(id: string): void {
    if (!confirm('¿Eliminás este registro del historial?')) return;
    this.facade.deleteHistory(id);
  }

  public setProfileIdForTesting(profileId: string): void {
    this.facade.setProfileIdForTesting(profileId);
  }

  private newExp(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      company: ['', Validators.required],
      description: ['']
    });
  }

  /**
   * Convierte campos comma-separated de la UI al contrato de aplicación sin alterar el payload HTTP final.
   */
  private profilePayloadFromForm(): HomeProfilePayload {
    const value = this.profileForm.getRawValue();
    return {
      id: this.profileId() ?? undefined,
      headline: value.headline ?? '',
      summary: value.summary ?? '',
      skills: csvToArray(value.skills ?? ''),
      experience: (value.experience ?? []).map((experience) => ({
        title: experience['title'] ?? '',
        company: experience['company'] ?? '',
        description: experience['description'] ?? ''
      })),
      preferences: {
        locations: csvToArray(value.locations ?? ''),
        remote: !!value.remote,
        seniority: value.seniority || undefined
      }
    };
  }

  private searchPayloadFromForm(): Omit<HomeSearchPayload, 'profileId'> | null {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return null;
    }

    const value = this.searchForm.getRawValue();
    return {
      keywords: value.keywords ?? '',
      location: value.location || undefined,
      remote: !!value.remote,
      limit: value.limit ?? 30,
      allowedLanguages: this.allowedLanguageData()
    };
  }

  private patchProfileImport(data: LinkedInImport): void {
    this.profileForm.patchValue({
      headline: data.headline,
      summary: data.summary,
      skills: data.skills.join(', ')
    });

    if (data.experience.length === 0) return;

    while (this.experience.length) this.experience.removeAt(0);
    for (const exp of data.experience) {
      this.experience.push(
        this.fb.group({
          title: [exp.title, Validators.required],
          company: [exp.company, Validators.required],
          description: [exp.description]
        })
      );
    }
  }

  private createAllowedLanguageForm(language: AllowedLanguageCode): FormGroup<AllowedLanguageForm> {
    return this.fb.nonNullable.group({
      language: [language],
      maxLevel: ['B1' as LanguageLevel]
    });
  }

  private bumpAllowedLanguagesVersion(): void {
    this.allowedLanguagesVersion.update((version) => version + 1);
  }

  private isAllowedLanguageCode(value: string): value is AllowedLanguageCode {
    return this.languageOptions.some((option) => option.code === value);
  }
}
