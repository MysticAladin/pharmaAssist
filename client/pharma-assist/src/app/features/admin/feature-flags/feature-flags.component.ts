import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DbFeatureFlagService } from '../../../core/services/db-feature-flag.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import {
  SystemFeatureFlag,
  ClientFeatureFlag,
  FlagCategory,
  FlagType,
  FlagScope,
  SYSTEM_FLAGS
} from '../../../core/models/feature-flag.model';

/** Matrix cell representing a flag state for a client */
interface MatrixCell {
  flagKey: string;
  clientId: number;
  clientName: string;
  systemEnabled: boolean;
  hasOverride: boolean;
  overrideEnabled?: boolean;
  effectiveValue: boolean;
}

/** Row in the matrix representing a client */
interface MatrixRow {
  clientId: number;
  clientName: string;
  cells: Map<string, MatrixCell>;
}

@Component({
  selector: 'app-feature-flags',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './feature-flags.component.html',
  styleUrl: './feature-flags.component.scss'
})
export class FeatureFlagsComponent implements OnInit {
  private readonly featureFlagService = inject(DbFeatureFlagService);
  private readonly authState = inject(AuthStateService);
  private readonly fb = inject(FormBuilder);

  // State
  readonly loading = this.featureFlagService.loading;
  readonly error = this.featureFlagService.error;
  readonly systemFlags = this.featureFlagService.systemFlags;
  readonly flagsByCategory = this.featureFlagService.flagsByCategory;

  // UI State
  readonly activeTab = signal<'system' | 'client' | 'matrix'>('system');
  readonly selectedCategory = signal<FlagCategory | 'all'>('all');
  readonly searchQuery = signal('');
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showClientModal = signal(false);
  readonly selectedFlag = signal<SystemFeatureFlag | null>(null);
  readonly selectedClientId = signal<string>('');
  readonly clientFlags = signal<ClientFeatureFlag[]>([]);
  readonly clientsWithOverrides = signal<{ id: string; name: string; overrideCount: number }[]>([]);

  // Matrix state
  readonly matrixLoading = signal(false);
  readonly matrixRows = signal<MatrixRow[]>([]);
  readonly matrixFlags = signal<SystemFeatureFlag[]>([]);
  readonly pendingChanges = signal<Map<string, { clientId: number; flagKey: string; enabled: boolean }>>(new Map());

  // Permission check
  readonly isSuperAdmin = computed(() => {
    const user = this.authState.currentUser();
    return user?.roles?.includes('SuperAdmin') || (user as any)?.isSuperAdmin === true;
  });

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
  setActiveTab(tab: 'system' | 'client' | 'matrix'): void {
    this.activeTab.set(tab);
    if (tab === 'client') {
      this.loadClientsWithOverrides();
    } else if (tab === 'matrix') {
      this.loadMatrix();
    }
  }

  // Matrix Methods
  loadMatrix(): void {
    if (!this.isSuperAdmin()) {
      return;
    }

    this.matrixLoading.set(true);
    this.pendingChanges.set(new Map());

    // Load all system flags and all client overrides
    // In a real implementation, this would call a dedicated matrix API endpoint
    // For now, we'll simulate with available data
    const flags = this.systemFlags().filter(f => f.allowClientOverride);
    this.matrixFlags.set(flags);

    // Load clients - in real implementation this would come from the API
    // using the new /featureflags/matrix endpoint
    this.featureFlagService.getAllClientOverrides().subscribe({
      next: (overrides: ClientFeatureFlag[]) => {
        const clientMap = new Map<string, MatrixRow>();

        // Get unique clients from overrides
        overrides.forEach(override => {
          if (!clientMap.has(override.customerId)) {
            clientMap.set(override.customerId, {
              clientId: parseInt(override.customerId, 10),
              clientName: override.customerName || `Client ${override.customerId}`,
              cells: new Map()
            });
          }

          const row = clientMap.get(override.customerId)!;
          const systemFlag = flags.find(f => f.key === override.flagKey || f.id === override.systemFlagId);

          if (systemFlag) {
            row.cells.set(override.flagKey, {
              flagKey: override.flagKey,
              clientId: parseInt(override.customerId, 10),
              clientName: override.customerName || '',
              systemEnabled: systemFlag.enabled,
              hasOverride: true,
              overrideEnabled: override.enabled,
              effectiveValue: override.enabled
            });
          }
        });

        // Fill in cells for flags without overrides
        clientMap.forEach(row => {
          flags.forEach(flag => {
            if (!row.cells.has(flag.key)) {
              row.cells.set(flag.key, {
                flagKey: flag.key,
                clientId: row.clientId,
                clientName: row.clientName,
                systemEnabled: flag.enabled,
                hasOverride: false,
                effectiveValue: flag.enabled
              });
            }
          });
        });

        this.matrixRows.set(Array.from(clientMap.values()));
        this.matrixLoading.set(false);
      },
      error: (err: Error) => {
        console.error('Failed to load matrix:', err);
        this.matrixLoading.set(false);
      }
    });
  }

  toggleMatrixCell(row: MatrixRow, flagKey: string): void {
    const cell = row.cells.get(flagKey);
    if (!cell) return;

    const changeKey = `${row.clientId}-${flagKey}`;
    const pending = this.pendingChanges();

    if (pending.has(changeKey)) {
      // Toggle existing pending change or remove it
      const change = pending.get(changeKey)!;
      if (change.enabled === cell.effectiveValue) {
        pending.delete(changeKey);
      } else {
        change.enabled = !change.enabled;
      }
    } else {
      // Add new pending change
      pending.set(changeKey, {
        clientId: row.clientId,
        flagKey,
        enabled: !cell.effectiveValue
      });
    }

    this.pendingChanges.set(new Map(pending));
  }

  getMatrixCellState(row: MatrixRow, flagKey: string): 'enabled' | 'disabled' | 'pending-enable' | 'pending-disable' {
    const cell = row.cells.get(flagKey);
    if (!cell) return 'disabled';

    const changeKey = `${row.clientId}-${flagKey}`;
    const pending = this.pendingChanges().get(changeKey);

    if (pending) {
      return pending.enabled ? 'pending-enable' : 'pending-disable';
    }

    return cell.effectiveValue ? 'enabled' : 'disabled';
  }

  hasPendingChanges(): boolean {
    return this.pendingChanges().size > 0;
  }

  savePendingChanges(): void {
    const changes = this.pendingChanges();
    if (changes.size === 0) return;

    // Group by client for batch updates
    const updates: Array<{ clientId: number; flagKey: string; enabled: boolean }> = [];
    changes.forEach(change => updates.push(change));

    // Process updates sequentially (in real implementation, use bulk API)
    let completed = 0;
    updates.forEach(update => {
      const systemFlag = this.matrixFlags().find(f => f.key === update.flagKey);
      if (!systemFlag) return;

      this.featureFlagService.setClientFlag({
        customerId: update.clientId,
        systemFlagId: parseInt(systemFlag.id, 10),
        value: String(update.enabled),
        isEnabled: update.enabled,
        reason: 'Bulk update from matrix view'
      }).subscribe({
        next: () => {
          completed++;
          if (completed === updates.length) {
            this.pendingChanges.set(new Map());
            this.loadMatrix();
          }
        },
        error: (err: Error) => {
          console.error('Failed to update:', err);
        }
      });
    });
  }

  discardPendingChanges(): void {
    this.pendingChanges.set(new Map());
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
    const flagId = parseInt(flag.id, 10);
    this.featureFlagService.toggleSystemFlag(flagId).subscribe({
      next: () => {
        // Flag will be updated via refresh
      },
      error: (err: Error) => {
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
      error: (err: Error) => {
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
    const flagId = parseInt(this.selectedFlag()!.id, 10);
    this.featureFlagService.updateSystemFlag(flagId, {
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
      error: (err: Error) => {
        console.error('Failed to update flag:', err);
      }
    });
  }

  // Delete Flag
  deleteFlag(flag: SystemFeatureFlag): void {
    if (!confirm(`Are you sure you want to delete the flag "${flag.name}"? This action cannot be undone.`)) {
      return;
    }

    const flagId = parseInt(flag.id, 10);
    this.featureFlagService.deleteSystemFlag(flagId).subscribe({
      error: (err: Error) => {
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
      next: (flags: ClientFeatureFlag[]) => {
        this.clientFlags.set(flags);
      },
      error: (err: Error) => {
        console.error('Failed to load client flags:', err);
      }
    });
  }

  openClientOverrideModal(flag: SystemFeatureFlag): void {
    this.selectedFlag.set(flag);
    this.clientFlagForm.patchValue({
      flagKey: flag.key,
      systemFlagId: flag.id,
      value: flag.currentValue,
      enabled: flag.enabled
    });
    this.showClientModal.set(true);
  }

  saveClientOverride(): void {
    if (this.clientFlagForm.invalid || !this.selectedFlag()) return;

    const formValue = this.clientFlagForm.value;
    const selectedFlagId = parseInt(this.selectedFlag()!.id, 10);
    const customerId = parseInt(formValue.clientId, 10);

    this.featureFlagService.setClientFlag({
      customerId: customerId,
      systemFlagId: selectedFlagId,
      value: String(formValue.value),
      isEnabled: formValue.enabled,
      reason: formValue.overrideReason
    }).subscribe({
      next: () => {
        this.showClientModal.set(false);
      },
      error: (err: Error) => {
        console.error('Failed to save client override:', err);
      }
    });
  }

  removeClientOverride(clientFlag: ClientFeatureFlag): void {
    if (!confirm('Remove this client override? The flag will revert to the system default.')) {
      return;
    }

    const overrideId = parseInt(clientFlag.id, 10);
    this.featureFlagService.deleteClientFlag(overrideId).subscribe({
      next: () => {
        this.selectClient(clientFlag.customerId); // Refresh
      },
      error: (err: Error) => {
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

  // Export/Import - TODO: Implement backend endpoints for these features
  exportFlags(): void {
    // Export all system flags as JSON for backup/transfer
    const flags = this.systemFlags();
    const jsonData = JSON.stringify(flags, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature-flags-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importFlags(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // TODO: Implement bulk import API endpoint
    // For now, read and validate the file
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content = e.target?.result as string;
        const flags = JSON.parse(content);
        console.log('Parsed flags for import:', flags);
        alert(`Import functionality is not yet implemented. ${flags.length} flags parsed from file.`);
      } catch (error) {
        console.error('Failed to parse import file:', error);
        alert('Failed to parse import file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
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
