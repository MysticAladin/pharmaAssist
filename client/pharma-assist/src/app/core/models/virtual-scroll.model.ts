// Virtual Scroll Models
// Performance optimization for large data sets

export interface VirtualScrollConfig {
  itemHeight: number;
  bufferSize: number;
  containerHeight: number;
  totalItems: number;
}

export interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  visibleItems: number;
}

export interface VirtualScrollRange {
  start: number;
  end: number;
  offset: number;
}

export interface ScrollPosition {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface VirtualTableConfig {
  rowHeight: number;
  headerHeight: number;
  bufferRows: number;
  minBufferPx: number;
  maxBufferPx: number;
}

export const DEFAULT_VIRTUAL_TABLE_CONFIG: VirtualTableConfig = {
  rowHeight: 48,
  headerHeight: 56,
  bufferRows: 5,
  minBufferPx: 100,
  maxBufferPx: 200
};

export interface InfiniteScrollConfig {
  threshold: number; // pixels from bottom to trigger load
  pageSize: number;
  initialLoad: number;
}

export const DEFAULT_INFINITE_SCROLL_CONFIG: InfiniteScrollConfig = {
  threshold: 200,
  pageSize: 25,
  initialLoad: 50
};
