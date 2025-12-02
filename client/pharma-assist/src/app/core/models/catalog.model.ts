// Category and Manufacturer interfaces

export interface Category {
  id: number;
  name: string;
  nameLocal: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
}

export interface Manufacturer {
  id: number;
  name: string;
  nameLocal?: string;
  country?: string;
  countryCode?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  productCount?: number;
}

export interface CategorySelectOption {
  id: number;
  name: string;
  nameLocal: string;
}

export interface ManufacturerSelectOption {
  id: number;
  name: string;
}
