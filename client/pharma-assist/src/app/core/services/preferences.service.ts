import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import {
  UserPreferences,
  DashboardWidget,
  NotificationPreferences,
  TablePreferences,
  AccessibilityPreferences,
  DEFAULT_PREFERENCES
} from '../models/preferences.model';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);
  private readonly STORAGE_KEY = 'pharma_user_preferences';

  // Full preferences object
  private readonly preferences = signal<UserPreferences>(this.loadPreferences());

  // Derived signals for easy access
  readonly theme = computed(() => this.preferences().theme);
  readonly language = computed(() => this.preferences().language);
  readonly fontSize = computed(() => this.preferences().fontSize);
  readonly compactMode = computed(() => this.preferences().compactMode);
  readonly dashboardLayout = computed(() => this.preferences().dashboardLayout);
  readonly defaultDashboardPeriod = computed(() => this.preferences().defaultDashboardPeriod);
  readonly notificationSettings = computed(() => this.preferences().notificationSettings);
  readonly tableSettings = computed(() => this.preferences().tableSettings);
  readonly accessibilitySettings = computed(() => this.preferences().accessibilitySettings);

  // Computed theme based on system preference
  readonly effectiveTheme = computed(() => {
    const theme = this.theme();
    if (theme === 'system') {
      return this.getSystemTheme();
    }
    return theme;
  });

  readonly isDarkMode = computed(() => this.effectiveTheme() === 'dark');

  constructor() {
    // Apply preferences on init
    this.applyTheme();
    this.applyLanguage();
    this.applyFontSize();
    this.applyAccessibility();

    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme() === 'system') {
          this.applyTheme();
        }
      });
    }

    // Auto-save preferences when they change
    effect(() => {
      const prefs = this.preferences();
      this.savePreferences(prefs);
    });
  }

  // Theme
  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.updatePreference('theme', theme);
    this.applyTheme();
  }

  private applyTheme(): void {
    const theme = this.effectiveTheme();
    const html = this.document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  // Language
  setLanguage(language: 'en' | 'bs'): void {
    this.updatePreference('language', language);
    this.applyLanguage();
  }

  private applyLanguage(): void {
    const lang = this.language();
    this.translate.use(lang);
    this.document.documentElement.lang = lang;
  }

  // Font Size
  setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.updatePreference('fontSize', size);
    this.applyFontSize();
  }

  private applyFontSize(): void {
    const size = this.fontSize();
    const html = this.document.documentElement;
    html.classList.remove('font-small', 'font-medium', 'font-large');
    html.classList.add(`font-${size}`);
  }

  // Compact Mode
  setCompactMode(compact: boolean): void {
    this.updatePreference('compactMode', compact);
    const html = this.document.documentElement;
    if (compact) {
      html.classList.add('compact-mode');
    } else {
      html.classList.remove('compact-mode');
    }
  }

  // Dashboard Layout
  setDashboardLayout(layout: DashboardWidget[]): void {
    this.updatePreference('dashboardLayout', layout);
  }

  toggleDashboardWidget(widgetId: string, enabled: boolean): void {
    const layout = this.dashboardLayout().map(widget =>
      widget.id === widgetId ? { ...widget, enabled } : widget
    );
    this.setDashboardLayout(layout);
  }

  reorderDashboardWidgets(newOrder: string[]): void {
    const layout = this.dashboardLayout().map(widget => ({
      ...widget,
      order: newOrder.indexOf(widget.id) + 1
    }));
    this.setDashboardLayout(layout.sort((a, b) => a.order - b.order));
  }

  setDefaultDashboardPeriod(period: 'today' | 'week' | 'month' | 'year'): void {
    this.updatePreference('defaultDashboardPeriod', period);
  }

  // Notification Settings
  updateNotificationSettings(settings: Partial<NotificationPreferences>): void {
    const current = this.notificationSettings();
    this.updatePreference('notificationSettings', { ...current, ...settings });
  }

  toggleNotificationCategory(category: keyof NotificationPreferences['categories'], enabled: boolean): void {
    const current = this.notificationSettings();
    this.updatePreference('notificationSettings', {
      ...current,
      categories: { ...current.categories, [category]: enabled }
    });
  }

  // Table Settings
  updateTableSettings(settings: Partial<TablePreferences>): void {
    const current = this.tableSettings();
    this.updatePreference('tableSettings', { ...current, ...settings });
  }

  setDefaultPageSize(size: 10 | 25 | 50 | 100): void {
    this.updateTableSettings({ defaultPageSize: size });
  }

  // Accessibility
  updateAccessibilitySettings(settings: Partial<AccessibilityPreferences>): void {
    const current = this.accessibilitySettings();
    this.updatePreference('accessibilitySettings', { ...current, ...settings });
    this.applyAccessibility();
  }

  private applyAccessibility(): void {
    const settings = this.accessibilitySettings();
    const html = this.document.documentElement;

    html.classList.toggle('reduce-motion', settings.reduceMotion);
    html.classList.toggle('high-contrast', settings.highContrast);
    html.classList.toggle('keyboard-nav', settings.keyboardNavigation);
    html.classList.toggle('screen-reader-optimized', settings.screenReaderOptimized);
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.preferences.set({ ...DEFAULT_PREFERENCES });
    this.applyTheme();
    this.applyLanguage();
    this.applyFontSize();
    this.applyAccessibility();
    this.document.documentElement.classList.remove('compact-mode');
  }

  // Export/Import preferences
  exportPreferences(): string {
    return JSON.stringify(this.preferences(), null, 2);
  }

  importPreferences(jsonString: string): boolean {
    try {
      const prefs = JSON.parse(jsonString) as UserPreferences;
      // Validate structure
      if (prefs.theme && prefs.language && prefs.notificationSettings) {
        this.preferences.set(prefs);
        this.applyTheme();
        this.applyLanguage();
        this.applyFontSize();
        this.applyAccessibility();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Private helpers
  private updatePreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    this.preferences.update(prefs => ({ ...prefs, [key]: value }));
  }

  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return { ...DEFAULT_PREFERENCES };
  }

  private savePreferences(prefs: UserPreferences): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage errors
    }
  }
}
