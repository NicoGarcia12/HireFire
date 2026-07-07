import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiService } from './hirefire-api.service';

const API_BASE = 'http://localhost:3000/api';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('saveProfile() POSTs the payload to /profile', () => {
    // Arrange
    const payload = { headline: 'Dev' } as Parameters<ApiService['saveProfile']>[0];

    // Act
    service.saveProfile(payload).subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/profile`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(payload);
    req.flush({});
  });

  it('analyzeProfile() POSTs to /profile/:id/analyze with an empty body', () => {
    // Arrange & Act
    service.analyzeProfile('profile-1').subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/profile/profile-1/analyze`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('importLinkedIn() POSTs the file wrapped in FormData', () => {
    // Arrange
    const file = new File(['zip content'], 'profile.zip');

    // Act
    service.importLinkedIn(file).subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/profile/import-linkedin`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush({});
  });

  it('search() POSTs the search payload to /search', () => {
    // Arrange
    const payload = { profileId: 'p1', keywords: 'dev' } as Parameters<ApiService['search']>[0];

    // Act
    service.search(payload).subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/search`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(payload);
    req.flush({ count: 0, results: [] });
  });

  it('getHistory() GETs /history filtered by profileId', () => {
    // Arrange & Act
    service.getHistory('profile-1').subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/history?profileId=profile-1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('deleteHistory() DELETEs /history/:id', () => {
    // Arrange & Act
    service.deleteHistory('history-1').subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/history/history-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getSavedSearches() GETs /saved-searches filtered by profileId', () => {
    // Arrange & Act
    service.getSavedSearches('profile-1').subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/saved-searches?profileId=profile-1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('saveSearch() POSTs the payload to /saved-searches', () => {
    // Arrange
    const payload = { name: 'Mi busqueda' } as Parameters<ApiService['saveSearch']>[0];

    // Act
    service.saveSearch(payload).subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/saved-searches`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(payload);
    req.flush({});
  });

  it('deleteSavedSearch() DELETEs /saved-searches/:id', () => {
    // Arrange & Act
    service.deleteSavedSearch('saved-1').subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/saved-searches/saved-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('list() GETs /applications with profileId and omits status when not given', () => {
    // Arrange & Act
    service.list('profile-1').subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/applications?profileId=profile-1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('list() includes status in the query string when given', () => {
    // Arrange & Act
    service.list('profile-1', 'entrevista').subscribe();

    // Assert
    const req = httpMock.expectOne(
      `${API_BASE}/applications?profileId=profile-1&status=entrevista`,
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create() POSTs the payload to /applications', () => {
    // Arrange
    const payload = { profileId: 'p1', title: 'Dev', company: 'Acme' } as Parameters<
      ApiService['create']
    >[0];

    // Act
    service.create(payload).subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/applications`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(payload);
    req.flush({});
  });

  it('update() PATCHes the payload to /applications/:id', () => {
    // Arrange
    const payload = { notes: 'updated' } as Parameters<ApiService['update']>[1];

    // Act
    service.update('app-1', payload).subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/applications/app-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBe(payload);
    req.flush({});
  });

  it('updateStatus() PATCHes { status } to /applications/:id/status', () => {
    // Arrange & Act
    service.updateStatus('app-1', 'oferta').subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/applications/app-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'oferta' });
    req.flush({});
  });

  it('delete() DELETEs /applications/:id', () => {
    // Arrange & Act
    service.delete('app-1').subscribe();

    // Assert
    const req = httpMock.expectOne(`${API_BASE}/applications/app-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
