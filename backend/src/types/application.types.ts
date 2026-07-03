export const APPLICATION_STATUSES = [
  'postulado',
  'en_proceso',
  'entrevista',
  'oferta',
  'rechazado',
  'descartado',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_SOURCES = ['hirefire', 'manual'] as const;
export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export const APPLICATION_PRIORITIES = ['alta', 'media', 'baja'] as const;
export type ApplicationPriority = (typeof APPLICATION_PRIORITIES)[number];

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
  source: string;
  externalJobId: string | null;
  // Pipeline
  status: string;
  appliedAt: Date;
  // Ampliables (opcionales)
  salaryAmount: number | null;
  salaryCurrency: string | null;
  contractType: string | null;
  notes: string;
  contactName: string | null;
  contactEmail: string | null;
  nextStepAt: Date | null;
  priority: string | null;
  rejectionReason: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApplicationInput {
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

export interface UpdateApplicationInput {
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

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus;
}
