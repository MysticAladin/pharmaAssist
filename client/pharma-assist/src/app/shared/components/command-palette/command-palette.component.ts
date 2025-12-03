import { Component, inject, signal, computed, effect, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommandPaletteService } from '../../../core/services/command-palette.service';
import { Command, COMMAND_CATEGORY_ICONS } from '../../../core/models/command.model';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    @if (commandService.isOpen()) {
      <div class="palette-overlay" (click)="close()">
        <div class="palette-container" (click)="$event.stopPropagation()">
          <!-- Search Input -->
          <div class="search-wrapper">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              #searchInput
              type="text"
              class="search-input"
              [placeholder]="'commands.searchPlaceholder' | translate"
              [ngModel]="commandService.searchQuery()"
              (ngModelChange)="onSearchChange($event)"
              (keydown)="handleKeydown($event)"
            />
            <kbd class="esc-hint">ESC</kbd>
          </div>

          <!-- Results -->
          <div class="results-container">
            @if (commandService.groupedCommands().length === 0) {
              <div class="no-results">
                <span class="no-results-icon">🔍</span>
                <span>{{ 'commands.noResults' | translate }}</span>
              </div>
            } @else {
              @for (group of commandService.groupedCommands(); track group.category) {
                <div class="command-group">
                  <div class="group-header">
                    <span class="group-icon">{{ getCategoryIcon(group.category) }}</span>
                    <span class="group-label">{{ group.label | translate }}</span>
                  </div>
                  <div class="command-list">
                    @for (command of group.commands; track command.id; let i = $index) {
                      <button
                        class="command-item"
                        [class.selected]="isSelected(command)"
                        (click)="executeCommand(command)"
                        (mouseenter)="selectCommand(command)"
                      >
                        <span class="command-icon">{{ command.icon }}</span>
                        <div class="command-content">
                          <span class="command-title">{{ command.title }}</span>
                          @if (command.description) {
                            <span class="command-description">{{ command.description }}</span>
                          }
                        </div>
                        @if (command.shortcut) {
                          <kbd class="command-shortcut">{{ command.shortcut }}</kbd>
                        }
                      </button>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- Footer -->
          <div class="palette-footer">
            <div class="footer-hint">
              <kbd>↑↓</kbd> {{ 'commands.hints.navigate' | translate }}
            </div>
            <div class="footer-hint">
              <kbd>↵</kbd> {{ 'commands.hints.select' | translate }}
            </div>
            <div class="footer-hint">
              <kbd>ESC</kbd> {{ 'commands.hints.close' | translate }}
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .palette-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
      z-index: 9999;
      animation: fadeIn 0.1s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .palette-container {
      background: var(--bg-primary, white);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 640px;
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideDown 0.15s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .search-icon {
      color: var(--text-secondary, #6b7280);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      color: var(--text-primary, #111827);
      outline: none;

      &::placeholder {
        color: var(--text-secondary, #9ca3af);
      }
    }

    .esc-hint {
      padding: 4px 8px;
      background: var(--bg-secondary, #f3f4f6);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      font-size: 11px;
      font-family: inherit;
      color: var(--text-secondary, #6b7280);
    }

    .results-container {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px;
      color: var(--text-secondary, #6b7280);
    }

    .no-results-icon {
      font-size: 32px;
      opacity: 0.5;
    }

    .command-group {
      &:not(:last-child) {
        margin-bottom: 12px;
      }
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary, #6b7280);
    }

    .group-icon {
      font-size: 12px;
    }

    .command-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .command-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.1s;

      &:hover,
      &.selected {
        background: var(--bg-secondary, #f3f4f6);
      }

      &.selected {
        background: var(--primary-light, #eef2ff);
      }
    }

    .command-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }

    .command-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .command-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary, #111827);
    }

    .command-description {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .command-shortcut {
      padding: 4px 8px;
      background: var(--bg-secondary, #f3f4f6);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      font-size: 11px;
      font-family: inherit;
      color: var(--text-secondary, #6b7280);
      white-space: nowrap;
    }

    .palette-footer {
      display: flex;
      gap: 16px;
      padding: 12px 20px;
      border-top: 1px solid var(--border-color, #e5e7eb);
      background: var(--bg-secondary, #f9fafb);
    }

    .footer-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary, #6b7280);

      kbd {
        padding: 2px 6px;
        background: var(--bg-primary, white);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 4px;
        font-size: 11px;
        font-family: inherit;
      }
    }

    /* Dark mode support */
    :host-context(.dark) {
      .palette-container {
        background: var(--bg-primary, #1f2937);
      }

      .search-input {
        color: var(--text-primary, #f9fafb);
      }

      .command-item {
        &:hover,
        &.selected {
          background: var(--bg-secondary, #374151);
        }
      }
    }
  `]
})
export class CommandPaletteComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  readonly commandService = inject(CommandPaletteService);
  readonly categoryIcons = COMMAND_CATEGORY_ICONS;

  selectedCommand = signal<Command | null>(null);

  private allFlatCommands = computed(() => {
    const groups = this.commandService.groupedCommands();
    return groups.flatMap(g => g.commands);
  });

  constructor() {
    // Auto-select first command when results change
    effect(() => {
      const commands = this.allFlatCommands();
      if (commands.length > 0 && !this.selectedCommand()) {
        this.selectedCommand.set(commands[0]);
      }
    });

    // Reset selection when palette opens
    effect(() => {
      if (this.commandService.isOpen()) {
        const commands = this.allFlatCommands();
        this.selectedCommand.set(commands[0] || null);
        setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.commandService.isOpen()) {
      this.searchInput?.nativeElement?.focus();
    }
  }

  onSearchChange(query: string): void {
    this.commandService.searchQuery.set(query);
    // Reset selection to first result
    const commands = this.allFlatCommands();
    this.selectedCommand.set(commands[0] || null);
  }

  handleKeydown(event: KeyboardEvent): void {
    const commands = this.allFlatCommands();
    const currentIndex = commands.findIndex(c => c.id === this.selectedCommand()?.id);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < commands.length - 1) {
          this.selectedCommand.set(commands[currentIndex + 1]);
          this.scrollToSelected();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          this.selectedCommand.set(commands[currentIndex - 1]);
          this.scrollToSelected();
        }
        break;

      case 'Enter':
        event.preventDefault();
        const selected = this.selectedCommand();
        if (selected) {
          this.executeCommand(selected);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  selectCommand(command: Command): void {
    this.selectedCommand.set(command);
  }

  isSelected(command: Command): boolean {
    return this.selectedCommand()?.id === command.id;
  }

  executeCommand(command: Command): void {
    this.commandService.executeCommand(command);
  }

  close(): void {
    this.commandService.close();
  }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category as keyof typeof this.categoryIcons] || '📁';
  }

  private scrollToSelected(): void {
    setTimeout(() => {
      const selected = document.querySelector('.command-item.selected');
      selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 0);
  }
}
