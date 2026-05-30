import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile, SearchResponse } from './models';

/** URL base del backend Express. El backend habilita CORS. */
const API_BASE = 'http://localhost:3000/api';

export interface ProfilePayload {
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
  seniority?: string;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  /** Crea o actualiza el perfil; devuelve el perfil con su id. */
  saveProfile(payload: ProfilePayload): Observable<Profile> {
    return this.http.post<Profile>(`${API_BASE}/profile`, payload);
  }

  /** Busca ofertas y las rankea contra el perfil indicado. */
  search(payload: SearchPayload): Observable<SearchResponse> {
    return this.http.post<SearchResponse>(`${API_BASE}/search`, payload);
  }
}
