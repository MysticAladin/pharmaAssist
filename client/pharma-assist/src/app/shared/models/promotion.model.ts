/**
 * Promotion calculation and validation models for rep order creation
 */

export interface PromotionDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  termsAndConditions?: string;
  type: PromotionType;
  typeName: string;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  startDate: string;
  endDate: string;
  maxUsageCount?: number;
  maxUsagePerCustomer?: number;
  currentUsageCount: number;
  appliesToAllProducts: boolean;
  appliesToAllCustomers: boolean;
  requiredCustomerTier?: CustomerTier;
  requiredCustomerType?: string;
  customerId?: number;
  customerName?: string;
  applyToChildCustomers: boolean;
  isActive: boolean;
  requiresCode: boolean;
  canStackWithOtherPromotions: boolean;
  canStackWithTierPricing: boolean;
  productIds?: number[];
  categoryIds?: number[];
  isValid: boolean;
  hasReachedLimit: boolean;
  createdAt: string;
}

export enum PromotionType {
  PercentageDiscount = 1,
  FixedAmountDiscount = 2,
  FreeShipping = 3,
  BuyOneGetOne = 4,
  BuyXGetYFree = 5,
  GiftWithPurchase = 6,
  BundleDiscount = 7
}

export enum CustomerTier {
  Standard = 0,
  Silver = 1,
  Gold = 2,
  Platinum = 3
}

export interface PromotionCalculationResult {
  success: boolean;
  originalTotal: number;
  discountTotal: number;
  finalTotal: number;
  appliedPromotions: AppliedPromotion[];
  lineDiscounts: PromotionLineDiscount[];
  message?: string;
}

export interface AppliedPromotion {
  promotionId: number;
  code: string;
  name: string;
  type: string;
  discountAmount: number;
  description: string;
}

export interface PromotionLineDiscount {
  productId: number;
  promotionId: number;
  originalLineTotal: number;
  discountAmount: number;
  discountPercent: number;
  finalLineTotal: number;
}

export interface PromoCodeValidationResult {
  isValid: boolean;
  errorMessage?: string;
  promotion?: PromotionDto;
  estimatedDiscount?: number;
}

export interface ValidatePromoCodeRequest {
  promoCode: string;
  customerId: number;
  orderTotal: number;
}

export interface CalculatePromotionsRequest {
  customerId: number;
  promoCode?: string;
  items: CalculatePromotionItem[];
}

export interface CalculatePromotionItem {
  productId: number;
  categoryId?: number;
  quantity: number;
  unitPrice: number;
}
