import { Observable } from 'rxjs';
import type { AllowedLanguage } from '../../domain/matching/models/allowed-language.model';
import type { LinkedInImport } from '../../domain/profile/models/linkedin-import.model';
import type { ProfileAnalysis } from '../../domain/profile/models/profile-analysis.model';
import type { Profile, ProfileExperience, ProfilePreferences } from '../../domain/profile/models/profile.model';
import type { SavedSearch } from '../../domain/search/models/saved-search.model';
import type { SearchRecord } from '../../domain/search/models/search-record.model';
import type { MatchResult } from '../../domain/matching/models/match-result.model';

export interface HomeProfilePayload {
  id?: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  preferences: ProfilePreferences;
}

export interface HomeSearchPayload {
  profileId: string;
  keywords: string;
  location?: string;
  remote?: boolean;
  limit?: number;
  allowedLanguages: AllowedLanguage[];
}

export interface HomeSearchResponse {
  count: number;
  results: MatchResult[];
}

export interface HomeSavedSearchPayload {
  profileId: string;
  name: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
}

/**
 * Puerto de aplicación para Home: la UI y la facade dependen de este contrato,
 * mientras infraestructura decide si lo resuelve con HTTP, mocks o futuros adapters.
 */
export abstract class HomeDataPort {
  public abstract saveProfile(payload: HomeProfilePayload): Observable<Profile>;
  public abstract analyzeProfile(profileId: string): Observable<ProfileAnalysis>;
  public abstract importLinkedIn(file: File): Observable<LinkedInImport>;
  public abstract search(payload: HomeSearchPayload): Observable<HomeSearchResponse>;
  public abstract getHistory(profileId: string): Observable<SearchRecord[]>;
  public abstract deleteHistory(id: string): Observable<void>;
  public abstract getSavedSearches(profileId: string): Observable<SavedSearch[]>;
  public abstract saveSearch(payload: HomeSavedSearchPayload): Observable<SavedSearch>;
  public abstract deleteSavedSearch(id: string): Observable<void>;
}
