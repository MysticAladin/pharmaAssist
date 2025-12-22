import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface PageHeaderAction {
  label: string;
  icon?: string;
  primary?: boolean;
  secondary?: boolean;
  onClick: () => void;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() breadcrumbs: { label: string; route?: string }[] = [];
  @Input() actions: PageHeaderAction[] = [];
  @Input() showRefresh: boolean = false;
  @Input() loading: boolean = false;

  @Output() refresh = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }
}
