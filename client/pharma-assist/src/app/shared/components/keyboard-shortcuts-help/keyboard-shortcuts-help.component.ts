import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { KeyboardService } from '../../../core/services/keyboard.service';

@Component({
  selector: 'app-keyboard-shortcuts-help',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (keyboardService.showHelp()) {
      <div class="shortcuts-overlay" (click)="close()">
        <div class="shortcuts-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ 'keyboard.title' | translate }}</h2>
            <button class="close-btn" (click)="close()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            @for (group of keyboardService.groupedShortcuts(); track group.category) {
              <div class="shortcut-group">
                <h3 class="group-title">{{ 'keyboard.categories.' + group.category | translate }}</h3>
                <div class="shortcuts-list">
                  @for (shortcut of group.shortcuts; track shortcut.id) {
                    <div class="shortcut-item">
                      <span class="shortcut-keys">
                        @for (key of formatKeys(shortcut.keys); track key; let last = $last) {
                          <kbd>{{ key }}</kbd>
                          @if (!last) {
                            <span class="key-separator">+</span>
                          }
                        }
                      </span>
                      <span class="shortcut-description">{{ shortcut.description | translate }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <div class="modal-footer">
            <p class="hint">{{ 'keyboard.pressEscToClose' | translate }}</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .shortcuts-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .shortcuts-modal {
      background: var(--surface);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text);
      }
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--surface-hover);
        color: var(--text);
      }
    }

    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
    }

    .shortcut-group {
      &:not(:last-child) {
        margin-bottom: 24px;
      }
    }

    .group-title {
      margin: 0 0 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
    }

    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--bg);
      border-radius: 8px;
      gap: 16px;
    }

    .shortcut-keys {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      color: var(--text);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .key-separator {
      color: var(--text-secondary);
      font-size: 12px;
      margin: 0 2px;
    }

    .shortcut-description {
      font-size: 14px;
      color: var(--text);
      text-align: right;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      text-align: center;
    }

    .hint {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary);
    }
  `]
})
export class KeyboardShortcutsHelpComponent {
  readonly keyboardService = inject(KeyboardService);

  close(): void {
    this.keyboardService.showHelp.set(false);
  }

  formatKeys(keys: string): string[] {
    return keys.split('+').map(key => {
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
    });
  }
}
