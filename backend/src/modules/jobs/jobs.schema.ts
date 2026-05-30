import { z } from 'zod';

export const jobSearchSchema = z.object({
  keywords: z.string().min(1, 'keywords es requerido'),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  seniority: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const fullSearchSchema = jobSearchSchema.extend({
  profileId: z.string().min(1, 'profileId es requerido'),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type FullSearchInput = z.infer<typeof fullSearchSchema>;
