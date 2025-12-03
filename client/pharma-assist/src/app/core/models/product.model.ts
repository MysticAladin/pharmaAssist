// Product interfaces matching backend DTOs

export interface Product {
  id: number;
  name: string;
  nameLocal: string;
  genericName?: string;
  description?: string;
  descriptionLocal?: string;
  sku: string;
  barcode?: string;
  atcCode?: string;

  categoryId: number;
  categoryName?: string;
  manufacturerId: number;
  manufacturerName?: string;

  unitPrice: number;
  costPrice?: number;
  taxRate: number;

  requiresPrescription: boolean;
  isControlled: boolean;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;

  stockQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;

  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;

  createdAt: string;
  updatedAt?: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  nameLocal: string;
  sku: string;
  categoryName?: string;
  manufacturerName?: string;
  unitPrice: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  isActive: boolean;
  imageUrl?: string;
}

export interface CreateProductRequest {
  name: string;
  nameLocal: string;
  genericName?: string;
  description?: string;
  descriptionLocal?: string;
  sku: string;
  barcode?: string;
  atcCode?: string;
  categoryId: number;
  manufacturerId: number;
  unitPrice: number;
  costPrice?: number;
  taxRate: number;
  requiresPrescription: boolean;
  isControlled: boolean;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  reorderLevel: number;
  reorderQuantity: number;
  imageUrl?: string;
  isFeatured: boolean;
}

export interface UpdateProductRequest extends CreateProductRequest {
  isActive: boolean;
}

// For partial updates (e.g., bulk price changes)
export type PartialProductUpdate = Partial<UpdateProductRequest>;

export interface ProductBatch {
  id: number;
  productId: number;
  productName?: string;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate: string;
  initialQuantity: number;
  remainingQuantity: number;
  costPrice?: number;
  isActive: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Filter parameters
export interface ProductFilters {
  search?: string;
  categoryId?: number;
  manufacturerId?: number;
  activeOnly?: boolean;
  page: number;
  pageSize: number;
  // Advanced filters
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'all' | 'inStock' | 'lowStock' | 'outOfStock';
  requiresPrescription?: boolean | null;
  hasBarcode?: boolean | null;
  expiryStatus?: 'all' | 'expiringSoon' | 'expired' | 'valid';
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
