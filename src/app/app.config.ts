import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { FilterService, MessageService } from 'primeng/api';
import {provideHttpClient, withFetch, withInterceptorsFromDi} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    MessageService,
    FilterService,
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(), // <-- ¡Esto habilita fetch!
      withInterceptorsFromDi() // <-- Si usas interceptores vía DI
    ),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
};
