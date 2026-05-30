import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { MatchResult } from '../../core/models';

/** Convierte un string separado por comas en array limpio. */
function csvToArray(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  /** Id del perfil guardado; habilita la búsqueda. */
  readonly profileId = signal<string | null>(null);
  readonly savingProfile = signal(false);
  readonly searching = signal(false);
  readonly error = signal<string | null>(null);
  readonly results = signal<MatchResult[]>([]);

  readonly profileForm = this.fb.group({
    headline: ['', Validators.required],
    summary: [''],
    skills: [''],
    locations: [''],
    remote: [true],
    seniority: [''],
    experience: this.fb.array([this.newExperience()]),
  });

  readonly searchForm = this.fb.group({
    keywords: ['', Validators.required],
    location: [''],
    remote: [false],
    limit: [30],
  });

  get experience(): FormArray {
    return this.profileForm.get('experience') as FormArray;
  }

  private newExperience(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      company: ['', Validators.required],
      description: [''],
    });
  }

  addExperience(): void {
    this.experience.push(this.newExperience());
  }

  removeExperience(index: number): void {
    if (this.experience.length > 1) this.experience.removeAt(index);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.savingProfile.set(true);

    const v = this.profileForm.getRawValue();
    this.api
      .saveProfile({
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
      })
      .subscribe({
        next: (profile) => {
          this.profileId.set(profile.id);
          this.savingProfile.set(false);
        },
        error: (err) => {
          this.error.set(this.describe(err));
          this.savingProfile.set(false);
        },
      });
  }

  runSearch(): void {
    const id = this.profileId();
    if (!id || this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.searching.set(true);
    this.results.set([]);

    const v = this.searchForm.getRawValue();
    this.api
      .search({
        profileId: id,
        keywords: v.keywords ?? '',
        location: v.location || undefined,
        remote: !!v.remote,
        limit: v.limit ?? 30,
      })
      .subscribe({
        next: (res) => {
          this.results.set(res.results);
          this.searching.set(false);
        },
        error: (err) => {
          this.error.set(this.describe(err));
          this.searching.set(false);
        },
      });
  }

  /** Color del badge según el score. */
  scoreClass(score: number): string {
    if (score >= 75) return 'score--high';
    if (score >= 50) return 'score--mid';
    return 'score--low';
  }

  private describe(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Ocurrió un error. ¿El backend está corriendo en :3000?';
  }
}
