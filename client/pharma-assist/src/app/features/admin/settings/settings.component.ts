import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DbFeatureFlagService } from '../../../core/services/db-feature-flag.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { EvaluatedFlag, FlagCategory, SystemFlagKey, SYSTEM_FLAGS } from '../../../core/models/feature-flag.model';

interface ConfigurableFlag {
  key: string;
  name: string;
  description: string;
  category: FlagCategory;
  systemEnabled: boolean;
  clientEnabled: boolean;
  hasOverride: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <h1>
          <span class="material-symbols-rounded">settings</span>
          {{ 'settings.title' | translate }}
        </h1>
        <p class="subtitle">{{ 'settings.subtitle' | translate }}</p>
      </header>

      <!-- Settings Tabs -->
      <div class="settings-tabs">
        <button
          class="tab"
          [class.active]="activeTab() === 'general'"
          (click)="setActiveTab('general')">
          <span class="material-symbols-rounded">tune</span>
          {{ 'settings.tabs.general' | translate }}
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'features'"
          (click)="setActiveTab('features')">
          <span class="material-symbols-rounded">toggle_on</span>
          {{ 'settings.tabs.features' | translate }}
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'notifications'"
          (click)="setActiveTab('notifications')">
          <span class="material-symbols-rounded">notifications</span>
          {{ 'settings.tabs.notifications' | translate }}
        </button>
      </div>

      <!-- General Settings Tab -->
      @if (activeTab() === 'general') {
        <div class="settings-section">
          <h2>{{ 'settings.general.title' | translate }}</h2>
          <p class="section-description">{{ 'settings.general.description' | translate }}</p>

          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">{{ 'settings.general.companyName' | translate }}</span>
                <span class="setting-description">{{ 'settings.general.companyNameDesc' | translate }}</span>
              </div>
              <input type="text" class="form-input" placeholder="Company name...">
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">{{ 'settings.general.timezone' | translate }}</span>
                <span class="setting-description">{{ 'settings.general.timezoneDesc' | translate }}</span>
              </div>
              <select class="form-select">
                <option value="Europe/Sarajevo">Europe/Sarajevo (CET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>
        </div>
      }

      <!-- Feature Flags Tab (Client Admin) -->
      @if (activeTab() === 'features') {
        <div class="settings-section">
          <h2>{{ 'settings.features.title' | translate }}</h2>
          <p class="section-description">{{ 'settings.features.description' | translate }}</p>

          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>{{ 'common.loading' | translate }}</p>
            </div>
          } @else if (configurableFlags().length === 0) {
            <div class="empty-state">
              <span class="material-symbols-rounded">toggle_off</span>
              <h3>{{ 'settings.features.empty.title' | translate }}</h3>
              <p>{{ 'settings.features.empty.description' | translate }}</p>
            </div>
          } @else {
            <!-- Group by category -->
            @for (category of flagCategories(); track category) {
              <div class="feature-category">
                <h3 class="category-title">
                  <span class="material-symbols-rounded">{{ getCategoryIcon(category) }}</span>
                  {{ getCategoryName(category) }}
                </h3>

                <div class="settings-card">
                  @for (flag of getFlagsByCategory(category); track flag.key) {
                    <div class="setting-item feature-toggle">
                      <div class="setting-info">
                        <span class="setting-label">
                          {{ flag.name }}
                          @if (flag.hasOverride) {
                            <span class="override-badge">{{ 'settings.features.customized' | translate }}</span>
                          }
                        </span>
                        <span class="setting-description">{{ flag.description }}</span>
                        @if (!flag.systemEnabled) {
                          <span class="system-disabled-notice">
                            <span class="material-symbols-rounded">info</span>
                            {{ 'settings.features.systemDisabled' | translate }}
                          </span>
                        }
                      </div>
                      <label class="toggle-switch" [class.disabled]="!flag.systemEnabled">
                        <input
                          type="checkbox"
                          [checked]="flag.clientEnabled"
                          [disabled]="!flag.systemEnabled"
                          (change)="toggleFlag(flag)">
                        <span class="slider"></span>
                      </label>
                    </div>
                  }
                </div>
              </div>
            }

            @if (hasChanges()) {
              <div class="save-bar">
                <span>{{ 'settings.features.unsavedChanges' | translate }}</span>
                <div class="save-actions">
                  <button class="btn btn-secondary" (click)="discardChanges()">
                    {{ 'common.cancel' | translate }}
                  </button>
                  <button class="btn btn-primary" (click)="saveChanges()" [disabled]="saving()">
                    @if (saving()) {
                      <span class="spinner-sm"></span>
                    }
                    {{ 'common.save' | translate }}
                  </button>
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- Notifications Tab -->
      @if (activeTab() === 'notifications') {
        <div class="settings-section">
          <h2>{{ 'settings.notifications.title' | translate }}</h2>
          <p class="section-description">{{ 'settings.notifications.description' | translate }}</p>

          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">{{ 'settings.notifications.orderUpdates' | translate }}</span>
                <span class="setting-description">{{ 'settings.notifications.orderUpdatesDesc' | translate }}</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">{{ 'settings.notifications.lowStock' | translate }}</span>
                <span class="setting-description">{{ 'settings.notifications.lowStockDesc' | translate }}</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">{{ 'settings.notifications.expiry' | translate }}</span>
                <span class="setting-description">{{ 'settings.notifications.expiryDesc' | translate }}</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-page {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;

        .material-symbols-rounded {
          color: var(--primary-color);
        }
      }

      .subtitle {
        color: var(--text-secondary);
        margin: 0.25rem 0 0;
      }
    }

    .settings-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid #d1d5db;
      padding-bottom: 0;

      .tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
        color: #64748b;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        .material-symbols-rounded {
          font-size: 20px;
        }

        &:hover {
          color: #0aaaaa;
          background: rgba(10, 170, 170, 0.05);
        }

        &.active {
          color: #0aaaaa;
          border-bottom-color: #0aaaaa;
          background: transparent;
        }
      }
    }

    .settings-section {
      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.5rem;
      }

      .section-description {
        color: var(--text-secondary);
        margin: 0 0 1.5rem;
        font-size: 0.875rem;
      }
    }

    .settings-card {
      background: var(--card-bg, white);
      border-radius: 12px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      gap: 1rem;

      &:last-child {
        border-bottom: none;
      }

      .setting-info {
        flex: 1;
        min-width: 0;

        .setting-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .setting-description {
          display: block;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .system-disabled-notice {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--warning-color);
          margin-top: 0.5rem;

          .material-symbols-rounded {
            font-size: 1rem;
          }
        }
      }
    }

    .override-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      background: var(--primary-light);
      color: var(--primary-color);
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .feature-category {
      margin-bottom: 1.5rem;

      .category-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.75rem;

        .material-symbols-rounded {
          font-size: 1.125rem;
        }
      }
    }

    .form-input,
    .form-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: var(--text-primary);
      font-size: 0.875rem;
      min-width: 200px;

      &:focus {
        outline: none;
        border-color: #0aaaaa;
        box-shadow: 0 0 0 3px rgba(10, 170, 170, 0.15);
      }
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
      flex-shrink: 0;

      input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #cbd5e1;
        border-radius: 26px;
        transition: 0.3s;
        border: 1px solid #9ca3af;

        &::before {
          content: '';
          position: absolute;
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
      }

      input:checked + .slider {
        background-color: #0aaaaa;
        border-color: #088888;
      }

      input:checked + .slider::before {
        transform: translateX(22px);
      }

      input:focus + .slider {
        box-shadow: 0 0 0 3px rgba(10, 170, 170, 0.2);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;

        .slider {
          cursor: not-allowed;
        }
      }
    }

    .save-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: var(--card-bg);
      border-top: 1px solid var(--border-color);
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
      z-index: 100;

      span {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .save-actions {
        display: flex;
        gap: 0.75rem;
      }
    }

    .loading-state,
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);

      .material-symbols-rounded {
        font-size: 3rem;
        opacity: 0.5;
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0;
        color: var(--text-primary);
      }

      p {
        margin: 0.5rem 0 0;
      }
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &.btn-primary {
        background: var(--primary-color);
        color: white;
        border: none;

        &:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.btn-secondary {
        background: transparent;
        color: var(--text-primary);
        border: 1px solid var(--border-color);

        &:hover {
          background: var(--bg-hover);
        }
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly featureFlagService = inject(DbFeatureFlagService);
  private readonly authState = inject(AuthStateService);

  // Category mapping for numeric enum values from backend
  private readonly categoryMap: Record<number | string, string> = {
    1: 'Portal',
    2: 'Billing',
    3: 'Inventory',
    4: 'Orders',
    5: 'Reports',
    6: 'Integration',
    7: 'UI',
    8: 'Experimental',
    'portal': 'Portal',
    'billing': 'Billing',
    'inventory': 'Inventory',
    'orders': 'Orders',
    'reports': 'Reports',
    'integration': 'Integration',
    'ui': 'UI',
    'experimental': 'Experimental'
  };

  // State
  readonly activeTab = signal<'general' | 'features' | 'notifications'>('general');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly configurableFlags = signal<ConfigurableFlag[]>([]);
  readonly pendingChanges = signal<Map<string, boolean>>(new Map());

  // Computed
  readonly flagCategories = computed(() => {
    const categories = new Set<FlagCategory>();
    this.configurableFlags().forEach(f => categories.add(f.category));
    return Array.from(categories);
  });

  readonly hasChanges = computed(() => this.pendingChanges().size > 0);

  ngOnInit(): void {
    // Load configurable flags when features tab is shown
  }

  setActiveTab(tab: 'general' | 'features' | 'notifications'): void {
    this.activeTab.set(tab);
    if (tab === 'features') {
      this.loadConfigurableFlags();
    }
  }

  loadConfigurableFlags(): void {
    this.loading.set(true);

    // Get flags that allow client override
    this.featureFlagService.loadFlags().subscribe({
      next: (data) => {
        const systemFlags = data.system;
        const clientFlags = data.client;

        const configurable: ConfigurableFlag[] = systemFlags
          .filter(f => f.allowClientOverride)
          .map(sysFlag => {
            const clientOverride = clientFlags.find(c => c.flagKey === sysFlag.key || c.systemFlagId === sysFlag.id);
            return {
              key: sysFlag.key,
              name: sysFlag.name,
              description: sysFlag.description,
              category: sysFlag.category,
              systemEnabled: sysFlag.enabled,
              clientEnabled: clientOverride ? clientOverride.enabled : sysFlag.enabled,
              hasOverride: !!clientOverride
            };
          });

        this.configurableFlags.set(configurable);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load configurable flags:', err);
        this.loading.set(false);
      }
    });
  }

  getFlagsByCategory(category: FlagCategory): ConfigurableFlag[] {
    return this.configurableFlags().filter(f => f.category === category);
  }

  getCategoryName(category: FlagCategory | number | string): string {
    return this.categoryMap[category as keyof typeof this.categoryMap] || String(category);
  }

  toggleFlag(flag: ConfigurableFlag): void {
    const pending = this.pendingChanges();
    const newValue = !flag.clientEnabled;

    // Update the flag in the list
    const flags = this.configurableFlags();
    const index = flags.findIndex(f => f.key === flag.key);
    if (index >= 0) {
      flags[index] = { ...flags[index], clientEnabled: newValue, hasOverride: true };
      this.configurableFlags.set([...flags]);
    }

    // Track the change
    pending.set(flag.key, newValue);
    this.pendingChanges.set(new Map(pending));
  }

  discardChanges(): void {
    this.pendingChanges.set(new Map());
    this.loadConfigurableFlags();
  }

  saveChanges(): void {
    const changes = this.pendingChanges();
    if (changes.size === 0) return;

    this.saving.set(true);
    const user = this.authState.currentUser();
    const customerId = (user as any)?.customerId;

    if (!customerId) {
      console.error('No customer ID available');
      this.saving.set(false);
      return;
    }

    let completed = 0;
    const total = changes.size;

    changes.forEach((enabled, flagKey) => {
      const flag = this.configurableFlags().find(f => f.key === flagKey);
      if (!flag) return;

      // Find the system flag ID
      this.featureFlagService.getSystemFlag(flagKey).subscribe({
        next: (systemFlag) => {
          if (!systemFlag) return;

          this.featureFlagService.setClientFlag({
            customerId: parseInt(customerId, 10),
            systemFlagId: parseInt(systemFlag.id, 10),
            value: String(enabled),
            isEnabled: enabled,
            reason: 'Updated from client settings'
          }).subscribe({
            next: () => {
              completed++;
              if (completed === total) {
                this.pendingChanges.set(new Map());
                this.saving.set(false);
                this.loadConfigurableFlags();
              }
            },
            error: (err) => {
              console.error('Failed to save flag:', err);
              completed++;
              if (completed === total) {
                this.saving.set(false);
              }
            }
          });
        }
      });
    });
  }

  getCategoryIcon(category: FlagCategory | number | string): string {
    const icons: Record<string | number, string> = {
      [FlagCategory.Portal]: 'storefront',
      [FlagCategory.Billing]: 'receipt',
      [FlagCategory.Inventory]: 'inventory_2',
      [FlagCategory.Orders]: 'shopping_cart',
      [FlagCategory.Reports]: 'analytics',
      [FlagCategory.Integration]: 'cable',
      [FlagCategory.UI]: 'palette',
      [FlagCategory.Experimental]: 'science',
      // Numeric mappings for backend enum values
      1: 'storefront',      // Portal
      2: 'receipt',         // Billing
      3: 'inventory_2',     // Inventory
      4: 'shopping_cart',   // Orders
      5: 'analytics',       // Reports
      6: 'cable',           // Integration
      7: 'palette',         // UI
      8: 'science'          // Experimental
    };
    return icons[category] || 'flag';
  }
}
