import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './empty-state-component/empty-state.component.html',
  styleUrls: ['./empty-state-component/empty-state.component.scss']
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
