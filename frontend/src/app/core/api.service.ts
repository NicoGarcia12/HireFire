import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LinkedInImport,
  Profile,
  ProfileAnalysis,
  SavedSearch,
  SearchRecord,
  SearchResponse,
} from './models';

const API_BASE = 'http://localhost:3000/api';

export interface ProfilePayload {
  id?: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; description: string }[];
  preferences: { locations: string[]; remote: boolean; seniority?: string };
}

export interface SearchPayload {
  profileId: string;
  keywords: string;
  location?: string;
  remote?: boolean;
  limit?: number;
}

export interface SavedSearchPayload {
  profileId: string;
  name: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ── Perfil ──────────────────────────────────────────────────────────────

  saveProfile(payload: ProfilePayload): Observable<Profile> {
    return this.http.post<Profile>(`${API_BASE}/profile`, payload);
  }

  analyzeProfile(profileId: string): Observable<ProfileAnalysis> {
    return this.http.post<ProfileAnalysis>(`${API_BASE}/profile/${profileId}/analyze`, {});
  }

  importLinkedIn(file: File): Observable<LinkedInImport> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<LinkedInImport>(`${API_BASE}/profile/import-linkedin`, form);
  }

  // ── Búsqueda ─────────────────────────────────────────────────────────────

  search(payload: SearchPayload): Observable<SearchResponse> {
    return this.http.post<SearchResponse>(`${API_BASE}/search`, payload);
  }

  // ── Historial ────────────────────────────────────────────────────────────

  getHistory(profileId: string): Observable<SearchRecord[]> {
    return this.http.get<SearchRecord[]>(`${API_BASE}/history?profileId=${profileId}`);
  }

  deleteHistory(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/history/${id}`);
  }

  // ── Búsquedas guardadas ──────────────────────────────────────────────────

  getSavedSearches(profileId: string): Observable<SavedSearch[]> {
    return this.http.get<SavedSearch[]>(
      `${API_BASE}/saved-searches?profileId=${profileId}`,
    );
  }

  saveSearch(payload: SavedSearchPayload): Observable<SavedSearch> {
    return this.http.post<SavedSearch>(`${API_BASE}/saved-searches`, payload);
  }

  deleteSavedSearch(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/saved-searches/${id}`);
  }
}
