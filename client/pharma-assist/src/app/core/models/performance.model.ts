// Performance Models
// For monitoring and optimization

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: PerformanceUnit;
  timestamp: number;
  category: PerformanceCategory;
  metadata?: Record<string, any>;
}

export enum PerformanceUnit {
  MILLISECONDS = 'ms',
  BYTES = 'bytes',
  COUNT = 'count',
  PERCENTAGE = '%'
}

export enum PerformanceCategory {
  NAVIGATION = 'navigation',
  RESOURCE = 'resource',
  RENDERING = 'rendering',
  API = 'api',
  MEMORY = 'memory',
  CUSTOM = 'custom'
}

export interface PerformanceSummary {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  memoryUsage?: MemoryInfo;
  apiMetrics: ApiPerformanceMetrics;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

export interface ApiPerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  slowestEndpoint: string;
  fastestEndpoint: string;
  errorRate: number;
  requestsByEndpoint: Record<string, EndpointMetrics>;
}

export interface EndpointMetrics {
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errors: number;
}

export interface RenderMetrics {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

export interface PerformanceThresholds {
  pageLoad: number;
  apiResponse: number;
  renderTime: number;
  memoryUsage: number;
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  pageLoad: 3000, // 3 seconds
  apiResponse: 1000, // 1 second
  renderTime: 16, // 16ms (60fps)
  memoryUsage: 80 // 80% of heap
};

export interface PerformanceAlert {
  type: 'warning' | 'error';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}
