// Reporting Models

export type ReportPeriod = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ReportFilters {
  period: ReportPeriod;
  customRange?: DateRange;
  categoryId?: number;
  manufacturerId?: number;
  customerId?: number;
}

// Sales Reports
export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  itemsSold: number;
  revenueGrowth: number; // percentage vs previous period
  ordersGrowth: number;
}

export interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
  items: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export interface TopCustomer {
  id: number;
  name: string;
  email?: string;
  orders: number;
  totalSpent: number;
  percentage: number;
}

export interface SalesByCategory {
  categoryId: number;
  categoryName: string;
  revenue: number;
  orders: number;
  items: number;
  percentage: number;
}

export interface SalesReport {
  metrics: SalesMetrics;
  trends: SalesTrend[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  byCategory: SalesByCategory[];
  hourlyDistribution: { hour: number; orders: number }[];
}

// Inventory Reports
export interface InventoryMetrics {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringThisMonth: number;
  totalValue: number;
}

export interface InventoryByCategory {
  categoryId: number;
  categoryName: string;
  productCount: number;
  totalStock: number;
  totalValue: number;
  lowStockCount: number;
}

export interface ExpiringProduct {
  id: number;
  name: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  daysUntilExpiry: number;
}

export interface StockMovement {
  date: string;
  inbound: number;
  outbound: number;
  adjustments: number;
}

export interface InventoryReport {
  metrics: InventoryMetrics;
  byCategory: InventoryByCategory[];
  expiringProducts: ExpiringProduct[];
  stockMovements: StockMovement[];
}

// Customer Reports
export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  repeatCustomerRate: number;
  averageLifetimeValue: number;
}

export interface CustomerSegment {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface CustomerGrowth {
  date: string;
  newCustomers: number;
  totalCustomers: number;
}

export interface CustomerReport {
  metrics: CustomerMetrics;
  segments: CustomerSegment[];
  growth: CustomerGrowth[];
  topCustomers: TopCustomer[];
}

// Customer Sales Reports (per customer/branch, with product breakdown)
export interface CustomerSalesReport {
  reportDate: string;
  startDate: string;
  endDate: string;
  customerId?: number | null;
  customerName?: string | null;
  includeChildBranches: boolean;

  totalOrders: number;
  totalProducts: number;
  totalQuantity: number;
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  averageOrderValue: number;

  salesByCustomer: CustomerSalesItem[];
  salesByProduct: ProductSalesItem[];
}

export interface CustomerSalesItem {
  customerId: number;
  customerCode: string;
  customerName: string;
  branchCode?: string | null;
  isHeadquarters: boolean;
  parentCustomerId?: number | null;
  parentCustomerName?: string | null;
  orderCount: number;
  totalQuantity: number;
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
}

export interface ProductSalesItem {
  productId: number;
  productName: string;
  sku: string;
  categoryName?: string | null;
  manufacturerName?: string | null;
  quantitySold: number;
  unitPrice: number;
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  orderCount: number;
}

// Financial Reports
export interface FinancialMetrics {
  grossRevenue: number;
  netRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMargin: number;
  taxCollected: number;
  pendingPayments: number;
  overduePayments: number;
}

export interface RevenueByPaymentMethod {
  method: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface ProfitTrend {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface FinancialReport {
  metrics: FinancialMetrics;
  byPaymentMethod: RevenueByPaymentMethod[];
  profitTrends: ProfitTrend[];
  revenueBreakdown: { category: string; amount: number; percentage: number }[];
}

// Report Builder Types
export enum ReportBuilderDataSource {
  Orders = 1,
  Products = 2,
  Customers = 3,
  Inventory = 4,
  OrderItems = 5,
  SalesAnalytics = 6
}

export enum ReportColumnType {
  Text = 1,
  Number = 2,
  Currency = 3,
  Date = 4,
  DateTime = 5,
  Boolean = 6,
  Percentage = 7
}

export enum AggregationType {
  Sum = 1,
  Average = 2,
  Count = 3,
  Min = 4,
  Max = 5
}

export enum FilterOperator {
  Equals = 1,
  NotEquals = 2,
  GreaterThan = 3,
  GreaterThanOrEqual = 4,
  LessThan = 5,
  LessThanOrEqual = 6,
  Contains = 7,
  StartsWith = 8,
  EndsWith = 9,
  Between = 10,
  In = 11,
  IsNull = 12,
  IsNotNull = 13
}

export enum ReportFormat {
  Pdf = 1,
  Excel = 2,
  Csv = 3,
  Html = 4
}

export interface ReportColumnConfig {
  field: string;
  label?: string;
  type: ReportColumnType;
  format?: string;
  visible: boolean;
  order: number;
  aggregation?: AggregationType;
}

export interface ReportFilterConfig {
  field: string;
  operator: FilterOperator;
  value?: unknown;
  value2?: unknown;
}

export interface ReportSortConfig {
  field: string;
  descending: boolean;
}

export interface ReportBuilderConfig {
  id?: number;
  name: string;
  description?: string;
  dataSource: ReportBuilderDataSource;
  columns: ReportColumnConfig[];
  filters: ReportFilterConfig[];
  sortBy: ReportSortConfig[];
  groupBy: string[];
  isShared: boolean;
  category?: string;
}

export interface ReportBuilderExecuteRequest {
  config: ReportBuilderConfig;
  startDate?: Date;
  endDate?: Date;
  page: number;
  pageSize: number;
  exportFormat: ReportFormat;
}

export interface ReportBuilderResult {
  success: boolean;
  message?: string;
  data: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totals?: Record<string, unknown>;
  generatedAt: Date;
}

export interface AvailableField {
  field: string;
  label: string;
  type: ReportColumnType;
  sortable: boolean;
  filterable: boolean;
  groupable: boolean;
  supportedOperators: FilterOperator[];
}

export interface DataSourceFields {
  dataSource: ReportBuilderDataSource;
  fields: AvailableField[];
}

export interface SavedReport {
  id: number;
  name: string;
  description?: string;
  dataSource: ReportBuilderDataSource;
  configuration: ReportBuilderConfig;
  isShared: boolean;
  isTemplate: boolean;
  category?: string;
  tags?: string;
  lastRunAt?: Date;
  runCount: number;
  createdAt: Date;
  createdBy?: string;
}
