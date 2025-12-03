import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Subject, fromEvent, filter, takeUntil } from 'rxjs';

export interface KeyboardShortcut {
  id: string;
  keys: string; // e.g., 'ctrl+k', 'alt+n', 'escape'
  description: string;
  category: 'navigation' | 'actions' | 'general';
  action: () => void;
  enabled?: boolean;
}

export interface ShortcutGroup {
  category: string;
  shortcuts: KeyboardShortcut[];
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardService implements OnDestroy {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroy$ = new Subject<void>();

  // Registered shortcuts
  private shortcuts = signal<Map<string, KeyboardShortcut>>(new Map());

  // Show keyboard shortcuts help modal
  showHelp = signal(false);

  // All shortcuts as array
  allShortcuts = computed(() => Array.from(this.shortcuts().values()));

  // Grouped shortcuts for help display
  groupedShortcuts = computed<ShortcutGroup[]>(() => {
    const shortcuts = this.allShortcuts();
    const groups: Map<string, KeyboardShortcut[]> = new Map();

    shortcuts.forEach(shortcut => {
      const existing = groups.get(shortcut.category) || [];
      groups.set(shortcut.category, [...existing, shortcut]);
    });

    return Array.from(groups.entries()).map(([category, shortcuts]) => ({
      category,
      shortcuts
    }));
  });

  constructor() {
    this.initializeListener();
    this.registerDefaultShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeListener(): void {
    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(
        takeUntil(this.destroy$),
        filter(event => !this.isInputFocused(event))
      )
      .subscribe(event => this.handleKeydown(event));
  }

  private isInputFocused(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const isEditable = target.isContentEditable;

    // Allow shortcuts in inputs only for escape and specific combos
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isEditable) {
      // Allow Escape key in inputs
      if (event.key === 'Escape') {
        return false;
      }
      // Allow Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        return false;
      }
      return true;
    }
    return false;
  }

  private handleKeydown(event: KeyboardEvent): void {
    const keyCombo = this.getKeyCombo(event);
    const shortcut = this.shortcuts().get(keyCombo);

    if (shortcut && shortcut.enabled !== false) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }

  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    const key = event.key.toLowerCase();
    // Normalize key names
    const normalizedKey = key === ' ' ? 'space' : key;
    parts.push(normalizedKey);

    return parts.join('+');
  }

  private registerDefaultShortcuts(): void {
    // Navigation shortcuts
    this.register({
      id: 'nav-dashboard',
      keys: 'alt+d',
      description: 'keyboard.shortcuts.dashboard',
      category: 'navigation',
      action: () => this.router.navigate(['/dashboard'])
    });

    this.register({
      id: 'nav-products',
      keys: 'alt+p',
      description: 'keyboard.shortcuts.products',
      category: 'navigation',
      action: () => this.router.navigate(['/products'])
    });

    this.register({
      id: 'nav-orders',
      keys: 'alt+o',
      description: 'keyboard.shortcuts.orders',
      category: 'navigation',
      action: () => this.router.navigate(['/orders'])
    });

    this.register({
      id: 'nav-customers',
      keys: 'alt+c',
      description: 'keyboard.shortcuts.customers',
      category: 'navigation',
      action: () => this.router.navigate(['/customers'])
    });

    this.register({
      id: 'nav-prescriptions',
      keys: 'alt+r',
      description: 'keyboard.shortcuts.prescriptions',
      category: 'navigation',
      action: () => this.router.navigate(['/prescriptions'])
    });

    this.register({
      id: 'nav-inventory',
      keys: 'alt+i',
      description: 'keyboard.shortcuts.inventory',
      category: 'navigation',
      action: () => this.router.navigate(['/inventory'])
    });

    // Action shortcuts
    this.register({
      id: 'action-new-order',
      keys: 'ctrl+shift+o',
      description: 'keyboard.shortcuts.newOrder',
      category: 'actions',
      action: () => this.router.navigate(['/orders/new'])
    });

    this.register({
      id: 'action-new-product',
      keys: 'ctrl+shift+p',
      description: 'keyboard.shortcuts.newProduct',
      category: 'actions',
      action: () => this.router.navigate(['/products/new'])
    });

    this.register({
      id: 'action-dispense',
      keys: 'ctrl+shift+d',
      description: 'keyboard.shortcuts.dispense',
      category: 'actions',
      action: () => this.router.navigate(['/prescriptions/dispense'])
    });

    this.register({
      id: 'action-search',
      keys: 'ctrl+k',
      description: 'keyboard.shortcuts.search',
      category: 'actions',
      action: () => this.focusSearch()
    });

    // General shortcuts
    this.register({
      id: 'general-help',
      keys: 'shift+?',
      description: 'keyboard.shortcuts.help',
      category: 'general',
      action: () => this.toggleHelp()
    });

    this.register({
      id: 'general-escape',
      keys: 'escape',
      description: 'keyboard.shortcuts.escape',
      category: 'general',
      action: () => this.handleEscape()
    });

    this.register({
      id: 'general-back',
      keys: 'alt+arrowleft',
      description: 'keyboard.shortcuts.back',
      category: 'general',
      action: () => window.history.back()
    });

    this.register({
      id: 'general-forward',
      keys: 'alt+arrowright',
      description: 'keyboard.shortcuts.forward',
      category: 'general',
      action: () => window.history.forward()
    });
  }

  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.update(map => {
      const newMap = new Map(map);
      newMap.set(shortcut.keys, shortcut);
      return newMap;
    });
  }

  unregister(keys: string): void {
    this.shortcuts.update(map => {
      const newMap = new Map(map);
      newMap.delete(keys);
      return newMap;
    });
  }

  enable(keys: string): void {
    this.shortcuts.update(map => {
      const shortcut = map.get(keys);
      if (shortcut) {
        const newMap = new Map(map);
        newMap.set(keys, { ...shortcut, enabled: true });
        return newMap;
      }
      return map;
    });
  }

  disable(keys: string): void {
    this.shortcuts.update(map => {
      const shortcut = map.get(keys);
      if (shortcut) {
        const newMap = new Map(map);
        newMap.set(keys, { ...shortcut, enabled: false });
        return newMap;
      }
      return map;
    });
  }

  toggleHelp(): void {
    this.showHelp.update(v => !v);
  }

  private focusSearch(): void {
    // Try to focus the search input in the current view
    const searchInput = this.document.querySelector('app-search-input input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  private handleEscape(): void {
    // Close help modal if open
    if (this.showHelp()) {
      this.showHelp.set(false);
      return;
    }

    // Blur any focused element
    const activeElement = this.document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }

  // Format key combo for display
  formatKeyCombo(keys: string): string {
    return keys
      .split('+')
      .map(key => {
        switch (key) {
          case 'ctrl': return 'Ctrl';
          case 'alt': return 'Alt';
          case 'shift': return 'Shift';
          case 'arrowleft': return '←';
          case 'arrowright': return '→';
          case 'arrowup': return '↑';
          case 'arrowdown': return '↓';
          case 'escape': return 'Esc';
          case 'space': return 'Space';
          case '?': return '?';
          default: return key.toUpperCase();
        }
      })
      .join(' + ');
  }
}
