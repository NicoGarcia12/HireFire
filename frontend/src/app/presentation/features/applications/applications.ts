import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { ApplicationsFacade } from '../../../application/applications/applications.facade';
import { HomeFacade } from '../../../application/home/home.facade';
import { APPLICATION_STATUSES, type ApplicationStatus } from '../../../domain/applications/enums/application-status.enum';
import type { Application } from '../../../domain/applications/models/application.model';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  postulado: 'Postulado',
  en_proceso: 'En proceso',
  entrevista: 'Entrevista',
  oferta: 'Oferta',
  rechazado: 'Rechazado',
  descartado: 'Descartado',
};

@Component({
  selector: 'app-applications',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatOptionModule, MatSelectModule],
  templateUrl: './applications.html',
  styleUrl: './applications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Applications {
  private readonly facade = inject(ApplicationsFacade);
  private readonly homeFacade = inject(HomeFacade);

  public readonly profileId = this.homeFacade.profileId;
  public readonly loading = this.facade.loading;
  public readonly error = this.facade.error;
  public readonly byStatus = this.facade.byStatus;

  public readonly statuses: readonly ApplicationStatus[] = APPLICATION_STATUSES;
  public readonly statusLabels = STATUS_LABELS;

  constructor() {
    const profileId = this.profileId();
    if (profileId) this.facade.load(profileId);
  }

  public onStatusChange(application: Application, event: MatSelectChange): void {
    const status = event.value as ApplicationStatus;
    if (status === application.status) return;

    this.facade.updateStatus(application.id, status);
  }
}
