import type { ApplicationStatus } from '../../../domain/applications/enums/application-status.enum';
import type { ApplicationPriority } from '../../../domain/applications/types/application-priority.type';
import type { ApplicationSource } from '../../../domain/applications/types/application-source.type';

export interface ApplicationPayload {
  profileId?: string;
  title?: string;
  company?: string;
  location?: string | null;
  remote?: boolean;
  url?: string | null;
  description?: string;
  source?: ApplicationSource;
  externalJobId?: string | null;
  status?: ApplicationStatus;
  appliedAt?: string;
  salaryAmount?: number | null;
  salaryCurrency?: string | null;
  contractType?: string | null;
  notes?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  nextStepAt?: string | null;
  priority?: ApplicationPriority | null;
  rejectionReason?: string | null;
  tags?: string[];
}

export interface ApplicationStatusPayload {
  status: ApplicationStatus;
}
