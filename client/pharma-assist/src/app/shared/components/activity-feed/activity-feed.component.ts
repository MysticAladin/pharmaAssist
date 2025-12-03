import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivityService, Activity, ActivityType } from '../../../core/services/activity.service';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="activity-feed">
      <div class="feed-header">
        <h3>{{ 'dashboard.recentActivity' | translate }}</h3>
        <span class="today-count">{{ todayCount() }} {{ 'dashboard.today' | translate }}</span>
      </div>

      <div class="feed-content">
        @if (activities().length === 0) {
          <div class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 8v4l3 3"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            <p>{{ 'dashboard.noRecentActivity' | translate }}</p>
          </div>
        } @else {
          <div class="activity-list">
            @for (activity of activities(); track activity.id) {
              <div class="activity-item" (click)="handleClick(activity)">
                <div class="activity-icon" [class]="'icon-' + getIconColor(activity.type)">
                  @switch (activity.type) {
                    @case ('order_created') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                      </svg>
                    }
                    @case ('order_shipped') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="3" width="15" height="13"/>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                        <circle cx="5.5" cy="18.5" r="2.5"/>
                        <circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                    }
                    @case ('order_delivered') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    }
                    @case ('order_cancelled') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    }
                    @case ('prescription_dispensed') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                        <polyline points="9 14 11 16 15 12"/>
                      </svg>
                    }
                    @case ('product_added') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <line x1="12" y1="10" x2="12" y2="16"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                      </svg>
                    }
                    @case ('stock_adjusted') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        <polyline points="2 17 12 22 22 17"/>
                        <polyline points="2 12 12 17 22 12"/>
                      </svg>
                    }
                    @case ('customer_registered') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                    }
                    @case ('payment_received') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                    }
                    @default {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    }
                  }
                </div>

                <div class="activity-content">
                  <span class="activity-title">{{ activity.title }}</span>
                  <span class="activity-desc">{{ activity.description }}</span>
                </div>

                <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .activity-feed {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--border-color, #e5e7eb);
      overflow: hidden;
    }

    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .feed-header h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a2e);
      margin: 0;
    }

    .today-count {
      font-size: 0.75rem;
      color: var(--pharma-teal, #0d9488);
      background: rgba(13, 148, 136, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .feed-content {
      max-height: 320px;
      overflow-y: auto;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      color: var(--text-secondary, #6b7280);
    }

    .empty-state svg {
      opacity: 0.4;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    .activity-list {
      padding: 0.5rem 0;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .activity-item:hover {
      background: var(--bg-hover, #f9fafb);
    }

    .activity-icon {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-blue { background: #dbeafe; color: #2563eb; }
    .icon-green { background: #d1fae5; color: #059669; }
    .icon-red { background: #fee2e2; color: #dc2626; }
    .icon-orange { background: #fed7aa; color: #ea580c; }
    .icon-purple { background: #e9d5ff; color: #7c3aed; }
    .icon-teal { background: #ccfbf1; color: #0d9488; }
    .icon-indigo { background: #e0e7ff; color: #4f46e5; }

    .activity-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .activity-title {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-primary, #1a1a2e);
    }

    .activity-desc {
      font-size: 0.75rem;
      color: var(--text-secondary, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .activity-time {
      flex-shrink: 0;
      font-size: 0.7rem;
      color: var(--text-tertiary, #9ca3af);
    }
  `]
})
export class ActivityFeedComponent {
  private readonly activityService = inject(ActivityService);

  activities = this.activityService.recentActivities;
  todayCount = () => this.activityService.todayActivities().length;

  getIconColor(type: ActivityType): string {
    const colors: Record<ActivityType, string> = {
      order_created: 'blue',
      order_shipped: 'indigo',
      order_delivered: 'green',
      order_cancelled: 'red',
      prescription_dispensed: 'teal',
      product_added: 'green',
      product_updated: 'blue',
      stock_adjusted: 'orange',
      customer_registered: 'purple',
      payment_received: 'green'
    };
    return colors[type] || 'blue';
  }

  formatTime(date: Date): string {
    return this.activityService.formatRelativeTime(date);
  }

  handleClick(activity: any): void {
    this.activityService.navigateToEntity(activity);
  }
}
