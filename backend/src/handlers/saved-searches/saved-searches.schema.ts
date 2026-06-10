import { z } from 'zod';

export const savedSearchSchema = z.object({
  profileId: z.string().min(1),
  name: z.string().min(1),
  keywords: z.string().min(1),
  location: z.string().optional(),
  remote: z.boolean().default(false),
  limit: z.number().int().min(1).max(200).default(30),
});

export type SavedSearchInput = z.infer<typeof savedSearchSchema>;
