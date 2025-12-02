// Category interfaces matching backend entities

export interface Category {
  id: number;
  name: string;
  nameLocal: string;
  description?: string;
  descriptionLocal?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
  subCategories?: Category[];
}

export interface CategorySummary {
  id: number;
  name: string;
  nameLocal: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  productCount: number;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  nameLocal: string;
  description?: string;
  descriptionLocal?: string;
  parentCategoryId?: number;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  id: number;
}
