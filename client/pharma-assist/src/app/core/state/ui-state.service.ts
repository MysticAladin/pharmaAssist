import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { INotification } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  // Sidebar state
  private readonly _sidebarCollapsed$ = new BehaviorSubject<boolean>(false);
  private readonly _sidebarMobileOpen$ = new BehaviorSubject<boolean>(false);

  // Loading state
  private readonly _globalLoading$ = new BehaviorSubject<boolean>(false);
  private readonly _loadingCount$ = new BehaviorSubject<number>(0);

  // Notifications
  private readonly _notifications$ = new BehaviorSubject<INotification[]>([]);

  // Dark mode
  private readonly _darkMode$ = new BehaviorSubject<boolean>(false);

  // Language
  private readonly _language$ = new BehaviorSubject<string>('bs'); // Bosnian default

  // Signals for templates
  readonly sidebarCollapsed = signal(false);
  readonly sidebarMobileOpen = signal(false);
  readonly globalLoading = signal(false);
  readonly darkMode = signal(false);
  readonly language = signal('bs');

  // Observables
  readonly sidebarCollapsed$: Observable<boolean> = this._sidebarCollapsed$.asObservable();
  readonly sidebarMobileOpen$: Observable<boolean> = this._sidebarMobileOpen$.asObservable();
  readonly globalLoading$: Observable<boolean> = this._globalLoading$.asObservable();
  readonly notifications$: Observable<INotification[]> = this._notifications$.asObservable();
  readonly darkMode$: Observable<boolean> = this._darkMode$.asObservable();
  readonly language$: Observable<string> = this._language$.asObservable();

  constructor() {
    this.loadPreferences();
  }

  /**
   * Load user preferences from storage
   */
  private loadPreferences(): void {
    const darkMode = localStorage.getItem('pa_dark_mode') === 'true';
    const language = localStorage.getItem('pa_language') ?? 'bs';
    const sidebarCollapsed = localStorage.getItem('pa_sidebar_collapsed') === 'true';

    this._darkMode$.next(darkMode);
    this._language$.next(language);
    this._sidebarCollapsed$.next(sidebarCollapsed);

    this.darkMode.set(darkMode);
    this.language.set(language);
    this.sidebarCollapsed.set(sidebarCollapsed);

    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }

  // Sidebar Methods
  toggleSidebar(): void {
    const collapsed = !this._sidebarCollapsed$.getValue();
    this._sidebarCollapsed$.next(collapsed);
    this.sidebarCollapsed.set(collapsed);
    localStorage.setItem('pa_sidebar_collapsed', String(collapsed));
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed$.next(collapsed);
    this.sidebarCollapsed.set(collapsed);
    localStorage.setItem('pa_sidebar_collapsed', String(collapsed));
  }

  toggleMobileSidebar(): void {
    const open = !this._sidebarMobileOpen$.getValue();
    this._sidebarMobileOpen$.next(open);
    this.sidebarMobileOpen.set(open);
  }

  closeMobileSidebar(): void {
    this._sidebarMobileOpen$.next(false);
    this.sidebarMobileOpen.set(false);
  }

  // Loading Methods
  startLoading(): void {
    const count = this._loadingCount$.getValue() + 1;
    this._loadingCount$.next(count);
    if (count === 1) {
      this._globalLoading$.next(true);
      this.globalLoading.set(true);
    }
  }

  stopLoading(): void {
    const count = Math.max(0, this._loadingCount$.getValue() - 1);
    this._loadingCount$.next(count);
    if (count === 0) {
      this._globalLoading$.next(false);
      this.globalLoading.set(false);
    }
  }

  resetLoading(): void {
    this._loadingCount$.next(0);
    this._globalLoading$.next(false);
    this.globalLoading.set(false);
  }

  // Notification Methods
  showNotification(notification: Omit<INotification, 'id'>): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: INotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true
    };

    const notifications = [...this._notifications$.getValue(), newNotification];
    this._notifications$.next(notifications);

    // Auto-dismiss
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => this.dismissNotification(id), newNotification.duration);
    }

    return id;
  }

  showSuccess(title: string, message?: string): string {
    return this.showNotification({ type: 'success', title, message });
  }

  showError(title: string, message?: string): string {
    return this.showNotification({ type: 'error', title, message, duration: 8000 });
  }

  showWarning(title: string, message?: string): string {
    return this.showNotification({ type: 'warning', title, message });
  }

  showInfo(title: string, message?: string): string {
    return this.showNotification({ type: 'info', title, message });
  }

  dismissNotification(id: string): void {
    const notifications = this._notifications$.getValue().filter(n => n.id !== id);
    this._notifications$.next(notifications);
  }

  clearAllNotifications(): void {
    this._notifications$.next([]);
  }

  // Dark Mode Methods
  toggleDarkMode(): void {
    const darkMode = !this._darkMode$.getValue();
    this.setDarkMode(darkMode);
  }

  setDarkMode(enabled: boolean): void {
    this._darkMode$.next(enabled);
    this.darkMode.set(enabled);
    localStorage.setItem('pa_dark_mode', String(enabled));

    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Language Methods
  setLanguage(lang: string): void {
    this._language$.next(lang);
    this.language.set(lang);
    localStorage.setItem('pa_language', lang);
  }

  getLanguage(): string {
    return this._language$.getValue();
  }
}
