import { z } from 'zod';

const languageLevelSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.toUpperCase() : value),
  z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
);

const allowedLanguageSchema = z.object({
  language: z.enum(['english', 'portuguese']),
  maxLevel: languageLevelSchema,
});

export const jobSearchSchema = z.object({
  keywords: z.string().min(1, 'keywords es requerido'),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  seniority: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
  allowEnglishRequirements: z.boolean().optional().default(true),
  maxEnglishLevelEnabled: z.boolean().optional().default(false),
  maxEnglishLevel: languageLevelSchema.optional(),
  allowedLanguages: z.array(allowedLanguageSchema).optional(),
});

export const fullSearchSchema = jobSearchSchema.extend({
  profileId: z.string().min(1, 'profileId es requerido'),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type FullSearchInput = z.infer<typeof fullSearchSchema>;
