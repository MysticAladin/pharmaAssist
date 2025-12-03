import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PreferencesService } from '../../../core/services/preferences.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-preferences-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="preferences-panel">
      <!-- Appearance Section -->
      <section class="pref-section">
        <h3 class="section-title">
          <span class="section-icon">🎨</span>
          {{ 'preferences.appearance.title' | translate }}
        </h3>

        <div class="pref-group">
          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.appearance.theme' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.appearance.themeDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <div class="theme-selector">
                @for (option of themeOptions; track option.value) {
                  <button
                    class="theme-option"
                    [class.active]="preferencesService.theme() === option.value"
                    (click)="preferencesService.setTheme(option.value)"
                  >
                    <span class="theme-icon">{{ option.icon }}</span>
                    <span class="theme-label">{{ option.label | translate }}</span>
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.appearance.language' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.appearance.languageDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <select
                [ngModel]="preferencesService.language()"
                (ngModelChange)="preferencesService.setLanguage($event)"
              >
                <option value="en">English</option>
                <option value="bs">Bosanski</option>
              </select>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.appearance.fontSize' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.appearance.fontSizeDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <select
                [ngModel]="preferencesService.fontSize()"
                (ngModelChange)="preferencesService.setFontSize($event)"
              >
                <option value="small">{{ 'preferences.fontSize.small' | translate }}</option>
                <option value="medium">{{ 'preferences.fontSize.medium' | translate }}</option>
                <option value="large">{{ 'preferences.fontSize.large' | translate }}</option>
              </select>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.appearance.compactMode' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.appearance.compactModeDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.compactMode()"
                  (ngModelChange)="preferencesService.setCompactMode($event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Notifications Section -->
      <section class="pref-section">
        <h3 class="section-title">
          <span class="section-icon">🔔</span>
          {{ 'preferences.notifications.title' | translate }}
        </h3>

        <div class="pref-group">
          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.notifications.email' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.notifications.emailDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.notificationSettings().emailNotifications"
                  (ngModelChange)="updateNotification('emailNotifications', $event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.notifications.push' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.notifications.pushDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.notificationSettings().pushNotifications"
                  (ngModelChange)="updateNotification('pushNotifications', $event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.notifications.sound' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.notifications.soundDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.notificationSettings().soundEnabled"
                  (ngModelChange)="updateNotification('soundEnabled', $event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="pref-subsection">
            <h4>{{ 'preferences.notifications.categories' | translate }}</h4>
            @for (category of notificationCategories; track category.key) {
              <div class="pref-item compact">
                <div class="pref-info">
                  <label>{{ category.label | translate }}</label>
                </div>
                <div class="pref-control">
                  <label class="toggle small">
                    <input
                      type="checkbox"
                      [ngModel]="preferencesService.notificationSettings().categories[category.key]"
                      (ngModelChange)="preferencesService.toggleNotificationCategory(category.key, $event)"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Table Settings Section -->
      <section class="pref-section">
        <h3 class="section-title">
          <span class="section-icon">📊</span>
          {{ 'preferences.tables.title' | translate }}
        </h3>

        <div class="pref-group">
          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.tables.pageSize' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.tables.pageSizeDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <select
                [ngModel]="preferencesService.tableSettings().defaultPageSize"
                (ngModelChange)="preferencesService.setDefaultPageSize($event)"
              >
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.tables.striped' | translate }}</label>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.tableSettings().striped"
                  (ngModelChange)="updateTable('striped', $event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.tables.compact' | translate }}</label>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.tableSettings().compact"
                  (ngModelChange)="updateTable('compact', $event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Accessibility Section -->
      <section class="pref-section">
        <h3 class="section-title">
          <span class="section-icon">♿</span>
          {{ 'preferences.accessibility.title' | translate }}
        </h3>

        <div class="pref-group">
          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.accessibility.reduceMotion' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.accessibility.reduceMotionDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.accessibilitySettings().reduceMotion"
                  (ngModelChange)="updateAccessibility('reduceMotion', $event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.accessibility.highContrast' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.accessibility.highContrastDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.accessibilitySettings().highContrast"
                  (ngModelChange)="updateAccessibility('highContrast', $event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="pref-item">
            <div class="pref-info">
              <label>{{ 'preferences.accessibility.keyboardNav' | translate }}</label>
              <span class="pref-desc">{{ 'preferences.accessibility.keyboardNavDesc' | translate }}</span>
            </div>
            <div class="pref-control">
              <label class="toggle">
                <input
                  type="checkbox"
                  [ngModel]="preferencesService.accessibilitySettings().keyboardNavigation"
                  (ngModelChange)="updateAccessibility('keyboardNavigation', $event)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <div class="pref-actions">
        <button class="btn btn-secondary" (click)="resetPreferences()">
          {{ 'preferences.reset' | translate }}
        </button>
        <button class="btn btn-secondary" (click)="exportPreferences()">
          {{ 'preferences.export' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .preferences-panel {
      max-width: 800px;
    }

    .pref-section {
      background: var(--bg-primary, white);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 0 1.25rem;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .section-icon {
      font-size: 1.25rem;
    }

    .pref-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .pref-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color, #e5e7eb);

      &:last-child {
        border-bottom: none;
      }

      &.compact {
        padding: 0.5rem 0;
      }
    }

    .pref-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      label {
        font-weight: 500;
        color: var(--text-primary, #111827);
      }
    }

    .pref-desc {
      font-size: 0.8125rem;
      color: var(--text-secondary, #6b7280);
    }

    .pref-control {
      select {
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        background: var(--bg-primary, white);
        font-size: 0.875rem;
        min-width: 120px;
      }
    }

    .theme-selector {
      display: flex;
      gap: 0.5rem;
    }

    .theme-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      background: var(--bg-primary, white);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: var(--primary, #4f46e5);
      }

      &.active {
        border-color: var(--primary, #4f46e5);
        background: var(--primary-light, #eef2ff);
      }
    }

    .theme-icon {
      font-size: 1.5rem;
    }

    .theme-label {
      font-size: 0.75rem;
      color: var(--text-secondary, #6b7280);
    }

    /* Toggle switch */
    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;

      input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      &.small {
        width: 36px;
        height: 20px;

        .toggle-slider::before {
          width: 16px;
          height: 16px;
        }
      }
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: var(--bg-secondary, #e5e7eb);
      border-radius: 24px;
      transition: 0.2s;

      &::before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 2px;
        bottom: 2px;
        background: white;
        border-radius: 50%;
        transition: 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
    }

    input:checked + .toggle-slider {
      background: var(--primary, #4f46e5);
    }

    input:checked + .toggle-slider::before {
      transform: translateX(20px);
    }

    .toggle.small input:checked + .toggle-slider::before {
      transform: translateX(16px);
    }

    .pref-subsection {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color, #e5e7eb);

      h4 {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary, #6b7280);
      }
    }

    .pref-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-secondary {
      background: var(--bg-secondary, #f3f4f6);
      color: var(--text-primary, #111827);
      border: 1px solid var(--border-color, #e5e7eb);

      &:hover {
        background: var(--bg-tertiary, #e5e7eb);
      }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .pref-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .theme-selector {
        width: 100%;
      }

      .theme-option {
        flex: 1;
      }
    }
  `]
})
export class PreferencesPanelComponent {
  readonly preferencesService = inject(PreferencesService);
  private readonly notificationService = inject(NotificationService);

  themeOptions = [
    { value: 'light' as const, icon: '☀️', label: 'preferences.theme.light' },
    { value: 'dark' as const, icon: '🌙', label: 'preferences.theme.dark' },
    { value: 'system' as const, icon: '💻', label: 'preferences.theme.system' }
  ];

  notificationCategories = [
    { key: 'stock' as const, label: 'preferences.notifications.cat.stock' },
    { key: 'orders' as const, label: 'preferences.notifications.cat.orders' },
    { key: 'expiry' as const, label: 'preferences.notifications.cat.expiry' },
    { key: 'prescriptions' as const, label: 'preferences.notifications.cat.prescriptions' },
    { key: 'system' as const, label: 'preferences.notifications.cat.system' }
  ];

  updateNotification(key: string, value: boolean): void {
    this.preferencesService.updateNotificationSettings({ [key]: value });
  }

  updateTable(key: string, value: boolean): void {
    this.preferencesService.updateTableSettings({ [key]: value } as any);
  }

  updateAccessibility(key: string, value: boolean): void {
    this.preferencesService.updateAccessibilitySettings({ [key]: value } as any);
  }

  resetPreferences(): void {
    this.preferencesService.resetToDefaults();
    this.notificationService.success('Preferences reset to defaults');
  }

  exportPreferences(): void {
    const json = this.preferencesService.exportPreferences();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pharma-assist-preferences.json';
    a.click();
    URL.revokeObjectURL(url);
    this.notificationService.success('Preferences exported');
  }
}
