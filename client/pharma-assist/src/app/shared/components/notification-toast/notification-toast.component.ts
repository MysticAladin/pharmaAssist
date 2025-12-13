import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (notification of notifications(); track notification.id) {
        <div class="toast" [class]="'toast-' + notification.type">
          <div class="toast-icon">
            @switch (notification.type) {
              @case ('success') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              }
              @case ('error') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              }
              @case ('warning') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              @case ('info') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            }
          </div>
          <div class="toast-content">
            <p class="toast-title">{{ notification.title }}</p>
            @if (notification.message) {
              <p class="toast-message">{{ notification.message }}</p>
            }
          </div>
          @if (notification.dismissible !== false) {
            <button class="toast-close" (click)="dismiss(notification.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      background: var(--surface-primary);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-left: 4px solid;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      border-left-color: var(--color-success);
    }
    .toast-success .toast-icon { color: var(--color-success); }

    .toast-error {
      border-left-color: var(--color-error);
    }
    .toast-error .toast-icon { color: var(--color-error); }

    .toast-warning {
      border-left-color: var(--color-warning);
    }
    .toast-warning .toast-icon { color: var(--color-warning); }

    .toast-info {
      border-left-color: var(--brand-primary);
    }
    .toast-info .toast-icon { color: var(--brand-primary); }

    .toast-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .toast-message {
      margin: 0.25rem 0 0;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .toast-close {
      flex-shrink: 0;
      padding: 0;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.2s;
    }

    .toast-close:hover {
      color: var(--text-secondary);
    }

    @media (max-width: 480px) {
      .toast-container {
        left: 1rem;
        right: 1rem;
        max-width: none;
      }
    }
  `]
})
export class NotificationToastComponent {
  private readonly notificationService = inject(NotificationService);

  notifications = this.notificationService.toasts;

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}
