import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Command, CommandCategory, CommandGroup, COMMAND_CATEGORY_LABELS } from '../models/command.model';

@Injectable({
  providedIn: 'root'
})
export class CommandPaletteService {
  private readonly router = inject(Router);

  // Palette visibility
  isOpen = signal(false);

  // Search query
  searchQuery = signal('');

  // Recent commands (persisted in localStorage)
  private readonly RECENT_KEY = 'pharma_recent_commands';
  private readonly MAX_RECENT = 5;
  recentCommandIds = signal<string[]>(this.loadRecentCommands());

  // Registered commands
  private commands = signal<Map<string, Command>>(new Map());

  // All commands as array
  allCommands = computed(() => Array.from(this.commands().values()).filter(c => !c.disabled));

  // Filtered commands based on search
  filteredCommands = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.allCommands();

    if (!query) {
      return all;
    }

    return all.filter(cmd => {
      const titleMatch = cmd.title.toLowerCase().includes(query);
      const descMatch = cmd.description?.toLowerCase().includes(query);
      const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(query));
      return titleMatch || descMatch || keywordMatch;
    }).sort((a, b) => {
      // Prioritize title matches
      const aTitle = a.title.toLowerCase().startsWith(query);
      const bTitle = b.title.toLowerCase().startsWith(query);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });
  });

  // Grouped commands for display
  groupedCommands = computed<CommandGroup[]>(() => {
    const commands = this.filteredCommands();
    const groups: Map<CommandCategory, Command[]> = new Map();

    // Add recent commands first if no search query
    if (!this.searchQuery()) {
      const recentIds = this.recentCommandIds();
      const recentCmds = recentIds
        .map(id => this.commands().get(id))
        .filter((cmd): cmd is Command => cmd !== undefined);

      if (recentCmds.length > 0) {
        groups.set('recent', recentCmds);
      }
    }

    // Group remaining commands by category
    commands.forEach(cmd => {
      // Skip if already in recent and no search query
      if (!this.searchQuery() && this.recentCommandIds().includes(cmd.id)) {
        return;
      }
      const existing = groups.get(cmd.category) || [];
      groups.set(cmd.category, [...existing, cmd]);
    });

    // Convert to array with labels
    const categoryOrder: CommandCategory[] = ['recent', 'navigation', 'actions', 'settings', 'help'];
    return categoryOrder
      .filter(cat => groups.has(cat))
      .map(category => ({
        category,
        label: COMMAND_CATEGORY_LABELS[category],
        commands: groups.get(category) || []
      }));
  });

  constructor() {
    this.registerDefaultCommands();
  }

  open(): void {
    this.searchQuery.set('');
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  executeCommand(command: Command): void {
    this.addToRecent(command.id);
    this.close();
    command.action();
  }

  register(command: Command): void {
    this.commands.update(map => {
      const newMap = new Map(map);
      newMap.set(command.id, command);
      return newMap;
    });
  }

  unregister(id: string): void {
    this.commands.update(map => {
      const newMap = new Map(map);
      newMap.delete(id);
      return newMap;
    });
  }

  private addToRecent(id: string): void {
    this.recentCommandIds.update(ids => {
      const filtered = ids.filter(i => i !== id);
      const newIds = [id, ...filtered].slice(0, this.MAX_RECENT);
      this.saveRecentCommands(newIds);
      return newIds;
    });
  }

  private loadRecentCommands(): string[] {
    try {
      const stored = localStorage.getItem(this.RECENT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveRecentCommands(ids: string[]): void {
    try {
      localStorage.setItem(this.RECENT_KEY, JSON.stringify(ids));
    } catch {
      // Ignore storage errors
    }
  }

  private registerDefaultCommands(): void {
    // Navigation commands
    this.register({
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'View main dashboard',
      icon: '📊',
      category: 'navigation',
      keywords: ['home', 'main', 'overview'],
      shortcut: 'Alt+D',
      action: () => this.router.navigate(['/dashboard'])
    });

    this.register({
      id: 'nav-products',
      title: 'Go to Products',
      description: 'Manage product catalog',
      icon: '💊',
      category: 'navigation',
      keywords: ['medication', 'drugs', 'inventory'],
      shortcut: 'Alt+P',
      action: () => this.router.navigate(['/products'])
    });

    this.register({
      id: 'nav-orders',
      title: 'Go to Orders',
      description: 'View and manage orders',
      icon: '📦',
      category: 'navigation',
      keywords: ['purchase', 'sales', 'transactions'],
      shortcut: 'Alt+O',
      action: () => this.router.navigate(['/orders'])
    });

    this.register({
      id: 'nav-customers',
      title: 'Go to Customers',
      description: 'Manage customer accounts',
      icon: '👥',
      category: 'navigation',
      keywords: ['clients', 'accounts', 'contacts'],
      shortcut: 'Alt+C',
      action: () => this.router.navigate(['/customers'])
    });

    this.register({
      id: 'nav-prescriptions',
      title: 'Go to Prescriptions',
      description: 'Manage prescriptions',
      icon: '📋',
      category: 'navigation',
      keywords: ['rx', 'dispense', 'medication'],
      shortcut: 'Alt+R',
      action: () => this.router.navigate(['/prescriptions'])
    });

    this.register({
      id: 'nav-inventory',
      title: 'Go to Inventory',
      description: 'Stock management',
      icon: '📦',
      category: 'navigation',
      keywords: ['stock', 'warehouse', 'levels'],
      shortcut: 'Alt+I',
      action: () => this.router.navigate(['/inventory'])
    });

    this.register({
      id: 'nav-reports',
      title: 'Go to Reports',
      description: 'Analytics and reporting',
      icon: '📈',
      category: 'navigation',
      keywords: ['analytics', 'statistics', 'charts'],
      action: () => this.router.navigate(['/reports'])
    });

    this.register({
      id: 'nav-settings',
      title: 'Go to Settings',
      description: 'Application settings',
      icon: '⚙️',
      category: 'navigation',
      keywords: ['preferences', 'configuration', 'options'],
      action: () => this.router.navigate(['/settings'])
    });

    // Action commands
    this.register({
      id: 'action-new-order',
      title: 'Create New Order',
      description: 'Start a new order',
      icon: '➕',
      category: 'actions',
      keywords: ['add', 'create', 'purchase'],
      shortcut: 'Ctrl+Shift+O',
      action: () => this.router.navigate(['/orders/new'])
    });

    this.register({
      id: 'action-new-product',
      title: 'Add New Product',
      description: 'Add a product to catalog',
      icon: '➕',
      category: 'actions',
      keywords: ['add', 'create', 'medication'],
      shortcut: 'Ctrl+Shift+P',
      action: () => this.router.navigate(['/products/new'])
    });

    this.register({
      id: 'action-new-customer',
      title: 'Add New Customer',
      description: 'Register a new customer',
      icon: '➕',
      category: 'actions',
      keywords: ['add', 'create', 'client'],
      action: () => this.router.navigate(['/customers/new'])
    });

    this.register({
      id: 'action-dispense',
      title: 'Dispense Prescription',
      description: 'Dispense a prescription',
      icon: '💉',
      category: 'actions',
      keywords: ['rx', 'fill', 'medication'],
      shortcut: 'Ctrl+Shift+D',
      action: () => this.router.navigate(['/prescriptions/dispense'])
    });

    this.register({
      id: 'action-stock-adjustment',
      title: 'Stock Adjustment',
      description: 'Adjust inventory levels',
      icon: '📊',
      category: 'actions',
      keywords: ['inventory', 'count', 'correct'],
      action: () => this.router.navigate(['/inventory/adjustments'])
    });

    // Settings commands
    this.register({
      id: 'settings-profile',
      title: 'Edit Profile',
      description: 'Update your profile',
      icon: '👤',
      category: 'settings',
      keywords: ['account', 'user', 'personal'],
      action: () => this.router.navigate(['/settings'], { queryParams: { tab: 'profile' } })
    });

    this.register({
      id: 'settings-notifications',
      title: 'Notification Settings',
      description: 'Configure notifications',
      icon: '🔔',
      category: 'settings',
      keywords: ['alerts', 'email', 'push'],
      action: () => this.router.navigate(['/settings'], { queryParams: { tab: 'notifications' } })
    });

    this.register({
      id: 'settings-security',
      title: 'Security Settings',
      description: 'Password and 2FA',
      icon: '🔒',
      category: 'settings',
      keywords: ['password', 'authentication', 'mfa'],
      action: () => this.router.navigate(['/settings'], { queryParams: { tab: 'security' } })
    });

    // Help commands
    this.register({
      id: 'help-shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'View all shortcuts',
      icon: '⌨️',
      category: 'help',
      keywords: ['keys', 'hotkeys', 'bindings'],
      shortcut: 'Shift+?',
      action: () => {
        // This will be handled by the KeyboardService
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true }));
      }
    });

    this.register({
      id: 'help-docs',
      title: 'Documentation',
      description: 'Open help documentation',
      icon: '📖',
      category: 'help',
      keywords: ['guide', 'manual', 'how-to'],
      action: () => window.open('/docs', '_blank')
    });

    this.register({
      id: 'help-support',
      title: 'Contact Support',
      description: 'Get help from support',
      icon: '💬',
      category: 'help',
      keywords: ['contact', 'assistance', 'ticket'],
      action: () => window.open('mailto:support@pharmaassist.com', '_blank')
    });
  }
}
