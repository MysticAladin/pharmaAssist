import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  ElementRef,
  viewChild,
  contentChild,
  TemplateRef,
  inject,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualScrollService } from '../../../core/services/virtual-scroll.service';
import {
  VirtualTableConfig,
  DEFAULT_VIRTUAL_TABLE_CONFIG
} from '../../../core/models/virtual-scroll.model';

/**
 * Virtual Scroll Container Component
 * Renders only visible items for optimal performance with large data sets
 *
 * Usage:
 * <app-virtual-scroll
 *   [items]="largeDataArray"
 *   [itemHeight]="48"
 *   [containerHeight]="400"
 *   [trackBy]="trackByFn">
 *   <ng-template #itemTemplate let-item let-index="index">
 *     <div class="item">{{ item.name }}</div>
 *   </ng-template>
 * </app-virtual-scroll>
 */
@Component({
  selector: 'app-virtual-scroll',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #scrollContainer
      class="virtual-scroll-container"
      [style.height.px]="containerHeight()"
      (scroll)="onScroll($event)">

      <!-- Spacer to create full scroll height -->
      <div
        class="virtual-scroll-spacer"
        [style.height.px]="totalHeight()">
      </div>

      <!-- Visible items container -->
      <div
        class="virtual-scroll-content"
        [style.transform]="'translateY(' + offsetY() + 'px)'">

        @for (item of visibleItems(); track trackByFn()(range().start + $index, item); let i = $index) {
          <div
            class="virtual-scroll-item"
            [style.height.px]="itemHeight()"
            [attr.data-index]="range().start + i">
            <ng-container
              [ngTemplateOutlet]="itemTemplate()"
              [ngTemplateOutletContext]="{ $implicit: item, index: range().start + i }">
            </ng-container>
          </div>
        }
      </div>
    </div>

    @if (showScrollIndicator() && isScrolling()) {
      <div class="scroll-indicator">
        <span>{{ scrollPosition() }} / {{ items().length }}</span>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .virtual-scroll-container {
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
      will-change: scroll-position;
      -webkit-overflow-scrolling: touch;
    }

    .virtual-scroll-spacer {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      pointer-events: none;
    }

    .virtual-scroll-content {
      position: relative;
      will-change: transform;
    }

    .virtual-scroll-item {
      box-sizing: border-box;
      contain: layout style;
    }

    .scroll-indicator {
      position: absolute;
      top: 8px;
      right: 24px;
      padding: 4px 12px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 10;
      opacity: 0.8;
      transition: opacity 0.2s ease;
    }

    /* Dark mode */
    :host-context(.dark) .scroll-indicator {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Scrollbar styling */
    .virtual-scroll-container::-webkit-scrollbar {
      width: 8px;
    }

    .virtual-scroll-container::-webkit-scrollbar-track {
      background: var(--surface-ground);
      border-radius: 4px;
    }

    .virtual-scroll-container::-webkit-scrollbar-thumb {
      background: var(--surface-400, #ccc);
      border-radius: 4px;
    }

    .virtual-scroll-container::-webkit-scrollbar-thumb:hover {
      background: var(--surface-500, #999);
    }
  `]
})
export class VirtualScrollComponent<T> implements AfterViewInit, OnDestroy {
  private virtualScrollService = inject(VirtualScrollService);

  // Inputs
  items = signal<T[]>([]);
  itemHeight = signal(48);
  containerHeight = signal(400);
  bufferSize = signal(5);
  showScrollIndicator = signal(true);
  trackByFn = signal<(index: number, item: T) => any>((index) => index);

  @Input() set data(value: T[]) {
    this.items.set(value || []);
  }

  @Input() set height(value: number) {
    this.itemHeight.set(value);
  }

  @Input() set viewportHeight(value: number) {
    this.containerHeight.set(value);
  }

  @Input() set buffer(value: number) {
    this.bufferSize.set(value);
  }

  @Input() set showIndicator(value: boolean) {
    this.showScrollIndicator.set(value);
  }

  @Input() set trackBy(fn: (index: number, item: T) => any) {
    this.trackByFn.set(fn);
  }

  // Outputs
  @Output() scrollEnd = new EventEmitter<void>();
  @Output() rangeChange = new EventEmitter<{ start: number; end: number }>();

  // View children
  scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  itemTemplate = contentChild.required<TemplateRef<any>>('itemTemplate');

  // State
  private scrollTop = signal(0);
  isScrolling = signal(false);
  private scrollTimeout: any;
  private resizeObserver: ResizeObserver | null = null;

  // Computed values
  range = computed(() => {
    return this.virtualScrollService.calculateVisibleRange(
      this.scrollTop(),
      this.containerHeight(),
      this.itemHeight(),
      this.items().length,
      this.bufferSize()
    );
  });

  visibleItems = computed(() => {
    const { start, end } = this.range();
    return this.items().slice(start, end);
  });

  totalHeight = computed(() => {
    return this.virtualScrollService.getTotalHeight(
      this.items().length,
      this.itemHeight()
    );
  });

  offsetY = computed(() => this.range().offset);

  scrollPosition = computed(() => {
    const { start, end } = this.range();
    return Math.floor((start + end) / 2);
  });

  // Debounced scroll handler
  private handleScroll = this.virtualScrollService.createScrollDebouncer(
    (scrollTop: number) => {
      this.scrollTop.set(scrollTop);
      this.checkScrollEnd(scrollTop);
    }
  );

  constructor() {
    // Emit range changes
    effect(() => {
      const { start, end } = this.range();
      this.rangeChange.emit({ start, end });
    });
  }

  ngAfterViewInit() {
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver() {
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.containerHeight.set(entry.contentRect.height);
      }
    });

    this.resizeObserver.observe(container);
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    this.handleScroll(target.scrollTop);

    // Show scroll indicator
    this.isScrolling.set(true);
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling.set(false);
    }, 1000);
  }

  private checkScrollEnd(scrollTop: number) {
    const shouldLoad = this.virtualScrollService.shouldLoadMore(
      scrollTop,
      this.containerHeight(),
      this.totalHeight(),
      200
    );

    if (shouldLoad) {
      this.scrollEnd.emit();
    }
  }

  /**
   * Scroll to a specific item index
   */
  scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    const targetTop = index * this.itemHeight();
    container.scrollTo({ top: targetTop, behavior });
  }

  /**
   * Scroll to top
   */
  scrollToTop(behavior: ScrollBehavior = 'smooth') {
    this.scrollToIndex(0, behavior);
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    container.scrollTo({ top: this.totalHeight(), behavior });
  }
}
