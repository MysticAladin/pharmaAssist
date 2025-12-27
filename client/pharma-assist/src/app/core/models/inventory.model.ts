// Inventory management interfaces

import { BadgeVariant } from '../../shared/components/status-badge';

export type AdjustmentType = 'addition' | 'removal' | 'correction' | 'damaged' | 'expired' | 'returned';
export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

export interface StockAdjustment {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  batchId?: number;
  batchNumber?: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  adjustedBy: string;
  adjustedAt: string;
}

export interface CreateStockAdjustmentRequest {
  productId: number;
  batchId?: number;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface StockTransfer {
  id: number;
  referenceNumber: string;
  sourceLocationId: number;
  sourceLocationName: string;
  destinationLocationId: number;
  destinationLocationName: string;
  status: TransferStatus;
  items: StockTransferItem[];
  notes?: string;
  createdBy: string;
  createdById: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
}

export interface StockTransferItem {
  id: number;
  transferId: number;
  productId: number;
  productName: string;
  productSku: string;
  batchId?: number;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  receivedQuantity?: number;
}

export interface CreateStockTransferRequest {
  sourceLocationId: number;
  destinationLocationId: number;
  items: CreateTransferItemRequest[];
  notes?: string;
}

export interface CreateTransferItemRequest {
  productId: number;
  batchId?: number;
  quantity: number;
}

export interface Location {
  id: number;
  name: string;
  code: string;
  type: 'warehouse' | 'pharmacy' | 'storage';
  address?: string;
  isActive: boolean;
}

export interface StockLevel {
  productId: number;
  productName: string;
  productSku: string;
  locationId: number;
  locationName: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  batches: BatchStock[];
}

export interface BatchStock {
  batchId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
}

export interface InventoryFilters {
  search?: string;
  locationId?: number;
  lowStockOnly?: boolean;
  expiringSoonOnly?: boolean;
  page: number;
  pageSize: number;
}

export interface AdjustmentFilters {
  productId?: number;
  adjustmentType?: AdjustmentType;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}

export interface TransferFilters {
  status?: TransferStatus;
  sourceLocationId?: number;
  destinationLocationId?: number;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}

// Helper functions
export function getAdjustmentTypeLabel(type: AdjustmentType): string {
  const labels: Record<AdjustmentType, string> = {
    addition: 'Addition',
    removal: 'Removal',
    correction: 'Correction',
    damaged: 'Damaged',
    expired: 'Expired',
    returned: 'Returned'
  };
  return labels[type];
}

export function getAdjustmentTypeColor(type: AdjustmentType): BadgeVariant {
  const colors: Record<AdjustmentType, BadgeVariant> = {
    addition: 'success',
    removal: 'danger',
    correction: 'warning',
    damaged: 'danger',
    expired: 'neutral',
    returned: 'info'
  };
  return colors[type];
}

export function getTransferStatusLabel(status: TransferStatus): string {
  const labels: Record<TransferStatus, string> = {
    pending: 'Pending',
    in_transit: 'In Transit',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return labels[status];
}

export function getTransferStatusColor(status: TransferStatus): BadgeVariant {
  const colors: Record<TransferStatus, BadgeVariant> = {
    pending: 'warning',
    in_transit: 'info',
    completed: 'success',
    cancelled: 'danger'
  };
  return colors[status];
}
