import { DestroyRef, Injectable, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '../../domain/applications/enums/application-status.enum';
import type { Application } from '../../domain/applications/models/application.model';
import {
  ApplicationsDataPort,
  type ApplicationCreatePayload,
  type ApplicationUpdatePayload,
} from './applications-data.port';

export type ApplicationsByStatus = Record<ApplicationStatus, Application[]>;

/**
 * Orquesta el estado del pipeline de postulaciones sin conocer formularios ni HttpClient.
 * El componente mantiene estado visual; este facade concentra llamadas y loading/error states.
 */
@Injectable({ providedIn: 'root' })
export class ApplicationsFacade {
  private readonly dataPort = inject(ApplicationsDataPort);
  private readonly destroyRef = inject(DestroyRef);

  private readonly applicationsSignal = signal<Application[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  public readonly applications: Signal<Application[]> = this.applicationsSignal.asReadonly();
  public readonly loading: Signal<boolean> = this.loadingSignal.asReadonly();
  public readonly error: Signal<string | null> = this.errorSignal.asReadonly();

  public readonly byStatus: Signal<ApplicationsByStatus> = computed(() => {
    const groups = APPLICATION_STATUSES.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {} as ApplicationsByStatus);

    for (const application of this.applicationsSignal()) {
      groups[application.status].push(application);
    }
    return groups;
  });

  /**
   * Carga las postulaciones de un perfil, opcionalmente filtradas por status.
   */
  public load(profileId: string, status?: ApplicationStatus): void {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    this.dataPort
      .list(profileId, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (applications) => {
          this.applicationsSignal.set(applications);
          this.loadingSignal.set(false);
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.messageFromError(error));
          this.loadingSignal.set(false);
        },
      });
  }

  public create(
    payload: ApplicationCreatePayload,
    onCreated?: (application: Application) => void,
  ): void {
    this.errorSignal.set(null);

    this.dataPort
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (application) => {
          this.applicationsSignal.update((applications) => [application, ...applications]);
          onCreated?.(application);
        },
        error: (error: unknown) => this.errorSignal.set(this.messageFromError(error)),
      });
  }

  public update(
    id: string,
    payload: ApplicationUpdatePayload,
    onUpdated?: (application: Application) => void,
  ): void {
    this.errorSignal.set(null);

    this.dataPort
      .update(id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (application) => {
          this.replace(application);
          onUpdated?.(application);
        },
        error: (error: unknown) => this.errorSignal.set(this.messageFromError(error)),
      });
  }

  /**
   * Actualización optimista del status para que el pipeline se sienta instantáneo (ej. drag & drop);
   * si el backend falla, se revierte al valor previo.
   */
  public updateStatus(id: string, status: ApplicationStatus): void {
    this.errorSignal.set(null);
    const previous = this.applicationsSignal();
    this.applicationsSignal.update((applications) =>
      applications.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    );

    this.dataPort
      .updateStatus(id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (application) => this.replace(application),
        error: (error: unknown) => {
          this.applicationsSignal.set(previous);
          this.errorSignal.set(this.messageFromError(error));
        },
      });
  }

  public delete(id: string): void {
    this.errorSignal.set(null);

    this.dataPort
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.applicationsSignal.update((applications) =>
            applications.filter((application) => application.id !== id),
          ),
        error: (error: unknown) => this.errorSignal.set(this.messageFromError(error)),
      });
  }

  private replace(application: Application): void {
    this.applicationsSignal.update((applications) =>
      applications.map((existing) => (existing.id === application.id ? application : existing)),
    );
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
