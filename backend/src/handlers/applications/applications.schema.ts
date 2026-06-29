import { z } from 'zod';
import {
  APPLICATION_PRIORITIES,
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
} from '../../types/application.types.js';

const isoDate = z.string().datetime({ offset: true });

export const createApplicationSchema = z.object({
  profileId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  remote: z.boolean().default(false),
  url: z.string().optional(),
  description: z.string().default(''),
  source: z.enum(APPLICATION_SOURCES).default('manual'),
  externalJobId: z.string().optional(),
  status: z.enum(APPLICATION_STATUSES).default('postulado'),
  appliedAt: isoDate.optional(),
  salaryAmount: z.number().int().nonnegative().optional(),
  salaryCurrency: z.string().optional(),
  contractType: z.string().optional(),
  notes: z.string().default(''),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  nextStepAt: isoDate.optional(),
  priority: z.enum(APPLICATION_PRIORITIES).optional(),
  rejectionReason: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateApplicationSchema = z
  .object({
    title: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    location: z.string().nullable().optional(),
    remote: z.boolean().optional(),
    url: z.string().nullable().optional(),
    description: z.string().optional(),
    source: z.enum(APPLICATION_SOURCES).optional(),
    externalJobId: z.string().nullable().optional(),
    status: z.enum(APPLICATION_STATUSES).optional(),
    appliedAt: isoDate.optional(),
    salaryAmount: z.number().int().nonnegative().nullable().optional(),
    salaryCurrency: z.string().nullable().optional(),
    contractType: z.string().nullable().optional(),
    notes: z.string().optional(),
    contactName: z.string().nullable().optional(),
    contactEmail: z.string().email().nullable().optional(),
    nextStepAt: isoDate.nullable().optional(),
    priority: z.enum(APPLICATION_PRIORITIES).nullable().optional(),
    rejectionReason: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

export const updateApplicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

export type CreateApplicationSchema = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationSchema = z.infer<typeof updateApplicationSchema>;
export type UpdateApplicationStatusSchema = z.infer<typeof updateApplicationStatusSchema>;
