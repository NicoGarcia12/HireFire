import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HomeDataPort } from './application/home/home-data.port';
import { ApplicationsDataPort } from './application/applications/applications-data.port';
import { App } from './app';
import { routes } from './app.routes';
import { ApiService } from './infrastructure/api/hirefire-api.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(),
        { provide: HomeDataPort, useExisting: ApiService },
        { provide: ApplicationsDataPort, useExisting: ApiService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  /** Valida que el bridge de routing cargue la Home real desde presentation/features. */
  it('should render the home shell for the default route', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/');

    expect(harness.routeNativeElement?.textContent).toContain('HireFire 🔥');
  });
});
