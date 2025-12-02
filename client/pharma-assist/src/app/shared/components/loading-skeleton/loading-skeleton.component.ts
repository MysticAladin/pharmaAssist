import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'table-row';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (variant()) {
      @case ('text') {
        <div class="skeleton skeleton-text" [style.width]="width()" [style.height]="height()"></div>
      }
      @case ('circle') {
        <div class="skeleton skeleton-circle" [style.width]="width()" [style.height]="width()"></div>
      }
      @case ('rect') {
        <div class="skeleton skeleton-rect" [style.width]="width()" [style.height]="height()"></div>
      }
      @case ('card') {
        <div class="skeleton-card">
          <div class="skeleton skeleton-rect" style="height: 160px;"></div>
          <div class="skeleton-card-content">
            <div class="skeleton skeleton-text" style="width: 70%; height: 20px;"></div>
            <div class="skeleton skeleton-text" style="width: 100%; height: 14px;"></div>
            <div class="skeleton skeleton-text" style="width: 90%; height: 14px;"></div>
          </div>
        </div>
      }
      @case ('table-row') {
        <div class="skeleton-table-row">
          @for (_ of columns(); track $index) {
            <div class="skeleton skeleton-text"></div>
          }
        </div>
      }
      @default {
        <div class="skeleton skeleton-rect" [style.width]="width()" [style.height]="height()"></div>
      }
    }
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-text {
      height: 16px;
      width: 100%;
      border-radius: 4px;
    }

    .skeleton-circle {
      border-radius: 50%;
    }

    .skeleton-rect {
      width: 100%;
      height: 100px;
      border-radius: 8px;
    }

    .skeleton-card {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--surface);
    }

    .skeleton-card-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-table-row {
      display: flex;
      gap: 16px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }

    .skeleton-table-row .skeleton {
      flex: 1;
      height: 16px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() set type(value: SkeletonVariant) { this.variant.set(value); }
  @Input() set skeletonWidth(value: string) { this.width.set(value); }
  @Input() set skeletonHeight(value: string) { this.height.set(value); }
  @Input() set columnCount(value: number) { this.columns.set(Array(value).fill(0)); }

  variant = signal<SkeletonVariant>('text');
  width = signal('100%');
  height = signal('16px');
  columns = signal<number[]>([1, 2, 3, 4, 5]);
}
