import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HomeDataPort, type HomeProfilePayload, type HomeSavedSearchPayload, type HomeSearchPayload } from '../../application/home/home-data.port';
import {
  ApplicationsDataPort,
  type ApplicationCreatePayload,
  type ApplicationUpdatePayload,
} from '../../application/applications/applications-data.port';
import type { ApplicationStatus } from '../../domain/applications/enums/application-status.enum';
import type { Application } from '../../domain/applications/models/application.model';
import type { LinkedInImport } from '../../domain/profile/models/linkedin-import.model';
import type { ProfileAnalysis } from '../../domain/profile/models/profile-analysis.model';
import type { Profile } from '../../domain/profile/models/profile.model';
import type { SavedSearch } from '../../domain/search/models/saved-search.model';
import type { SearchRecord } from '../../domain/search/models/search-record.model';
import type { ApplicationPayload, ApplicationStatusPayload } from './dto/application-payload.dto';
import type { SearchResponse } from './dto/search-response.dto';

const API_BASE = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService extends HomeDataPort implements ApplicationsDataPort {
  private readonly http = inject(HttpClient);

  public override saveProfile(payload: HomeProfilePayload): Observable<Profile> {
    return this.http.post<Profile>(`${API_BASE}/profile`, payload);
  }

  public override analyzeProfile(profileId: string): Observable<ProfileAnalysis> {
    return this.http.post<ProfileAnalysis>(`${API_BASE}/profile/${profileId}/analyze`, {});
  }

  public override importLinkedIn(file: File): Observable<LinkedInImport> {
    const form = new FormData();
    form.append('file', file);

    return this.http.post<LinkedInImport>(`${API_BASE}/profile/import-linkedin`, form);
  }

  public override search(payload: HomeSearchPayload): Observable<SearchResponse> {
    return this.http.post<SearchResponse>(`${API_BASE}/search`, payload);
  }

  public override getHistory(profileId: string): Observable<SearchRecord[]> {
    return this.http.get<SearchRecord[]>(`${API_BASE}/history?profileId=${profileId}`);
  }

  public override deleteHistory(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/history/${id}`);
  }

  public override getSavedSearches(profileId: string): Observable<SavedSearch[]> {
    return this.http.get<SavedSearch[]>(`${API_BASE}/saved-searches?profileId=${profileId}`);
  }

  public override saveSearch(payload: HomeSavedSearchPayload): Observable<SavedSearch> {
    return this.http.post<SavedSearch>(`${API_BASE}/saved-searches`, payload);
  }

  public override deleteSavedSearch(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/saved-searches/${id}`);
  }

  public list(profileId: string, status?: ApplicationStatus): Observable<Application[]> {
    const params = new URLSearchParams({ profileId });
    if (status) params.set('status', status);

    return this.http.get<Application[]>(`${API_BASE}/applications?${params.toString()}`);
  }

  public create(payload: ApplicationCreatePayload): Observable<Application> {
    const body: ApplicationPayload = payload;
    return this.http.post<Application>(`${API_BASE}/applications`, body);
  }

  public update(id: string, payload: ApplicationUpdatePayload): Observable<Application> {
    const body: ApplicationPayload = payload;
    return this.http.patch<Application>(`${API_BASE}/applications/${id}`, body);
  }

  public updateStatus(id: string, status: ApplicationStatus): Observable<Application> {
    const body: ApplicationStatusPayload = { status };
    return this.http.patch<Application>(`${API_BASE}/applications/${id}/status`, body);
  }

  public delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/applications/${id}`);
  }
}
