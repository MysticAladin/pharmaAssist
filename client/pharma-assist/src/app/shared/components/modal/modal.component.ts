import { Component, Input, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div
          class="modal-container"
          [class.modal-sm]="size() === 'sm'"
          [class.modal-md]="size() === 'md'"
          [class.modal-lg]="size() === 'lg'"
          [class.modal-xl]="size() === 'xl'"
          role="dialog"
          aria-modal="true"
        >
          <div class="modal-header">
            <h2 class="modal-title">{{ title | translate }}</h2>
            @if (showCloseButton()) {
              <button class="close-btn" (click)="close()" type="button" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            }
          </div>
          <div class="modal-body">
            <ng-content></ng-content>
          </div>
          @if (showFooter()) {
            <div class="modal-footer">
              <ng-content select="[modalFooter]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-container {
      background: var(--surface);
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      animation: slideIn 0.2s ease-out;
      overflow: hidden;
    }

    .modal-sm { width: 100%; max-width: 400px; }
    .modal-md { width: 100%; max-width: 560px; }
    .modal-lg { width: 100%; max-width: 720px; }
    .modal-xl { width: 100%; max-width: 960px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }

    .modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--text-muted);
      border-radius: 8px;
      transition: color 0.2s, background-color 0.2s;

      &:hover {
        color: var(--text);
        background: var(--surface-hover, #f1f5f9);
      }
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      background: var(--surface-alt, #f8fafc);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ModalComponent {
  @Input() title = '';
  @Input('isOpen') set isOpenInput(value: boolean) { this.isOpen.set(value); }
  @Input() set open(value: boolean) { this.isOpen.set(value); }
  @Input('size') set modalSize(value: 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'medium' | 'large') {
    // Map alternative size names
    const sizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl'> = { small: 'sm', medium: 'md', large: 'lg' };
    this.size.set(sizeMap[value as string] || (value as 'sm' | 'md' | 'lg' | 'xl'));
  }
  @Input() set closeOnOverlay(value: boolean) { this.closeOnOverlayClick.set(value); }
  @Input() set closeOnEscape(value: boolean) { this.closeOnEsc.set(value); }
  @Input() set hasCloseButton(value: boolean) { this.showCloseButton.set(value); }
  @Input() set hasFooter(value: boolean) { this.showFooter.set(value); }

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  isOpen = signal(false);
  size = signal<'sm' | 'md' | 'lg' | 'xl'>('md');
  closeOnOverlayClick = signal(true);
  closeOnEsc = signal(true);
  showCloseButton = signal(true);
  showFooter = signal(true);

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen() && this.closeOnEsc()) {
      this.close();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && this.closeOnOverlayClick()) {
      this.close();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.openChange.emit(false);
    this.closed.emit();
    this.closeModal.emit();
  }
}
