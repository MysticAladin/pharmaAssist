// Manufacturer interfaces matching backend entities

export interface Manufacturer {
  id: number;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  isActive: boolean;
  productCount?: number;
}

export interface ManufacturerSummary {
  id: number;
  name: string;
  country?: string;
  productCount: number;
  isActive: boolean;
}

export interface CreateManufacturerRequest {
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface UpdateManufacturerRequest extends CreateManufacturerRequest {
  id: number;
}
