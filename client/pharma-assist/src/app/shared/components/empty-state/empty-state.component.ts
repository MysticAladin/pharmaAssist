import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="empty-state" [class.compact]="compact()">
      <div class="icon-container">
        @switch (icon) {
          @case ('folder') {
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          }
          @case ('building') {
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 21h18"/>
              <path d="M5 21V7l8-4v18"/>
              <path d="M19 21V11l-6-4"/>
              <path d="M9 9v.01"/>
              <path d="M9 12v.01"/>
              <path d="M9 15v.01"/>
              <path d="M9 18v.01"/>
            </svg>
          }
          @case ('search') {
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          }
          @case ('package') {
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="m16.5 9.4-9-5.19"/>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          }
          @case ('cart') {
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          }
          @case ('users') {
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
          @default {
            <!-- Default empty box icon -->
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          }
        }
      </div>
      <h3 class="title">{{ title | translate }}</h3>
      @if (description) {
        <p class="description">{{ description | translate }}</p>
      }
      <div class="actions">
        @if (actionLabel) {
          <button class="btn btn-primary" (click)="actionClick.emit()">
            {{ actionLabel | translate }}
          </button>
        }
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
    }

    .empty-state.compact {
      padding: 32px 16px;
    }

    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--surface-alt, #f8fafc);
      margin-bottom: 24px;
      color: var(--text-muted);

      :host ::ng-deep svg {
        width: 48px;
        height: 48px;
      }
    }

    .compact .icon-container {
      width: 72px;
      height: 72px;
      margin-bottom: 16px;

      :host ::ng-deep svg {
        width: 36px;
        height: 36px;
      }
    }

    .title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
    }

    .compact .title {
      font-size: 16px;
    }

    .description {
      margin: 0 0 24px;
      font-size: 14px;
      color: var(--text-secondary);
      max-width: 400px;
      line-height: 1.5;
    }

    .compact .description {
      margin-bottom: 16px;
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .actions:empty {
      display: none;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--pharma-teal-600, #0d9488);
      color: white;
    }

    .btn-primary:hover {
      background: var(--pharma-teal-700, #0f766e);
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'common.noData';
  @Input() description = '';
  @Input() icon = '';
  @Input() actionLabel = '';
  @Input() set isCompact(value: boolean) { this.compact.set(value); }

  @Output() actionClick = new EventEmitter<void>();

  compact = signal(false);
}
