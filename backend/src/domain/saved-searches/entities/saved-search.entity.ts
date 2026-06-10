export interface SavedSearch {
  id: string;
  profileId: string;
  name: string;
  keywords: string;
  location: string | null;
  remote: boolean;
  limit: number;
  createdAt: Date;
}

export interface CreateSavedSearch {
  profileId: string;
  name: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
}
