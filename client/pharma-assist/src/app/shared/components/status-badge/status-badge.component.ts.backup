import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <span
      class="badge"
      [class]="badgeClasses()"
      [class.with-dot]="showDot()"
    >
      @if (showDot()) {
        <span class="dot"></span>
      }
      @if (icon()) {
        <span class="icon" [innerHTML]="icon()"></span>
      }
      <span class="label">{{ translateLabel() ? (label | translate) : label }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-weight: 500;
      white-space: nowrap;
    }

    /* Sizes */
    .badge-sm {
      font-size: 11px;
      padding: 2px 8px;
    }

    .badge-md {
      font-size: 12px;
      padding: 4px 10px;
    }

    .badge-lg {
      font-size: 14px;
      padding: 6px 14px;
    }

    /* Variants */
    .badge-success {
      background: var(--color-success-bg);
      color: #166534;
    }

    .badge-warning {
      background: var(--status-pending-bg);
      color: var(--color-warning-text);
    }

    .badge-danger {
      background: var(--color-error-bg);
      color: var(--color-error-text);
    }

    .badge-info {
      background: var(--status-processing-bg);
      color: var(--color-info-text);
    }

    .badge-neutral {
      background: var(--surface-tertiary);
      color: #475569;
    }

    .badge-primary {
      background: rgba(var(--primary-rgb), 0.15);
      color: var(--primary);
    }

    /* Dot */
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .badge-sm .dot {
      width: 5px;
      height: 5px;
    }

    .badge-lg .dot {
      width: 8px;
      height: 8px;
    }

    /* Icon */
    .icon {
      display: flex;
      align-items: center;

      :host ::ng-deep svg {
        width: 14px;
        height: 14px;
      }
    }

    .badge-sm .icon :host ::ng-deep svg {
      width: 12px;
      height: 12px;
    }

    .badge-lg .icon :host ::ng-deep svg {
      width: 16px;
      height: 16px;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() set variant(value: BadgeVariant) { this._variant.set(value); }
  @Input() set size(value: BadgeSize) { this._size.set(value); }
  @Input() set dot(value: boolean) { this.showDot.set(value); }
  @Input() set svgIcon(value: string) { this.icon.set(value); }
  @Input() set shouldTranslate(value: boolean) { this.translateLabel.set(value); }

  _variant = signal<BadgeVariant>('neutral');
  _size = signal<BadgeSize>('md');
  showDot = signal(false);
  icon = signal('');
  translateLabel = signal(false);

  badgeClasses = computed(() => {
    return `badge-${this._variant()} badge-${this._size()}`;
  });
}
