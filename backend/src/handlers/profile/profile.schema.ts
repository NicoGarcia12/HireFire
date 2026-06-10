import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string().optional(),
  headline: z.string().min(1),
  summary: z.string().default(''),
  skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        title: z.string().min(1),
        company: z.string().min(1),
        description: z.string().default(''),
      }),
    )
    .default([]),
  preferences: z
    .object({
      locations: z.array(z.string()).default([]),
      remote: z.boolean().default(false),
      seniority: z.string().optional(),
    })
    .default({ locations: [], remote: false }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
