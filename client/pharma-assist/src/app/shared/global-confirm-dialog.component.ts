import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService } from '../core/services/confirmation.service';
import { ModalComponent } from './components/modal';

@Component({
  selector: 'app-global-confirm-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, ModalComponent],
  template: `
    @if (state(); as s) {
      <app-modal
        [open]="s.isOpen"
        [title]="s.title | translate"
        modalSize="sm"
        [hasFooter]="false"
        (openChange)="onOpenChange($event)"
      >
        <div class="confirm-content">
          <div class="icon-container" [class]="'icon-' + s.variant">
            @switch (s.variant) {
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
          <p class="message">{{ s.message | translate }}</p>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" (click)="onCancel()">
            {{ s.cancelText | translate }}
          </button>
          <button class="btn" [class]="'btn-' + s.variant" (click)="onConfirm()">
            {{ s.confirmText | translate }}
          </button>
        </div>
      </app-modal>
    }
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
      justify-content: center;
      gap: 12px;
      padding-top: 8px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    .btn-warning {
      background: #d97706;
      color: white;
    }

    .btn-warning:hover {
      background: #b45309;
    }

    .btn-info {
      background: #2563eb;
      color: white;
    }

    .btn-info:hover {
      background: #1d4ed8;
    }
  `]
})
export class GlobalConfirmDialogComponent {
  private readonly confirmationService = inject(ConfirmationService);

  state = this.confirmationService.state;

  onOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirmationService.handleConfirm();
  }

  onCancel(): void {
    this.confirmationService.handleCancel();
  }
}
