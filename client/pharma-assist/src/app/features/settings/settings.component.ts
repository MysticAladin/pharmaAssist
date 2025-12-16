import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../core/services/translation.service';

interface NotificationSettings {
  // Email Settings
  emailNotifications: boolean;
  orderAlerts: boolean;
  lowStockAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  // Push Notifications
  pushNotifications: boolean;
  // Alert Types
  expiryAlerts: boolean;
  expiryAlertDays: number;
  prescriptionAlerts: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <h1 class="page-title">{{ 'settings.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'settings.subtitle' | translate }}</p>
      </div>

      <div class="settings-layout">
        <!-- Sidebar Navigation -->
        <nav class="settings-nav">
          <button class="nav-item" [class.active]="activeSection() === 'general'"
                  (click)="activeSection.set('general')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            {{ 'settings.tabs.general' | translate }}
          </button>
          <button class="nav-item" [class.active]="activeSection() === 'appearance'"
                  (click)="activeSection.set('appearance')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            {{ 'settings.tabs.appearance' | translate }}
          </button>
          <button class="nav-item" [class.active]="activeSection() === 'notifications'"
                  (click)="activeSection.set('notifications')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {{ 'settings.tabs.notifications' | translate }}
          </button>
          <button class="nav-item" [class.active]="activeSection() === 'regional'"
                  (click)="activeSection.set('regional')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {{ 'settings.tabs.regional' | translate }}
          </button>
          <button class="nav-item" [class.active]="activeSection() === 'privacy'"
                  (click)="activeSection.set('privacy')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {{ 'settings.tabs.privacy' | translate }}
          </button>
        </nav>

        <!-- Content Area -->
        <div class="settings-content">
          <!-- General Settings -->
          @if (activeSection() === 'general') {
            <div class="settings-section">
              <h2 class="section-title">{{ 'settings.generalSettings' | translate }}</h2>
              <p class="section-desc">{{ 'settings.generalDesc' | translate }}</p>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.companyName' | translate }}</h3>
                    <p>{{ 'settings.companyNameDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <input type="text" class="input" [(ngModel)]="companyName"
                           [placeholder]="'settings.companyNamePlaceholder' | translate">
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.defaultCurrency' | translate }}</h3>
                    <p>{{ 'settings.defaultCurrencyDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <select class="select" [(ngModel)]="currency">
                      <option value="BAM">BAM - Konvertibilna marka</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="USD">USD - US Dollar</option>
                    </select>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.taxRate' | translate }}</h3>
                    <p>{{ 'settings.taxRateDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <div class="input-group">
                      <input type="number" class="input" [(ngModel)]="taxRate" min="0" max="100">
                      <span class="input-suffix">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Appearance Settings -->
          @if (activeSection() === 'appearance') {
            <div class="settings-section">
              <h2 class="section-title">{{ 'settings.appearanceSettings' | translate }}</h2>
              <p class="section-desc">{{ 'settings.appearanceDesc' | translate }}</p>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.theme' | translate }}</h3>
                    <p>{{ 'settings.themeDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <div class="theme-options">
                      <button class="theme-btn" [class.active]="currentTheme === 'light'" (click)="setTheme('light')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        {{ 'settings.lightTheme' | translate }}
                      </button>
                      <button class="theme-btn" [class.active]="currentTheme === 'dark'" (click)="setTheme('dark')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        {{ 'settings.darkTheme' | translate }}
                      </button>
                      <button class="theme-btn" [class.active]="currentTheme === 'system'" (click)="setTheme('system')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        {{ 'settings.systemTheme' | translate }}
                      </button>
                    </div>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.compactMode' | translate }}</h3>
                    <p>{{ 'settings.compactModeDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="compactMode">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Notification Settings -->
          @if (activeSection() === 'notifications') {
            <div class="settings-section">
              <h2 class="section-title">{{ 'settings.notificationSettings' | translate }}</h2>
              <p class="section-desc">{{ 'settings.notificationDesc' | translate }}</p>

              <!-- Push Notifications -->
              <div class="settings-group">
                <h4 class="group-title">{{ 'settings.pushNotificationsSection' | translate }}</h4>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.pushNotifications' | translate }}</h3>
                    <p>{{ 'settings.pushNotificationsDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.pushNotifications">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Email Notifications -->
              <div class="settings-group">
                <h4 class="group-title">{{ 'settings.emailSection' | translate }}</h4>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.emailNotifications' | translate }}</h3>
                    <p>{{ 'settings.emailNotificationsDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.emailNotifications">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.weeklyDigest' | translate }}</h3>
                    <p>{{ 'settings.weeklyDigestDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.weeklyDigest">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Alert Types -->
              <div class="settings-group">
                <h4 class="group-title">{{ 'settings.alertTypes' | translate }}</h4>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.orderAlerts' | translate }}</h3>
                    <p>{{ 'settings.orderAlertsDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.orderAlerts">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.lowStockAlerts' | translate }}</h3>
                    <p>{{ 'settings.lowStockAlertsDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.lowStockAlerts">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.expiryAlerts' | translate }}</h3>
                    <p>{{ 'settings.expiryAlertsDesc' | translate }}</p>
                  </div>
                  <div class="setting-control horizontal">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.expiryAlerts">
                      <span class="toggle-slider"></span>
                    </label>
                    @if (notifications.expiryAlerts) {
                      <div class="inline-input">
                        <input type="number" class="input small" [(ngModel)]="notifications.expiryAlertDays" min="7" max="180">
                        <span class="input-label">{{ 'settings.daysBeforeExpiry' | translate }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.prescriptionAlerts' | translate }}</h3>
                    <p>{{ 'settings.prescriptionAlertsDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.prescriptionAlerts">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.paymentAlerts' | translate }}</h3>
                    <p>{{ 'settings.paymentAlertsDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.paymentAlerts">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.systemAlerts' | translate }}</h3>
                    <p>{{ 'settings.systemAlertsDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.systemAlerts">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Quiet Hours -->
              <div class="settings-group">
                <h4 class="group-title">{{ 'settings.quietHours' | translate }}</h4>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.quietHoursEnabled' | translate }}</h3>
                    <p>{{ 'settings.quietHoursDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="notifications.quietHoursEnabled">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                @if (notifications.quietHoursEnabled) {
                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>{{ 'settings.quietHoursTime' | translate }}</h3>
                      <p>{{ 'settings.quietHoursTimeDesc' | translate }}</p>
                    </div>
                    <div class="setting-control time-range">
                      <div class="time-input">
                        <label>{{ 'settings.from' | translate }}</label>
                        <input type="time" class="input" [(ngModel)]="notifications.quietHoursStart">
                      </div>
                      <span class="time-separator">–</span>
                      <div class="time-input">
                        <label>{{ 'settings.to' | translate }}</label>
                        <input type="time" class="input" [(ngModel)]="notifications.quietHoursEnd">
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Regional Settings -->
          @if (activeSection() === 'regional') {
            <div class="settings-section">
              <h2 class="section-title">{{ 'settings.regionalSettings' | translate }}</h2>
              <p class="section-desc">{{ 'settings.regionalDesc' | translate }}</p>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.language' | translate }}</h3>
                    <p>{{ 'settings.languageDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <select class="select" [(ngModel)]="currentLanguage" (ngModelChange)="onLanguageChange($event)">
                      <option value="en">English</option>
                      <option value="bs">Bosanski</option>
                    </select>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.dateFormat' | translate }}</h3>
                    <p>{{ 'settings.dateFormatDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <select class="select" [(ngModel)]="dateFormat">
                      <option value="dd.MM.yyyy">DD.MM.YYYY (31.12.2024)</option>
                      <option value="MM/dd/yyyy">MM/DD/YYYY (12/31/2024)</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD (2024-12-31)</option>
                    </select>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.timezone' | translate }}</h3>
                    <p>{{ 'settings.timezoneDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <select class="select" [(ngModel)]="timezone">
                      <option value="Europe/Sarajevo">Europe/Sarajevo (CET)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Privacy Settings -->
          @if (activeSection() === 'privacy') {
            <div class="settings-section">
              <h2 class="section-title">{{ 'settings.privacySettings' | translate }}</h2>
              <p class="section-desc">{{ 'settings.privacyDesc' | translate }}</p>

              <div class="settings-group">
                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.activityLog' | translate }}</h3>
                    <p>{{ 'settings.activityLogDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="activityLogEnabled">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h3>{{ 'settings.dataSharing' | translate }}</h3>
                    <p>{{ 'settings.dataSharingDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="dataSharing">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-item danger">
                  <div class="setting-info">
                    <h3>{{ 'settings.deleteAccount' | translate }}</h3>
                    <p>{{ 'settings.deleteAccountDesc' | translate }}</p>
                  </div>
                  <div class="setting-control">
                    <button class="btn-danger">{{ 'settings.deleteAccountBtn' | translate }}</button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Save Button -->
          <div class="settings-actions">
            <button class="btn-primary" (click)="saveSettings()" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner"></span>
              }
              {{ 'settings.saveChanges' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--c6:#dc2626}
    .settings-page{padding:1.5rem;max-width:1100px;margin:0 auto}
    .page-header{margin-bottom:1.5rem}
    .page-title{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-subtitle{color:var(--c2);margin:0;font-size:.9rem}
    .settings-layout{display:grid;grid-template-columns:240px 1fr;gap:1.5rem;background:#fff;border-radius:12px;border:1px solid var(--c3);overflow:hidden}
    @media(max-width:768px){.settings-layout{grid-template-columns:1fr}}
    .settings-nav{padding:1rem;background:var(--c4);display:flex;flex-direction:column;gap:.25rem}
    @media(max-width:768px){.settings-nav{flex-direction:row;flex-wrap:wrap;border-bottom:1px solid var(--c3)}}
    .nav-item{display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;border:none;background:transparent;color:var(--c2);font-size:.9rem;font-weight:500;border-radius:8px;cursor:pointer;text-align:left;transition:all .2s;width:100%}
    @media(max-width:768px){.nav-item{width:auto;flex:1;min-width:140px;justify-content:center}}
    .nav-item:hover{background:rgba(13,148,136,.1);color:var(--c5)}
    .nav-item.active{background:var(--c5);color:#fff}
    .nav-item svg{width:18px;height:18px;flex-shrink:0}
    .settings-content{padding:1.5rem}
    .settings-section{margin-bottom:2rem}
    .section-title{font-size:1.125rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .section-desc{color:var(--c2);margin:0 0 1.5rem;font-size:.875rem}
    .settings-group{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem}
    .group-title{font-size:.8rem;font-weight:600;color:var(--c5);text-transform:uppercase;letter-spacing:.5px;margin:0 0 .5rem;padding-bottom:.5rem;border-bottom:1px solid var(--c3)}
    .setting-item{display:flex;justify-content:space-between;align-items:flex-start;padding:1rem;background:var(--c4);border-radius:10px;gap:1rem}
    @media(max-width:600px){.setting-item{flex-direction:column}}
    .setting-item.danger{background:#fef2f2;border:1px solid #fecaca}
    .setting-info{flex:1}
    .setting-info h3{font-size:.9rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .setting-info p{font-size:.8rem;color:var(--c2);margin:0}
    .setting-item.danger .setting-info h3{color:var(--c6)}
    .setting-control{flex-shrink:0;min-width:200px}
    .setting-control.horizontal{display:flex;align-items:center;gap:1rem}
    .setting-control.time-range{display:flex;align-items:center;gap:.5rem}
    @media(max-width:600px){.setting-control{min-width:100%;width:100%}}
    .input,.select{width:100%;padding:.625rem .875rem;border:1px solid var(--c3);border-radius:8px;font-size:.875rem;transition:border-color .2s}
    .input.small{width:70px;text-align:center}
    .input:focus,.select:focus{outline:none;border-color:var(--c5)}
    .input-group{display:flex;align-items:center}
    .input-group .input{border-radius:8px 0 0 8px;text-align:right}
    .input-suffix{padding:.625rem .875rem;background:var(--c4);border:1px solid var(--c3);border-left:none;border-radius:0 8px 8px 0;color:var(--c2);font-size:.875rem}
    .inline-input{display:flex;align-items:center;gap:.5rem}
    .inline-input .input-label{font-size:.8rem;color:var(--c2)}
    .time-input{display:flex;flex-direction:column;gap:.25rem}
    .time-input label{font-size:.75rem;color:var(--c2)}
    .time-input .input{width:100px}
    .time-separator{color:var(--c2);font-weight:600}
    .theme-options{display:flex;gap:.5rem;flex-wrap:wrap}
    .theme-btn{display:flex;align-items:center;gap:.5rem;padding:.625rem 1rem;border:1px solid var(--c3);background:#fff;border-radius:8px;cursor:pointer;font-size:.8rem;color:var(--c2);transition:all .2s}
    .theme-btn:hover{border-color:var(--c5);color:var(--c5)}
    .theme-btn.active{border-color:var(--c5);background:rgba(13,148,136,.1);color:var(--c5)}
    .toggle{position:relative;display:inline-block;width:44px;height:24px}
    .toggle input{opacity:0;width:0;height:0}
    .toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--c3);transition:.3s;border-radius:24px}
    .toggle-slider:before{position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background:#fff;transition:.3s;border-radius:50%}
    .toggle input:checked+.toggle-slider{background:var(--c5)}
    .toggle input:checked+.toggle-slider:before{transform:translateX(20px)}
    .btn-primary{display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.75rem 1.5rem;background:var(--c5);color:#fff;border:none;border-radius:8px;font-size:.9rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-primary:hover:not(:disabled){background:#088888}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-danger{padding:.5rem 1rem;background:var(--c6);color:#fff;border:none;border-radius:6px;font-size:.8rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-danger:hover{background:#b91c1c}
    .settings-actions{margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--c3);display:flex;justify-content:flex-end}
    .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  `]
})
export class SettingsComponent implements OnInit {
  private readonly translationService = inject(TranslationService);

  activeSection = signal<'general' | 'appearance' | 'notifications' | 'regional' | 'privacy'>('general');
  saving = signal(false);

  // General settings
  companyName = 'PharmaAssist';
  currency = 'BAM';
  taxRate = 17;

  // Appearance settings
  currentTheme = 'light';
  compactMode = false;

  // Notification settings
  notifications: NotificationSettings = {
    // Email Settings
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
    // Push Notifications
    pushNotifications: true,
    // Alert Types
    expiryAlerts: true,
    expiryAlertDays: 30,
    prescriptionAlerts: true,
    paymentAlerts: true,
    systemAlerts: true,
    // Quiet Hours
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  };

  // Regional settings
  currentLanguage = 'bs';
  dateFormat = 'dd.MM.yyyy';
  timezone = 'Europe/Sarajevo';

  // Privacy settings
  activityLogEnabled = true;
  dataSharing = false;

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    // Load current language
    this.currentLanguage = this.translationService.currentLanguage();

    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.currentTheme = savedTheme;

    // Load other settings from localStorage or API
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.companyName = settings.companyName || this.companyName;
        this.currency = settings.currency || this.currency;
        this.taxRate = settings.taxRate || this.taxRate;
        this.compactMode = settings.compactMode || false;
        this.notifications = { ...this.notifications, ...settings.notifications };
        this.dateFormat = settings.dateFormat || this.dateFormat;
        this.timezone = settings.timezone || this.timezone;
        this.activityLogEnabled = settings.activityLogEnabled ?? true;
        this.dataSharing = settings.dataSharing ?? false;
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }

  setTheme(theme: string): void {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }

  onLanguageChange(language: string): void {
    this.translationService.setLanguage(language as 'en' | 'bs');
  }

  saveSettings(): void {
    this.saving.set(true);

    const settings = {
      companyName: this.companyName,
      currency: this.currency,
      taxRate: this.taxRate,
      compactMode: this.compactMode,
      notifications: this.notifications,
      dateFormat: this.dateFormat,
      timezone: this.timezone,
      activityLogEnabled: this.activityLogEnabled,
      dataSharing: this.dataSharing
    };

    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));

    // Simulate API save
    setTimeout(() => {
      this.saving.set(false);
    }, 800);
  }
}
