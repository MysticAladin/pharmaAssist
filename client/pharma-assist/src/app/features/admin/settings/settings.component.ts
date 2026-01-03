import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DbFeatureFlagService } from '../../../core/services/db-feature-flag.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { EvaluatedFlag, FlagCategory, SystemFlagKey, SYSTEM_FLAGS } from '../../../core/models/feature-flag.model';
import { NotificationSettingsService } from '../../../core/services/notification-settings.service';

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
  templateUrl: './settings-component/settings.component.html',
  styleUrls: ['./settings-component/settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private readonly featureFlagService = inject(DbFeatureFlagService);
  private readonly authState = inject(AuthStateService);
  private readonly notificationSettingsService = inject(NotificationSettingsService);

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

  // Internal order notification recipients
  readonly recipientsLoading = signal(false);
  readonly recipientsSaving = signal(false);
  readonly recipientsError = signal<string | null>(null);
  readonly orderPlacedRecipients = signal<string[]>([]);
  readonly orderPlacedRecipientsBaseline = signal<string[]>([]);
  readonly newRecipientEmail = signal('');

  readonly recipientsHasChanges = computed(() => {
    const current = this.normalizeEmails(this.orderPlacedRecipients());
    const baseline = this.normalizeEmails(this.orderPlacedRecipientsBaseline());
    if (current.length !== baseline.length) return true;
    for (let i = 0; i < current.length; i++) {
      if (current[i] !== baseline[i]) return true;
    }
    return false;
  });

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
    if (tab === 'notifications') {
      this.loadOrderPlacedRecipients();
    }
  }

  loadOrderPlacedRecipients(): void {
    if (this.recipientsLoading()) return;
    this.recipientsError.set(null);
    this.recipientsLoading.set(true);

    this.notificationSettingsService.getOrderPlacedInternalRecipients().subscribe({
      next: (emails) => {
        const normalized = this.normalizeEmails(emails ?? []);
        this.orderPlacedRecipients.set(normalized);
        this.orderPlacedRecipientsBaseline.set(normalized);
        this.recipientsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load notification recipients', err);
        this.recipientsError.set('common.error');
        this.recipientsLoading.set(false);
      }
    });
  }

  addOrderPlacedRecipient(): void {
    const email = (this.newRecipientEmail() ?? '').trim();
    if (!email) return;

    const emailLooksValid = /.+@.+\..+/.test(email);
    if (!emailLooksValid) {
      this.recipientsError.set('validation.email');
      return;
    }

    const existing = this.orderPlacedRecipients();
    if (existing.some(e => e.trim().toLowerCase() === email.toLowerCase())) {
      this.newRecipientEmail.set('');
      return;
    }

    this.orderPlacedRecipients.set(this.normalizeEmails([...existing, email]));
    this.newRecipientEmail.set('');
  }

  removeOrderPlacedRecipient(email: string): void {
    this.orderPlacedRecipients.set(this.orderPlacedRecipients().filter(e => e !== email));
  }

  saveOrderPlacedRecipients(): void {
    if (this.recipientsSaving()) return;
    if (!this.recipientsHasChanges()) return;
    this.recipientsError.set(null);
    this.recipientsSaving.set(true);

    this.notificationSettingsService.updateOrderPlacedInternalRecipients(this.orderPlacedRecipients()).subscribe({
      next: (emails) => {
        const normalized = this.normalizeEmails(emails ?? []);
        this.orderPlacedRecipients.set(normalized);
        this.orderPlacedRecipientsBaseline.set(normalized);
        this.recipientsSaving.set(false);
      },
      error: (err) => {
        console.error('Failed to save notification recipients', err);
        this.recipientsError.set('common.error');
        this.recipientsSaving.set(false);
      }
    });
  }

  private normalizeEmails(emails: string[]): string[] {
    const distinct = new Map<string, string>();
    for (const raw of emails ?? []) {
      const trimmed = (raw ?? '').trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (!distinct.has(key)) {
        distinct.set(key, trimmed);
      }
    }
    return Array.from(distinct.values()).sort((a, b) => a.localeCompare(b));
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
