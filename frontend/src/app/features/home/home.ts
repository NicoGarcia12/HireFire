import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { MatchResult, SavedSearch, SearchRecord } from '../../core/models';

function csvToArray(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  // ── Estado global ─────────────────────────────────────────────────────
  readonly profileId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  // ── Perfil ────────────────────────────────────────────────────────────
  readonly savingProfile = signal(false);
  readonly importing = signal(false);

  readonly profileForm = this.fb.group({
    headline: ['', Validators.required],
    summary: [''],
    skills: [''],
    locations: [''],
    remote: [true],
    seniority: [''],
    experience: this.fb.array([this.newExp()]),
  });

  get experience(): FormArray { return this.profileForm.get('experience') as FormArray; }

  private newExp(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      company: ['', Validators.required],
      description: [''],
    });
  }

  addExp(): void { this.experience.push(this.newExp()); }
  removeExp(i: number): void { if (this.experience.length > 1) this.experience.removeAt(i); }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.error.set(null);
    this.savingProfile.set(true);
    const v = this.profileForm.getRawValue();
    this.api.saveProfile({
      id: this.profileId() ?? undefined,
      headline: v.headline ?? '',
      summary: v.summary ?? '',
      skills: csvToArray(v.skills ?? ''),
      experience: (v.experience ?? []).map((e) => ({
        title: e['title'] ?? '',
        company: e['company'] ?? '',
        description: e['description'] ?? '',
      })),
      preferences: {
        locations: csvToArray(v.locations ?? ''),
        remote: !!v.remote,
        seniority: v.seniority || undefined,
      },
    }).subscribe({
      next: (p) => {
        this.profileId.set(p.id);
        this.savingProfile.set(false);
        this.loadSaved();
        this.loadHistory();
      },
      error: (e) => { this.error.set(this.msg(e)); this.savingProfile.set(false); },
    });
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importing.set(true);
    this.error.set(null);
    this.api.importLinkedIn(file).subscribe({
      next: (data) => {
        this.profileForm.patchValue({
          headline: data.headline,
          summary: data.summary,
          skills: data.skills.join(', '),
        });
        if (data.experience.length > 0) {
          while (this.experience.length) this.experience.removeAt(0);
          for (const exp of data.experience) {
            this.experience.push(this.fb.group({
              title: [exp.title, Validators.required],
              company: [exp.company, Validators.required],
              description: [exp.description],
            }));
          }
        }
        this.importing.set(false);
      },
      error: (e) => { this.error.set(this.msg(e)); this.importing.set(false); },
    });
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────
  readonly searching = signal(false);
  readonly results = signal<MatchResult[]>([]);
  readonly showSaveDialog = signal(false);
  readonly saveNameValue = signal('');

  readonly searchForm = this.fb.group({
    keywords: ['', Validators.required],
    location: [''],
    remote: [false],
    limit: [30],
  });

  runSearch(params?: { keywords: string; location?: string; remote: boolean; limit: number }): void {
    const id = this.profileId();
    if (!id) return;
    let keywords: string, location: string | undefined, remote: boolean, limit: number;
    if (params) {
      ({ keywords, location, remote, limit } = params);
    } else {
      if (this.searchForm.invalid) { this.searchForm.markAllAsTouched(); return; }
      const v = this.searchForm.getRawValue();
      keywords = v.keywords ?? '';
      location = v.location || undefined;
      remote = !!v.remote;
      limit = v.limit ?? 30;
    }
    this.error.set(null);
    this.searching.set(true);
    this.results.set([]);
    this.api.search({ profileId: id, keywords, location, remote, limit }).subscribe({
      next: (res) => {
        this.results.set(res.results);
        this.searching.set(false);
        this.loadHistory();
      },
      error: (e) => { this.error.set(this.msg(e)); this.searching.set(false); },
    });
  }

  scoreClass(s: number): string {
    return s >= 75 ? 'score--high' : s >= 50 ? 'score--mid' : 'score--low';
  }

  // ── Búsquedas guardadas ───────────────────────────────────────────────
  readonly saved = signal<SavedSearch[]>([]);
  readonly savingSearch = signal(false);

  loadSaved(): void {
    const id = this.profileId();
    if (!id) return;
    this.api.getSavedSearches(id).subscribe({ next: (s) => this.saved.set(s) });
  }

  toggleSaveDialog(): void { this.showSaveDialog.update((v) => !v); }

  saveCurrentSearch(): void {
    const id = this.profileId();
    if (!id || !this.saveNameValue().trim()) return;
    const v = this.searchForm.getRawValue();
    this.savingSearch.set(true);
    this.api.saveSearch({
      profileId: id,
      name: this.saveNameValue().trim(),
      keywords: v.keywords ?? '',
      location: v.location || undefined,
      remote: !!v.remote,
      limit: v.limit ?? 30,
    }).subscribe({
      next: () => {
        this.showSaveDialog.set(false);
        this.saveNameValue.set('');
        this.savingSearch.set(false);
        this.loadSaved();
      },
      error: (e) => { this.error.set(this.msg(e)); this.savingSearch.set(false); },
    });
  }

  runSaved(s: SavedSearch): void {
    this.searchForm.patchValue({ keywords: s.keywords, location: s.location ?? '', remote: s.remote, limit: s.limit });
    this.runSearch({ keywords: s.keywords, location: s.location, remote: s.remote, limit: s.limit });
  }

  deleteSaved(id: string): void {
    this.api.deleteSavedSearch(id).subscribe({ next: () => this.loadSaved() });
  }

  // ── Historial ─────────────────────────────────────────────────────────
  readonly history = signal<SearchRecord[]>([]);
  readonly showHistory = signal(false);

  loadHistory(): void {
    const id = this.profileId();
    if (!id) return;
    this.api.getHistory(id).subscribe({ next: (h) => this.history.set(h) });
  }

  rerunHistory(h: SearchRecord): void {
    this.searchForm.patchValue({ keywords: h.keywords, location: h.location ?? '', remote: h.remote, limit: h.limit });
    this.runSearch({ keywords: h.keywords, location: h.location, remote: h.remote, limit: h.limit });
  }

  deleteHistory(id: string): void {
    this.api.deleteHistory(id).subscribe({ next: () => this.loadHistory() });
  }

  private msg(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
    return 'Error — ¿el backend está corriendo en :3000?';
  }
}
