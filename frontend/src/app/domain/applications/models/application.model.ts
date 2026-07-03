import type { ApplicationStatus } from '../enums/application-status.enum';
import type { ApplicationPriority } from '../types/application-priority.type';
import type { ApplicationSource } from '../types/application-source.type';

export interface Application {
  id: string;
  profileId: string;
  // Snapshot de la oferta
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  url: string | null;
  description: string;
  source: ApplicationSource;
  externalJobId: string | null;
  // Pipeline
  status: ApplicationStatus;
  appliedAt: string;
  // Ampliables (opcionales)
  salaryAmount: number | null;
  salaryCurrency: string | null;
  contractType: string | null;
  notes: string;
  contactName: string | null;
  contactEmail: string | null;
  nextStepAt: string | null;
  priority: ApplicationPriority | null;
  rejectionReason: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
