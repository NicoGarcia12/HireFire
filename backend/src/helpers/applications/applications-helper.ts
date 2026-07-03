import { prisma } from '../../config/db.js';
import type {
  Application,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '../../types/application.types.js';

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  return prisma.application.create({
    data: {
      profileId: input.profileId,
      title: input.title,
      company: input.company,
      location: input.location ?? null,
      remote: input.remote ?? false,
      url: input.url ?? null,
      description: input.description ?? '',
      source: input.source ?? 'manual',
      externalJobId: input.externalJobId ?? null,
      status: input.status ?? 'postulado',
      ...(input.appliedAt ? { appliedAt: new Date(input.appliedAt) } : {}),
      salaryAmount: input.salaryAmount ?? null,
      salaryCurrency: input.salaryCurrency ?? null,
      contractType: input.contractType ?? null,
      notes: input.notes ?? '',
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      nextStepAt: input.nextStepAt ? new Date(input.nextStepAt) : null,
      priority: input.priority ?? null,
      rejectionReason: input.rejectionReason ?? null,
      tags: input.tags ?? [],
    },
  });
}

export async function listApplicationsByProfile(
  profileId: string,
  status?: string,
): Promise<Application[]> {
  return prisma.application.findMany({
    where: { profileId, ...(status ? { status } : {}) },
    orderBy: { appliedAt: 'desc' },
  });
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput,
): Promise<Application> {
  const { appliedAt, nextStepAt, ...rest } = input;

  return prisma.application.update({
    where: { id },
    data: {
      ...rest,
      ...(appliedAt !== undefined ? { appliedAt: new Date(appliedAt) } : {}),
      ...(nextStepAt !== undefined ? { nextStepAt: nextStepAt ? new Date(nextStepAt) : null } : {}),
    },
  });
}

export async function updateApplicationStatus(id: string, status: string): Promise<Application> {
  return prisma.application.update({
    where: { id },
    data: { status },
  });
}

export async function deleteApplication(id: string): Promise<void> {
  await prisma.application.delete({ where: { id } });
}
