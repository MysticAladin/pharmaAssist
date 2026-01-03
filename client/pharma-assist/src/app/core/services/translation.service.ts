import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'en' | 'bs';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly translate = inject(TranslateService);

  private readonly STORAGE_KEY = 'pa_language';

  readonly supportedLanguages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' }
  ];

  readonly defaultLanguage: SupportedLanguage = 'bs';

  // Signal for reactive language state
  readonly currentLanguage = signal<SupportedLanguage>(this.defaultLanguage);

  constructor() {
    this.initializeTranslation();
  }

  private initializeTranslation(): void {
    // Set available languages
    this.translate.addLangs(this.supportedLanguages.map(l => l.code));

    // Set default language
    this.translate.setDefaultLang(this.defaultLanguage);

    // Get saved language or detect from browser
    const savedLang = this.getSavedLanguage();
    const browserLang = this.translate.getBrowserLang() as SupportedLanguage;

    // Use saved language, or browser language if supported, or default
    const langToUse = savedLang ||
      (this.isLanguageSupported(browserLang) ? browserLang : this.defaultLanguage);

    this.setLanguage(langToUse);
  }

  setLanguage(lang: SupportedLanguage): void {
    if (!this.isLanguageSupported(lang)) {
      console.warn(`Language '${lang}' is not supported, using default`);
      lang = this.defaultLanguage;
    }

    this.translate.use(lang);
    this.currentLanguage.set(lang);
    this.saveLanguage(lang);

    // Update document language attribute
    document.documentElement.lang = lang;
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage();
  }

  getLanguageOption(code: SupportedLanguage): LanguageOption | undefined {
    return this.supportedLanguages.find(l => l.code === code);
  }

  getCurrentLanguageOption(): LanguageOption {
    return this.getLanguageOption(this.currentLanguage()) || this.supportedLanguages[0];
  }

  toggleLanguage(): void {
    const current = this.currentLanguage();
    const next = current === 'en' ? 'bs' : 'en';
    this.setLanguage(next);
  }

  private isLanguageSupported(lang: string): lang is SupportedLanguage {
    return this.supportedLanguages.some(l => l.code === lang);
  }

  private getSavedLanguage(): SupportedLanguage | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.isLanguageSupported(saved)) {
        return saved as SupportedLanguage;
      }
    } catch {
      // localStorage not available
    }
    return null;
  }

  private saveLanguage(lang: SupportedLanguage): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
    } catch {
      // localStorage not available
    }
  }

  // Utility method to get instant translation (synchronous)
  instant(key: string, params?: object): string {
    return this.translate.instant(key, params);
  }

  // Utility method to get translation as Observable
  get(key: string, params?: object) {
    return this.translate.get(key, params);
  }
}
