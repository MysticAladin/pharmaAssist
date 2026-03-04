// Brand interfaces matching backend DTOs

export interface Brand {
  id: number;
  name: string;
  nameLocal?: string;
  manufacturerId: number;
  manufacturerName?: string;
  description?: string;
  descriptionLocal?: string;
  logoPath?: string;
  therapeuticArea?: string;
  isActive: boolean;
  productCount: number;
  products: BrandProduct[];
  brandGroups: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface BrandSummary {
  id: number;
  name: string;
  nameLocal?: string;
  manufacturerName?: string;
  therapeuticArea?: string;
  logoPath?: string;
  productCount: number;
  isActive: boolean;
}

export interface BrandProduct {
  id: number;
  name: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  unitPrice: number;
  isActive: boolean;
}

export interface CreateBrandRequest {
  name: string;
  nameLocal?: string;
  manufacturerId: number;
  description?: string;
  descriptionLocal?: string;
  logoPath?: string;
  therapeuticArea?: string;
}

export interface UpdateBrandRequest {
  name: string;
  nameLocal?: string;
  manufacturerId: number;
  description?: string;
  descriptionLocal?: string;
  logoPath?: string;
  therapeuticArea?: string;
  isActive: boolean;
}

export interface BrandGroup {
  id: number;
  name: string;
  nameLocal?: string;
  description?: string;
  isActive: boolean;
  brands: BrandSummary[];
  createdAt: string;
}

export interface CreateBrandGroupRequest {
  name: string;
  nameLocal?: string;
  description?: string;
  brandIds?: number[];
}

export interface UpdateBrandGroupRequest {
  name: string;
  nameLocal?: string;
  description?: string;
  isActive: boolean;
  brandIds?: number[];
}

export interface ProductDocument {
  id: number;
  productId: number;
  productName?: string;
  documentType: number;
  documentTypeName: string;
  fileName: string;
  filePath: string;
  fileType?: string;
  fileSize: number;
  version?: string;
  effectiveDate?: string;
  uploadedBy?: string;
  isCurrentVersion: boolean;
  notes?: string;
  createdAt: string;
}

export interface CreateProductDocumentRequest {
  productId: number;
  documentType: number;
  fileName: string;
  filePath: string;
  fileType?: string;
  fileSize: number;
  version?: string;
  effectiveDate?: string;
  notes?: string;
}

export interface KnowledgeArticle {
  id: number;
  productId?: number;
  productName?: string;
  brandId?: number;
  brandName?: string;
  title: string;
  titleLocal?: string;
  content: string;
  contentLocal?: string;
  category: number;
  categoryName: string;
  sortOrder: number;
  isPublished: boolean;
  tags?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface KnowledgeArticleSummary {
  id: number;
  title: string;
  titleLocal?: string;
  categoryName: string;
  productName?: string;
  brandName?: string;
  isPublished: boolean;
}

export interface CreateKnowledgeArticleRequest {
  productId?: number;
  brandId?: number;
  title: string;
  titleLocal?: string;
  content: string;
  contentLocal?: string;
  category: number;
  sortOrder: number;
  isPublished: boolean;
  tags?: string;
}

export interface UpdateKnowledgeArticleRequest extends CreateKnowledgeArticleRequest {}

export interface ProductPromotionReport {
  productId: number;
  productName: string;
  brandName?: string;
  totalPresentations: number;
  positiveReactions: number;
  neutralReactions: number;
  negativeReactions: number;
  acceptanceRate: number;
  byCustomerType: Record<string, number>;
  commitmentBreakdown: CommitmentBreakdown[];
}

export interface CommitmentBreakdown {
  level: number;
  levelName: string;
  count: number;
  percentage: number;
}

export interface BrandFilters {
  page: number;
  pageSize: number;
  search?: string;
  manufacturerId?: number;
  activeOnly?: boolean;
  therapeuticArea?: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface KnowledgeFilters {
  page: number;
  pageSize: number;
  search?: string;
  productId?: number;
  brandId?: number;
  category?: number;
  publishedOnly?: boolean;
}

// Enums matching backend
export enum ProductDocumentType {
  SmPC = 1,
  PIL = 2,
  SDS = 3,
  MarketingMaterial = 4,
  ClinicalStudy = 5,
  Other = 99
}

export enum KnowledgeCategory {
  FAQ = 1,
  ObjectionHandling = 2,
  ClinicalData = 3,
  Dosage = 4,
  Interactions = 5,
  Contraindications = 6,
  Storage = 7,
  General = 99
}

export enum ProductReactionType {
  Positive = 1,
  Neutral = 2,
  Negative = 3
}

export enum CommitmentLevel {
  None = 0,
  LowInterest = 1,
  Considering = 2,
  WillTry = 3,
  Committed = 4,
  AlreadyUsing = 5
}

export const DOCUMENT_TYPE_LABELS: Record<number, string> = {
  [ProductDocumentType.SmPC]: 'SmPC',
  [ProductDocumentType.PIL]: 'PIL (Patient Information Leaflet)',
  [ProductDocumentType.SDS]: 'SDS (Safety Data Sheet)',
  [ProductDocumentType.MarketingMaterial]: 'Marketing Material',
  [ProductDocumentType.ClinicalStudy]: 'Clinical Study',
  [ProductDocumentType.Other]: 'Other'
};

export const KNOWLEDGE_CATEGORY_LABELS: Record<number, string> = {
  [KnowledgeCategory.FAQ]: 'FAQ',
  [KnowledgeCategory.ObjectionHandling]: 'Objection Handling',
  [KnowledgeCategory.ClinicalData]: 'Clinical Data',
  [KnowledgeCategory.Dosage]: 'Dosage',
  [KnowledgeCategory.Interactions]: 'Interactions',
  [KnowledgeCategory.Contraindications]: 'Contraindications',
  [KnowledgeCategory.Storage]: 'Storage',
  [KnowledgeCategory.General]: 'General'
};

export const REACTION_TYPE_LABELS: Record<number, string> = {
  [ProductReactionType.Positive]: 'Positive',
  [ProductReactionType.Neutral]: 'Neutral',
  [ProductReactionType.Negative]: 'Negative'
};

export const COMMITMENT_LEVEL_LABELS: Record<number, string> = {
  [CommitmentLevel.None]: 'None',
  [CommitmentLevel.LowInterest]: 'Low Interest',
  [CommitmentLevel.Considering]: 'Considering',
  [CommitmentLevel.WillTry]: 'Will Try',
  [CommitmentLevel.Committed]: 'Committed',
  [CommitmentLevel.AlreadyUsing]: 'Already Using'
};
