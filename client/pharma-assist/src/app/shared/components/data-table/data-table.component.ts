import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  template?: TemplateRef<any>;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './data-table-component/data-table.component.html',
  styleUrls: ['./data-table-component/data-table.component.scss']
})
export class DataTableComponent<T = any> {
  columns = signal<TableColumn[]>([]);
  data = signal<T[]>([]);
  loading = signal(false);
  selectable = signal(false);
  showActions = signal(false);
  rowClickable = signal(false);
  hoverable = signal(true);
  striped = signal(false);
  trackByFn = signal<(item: T) => any>((item: any) => item.id);

  // Support both naming conventions
  @Input('columns') set columnsInput(value: TableColumn[]) { this.columns.set(value); }
  @Input() set columnDefs(value: TableColumn[]) { this.columns.set(value); }

  @Input('data') set dataInput(value: T[]) { this.data.set(value); }
  @Input() set items(value: T[]) { this.data.set(value); }

  @Input('loading') set loadingInput(value: boolean) { this.loading.set(value); }
  @Input() set isLoading(value: boolean) { this.loading.set(value); }

  @Input('selectable') set selectableInput(value: boolean) { this.selectable.set(value); }
  @Input() set enableSelection(value: boolean) { this.selectable.set(value); }

  @Input() set showActionsInput(value: boolean) { this.showActions.set(value); }
  @Input() set enableActions(value: boolean) { this.showActions.set(value); }

  @Input('clickable') set clickableInput(value: boolean) { this.rowClickable.set(value); }
  @Input() set enableRowClick(value: boolean) { this.rowClickable.set(value); }

  @Input() set trackBy(value: (item: T) => any) { this.trackByFn.set(value); }
  @Input('hoverable') set hoverableInput(value: boolean) { this.hoverable.set(value); }
  @Input('striped') set stripedInput(value: boolean) { this.striped.set(value); }
  @Input() actionsTemplate!: TemplateRef<any>;

  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() rowClick = new EventEmitter<T>();

  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');
  selectedItems = signal<Set<T>>(new Set());

  totalColumns = computed(() => {
    let count = this.columns().length;
    if (this.selectable()) count++;
    if (this.showActions()) count++;
    return count;
  });

  allSelected = computed(() => {
    const items = this.data();
    const selected = this.selectedItems();
    return items.length > 0 && items.every(item => selected.has(item));
  });

  someSelected = computed(() => {
    const items = this.data();
    const selected = this.selectedItems();
    const selectedCount = items.filter(item => selected.has(item)).length;
    return selectedCount > 0 && selectedCount < items.length;
  });

  sort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortChange.emit({ column, direction: this.sortDirection() });
  }

  isSelected(item: T): boolean {
    return this.selectedItems().has(item);
  }

  toggleSelect(item: T): void {
    this.selectedItems.update(set => {
      const newSet = new Set(set);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
    this.selectionChange.emit(Array.from(this.selectedItems()));
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedItems.set(new Set());
    } else {
      this.selectedItems.set(new Set(this.data()));
    }
    this.selectionChange.emit(Array.from(this.selectedItems()));
  }

  onRowClick(row: T): void {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }

  getValue(row: T, key: string): any {
    return (row as Record<string, any>)[key];
  }
}
