/**
 * Prescription Models
 */

import { BadgeVariant } from '../../shared/components/status-badge';

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  orderId?: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  patientName: string;
  patientDateOfBirth?: Date;
  doctorName: string;
  doctorLicenseNumber?: string;
  healthFacility?: string;
  issueDate: Date;
  expiryDate: Date;
  status: PrescriptionStatus;
  priority: PrescriptionPriority;
  isControlled: boolean;
  notes?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  dispensedBy?: string;
  dispensedAt?: Date;
  fileUrl?: string;
  fileName?: string;
  items: PrescriptionItem[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface PrescriptionItem {
  id: string;
  productId: number;
  productName: string;
  productSku: string;
  dosage: string;
  quantity: number;
  instructions: string;
  duration?: string;
  refillsAllowed: number;
  refillsUsed: number;
  isDispensed: boolean;
}

export interface PrescriptionSummary {
  id: string;
  prescriptionNumber: string;
  customerName: string;
  patientName: string;
  doctorName: string;
  issueDate: Date;
  expiryDate: Date;
  status: PrescriptionStatus;
  priority: PrescriptionPriority;
  isControlled: boolean;
  itemCount: number;
  createdAt: Date;
}

export enum PrescriptionStatus {
  Pending = 0,
  UnderReview = 1,
  Approved = 2,
  Rejected = 3,
  PartiallyDispensed = 4,
  Dispensed = 5,
  Expired = 6,
  Cancelled = 7
}

export enum PrescriptionPriority {
  Normal = 0,
  Urgent = 1,
  Emergency = 2
}

export interface PrescriptionFilter {
  searchTerm?: string;
  status?: PrescriptionStatus;
  priority?: PrescriptionPriority;
  isControlled?: boolean;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  pageSize: number;
}

export interface ReviewPrescriptionRequest {
  approved: boolean;
  notes?: string;
}

export interface DispensePrescriptionRequest {
  items: DispenseItem[];
  notes?: string;
}

export interface DispenseItem {
  prescriptionItemId: string;
  quantityDispensed: number;
  batchNumber?: string;
}

// Helpers
export function getPrescriptionStatusLabel(status: PrescriptionStatus): string {
  const labels: Record<PrescriptionStatus, string> = {
    [PrescriptionStatus.Pending]: 'prescriptions.status.pending',
    [PrescriptionStatus.UnderReview]: 'prescriptions.status.underReview',
    [PrescriptionStatus.Approved]: 'prescriptions.status.approved',
    [PrescriptionStatus.Rejected]: 'prescriptions.status.rejected',
    [PrescriptionStatus.PartiallyDispensed]: 'prescriptions.status.partiallyDispensed',
    [PrescriptionStatus.Dispensed]: 'prescriptions.status.dispensed',
    [PrescriptionStatus.Expired]: 'prescriptions.status.expired',
    [PrescriptionStatus.Cancelled]: 'prescriptions.status.cancelled'
  };
  return labels[status] || 'common.unknown';
}

export function getPrescriptionStatusColor(status: PrescriptionStatus): BadgeVariant {
  const colors: Record<PrescriptionStatus, BadgeVariant> = {
    [PrescriptionStatus.Pending]: 'warning',
    [PrescriptionStatus.UnderReview]: 'info',
    [PrescriptionStatus.Approved]: 'success',
    [PrescriptionStatus.Rejected]: 'danger',
    [PrescriptionStatus.PartiallyDispensed]: 'info',
    [PrescriptionStatus.Dispensed]: 'success',
    [PrescriptionStatus.Expired]: 'neutral',
    [PrescriptionStatus.Cancelled]: 'neutral'
  };
  return colors[status] || 'neutral';
}

export function getPriorityLabel(priority: PrescriptionPriority): string {
  const labels: Record<PrescriptionPriority, string> = {
    [PrescriptionPriority.Normal]: 'prescriptions.priority.normal',
    [PrescriptionPriority.Urgent]: 'prescriptions.priority.urgent',
    [PrescriptionPriority.Emergency]: 'prescriptions.priority.emergency'
  };
  return labels[priority] || 'common.unknown';
}

export function getPriorityColor(priority: PrescriptionPriority): BadgeVariant {
  const colors: Record<PrescriptionPriority, BadgeVariant> = {
    [PrescriptionPriority.Normal]: 'neutral',
    [PrescriptionPriority.Urgent]: 'warning',
    [PrescriptionPriority.Emergency]: 'danger'
  };
  return colors[priority] || 'neutral';
}
