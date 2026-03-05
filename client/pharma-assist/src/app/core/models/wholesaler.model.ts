// Wholesaler Data Import & Sales Analytics interfaces matching backend DTOs

// === Enums ===

export enum ImportStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  CompletedWithErrors = 3,
  Error = 4
}

export const IMPORT_STATUS_LABELS: Record<number, string> = {
  0: 'Pending',
  1: 'Processing',
  2: 'Completed',
  3: 'Completed with Errors',
  4: 'Error'
};

export const IMPORT_STATUS_VARIANTS: Record<number, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'> = {
  0: 'neutral',
  1: 'info',
  2: 'success',
  3: 'warning',
  4: 'danger'
};

// === Import DTOs ===

export interface WholesalerDataImport {
  id: number;
  wholesalerId: number;
  wholesalerName: string;
  fileName: string;
  importDate: string;
  period?: string;
  status: ImportStatus;
  statusName: string;
  recordCount: number;
  errorCount: number;
  matchedProductCount: number;
  matchedCustomerCount: number;
  unmatchedProductCount: number;
  unmatchedCustomerCount: number;
  notes?: string;
  createdAt: string;
}

export interface WholesalerDataImportDetail extends WholesalerDataImport {
  columnMapping?: string;
  errorLog?: string;
  salesRecords: WholesalerSalesRecord[];
  stockRecords: WholesalerStockRecord[];
}

export interface CreateImportRequest {
  wholesalerId: number;
  period?: string;
  columnMapping?: string;
  notes?: string;
}

export interface ColumnMappingTemplate {
  templateName: string;
  wholesalerId: number;
  mappings: Record<string, string>;
}

export interface ImportPreview {
  totalRows: number;
  detectedColumns: string[];
  previewRows: Record<string, string>[];
  warnings: string[];
}

export interface ImportResult {
  importId: number;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  matchedProducts: number;
  matchedCustomers: number;
  unmatchedProducts: number;
  unmatchedCustomers: number;
  errors: string[];
}

// === Sales Record DTOs ===

export interface WholesalerSalesRecord {
  id: number;
  importId: number;
  productCode?: string;
  productName: string;
  customerCode?: string;
  customerName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  invoiceDate?: string;
  invoiceNumber?: string;
  productId?: number;
  matchedProductName?: string;
  customerId?: number;
  matchedCustomerName?: string;
  isManuallyMatched: boolean;
}

export interface MatchRecordRequest {
  recordId: number;
  productId?: number;
  customerId?: number;
}

export interface BulkMatchRequest {
  matches: MatchRecordRequest[];
}

// === Stock Record DTOs ===

export interface WholesalerStockRecord {
  id: number;
  wholesalerId: number;
  wholesalerName?: string;
  productId?: number;
  productCode?: string;
  productName: string;
  quantity: number;
  reportDate: string;
}

export interface WholesalerStockSummary {
  productId: number;
  productName: string;
  stockLevels: WholesalerStockLevel[];
  totalStock: number;
}

export interface WholesalerStockLevel {
  wholesalerId: number;
  wholesalerName: string;
  quantity: number;
  reportDate: string;
}

// === Sales Analytics DTOs ===

export interface SalesAnalyticsFilter {
  dateFrom?: string;
  dateTo?: string;
  period?: string;
  wholesalerId?: number;
  productId?: number;
  brandId?: number;
  customerId?: number;
  cantonId?: number;
  customerType?: number;
  repId?: number;
}

export interface SalesDashboard {
  totalSalesAmount: number;
  totalQuantity: number;
  totalInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  monthlyTrend: SalesTrend[];
  byInstitutionType: SalesByInstitutionType[];
  topRegions: SalesByRegion[];
  topProducts: SalesByProduct[];
}

export interface SalesByInstitution {
  customerId: number;
  customerName: string;
  customerType: string;
  canton?: string;
  totalQuantity: number;
  totalAmount: number;
  invoiceCount: number;
  productCount: number;
}

export interface SalesByInstitutionType {
  customerType: string;
  institutionCount: number;
  totalQuantity: number;
  totalAmount: number;
  percentOfTotal: number;
}

export interface SalesByRegion {
  cantonId?: number;
  cantonName: string;
  institutionCount: number;
  totalQuantity: number;
  totalAmount: number;
  percentOfTotal: number;
}

export interface SalesByProduct {
  productId: number;
  productName: string;
  brandName?: string;
  totalQuantity: number;
  totalAmount: number;
  customerCount: number;
}

export interface SalesByBrand {
  brandId: number;
  brandName: string;
  productCount: number;
  totalQuantity: number;
  totalAmount: number;
  customerCount: number;
}

export interface SalesByRep {
  repId: number;
  repName: string;
  employeeCode?: string;
  totalSalesAmount: number;
  customerCount: number;
  productCount: number;
}

export interface SalesTrend {
  period: string;
  totalQuantity: number;
  totalAmount: number;
  recordCount: number;
}

// === Filter ===

export interface WholesalerImportFilters {
  page: number;
  pageSize: number;
  wholesalerId?: number;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
}
