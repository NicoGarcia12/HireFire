export interface SavedSearchPayload {
  profileId: string;
  name: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
}
