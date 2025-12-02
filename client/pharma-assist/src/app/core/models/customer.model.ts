// Customer interfaces matching backend DTOs

export enum CustomerType {
  Retail = 1,
  Pharmacy = 2,
  Hospital = 3,
  Wholesale = 4,
  Clinic = 5,
  Other = 99
}

export enum CustomerTier {
  A = 1,
  B = 2,
  C = 3
}

export enum AddressType {
  Billing = 1,
  Shipping = 2,
  Both = 3
}

export interface Customer {
  id: number;
  customerCode: string;
  name: string;
  customerType: CustomerType;
  customerTypeName: string;
  taxId?: string;
  registrationNumber?: string;
  pharmacyLicense?: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  tier: CustomerTier;
  tierName: string;
  discountPercentage: number;
  creditLimit: number;
  paymentTermDays: number;
  isActive: boolean;
  createdAt: string;
  addresses: CustomerAddress[];
}

export interface CustomerSummary {
  id: number;
  customerCode: string;
  name: string;
  customerType: CustomerType;
  customerTypeName: string;
  tier: CustomerTier;
  tierName: string;
  city?: string;
  isActive: boolean;
}

export interface CustomerAddress {
  id: number;
  customerId: number;
  addressType: AddressType;
  addressTypeName: string;
  street: string;
  buildingNumber?: string;
  postalCode: string;
  cityId: number;
  cityName: string;
  cantonId: number;
  cantonName: string;
  isPrimary: boolean;
  notes?: string;
}

export interface CreateCustomerRequest {
  name: string;
  customerType: CustomerType;
  taxId?: string;
  registrationNumber?: string;
  pharmacyLicense?: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  tier: CustomerTier;
  discountPercentage: number;
  creditLimit: number;
  paymentTermDays: number;
  primaryAddress?: CreateCustomerAddressRequest;
}

export interface CreateCustomerAddressRequest {
  addressType: AddressType;
  street: string;
  buildingNumber?: string;
  postalCode: string;
  cityId: number;
  cantonId: number;
  isPrimary: boolean;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name: string;
  customerType: CustomerType;
  taxId?: string;
  registrationNumber?: string;
  pharmacyLicense?: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  tier: CustomerTier;
  discountPercentage: number;
  creditLimit: number;
  paymentTermDays: number;
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CustomerFilters {
  page: number;
  pageSize: number;
  search?: string;
  customerType?: CustomerType;
  tier?: CustomerTier;
  activeOnly?: boolean;
}

// Helper functions
export function getCustomerTypeLabel(type: CustomerType): string {
  const labels: Record<CustomerType, string> = {
    [CustomerType.Retail]: 'customers.types.retail',
    [CustomerType.Pharmacy]: 'customers.types.pharmacy',
    [CustomerType.Hospital]: 'customers.types.hospital',
    [CustomerType.Wholesale]: 'customers.types.wholesale',
    [CustomerType.Clinic]: 'customers.types.clinic',
    [CustomerType.Other]: 'customers.types.other'
  };
  return labels[type] || 'customers.types.other';
}

export function getTierLabel(tier: CustomerTier): string {
  const labels: Record<CustomerTier, string> = {
    [CustomerTier.A]: 'customers.tiers.premium',
    [CustomerTier.B]: 'customers.tiers.standard',
    [CustomerTier.C]: 'customers.tiers.basic'
  };
  return labels[tier] || 'customers.tiers.basic';
}

export function getTierClass(tier: CustomerTier): string {
  const classes: Record<CustomerTier, string> = {
    [CustomerTier.A]: 'tier-premium',
    [CustomerTier.B]: 'tier-standard',
    [CustomerTier.C]: 'tier-basic'
  };
  return classes[tier] || 'tier-basic';
}
