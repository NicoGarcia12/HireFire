import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { JobCardComponent } from '../../../shared/job-card/job-card.component';
import { HomeFacade } from '../../../application/home/home.facade';
import type { HomeProfilePayload, HomeSearchPayload } from '../../../application/home/home-data.port';
import { LANGUAGE_LEVELS, type LanguageLevel } from '../../../domain/matching/enums/language-level.enum';
import type { AllowedLanguage } from '../../../domain/matching/models/allowed-language.model';
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
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatOptionModule,
    MatDialogModule,
    MatSliderModule,
    JobCardComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(HomeFacade);
  private readonly dialog = inject(MatDialog);

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

  public readonly minScore = signal(0);
  public readonly filteredResults = computed(() =>
    this.results().filter(j => j.score >= this.minScore())
  );

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
    return p === 'alta' ? 'hf-priority--high' : p === 'media' ? 'hf-priority--mid' : 'hf-priority--low';
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

  public scoreLabel(value: number): string {
    return `${value}`;
  }

  public loadSaved(): void {
    this.facade.loadSaved();
  }

  public toggleSaveDialog(): void {
    this.showSaveDialog.update((v) => !v);
  }

  public toggleHistory(): void {
    this.showHistory.update((v) => !v);
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
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar búsqueda', message: '¿Eliminás esta búsqueda guardada?' },
      width: '360px',
    });
    ref.afterClosed().subscribe((confirmed) => { if (confirmed) this.facade.deleteSaved(id); });
  }

  public loadHistory(): void {
    this.facade.loadHistory();
  }

  public rerunHistory(history: SearchRecord): void {
    this.searchForm.patchValue({ keywords: history.keywords, location: history.location ?? '', remote: history.remote, limit: history.limit });
    this.runSearch({ keywords: history.keywords, location: history.location, remote: history.remote, limit: history.limit });
  }

  public deleteHistory(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar historial', message: '¿Eliminás este registro del historial?' },
      width: '360px',
    });
    ref.afterClosed().subscribe((confirmed) => { if (confirmed) this.facade.deleteHistory(id); });
  }

  public exportResults(): void {
    const header = ['Título', 'Empresa', 'Ubicación', 'Score', 'URL'];
    const rows = this.results().map(j => [
      `"${(j.title ?? '').replace(/"/g, '""')}"`,
      `"${(j.company ?? '').replace(/"/g, '""')}"`,
      `"${(j.location ?? '').replace(/"/g, '""')}"`,
      j.score,
      `"${j.url ?? ''}"`,
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hirefire-resultados.csv';
    a.click();
    URL.revokeObjectURL(url);
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
