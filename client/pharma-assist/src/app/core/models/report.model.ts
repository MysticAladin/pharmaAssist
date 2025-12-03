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
