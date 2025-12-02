import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ModalComponent } from '../modal';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, ModalComponent],
  template: `
    <app-modal
      [open]="isOpen()"
      [title]="title"
      modalSize="sm"
      [hasFooter]="false"
      (openChange)="onOpenChange($event)"
    >
      <div class="confirm-content">
        <div class="icon-container" [class]="'icon-' + variant()">
          @switch (variant()) {
            @case ('danger') {
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            }
            @case ('warning') {
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            }
            @default {
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            }
          }
        </div>
        <p class="message">{{ message | translate }}</p>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-secondary" (click)="onCancel()">
          {{ cancelText | translate }}
        </button>
        <button class="btn" [class]="'btn-' + variant()" [disabled]="loading()" (click)="onConfirm()">
          @if (loading()) {
            <span class="spinner"></span>
          }
          {{ confirmText | translate }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .confirm-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 8px 0 24px;
    }

    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      margin-bottom: 16px;
    }

    .icon-danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .icon-warning {
      background: #fef3c7;
      color: #d97706;
    }

    .icon-info {
      background: #dbeafe;
      color: #2563eb;
    }

    .message {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      max-width: 320px;
    }

    .confirm-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      padding-top: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
      min-width: 100px;

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background: var(--surface-alt, #f1f5f9);
      color: var(--text);
      border: 1px solid var(--border);

      &:hover:not(:disabled) {
        background: var(--surface-hover, #e2e8f0);
      }
    }

    .btn-danger {
      background: #dc2626;
      color: white;

      &:hover:not(:disabled) {
        background: #b91c1c;
      }
    }

    .btn-warning {
      background: #d97706;
      color: white;

      &:hover:not(:disabled) {
        background: #b45309;
      }
    }

    .btn-info {
      background: #2563eb;
      color: white;

      &:hover:not(:disabled) {
        background: #1d4ed8;
      }
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() title = 'common.confirm';
  @Input() message = 'common.confirmMessage';
  @Input() confirmText = 'common.confirm';
  @Input('confirmLabel') set confirmLabelAlias(value: string) { this.confirmText = value; }
  @Input() cancelText = 'common.cancel';
  @Input('cancelLabel') set cancelLabelAlias(value: string) { this.cancelText = value; }
  @Input('isOpen') set isOpenInput(value: boolean) { this.isOpen.set(value); }
  @Input() set open(value: boolean) { this.isOpen.set(value); }
  @Input('variant') set variantInput(value: ConfirmVariant) { this.variant.set(value); }
  @Input() set type(value: ConfirmVariant) { this.variant.set(value); }
  @Input() set isLoading(value: boolean) { this.loading.set(value); }

  @Output() openChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isOpen = signal(false);
  variant = signal<ConfirmVariant>('danger');
  loading = signal(false);

  onOpenChange(value: boolean): void {
    this.isOpen.set(value);
    this.openChange.emit(value);
  }

  onConfirm(): void {
    this.confirm.emit();
    this.confirmed.emit();
  }

  onCancel(): void {
    this.isOpen.set(false);
    this.openChange.emit(false);
    this.cancel.emit();
    this.cancelled.emit();
  }
}
