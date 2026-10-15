import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { environment } from '../environments/environment';
import { API_CONFIG } from '@game-server/client/shared';
import { requestInterceptor } from '@game-server/client/shared';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([requestInterceptor])),
    { provide: API_CONFIG, useValue: { apiBase: environment.apiBase } },
  ],
};
