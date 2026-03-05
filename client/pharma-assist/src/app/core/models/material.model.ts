// Material Distribution interfaces matching backend DTOs

export enum MaterialType {
  Sample = 1,
  Brochure = 2,
  Gift = 3,
  Equipment = 4,
  Other = 99
}

export interface MaterialDistribution {
  id: number;
  repId: number;
  repName: string;
  customerId: number;
  customerName: string;
  visitId?: number;
  productId?: number;
  productName?: string;
  materialName: string;
  materialType: MaterialType;
  materialTypeName: string;
  quantity: number;
  lotNumber?: string;
  distributedAt: string;
  notes?: string;
}

export interface CreateDistributionRequest {
  repId: number;
  customerId: number;
  visitId?: number;
  productId?: number;
  materialName: string;
  materialType: MaterialType;
  quantity: number;
  lotNumber?: string;
  notes?: string;
}

export interface DistributionFilters {
  page: number;
  pageSize: number;
  repId?: number;
  customerId?: number;
  materialType?: MaterialType;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
}

// ───── Rep Inventory ─────

export interface RepInventory {
  id: number;
  repId: number;
  repName: string;
  productId?: number;
  productName?: string;
  materialName: string;
  quantity: number;
  minQuantity?: number;
  isLowStock: boolean;
  lastRestockedAt?: string;
}

export interface UpdateRepInventoryRequest {
  repId: number;
  productId?: number;
  materialName: string;
  quantity: number;
  minQuantity?: number;
}

export interface RestockInventoryRequest {
  quantity: number;
}

// ───── Distribution Reports ─────

export interface DistributionSummary {
  totalDistributions: number;
  totalQuantity: number;
  uniqueCustomers: number;
  uniqueReps: number;
  byMaterialType: MaterialTypeSummary[];
  byRep: RepDistributionSummary[];
  byProduct: ProductDistributionSummary[];
}

export interface MaterialTypeSummary {
  materialType: MaterialType;
  materialTypeName: string;
  count: number;
  totalQuantity: number;
}

export interface RepDistributionSummary {
  repId: number;
  repName: string;
  distributionCount: number;
  totalQuantity: number;
  uniqueCustomers: number;
}

export interface ProductDistributionSummary {
  productId?: number;
  materialName: string;
  distributionCount: number;
  totalQuantity: number;
}

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  [MaterialType.Sample]: 'MATERIALS.TYPE.SAMPLE',
  [MaterialType.Brochure]: 'MATERIALS.TYPE.BROCHURE',
  [MaterialType.Gift]: 'MATERIALS.TYPE.GIFT',
  [MaterialType.Equipment]: 'MATERIALS.TYPE.EQUIPMENT',
  [MaterialType.Other]: 'MATERIALS.TYPE.OTHER'
};
