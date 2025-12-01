import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor, errorInterceptor, loadingInterceptor } from './core/interceptors';
import { AuthService } from './core/services/auth.service';

/**
 * Initialize authentication state on app startup
 */
function initializeAuth(authService: AuthService) {
  return () => {
    authService.initializeAuth();
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router with component input binding and view transitions
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),

    // HTTP client with interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([
        loadingInterceptor,
        authInterceptor,
        errorInterceptor
      ])
    ),

    // Animations
    provideAnimations(),

    // Translation (ngx-translate v17)
    provideTranslateService({
      defaultLanguage: 'en'
    }),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    }),

    // App initialization
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const authService = inject(AuthService);
        return initializeAuth(authService);
      },
      multi: true
    }
  ]
};
