import { Component, Input, Output, EventEmitter, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="search-input-container" [class.focused]="focused()">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        class="search-input"
        [placeholder]="placeholder | translate"
        [value]="value()"
        (input)="onInput($event)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
        (keydown.escape)="clear()"
      />
      @if (value()) {
        <button class="clear-btn" (click)="clear()" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      }
    </div>
  `,
  styles: [`
    .search-input-container {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0 12px;
      transition: border-color 0.2s, box-shadow 0.2s;
      min-width: 240px;

      &:hover {
        border-color: var(--border-hover, #94a3b8);
      }

      &.focused {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
      }
    }

    .search-icon {
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 10px 8px;
      font-size: 14px;
      color: var(--text);
      outline: none;
      min-width: 0;

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: var(--text-muted);
      border-radius: 4px;
      transition: color 0.2s, background-color 0.2s;

      &:hover {
        color: var(--text);
        background: var(--surface-hover, #f1f5f9);
      }
    }
  `]
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'common.search';
  @Input() debounceMs = 300;
  @Input() set debounceTime(val: number) { this.debounceMs = val; }
  @Input() set initialValue(val: string) { this.value.set(val); }

  @Output() searchChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();

  value = signal('');
  focused = signal(false);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.search.emit(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.searchChange.emit(value);
    this.searchSubject.next(value);
  }

  clear(): void {
    this.value.set('');
    this.searchChange.emit('');
    this.search.emit('');
  }
}
