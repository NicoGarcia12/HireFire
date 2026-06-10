export interface SavedSearch {
  id: string;
  name: string;
  profileId: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
  createdAt: string;
}
