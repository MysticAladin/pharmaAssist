import { Injectable, signal, computed } from '@angular/core';
import {
  VirtualScrollConfig,
  VirtualScrollState,
  VirtualScrollRange,
  VirtualTableConfig,
  DEFAULT_VIRTUAL_TABLE_CONFIG
} from '../models/virtual-scroll.model';

/**
 * Service for managing virtual scrolling calculations
 * Optimizes performance for large data sets by only rendering visible items
 */
@Injectable({
  providedIn: 'root'
})
export class VirtualScrollService {

  /**
   * Calculate the visible range of items based on scroll position
   */
  calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    bufferSize: number = 5
  ): VirtualScrollRange {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const endIndex = Math.min(totalItems, startIndex + visibleCount + bufferSize * 2);
    const offset = startIndex * itemHeight;

    return { start: startIndex, end: endIndex, offset };
  }

  /**
   * Calculate virtual scroll state for a container
   */
  calculateScrollState(
    config: VirtualScrollConfig,
    scrollTop: number
  ): VirtualScrollState {
    const { itemHeight, bufferSize, containerHeight, totalItems } = config;
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const endIndex = Math.min(totalItems, startIndex + visibleItems + bufferSize * 2);
    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY, visibleItems };
  }

  /**
   * Get total height of all items for scroll container
   */
  getTotalHeight(itemCount: number, itemHeight: number): number {
    return itemCount * itemHeight;
  }

  /**
   * Check if we should load more items (for infinite scroll)
   */
  shouldLoadMore(
    scrollTop: number,
    containerHeight: number,
    totalHeight: number,
    threshold: number = 200
  ): boolean {
    return scrollTop + containerHeight >= totalHeight - threshold;
  }

  /**
   * Create a virtual scroll tracker for a data source
   */
  createVirtualTracker<T>(
    items: T[],
    config: VirtualTableConfig = DEFAULT_VIRTUAL_TABLE_CONFIG
  ) {
    const scrollTop = signal(0);
    const containerHeight = signal(400);

    const range = computed(() => {
      return this.calculateVisibleRange(
        scrollTop(),
        containerHeight(),
        config.rowHeight,
        items.length,
        config.bufferRows
      );
    });

    const visibleItems = computed(() => {
      const { start, end } = range();
      return items.slice(start, end);
    });

    const totalHeight = computed(() => {
      return this.getTotalHeight(items.length, config.rowHeight);
    });

    const offsetY = computed(() => range().offset);

    return {
      scrollTop,
      containerHeight,
      range,
      visibleItems,
      totalHeight,
      offsetY,
      updateScroll: (top: number) => scrollTop.set(top),
      updateContainerHeight: (height: number) => containerHeight.set(height)
    };
  }

  /**
   * Debounce scroll events for better performance
   */
  createScrollDebouncer(callback: (scrollTop: number) => void, delay: number = 16) {
    let rafId: number | null = null;
    let lastScrollTop = 0;

    return (scrollTop: number) => {
      lastScrollTop = scrollTop;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          callback(lastScrollTop);
          rafId = null;
        });
      }
    };
  }

  /**
   * Calculate optimal buffer size based on scroll velocity
   */
  calculateDynamicBuffer(
    velocity: number,
    baseBuffer: number = 5,
    maxBuffer: number = 15
  ): number {
    const velocityFactor = Math.min(Math.abs(velocity) / 100, 1);
    return Math.round(baseBuffer + (maxBuffer - baseBuffer) * velocityFactor);
  }
}
