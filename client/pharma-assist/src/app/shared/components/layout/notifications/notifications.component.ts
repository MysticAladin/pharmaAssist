import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIStateService } from '../../../../core/state/ui-state.service';
import { INotification } from '../../../../core/models/common.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      @for (notification of notifications$ | async; track notification.id ?? $index) {
        <div
          class="notification"
          [class]="'notification-' + notification.type"
          [@slideIn]>
          <div class="notification-icon">
            <i [class]="getIconClass(notification.type)"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            @if (notification.message) {
              <div class="notification-message">{{ notification.message }}</div>
            }
          </div>
          @if (notification.dismissible !== false && notification.id) {
            <button
              class="notification-close"
              (click)="dismiss(notification.id)"
              aria-label="Dismiss notification">
              <i class="icon-x"></i>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }

    .notification {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
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

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon i {
      font-size: 20px;
      color: #fff;
    }

    .notification-success .notification-icon {
      background-color: #10b981;
    }

    .notification-error .notification-icon {
      background-color: #ef4444;
    }

    .notification-warning .notification-icon {
      background-color: #f59e0b;
    }

    .notification-info .notification-icon {
      background-color: #3b82f6;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .notification-message {
      font-size: 13px;
      color: #64748b;
      line-height: 1.4;
    }

    .notification-close {
      background: none;
      border: none;
      padding: 4px;
      color: #94a3b8;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .notification-close:hover {
      background-color: #f1f5f9;
      color: #475569;
    }

    /* Dark mode */
    :host-context(.dark) .notification {
      background-color: #1e293b;
    }

    :host-context(.dark) .notification-title {
      color: #f8fafc;
    }

    :host-context(.dark) .notification-message {
      color: #94a3b8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .notifications-container {
        right: 16px;
        left: 16px;
        max-width: none;
      }
    }
  `]
})
export class NotificationsComponent {
  private readonly uiState = inject(UIStateService);

  notifications$ = this.uiState.notifications$;

  getIconClass(type: INotification['type']): string {
    switch (type) {
      case 'success':
        return 'icon-check-circle';
      case 'error':
        return 'icon-x-circle';
      case 'warning':
        return 'icon-alert-triangle';
      case 'info':
      default:
        return 'icon-info';
    }
  }

  dismiss(id: string): void {
    this.uiState.dismissNotification(id);
  }
}
