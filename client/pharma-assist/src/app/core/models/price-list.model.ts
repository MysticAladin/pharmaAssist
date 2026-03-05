// Price List interfaces matching backend DTOs

// === Enums ===

export enum PriceListType {
  Hospital = 1,
  Retail = 2,
  Wholesale = 3,
  Government = 4,
  Export = 5
}

export const PRICE_LIST_TYPE_LABELS: Record<number, string> = {
  1: 'Hospital',
  2: 'Retail',
  3: 'Wholesale',
  4: 'Government',
  5: 'Export'
};

// === DTOs ===

export interface PriceList {
  id: number;
  name: string;
  nameLocal?: string;
  type: PriceListType;
  typeName: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  description?: string;
  itemCount: number;
  createdAt: string;
}

export interface PriceListDetail extends PriceList {
  items: PriceListItem[];
}

export interface PriceListItem {
  id: number;
  priceListId: number;
  productId: number;
  productName: string;
  productCode?: string;
  price: number;
  discountPercent?: number;
  notes?: string;
}

export interface CreatePriceListRequest {
  name: string;
  nameLocal?: string;
  type: PriceListType;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  description?: string;
}

export interface UpdatePriceListRequest extends CreatePriceListRequest {
  id: number;
}

export interface CreatePriceListItemRequest {
  priceListId: number;
  productId: number;
  price: number;
  discountPercent?: number;
  notes?: string;
}

export interface UpdatePriceListItemRequest extends CreatePriceListItemRequest {
  id: number;
}

export interface BulkPriceListItemRequest {
  priceListId: number;
  items: CreatePriceListItemRequest[];
}

export interface PriceComparison {
  productId: number;
  productName: string;
  productCode?: string;
  prices: PriceListPrice[];
}

export interface PriceListPrice {
  priceListId: number;
  priceListName: string;
  priceListType: PriceListType;
  price: number;
  discountPercent?: number;
}

export interface PriceListFilters {
  page: number;
  pageSize: number;
  search?: string;
  type?: PriceListType;
  activeOnly?: boolean;
  sortBy?: string;
  sortDirection?: string;
}
