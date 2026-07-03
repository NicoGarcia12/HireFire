import { Observable } from 'rxjs';
import type { ApplicationStatus } from '../../domain/applications/enums/application-status.enum';
import type { Application } from '../../domain/applications/models/application.model';
import type { ApplicationPriority } from '../../domain/applications/types/application-priority.type';
import type { ApplicationSource } from '../../domain/applications/types/application-source.type';

export interface ApplicationCreatePayload {
  profileId: string;
  title: string;
  company: string;
  location?: string;
  remote?: boolean;
  url?: string;
  description?: string;
  source?: ApplicationSource;
  externalJobId?: string;
  status?: ApplicationStatus;
  appliedAt?: string;
  salaryAmount?: number;
  salaryCurrency?: string;
  contractType?: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  nextStepAt?: string;
  priority?: ApplicationPriority;
  rejectionReason?: string;
  tags?: string[];
}

export type ApplicationUpdatePayload = Partial<Omit<ApplicationCreatePayload, 'profileId'>>;

/**
 * Puerto de aplicación para Postulaciones: la UI y la facade dependen de este contrato,
 * mientras infraestructura decide si lo resuelve con HTTP, mocks o futuros adapters.
 */
export abstract class ApplicationsDataPort {
  public abstract list(profileId: string, status?: ApplicationStatus): Observable<Application[]>;
  public abstract create(payload: ApplicationCreatePayload): Observable<Application>;
  public abstract update(id: string, payload: ApplicationUpdatePayload): Observable<Application>;
  public abstract updateStatus(id: string, status: ApplicationStatus): Observable<Application>;
  public abstract delete(id: string): Observable<void>;
}
