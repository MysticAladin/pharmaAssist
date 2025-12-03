import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import {
  PerformanceMetric,
  PerformanceCategory,
  PerformanceUnit,
  PerformanceSummary,
  MemoryInfo,
  ApiPerformanceMetrics,
  EndpointMetrics,
  RenderMetrics,
  PerformanceAlert,
  DEFAULT_THRESHOLDS,
  PerformanceThresholds
} from '../models/performance.model';

/**
 * Performance Monitoring Service
 * Tracks and reports on application performance metrics
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private ngZone = inject(NgZone);

  // Metrics storage
  private metrics = signal<PerformanceMetric[]>([]);
  private apiMetrics = new Map<string, EndpointMetrics>();
  private renderMetrics = new Map<string, RenderMetrics>();
  private alerts = signal<PerformanceAlert[]>([]);

  // Configuration
  private thresholds = signal<PerformanceThresholds>(DEFAULT_THRESHOLDS);
  private isEnabled = signal(true);

  // Computed summaries
  summary = computed<PerformanceSummary>(() => this.calculateSummary());
  recentAlerts = computed(() => this.alerts().slice(-10));

  /**
   * Record a performance metric
   */
  record(
    name: string,
    value: number,
    category: PerformanceCategory,
    unit: PerformanceUnit = PerformanceUnit.MILLISECONDS,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled()) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      category,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.update(m => [...m.slice(-999), metric]);
    this.checkThresholds(metric);
  }

  /**
   * Track API request performance
   */
  trackApiRequest(
    endpoint: string,
    startTime: number,
    success: boolean = true
  ): void {
    const duration = performance.now() - startTime;
    const existing = this.apiMetrics.get(endpoint) || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0
    };

    existing.count++;
    existing.totalTime += duration;
    existing.averageTime = existing.totalTime / existing.count;
    existing.minTime = Math.min(existing.minTime, duration);
    existing.maxTime = Math.max(existing.maxTime, duration);
    if (!success) existing.errors++;

    this.apiMetrics.set(endpoint, existing);

    this.record(
      `api:${endpoint}`,
      duration,
      PerformanceCategory.API,
      PerformanceUnit.MILLISECONDS,
      { success }
    );
  }

  /**
   * Track component render performance
   */
  trackRender(componentName: string, renderTime: number): void {
    const existing = this.renderMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0
    };

    existing.renderCount++;
    existing.totalRenderTime += renderTime;
    existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
    existing.lastRenderTime = renderTime;

    this.renderMetrics.set(componentName, existing);

    if (renderTime > this.thresholds().renderTime) {
      this.record(
        `render:${componentName}`,
        renderTime,
        PerformanceCategory.RENDERING,
        PerformanceUnit.MILLISECONDS
      );
    }
  }

  /**
   * Create a render tracker for a component
   */
  createRenderTracker(componentName: string): () => void {
    const start = performance.now();
    return () => {
      this.trackRender(componentName, performance.now() - start);
    };
  }

  /**
   * Measure async operation
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    category: PerformanceCategory = PerformanceCategory.CUSTOM
  ): Promise<T> {
    const start = performance.now();
    try {
      return await operation();
    } finally {
      this.record(name, performance.now() - start, category);
    }
  }

  /**
   * Measure sync operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    category: PerformanceCategory = PerformanceCategory.CUSTOM
  ): T {
    const start = performance.now();
    try {
      return operation();
    } finally {
      this.record(name, performance.now() - start, category);
    }
  }

  /**
   * Get Web Vitals metrics
   */
  getWebVitals(): Partial<PerformanceSummary> {
    if (typeof window === 'undefined' || !window.performance) {
      return {};
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(e => e.name === 'first-contentful-paint');

    return {
      pageLoadTime: navigation?.loadEventEnd - navigation?.startTime || 0,
      firstContentfulPaint: fcp?.startTime || 0,
      timeToInteractive: navigation?.domInteractive - navigation?.startTime || 0
    };
  }

  /**
   * Get memory usage (Chrome only)
   */
  getMemoryInfo(): MemoryInfo | undefined {
    const memory = (performance as any).memory;
    if (!memory) return undefined;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }

  /**
   * Get API metrics summary
   */
  getApiMetricsSummary(): ApiPerformanceMetrics {
    const endpoints = Object.fromEntries(this.apiMetrics);
    const values = Array.from(this.apiMetrics.values());

    const totalRequests = values.reduce((sum, m) => sum + m.count, 0);
    const totalTime = values.reduce((sum, m) => sum + m.totalTime, 0);
    const totalErrors = values.reduce((sum, m) => sum + m.errors, 0);

    let slowest = '';
    let fastest = '';
    let slowestTime = 0;
    let fastestTime = Infinity;

    this.apiMetrics.forEach((metrics, endpoint) => {
      if (metrics.averageTime > slowestTime) {
        slowestTime = metrics.averageTime;
        slowest = endpoint;
      }
      if (metrics.averageTime < fastestTime) {
        fastestTime = metrics.averageTime;
        fastest = endpoint;
      }
    });

    return {
      totalRequests,
      averageResponseTime: totalRequests > 0 ? totalTime / totalRequests : 0,
      slowestEndpoint: slowest,
      fastestEndpoint: fastest,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      requestsByEndpoint: endpoints
    };
  }

  /**
   * Get render metrics for all components
   */
  getRenderMetrics(): RenderMetrics[] {
    return Array.from(this.renderMetrics.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }

  /**
   * Calculate full performance summary
   */
  private calculateSummary(): PerformanceSummary {
    const webVitals = this.getWebVitals();
    const memory = this.getMemoryInfo();
    const api = this.getApiMetricsSummary();

    return {
      pageLoadTime: webVitals.pageLoadTime || 0,
      firstContentfulPaint: webVitals.firstContentfulPaint || 0,
      largestContentfulPaint: 0, // Requires PerformanceObserver
      timeToInteractive: webVitals.timeToInteractive || 0,
      totalBlockingTime: 0, // Requires PerformanceObserver
      cumulativeLayoutShift: 0, // Requires PerformanceObserver
      memoryUsage: memory,
      apiMetrics: api
    };
  }

  /**
   * Check thresholds and create alerts
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const thresholds = this.thresholds();
    let threshold: number | undefined;
    let type: 'warning' | 'error' = 'warning';

    switch (metric.category) {
      case PerformanceCategory.API:
        threshold = thresholds.apiResponse;
        if (metric.value > threshold * 2) type = 'error';
        break;
      case PerformanceCategory.RENDERING:
        threshold = thresholds.renderTime;
        if (metric.value > threshold * 3) type = 'error';
        break;
      case PerformanceCategory.NAVIGATION:
        threshold = thresholds.pageLoad;
        if (metric.value > threshold * 1.5) type = 'error';
        break;
    }

    if (threshold && metric.value > threshold) {
      const alert: PerformanceAlert = {
        type,
        metric: metric.name,
        value: metric.value,
        threshold,
        message: `${metric.name} took ${metric.value.toFixed(2)}${metric.unit} (threshold: ${threshold}${metric.unit})`,
        timestamp: Date.now()
      };

      this.alerts.update(a => [...a.slice(-99), alert]);
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.set([]);
    this.apiMetrics.clear();
    this.renderMetrics.clear();
    this.alerts.set([]);
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      summary: this.summary(),
      metrics: this.metrics(),
      apiMetrics: Object.fromEntries(this.apiMetrics),
      renderMetrics: Array.from(this.renderMetrics.values()),
      alerts: this.alerts()
    }, null, 2);
  }

  /**
   * Start observing Web Vitals (LCP, CLS, etc.)
   */
  observeWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      // Observe LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.record(
            'largest-contentful-paint',
            lastEntry.startTime,
            PerformanceCategory.RENDERING
          );
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // Observe layout shifts
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Record CLS on page hide
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            this.record(
              'cumulative-layout-shift',
              clsValue,
              PerformanceCategory.RENDERING,
              PerformanceUnit.COUNT
            );
          }
        });
      } catch (e) {
        // CLS not supported
      }

      // Observe long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.record(
              'long-task',
              entry.duration,
              PerformanceCategory.RENDERING,
              PerformanceUnit.MILLISECONDS,
              { name: entry.name }
            );
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (e) {
        // Long tasks not supported
      }
    });
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled.set(enabled);
  }

  /**
   * Update thresholds
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds.update(t => ({ ...t, ...thresholds }));
  }
}
