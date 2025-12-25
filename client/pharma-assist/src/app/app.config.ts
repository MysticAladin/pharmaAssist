import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER, inject, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
import localeBs from '@angular/common/locales/bs';
import localeDe from '@angular/common/locales/de';

import { routes } from './app.routes';
import { authInterceptor, errorInterceptor, loadingInterceptor } from './core/interceptors';
import { AuthService } from './core/services/auth.service';

// Register Bosnian and German locales for formatting
registerLocaleData(localeBs);
registerLocaleData(localeDe, 'de');

/**
 * Initialize authentication state on app startup
 */
function initializeAuth(authService: AuthService) {
  return () => {
    authService.initializeAuth();
    return Promise.resolve();
  };
}

/**
 * Initialize translations on app startup
 */
function initializeTranslations(translate: TranslateService) {
  return () => {
    translate.addLangs(['en', 'bs']);
    translate.setDefaultLang('en');
    const savedLang = localStorage.getItem('pharma_language') || 'en';
    return translate.use(savedLang).toPromise();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Set default locale to German for number formatting (1.234,56)
    { provide: LOCALE_ID, useValue: 'de' },

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
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const translate = inject(TranslateService);
        return initializeTranslations(translate);
      },
      multi: true
    }
  ]
};
