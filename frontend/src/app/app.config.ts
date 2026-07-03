import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { ApplicationsDataPort } from './application/applications/applications-data.port';
import { HomeDataPort } from './application/home/home-data.port';
import { ApiService } from './infrastructure/api/hirefire-api.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    { provide: HomeDataPort, useExisting: ApiService },
    { provide: ApplicationsDataPort, useExisting: ApiService },
  ],
};
