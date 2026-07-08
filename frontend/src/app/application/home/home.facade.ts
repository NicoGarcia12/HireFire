import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { LinkedInImport } from '../../domain/profile/models/linkedin-import.model';
import type { ProfileAnalysis } from '../../domain/profile/models/profile-analysis.model';
import type { SavedSearch } from '../../domain/search/models/saved-search.model';
import type { SearchRecord } from '../../domain/search/models/search-record.model';
import type { MatchResult } from '../../domain/matching/models/match-result.model';
import {
  HomeDataPort,
  type HomeProfilePayload,
  type HomeSavedSearchPayload,
  type HomeSearchPayload,
} from './home-data.port';
import { StorageService } from '../../core/storage.service';

/**
 * Orquesta el estado de la pantalla Home sin conocer formularios ni HttpClient.
 * El componente mantiene estado visual; este facade concentra llamadas y loading/error states.
 */
@Injectable({ providedIn: 'root' })
export class HomeFacade {
  private readonly dataPort = inject(HomeDataPort);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(StorageService);

  private static readonly PROFILE_ID_KEY = 'hirefire_profile_id';

  private readonly profileIdSignal = signal<string | null>(null);
  private readonly errorSignal = signal<string | null>(null);
  private readonly savingProfileSignal = signal(false);
  private readonly importingSignal = signal(false);
  private readonly analyzingSignal = signal(false);
  private readonly analysisSignal = signal<ProfileAnalysis | null>(null);
  private readonly searchingSignal = signal(false);
  private readonly resultsSignal = signal<MatchResult[]>([]);
  private readonly savedSignal = signal<SavedSearch[]>([]);
  private readonly savingSearchSignal = signal(false);
  private readonly historySignal = signal<SearchRecord[]>([]);
  private readonly searchedSignal = signal(false);

  public readonly profileId: Signal<string | null> = this.profileIdSignal.asReadonly();

  constructor() {
    const stored = this.storage.get(HomeFacade.PROFILE_ID_KEY);
    if (stored) {
      this.profileIdSignal.set(stored);
      this.loadSaved();
      this.loadHistory();
    }
  }
  public readonly error: Signal<string | null> = this.errorSignal.asReadonly();
  public readonly savingProfile: Signal<boolean> = this.savingProfileSignal.asReadonly();
  public readonly importing: Signal<boolean> = this.importingSignal.asReadonly();
  public readonly analyzing: Signal<boolean> = this.analyzingSignal.asReadonly();
  public readonly analysis: Signal<ProfileAnalysis | null> = this.analysisSignal.asReadonly();
  public readonly searching: Signal<boolean> = this.searchingSignal.asReadonly();
  public readonly results: Signal<MatchResult[]> = this.resultsSignal.asReadonly();
  public readonly saved: Signal<SavedSearch[]> = this.savedSignal.asReadonly();
  public readonly savingSearch: Signal<boolean> = this.savingSearchSignal.asReadonly();
  public readonly history: Signal<SearchRecord[]> = this.historySignal.asReadonly();
  public readonly searched: Signal<boolean> = this.searchedSignal.asReadonly();

  /**
   * Guarda o actualiza el perfil y luego refresca las listas derivadas que dependen del profileId.
   */
  public saveProfile(payload: HomeProfilePayload): void {
    this.errorSignal.set(null);
    this.savingProfileSignal.set(true);

    this.dataPort
      .saveProfile(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profileIdSignal.set(profile.id);
          this.storage.set(HomeFacade.PROFILE_ID_KEY, profile.id);
          this.savingProfileSignal.set(false);
          this.loadSaved();
          this.loadHistory();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.messageFromError(error));
          this.savingProfileSignal.set(false);
        },
      });
  }

  /**
   * Importa el ZIP de LinkedIn y delega al componente el patch del formulario, que sigue siendo estado visual.
   */
  public importLinkedIn(file: File, onImported: (data: LinkedInImport) => void): void {
    this.importingSignal.set(true);
    this.errorSignal.set(null);

    this.dataPort
      .importLinkedIn(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          onImported(data);
          this.importingSignal.set(false);
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.messageFromError(error));
          this.importingSignal.set(false);
        },
      });
  }

  public analyzeProfile(): void {
    const id = this.profileIdSignal();
    if (!id) return;

    this.analyzingSignal.set(true);
    this.analysisSignal.set(null);
    this.errorSignal.set(null);

    this.dataPort
      .analyzeProfile(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (analysis) => {
          this.analysisSignal.set(analysis);
          this.analyzingSignal.set(false);
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.messageFromError(error));
          this.analyzingSignal.set(false);
        },
      });
  }

  /**
   * Ejecuta búsqueda, mantiene el resultado en estado de aplicación y refresca historial al finalizar.
   */
  public runSearch(payload: Omit<HomeSearchPayload, 'profileId'>): void {
    const id = this.profileIdSignal();
    if (!id) return;

    this.errorSignal.set(null);
    this.searchingSignal.set(true);
    this.resultsSignal.set([]);

    this.dataPort
      .search({ ...payload, profileId: id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.resultsSignal.set(response.results);
          this.searchingSignal.set(false);
          this.searchedSignal.set(true);
          this.loadHistory();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.messageFromError(error));
          this.searchingSignal.set(false);
          this.searchedSignal.set(true);
        },
      });
  }

  public loadSaved(): void {
    const id = this.profileIdSignal();
    if (!id) return;

    this.dataPort
      .getSavedSearches(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (saved) => this.savedSignal.set(saved) });
  }

  public saveCurrentSearch(
    payload: Omit<HomeSavedSearchPayload, 'profileId'>,
    onSaved?: () => void,
  ): void {
    const id = this.profileIdSignal();
    if (!id) return;

    this.savingSearchSignal.set(true);

    this.dataPort
      .saveSearch({ ...payload, profileId: id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingSearchSignal.set(false);
          onSaved?.();
          this.loadSaved();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.messageFromError(error));
          this.savingSearchSignal.set(false);
        },
      });
  }

  public deleteSaved(id: string): void {
    this.dataPort
      .deleteSavedSearch(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadSaved() });
  }

  public loadHistory(): void {
    const id = this.profileIdSignal();
    if (!id) return;

    this.dataPort
      .getHistory(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (history) => this.historySignal.set(history) });
  }

  public deleteHistory(id: string): void {
    this.dataPort
      .deleteHistory(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadHistory() });
  }

  public setProfileIdForTesting(profileId: string): void {
    this.profileIdSignal.set(profileId);
  }

  /**
   * Normaliza errores externos para no filtrar detalles de HttpErrorResponse a la template.
   */
  private messageFromError(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error)
      return String((error as { message: unknown }).message);
    return 'Error — ¿el backend está corriendo en :3000?';
  }
}
