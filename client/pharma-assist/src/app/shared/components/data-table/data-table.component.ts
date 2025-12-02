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
  template: `
    <div class="data-table-container">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              @if (selectable()) {
                <th class="checkbox-cell">
                  <input
                    type="checkbox"
                    [checked]="allSelected()"
                    [indeterminate]="someSelected()"
                    (change)="toggleSelectAll()"
                  />
                </th>
              }
              @for (column of columns(); track column.key) {
                <th
                  [style.width]="column.width"
                  [class.sortable]="column.sortable"
                  [class.sorted]="sortColumn() === column.key"
                  [class.align-center]="column.align === 'center'"
                  [class.align-right]="column.align === 'right'"
                  (click)="column.sortable ? sort(column.key) : null"
                >
                  <div class="th-content">
                    <span>{{ column.label | translate }}</span>
                    @if (column.sortable) {
                      <span class="sort-icon">
                        @if (sortColumn() === column.key) {
                          @if (sortDirection() === 'asc') {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 19V5M5 12l7-7 7 7"/>
                            </svg>
                          } @else {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 5v14M5 12l7 7 7-7"/>
                            </svg>
                          }
                        } @else {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                            <path d="M12 5v14M5 12l7 7 7-7"/>
                          </svg>
                        }
                      </span>
                    }
                  </div>
                </th>
              }
              @if (showActions()) {
                <th class="actions-cell">{{ 'common.actions' | translate }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (i of [1,2,3,4,5]; track i) {
                <tr class="skeleton-row">
                  @if (selectable()) {
                    <td><div class="skeleton skeleton-checkbox"></div></td>
                  }
                  @for (column of columns(); track column.key) {
                    <td><div class="skeleton skeleton-text"></div></td>
                  }
                  @if (showActions()) {
                    <td><div class="skeleton skeleton-actions"></div></td>
                  }
                </tr>
              }
            } @else if (data().length === 0) {
              <tr class="empty-row">
                <td [attr.colspan]="totalColumns()">
                  <ng-content select="[emptyState]"></ng-content>
                </td>
              </tr>
            } @else {
              @for (row of data(); track trackByFn()(row); let i = $index) {
                <tr
                  [class.selected]="isSelected(row)"
                  [class.clickable]="rowClickable()"
                  (click)="onRowClick(row)"
                >
                  @if (selectable()) {
                    <td class="checkbox-cell" (click)="$event.stopPropagation()">
                      <input
                        type="checkbox"
                        [checked]="isSelected(row)"
                        (change)="toggleSelect(row)"
                      />
                    </td>
                  }
                  @for (column of columns(); track column.key) {
                    <td
                      [class.align-center]="column.align === 'center'"
                      [class.align-right]="column.align === 'right'"
                    >
                      @if (column.template) {
                        <ng-container
                          *ngTemplateOutlet="column.template; context: { $implicit: row, row: row, value: getValue(row, column.key), index: i }"
                        ></ng-container>
                      } @else {
                        {{ getValue(row, column.key) }}
                      }
                    </td>
                  }
                  @if (showActions()) {
                    <td class="actions-cell" (click)="$event.stopPropagation()">
                      <ng-container
                        *ngTemplateOutlet="actionsTemplate; context: { $implicit: row, row: row, index: i }"
                      ></ng-container>
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .data-table-container {
      background: var(--surface);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    thead {
      background: var(--surface-alt, #f8fafc);
      border-bottom: 1px solid var(--border);
    }

    th {
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      user-select: none;

      &.sortable {
        cursor: pointer;
        transition: color 0.2s, background-color 0.2s;

        &:hover {
          color: var(--primary);
          background: rgba(var(--primary-rgb), 0.05);
        }
      }

      &.sorted {
        color: var(--primary);
      }

      &.align-center {
        text-align: center;
      }

      &.align-right {
        text-align: right;
      }
    }

    .th-content {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sort-icon {
      display: flex;
      align-items: center;
      color: var(--primary);
    }

    .checkbox-cell {
      width: 48px;
      text-align: center;
    }

    .actions-cell {
      width: 120px;
      text-align: center;
    }

    tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background-color 0.15s;

      &:last-child {
        border-bottom: none;
      }

      &:hover:not(.skeleton-row):not(.empty-row) {
        background: var(--surface-hover, #f8fafc);
      }

      &.selected {
        background: rgba(var(--primary-rgb), 0.08);
      }

      &.clickable {
        cursor: pointer;
      }
    }

    td {
      padding: 14px 16px;
      color: var(--text);
      vertical-align: middle;

      &.align-center {
        text-align: center;
      }

      &.align-right {
        text-align: right;
      }
    }

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary);
    }

    .empty-row td {
      padding: 48px 16px;
      text-align: center;
    }

    /* Skeleton styles */
    .skeleton {
      background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-text {
      height: 16px;
      width: 80%;
    }

    .skeleton-checkbox {
      height: 18px;
      width: 18px;
      margin: 0 auto;
    }

    .skeleton-actions {
      height: 32px;
      width: 80px;
      margin: 0 auto;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class DataTableComponent<T = any> {
  columns = signal<TableColumn[]>([]);
  data = signal<T[]>([]);
  loading = signal(false);
  selectable = signal(false);
  showActions = signal(false);
  rowClickable = signal(false);
  trackByFn = signal<(item: T) => any>((item: any) => item.id);

  @Input() set columnDefs(value: TableColumn[]) { this.columns.set(value); }
  @Input() set items(value: T[]) { this.data.set(value); }
  @Input() set isLoading(value: boolean) { this.loading.set(value); }
  @Input() set enableSelection(value: boolean) { this.selectable.set(value); }
  @Input() set enableActions(value: boolean) { this.showActions.set(value); }
  @Input() set enableRowClick(value: boolean) { this.rowClickable.set(value); }
  @Input() set trackBy(value: (item: T) => any) { this.trackByFn.set(value); }
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
