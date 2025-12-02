import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="empty-state" [class.compact]="compact()">
      <div class="icon-container">
        @if (customIcon()) {
          <span [innerHTML]="customIcon()"></span>
        } @else {
          <!-- Default empty box icon -->
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        }
      </div>
      <h3 class="title">{{ title | translate }}</h3>
      @if (description) {
        <p class="description">{{ description | translate }}</p>
      }
      <div class="actions">
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
  `]
})
export class EmptyStateComponent {
  @Input() title = 'common.noData';
  @Input() description = '';
  @Input() set icon(value: string) { this.customIcon.set(value); }
  @Input() set isCompact(value: boolean) { this.compact.set(value); }

  customIcon = signal('');
  compact = signal(false);
}
