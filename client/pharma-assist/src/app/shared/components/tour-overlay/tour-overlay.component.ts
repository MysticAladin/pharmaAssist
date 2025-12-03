import { Component, inject, computed, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HelpService } from '../../../core/services/help.service';

@Component({
  selector: 'app-tour-overlay',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (helpService.isTourActive()) {
      <div class="tour-overlay">
        <!-- Backdrop -->
        <div class="tour-backdrop" (click)="helpService.skipTour()"></div>

        <!-- Tooltip -->
        @if (helpService.currentStep(); as step) {
          <div
            #tooltip
            class="tour-tooltip"
            [class]="'position-' + step.position"
            [style.top.px]="tooltipPosition().top"
            [style.left.px]="tooltipPosition().left"
          >
            <div class="tooltip-header">
              <h4>{{ step.title | translate }}</h4>
              <span class="step-counter">
                {{ helpService.currentStepIndex() + 1 }} / {{ helpService.totalSteps() }}
              </span>
            </div>

            <div class="tooltip-content">
              <p>{{ step.content | translate }}</p>
            </div>

            <div class="tooltip-actions">
              <button class="btn-skip" (click)="helpService.skipTour()">
                {{ 'help.tour.skip' | translate }}
              </button>

              <div class="nav-buttons">
                @if (!helpService.isFirstStep()) {
                  <button class="btn-prev" (click)="helpService.previousStep()">
                    ← {{ 'help.tour.previous' | translate }}
                  </button>
                }

                <button class="btn-next" (click)="helpService.nextStep()">
                  @if (helpService.isLastStep()) {
                    {{ 'help.tour.finish' | translate }} ✓
                  } @else {
                    {{ 'help.tour.next' | translate }} →
                  }
                </button>
              </div>
            </div>

            <!-- Arrow pointer -->
            <div class="tooltip-arrow"></div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .tour-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
    }

    .tour-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      pointer-events: auto;
    }

    .tour-tooltip {
      position: absolute;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      z-index: 10001;
      animation: tooltipFadeIn 0.2s ease-out;
    }

    @keyframes tooltipFadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tooltip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px 12px;
      border-bottom: 1px solid #e5e7eb;

      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #111827;
      }
    }

    .step-counter {
      font-size: 0.75rem;
      color: #6b7280;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 12px;
    }

    .tooltip-content {
      padding: 16px 20px;

      p {
        margin: 0;
        font-size: 0.875rem;
        color: #4b5563;
        line-height: 1.5;
      }
    }

    .tooltip-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px 16px;
      border-top: 1px solid #e5e7eb;
    }

    .btn-skip {
      padding: 6px 12px;
      font-size: 0.8125rem;
      color: #6b7280;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        color: #374151;
      }
    }

    .nav-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-prev,
    .btn-next {
      padding: 8px 16px;
      font-size: 0.8125rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-prev {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;

      &:hover {
        background: #f9fafb;
      }
    }

    .btn-next {
      background: var(--primary, #4f46e5);
      border: none;
      color: white;

      &:hover {
        background: var(--primary-dark, #4338ca);
      }
    }

    /* Arrow styles */
    .tooltip-arrow {
      position: absolute;
      width: 12px;
      height: 12px;
      background: white;
      transform: rotate(45deg);
    }

    .position-bottom .tooltip-arrow {
      top: -6px;
      left: 50%;
      margin-left: -6px;
      box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.05);
    }

    .position-top .tooltip-arrow {
      bottom: -6px;
      left: 50%;
      margin-left: -6px;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
    }

    .position-left .tooltip-arrow {
      right: -6px;
      top: 50%;
      margin-top: -6px;
      box-shadow: 2px -2px 4px rgba(0, 0, 0, 0.05);
    }

    .position-right .tooltip-arrow {
      left: -6px;
      top: 50%;
      margin-top: -6px;
      box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.05);
    }

    /* Highlight style (applied to target elements) */
    :global(.tour-highlight) {
      position: relative;
      z-index: 10000 !important;
      box-shadow: 0 0 0 4px var(--primary, #4f46e5), 0 0 0 8px rgba(79, 70, 229, 0.2) !important;
      border-radius: 8px;
    }
  `]
})
export class TourOverlayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('tooltip') tooltipRef!: ElementRef<HTMLDivElement>;

  readonly helpService = inject(HelpService);

  private resizeObserver?: ResizeObserver;

  tooltipPosition = computed(() => {
    const step = this.helpService.currentStep();
    if (!step) return { top: 0, left: 0 };

    const target = document.querySelector(step.targetSelector);
    if (!target) return { top: 100, left: 100 };

    const rect = target.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + padding;
        break;
    }

    // Keep within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return { top, left };
  });

  ngAfterViewInit(): void {
    // Recalculate position on resize
    if (typeof window !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        // Trigger recalculation
      });
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
