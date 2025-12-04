import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DbFeatureFlagService } from '../../../core/services/db-feature-flag.service';
import {
  SystemFeatureFlag,
  ClientFeatureFlag,
  FlagCategory,
  FlagType,
  FlagScope,
  SYSTEM_FLAGS
} from '../../../core/models/feature-flag.model';

@Component({
  selector: 'app-feature-flags',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './feature-flags.component.html',
  styleUrl: './feature-flags.component.scss'
})
export class FeatureFlagsComponent implements OnInit {
  private readonly featureFlagService = inject(DbFeatureFlagService);
  private readonly fb = inject(FormBuilder);

  // State
  readonly loading = this.featureFlagService.loading;
  readonly error = this.featureFlagService.error;
  readonly systemFlags = this.featureFlagService.systemFlags;
  readonly flagsByCategory = this.featureFlagService.flagsByCategory;

  // UI State
  readonly activeTab = signal<'system' | 'client'>('system');
  readonly selectedCategory = signal<FlagCategory | 'all'>('all');
  readonly searchQuery = signal('');
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showClientModal = signal(false);
  readonly selectedFlag = signal<SystemFeatureFlag | null>(null);
  readonly selectedClientId = signal<string>('');
  readonly clientFlags = signal<ClientFeatureFlag[]>([]);
  readonly clientsWithOverrides = signal<{ id: string; name: string; overrideCount: number }[]>([]);

  // Enums for template
  readonly FlagCategory = FlagCategory;
  readonly FlagType = FlagType;
  readonly FlagScope = FlagScope;
  readonly categories = Object.values(FlagCategory);
  readonly types = Object.values(FlagType);

  // Forms
  flagForm!: FormGroup;
  clientFlagForm!: FormGroup;

  // Filtered flags
  readonly filteredFlags = computed(() => {
    const flags = this.systemFlags();
    const category = this.selectedCategory();
    const search = this.searchQuery().toLowerCase();

    return flags.filter(flag => {
      const matchesCategory = category === 'all' || flag.category === category;
      const matchesSearch = !search ||
        flag.key.toLowerCase().includes(search) ||
        flag.name.toLowerCase().includes(search) ||
        flag.description.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  });

  // Stats
  readonly stats = computed(() => {
    const flags = this.systemFlags();
    return {
      total: flags.length,
      enabled: flags.filter(f => f.enabled).length,
      disabled: flags.filter(f => !f.enabled).length,
      clientOverridable: flags.filter(f => f.allowClientOverride).length
    };
  });

  ngOnInit(): void {
    this.initForms();
    this.featureFlagService.loadFlags().subscribe();
  }

  private initForms(): void {
    this.flagForm = this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/^[a-z]+\.[a-z_]+$/)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      category: [FlagCategory.Portal, [Validators.required]],
      type: [FlagType.Boolean, [Validators.required]],
      defaultValue: [true],
      enabled: [true],
      allowClientOverride: [true]
    });

    this.clientFlagForm = this.fb.group({
      clientId: ['', [Validators.required]],
      flagKey: [''],
      value: [true],
      enabled: [true],
      overrideReason: ['']
    });
  }

  // Tab Management
  setActiveTab(tab: 'system' | 'client'): void {
    this.activeTab.set(tab);
    if (tab === 'client') {
      this.loadClientsWithOverrides();
    }
  }

  // Category Filter
  setCategory(category: FlagCategory | 'all'): void {
    this.selectedCategory.set(category);
  }

  // Search
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  // Toggle Flag
  toggleFlag(flag: SystemFeatureFlag): void {
    this.featureFlagService.toggleSystemFlag(flag.key).subscribe({
      next: () => {
        // Flag will be updated via refresh
      },
      error: (err) => {
        console.error('Failed to toggle flag:', err);
      }
    });
  }

  // Create Flag
  openCreateModal(): void {
    this.flagForm.reset({
      category: FlagCategory.Portal,
      type: FlagType.Boolean,
      defaultValue: true,
      enabled: true,
      allowClientOverride: true
    });
    this.showCreateModal.set(true);
  }

  createFlag(): void {
    if (this.flagForm.invalid) return;

    const formValue = this.flagForm.value;
    this.featureFlagService.createSystemFlag({
      key: formValue.key,
      name: formValue.name,
      description: formValue.description,
      category: formValue.category,
      type: formValue.type,
      defaultValue: formValue.defaultValue,
      enabled: formValue.enabled,
      allowClientOverride: formValue.allowClientOverride
    }).subscribe({
      next: () => {
        this.showCreateModal.set(false);
      },
      error: (err) => {
        console.error('Failed to create flag:', err);
      }
    });
  }

  // Edit Flag
  openEditModal(flag: SystemFeatureFlag): void {
    this.selectedFlag.set(flag);
    this.flagForm.patchValue({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      category: flag.category,
      type: flag.type,
      defaultValue: flag.defaultValue,
      enabled: flag.enabled,
      allowClientOverride: flag.allowClientOverride
    });
    this.showEditModal.set(true);
  }

  updateFlag(): void {
    if (this.flagForm.invalid || !this.selectedFlag()) return;

    const formValue = this.flagForm.value;
    this.featureFlagService.updateSystemFlag(this.selectedFlag()!.key, {
      name: formValue.name,
      description: formValue.description,
      category: formValue.category,
      type: formValue.type,
      defaultValue: formValue.defaultValue,
      enabled: formValue.enabled,
      allowClientOverride: formValue.allowClientOverride
    }).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.selectedFlag.set(null);
      },
      error: (err) => {
        console.error('Failed to update flag:', err);
      }
    });
  }

  // Delete Flag
  deleteFlag(flag: SystemFeatureFlag): void {
    if (!confirm(`Are you sure you want to delete the flag "${flag.name}"? This action cannot be undone.`)) {
      return;
    }

    this.featureFlagService.deleteSystemFlag(flag.key).subscribe({
      error: (err) => {
        console.error('Failed to delete flag:', err);
      }
    });
  }

  // Client Overrides
  loadClientsWithOverrides(): void {
    // In a real app, this would call an API
    // For now, we'll simulate with mock data
    this.clientsWithOverrides.set([
      { id: 'client-1', name: 'Apoteka Sarajevo', overrideCount: 3 },
      { id: 'client-2', name: 'Apoteka Mostar', overrideCount: 1 },
      { id: 'client-3', name: 'Apoteka Banja Luka', overrideCount: 5 }
    ]);
  }

  selectClient(clientId: string): void {
    this.selectedClientId.set(clientId);
    this.featureFlagService.getClientFlags(clientId).subscribe({
      next: (flags) => {
        this.clientFlags.set(flags);
      },
      error: (err) => {
        console.error('Failed to load client flags:', err);
      }
    });
  }

  openClientOverrideModal(flag: SystemFeatureFlag): void {
    this.selectedFlag.set(flag);
    this.clientFlagForm.patchValue({
      flagKey: flag.key,
      value: flag.currentValue,
      enabled: flag.enabled
    });
    this.showClientModal.set(true);
  }

  saveClientOverride(): void {
    if (this.clientFlagForm.invalid) return;

    const formValue = this.clientFlagForm.value;
    this.featureFlagService.setClientFlag(formValue.clientId, {
      clientId: formValue.clientId,
      flagKey: formValue.flagKey,
      value: formValue.value,
      enabled: formValue.enabled,
      overrideReason: formValue.overrideReason
    }).subscribe({
      next: () => {
        this.showClientModal.set(false);
      },
      error: (err) => {
        console.error('Failed to save client override:', err);
      }
    });
  }

  removeClientOverride(clientId: string, flagKey: string): void {
    if (!confirm('Remove this client override? The flag will revert to the system default.')) {
      return;
    }

    this.featureFlagService.deleteClientFlag(clientId, flagKey).subscribe({
      next: () => {
        this.selectClient(clientId); // Refresh
      },
      error: (err) => {
        console.error('Failed to remove client override:', err);
      }
    });
  }

  // Close Modals
  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showClientModal.set(false);
    this.selectedFlag.set(null);
  }

  // Export/Import
  exportFlags(): void {
    this.featureFlagService.exportFlags().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feature-flags-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to export flags:', err);
      }
    });
  }

  importFlags(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.featureFlagService.importFlags(file).subscribe({
      next: (result) => {
        alert(`Imported ${result.imported} flags.${result.errors.length ? '\nErrors: ' + result.errors.join(', ') : ''}`);
      },
      error: (err) => {
        console.error('Failed to import flags:', err);
      }
    });
  }

  // Helpers
  getCategoryIcon(category: FlagCategory): string {
    const icons: Record<FlagCategory, string> = {
      [FlagCategory.Portal]: 'storefront',
      [FlagCategory.Billing]: 'receipt',
      [FlagCategory.Inventory]: 'inventory_2',
      [FlagCategory.Orders]: 'shopping_cart',
      [FlagCategory.Reports]: 'analytics',
      [FlagCategory.Integration]: 'cable',
      [FlagCategory.UI]: 'palette',
      [FlagCategory.Experimental]: 'science'
    };
    return icons[category] || 'flag';
  }

  getCategoryColor(category: FlagCategory): string {
    const colors: Record<FlagCategory, string> = {
      [FlagCategory.Portal]: '#4CAF50',
      [FlagCategory.Billing]: '#2196F3',
      [FlagCategory.Inventory]: '#FF9800',
      [FlagCategory.Orders]: '#9C27B0',
      [FlagCategory.Reports]: '#00BCD4',
      [FlagCategory.Integration]: '#607D8B',
      [FlagCategory.UI]: '#E91E63',
      [FlagCategory.Experimental]: '#F44336'
    };
    return colors[category] || '#757575';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
