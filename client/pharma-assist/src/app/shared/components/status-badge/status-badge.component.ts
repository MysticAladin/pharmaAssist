import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './status-badge-component/status-badge.component.html',
  styleUrls: ['./status-badge-component/status-badge.component.scss']
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
