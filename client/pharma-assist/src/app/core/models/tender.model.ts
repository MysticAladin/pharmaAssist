// Tender Management Models

export type TenderStatus = 'Draft' | 'Published' | 'Open' | 'UnderEvaluation' | 'Awarded' | 'Cancelled' | 'Expired' | 'Completed';
export type TenderType = 'OpenTender' | 'RestrictedTender' | 'NegotiatedProcurement' | 'FrameworkAgreement' | 'QuoteRequest';
export type TenderPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TenderBidStatus = 'Draft' | 'Submitted' | 'UnderReview' | 'Shortlisted' | 'Awarded' | 'Rejected' | 'Withdrawn';
export type TenderDocumentType = 'Specification' | 'Contract' | 'BidDocument' | 'Evaluation' | 'Award' | 'Other';

export interface TenderDto {
  id: number;
  tenderNumber: string;
  title: string;
  description?: string;
  type: TenderType;
  status: TenderStatus;
  priority: TenderPriority;
  customerId: number;
  customerName: string;
  submissionDeadline: Date;
  publishedDate?: Date;
  estimatedValue?: number;
  budget?: number;
  currency: string;
  itemCount: number;
  bidCount: number;
  isOpen: boolean;
  createdAt: Date;
  createdBy?: string;
}

export interface TenderDetailDto extends TenderDto {
  openingDate?: Date;
  contractStartDate?: Date;
  contractEndDate?: Date;
  bidSecurityAmount?: number;
  deliveryLocation?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  specialConditions?: string;
  evaluationCriteria?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  internalNotes?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  awardedDate?: Date;
  winningBidId?: number;
  items: TenderItemDto[];
  bids: TenderBidDto[];
  documents: TenderDocumentDto[];
}

export interface TenderItemDto {
  id: number;
  tenderId: number;
  productId?: number;
  productName?: string;
  description: string;
  specification?: string;
  quantity: number;
  unit?: string;
  estimatedUnitPrice?: number;
  estimatedTotal?: number;
  isRequired: boolean;
  sortOrder?: number;
}

export interface TenderBidDto {
  id: number;
  tenderId: number;
  bidNumber: string;
  status: TenderBidStatus;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  currency: string;
  validityDays: number;
  deliveryDays?: number;
  warrantyMonths?: number;
  paymentTerms?: string;
  technicalProposal?: string;
  notes?: string;
  submittedDate?: Date;
  preparedById?: string;
  preparedByName?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: Date;
  evaluationScore?: number;
  evaluationNotes?: string;
  isWinningBid: boolean;
  itemCount: number;
  createdAt: Date;
}

export interface TenderBidItemDto {
  id: number;
  tenderBidId: number;
  tenderItemId?: number;
  productId?: number;
  productName?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  finalUnitPrice: number;
  totalPrice: number;
  deliveryDays?: number;
  warrantyMonths?: number;
  notes?: string;
}

export interface TenderDocumentDto {
  id: number;
  tenderId: number;
  name: string;
  description?: string;
  documentType: TenderDocumentType;
  filePath: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  uploadedById?: string;
  uploadedByName?: string;
  createdAt: Date;
}

export interface CreateTenderDto {
  title: string;
  description?: string;
  type: TenderType;
  priority: TenderPriority;
  customerId: number;
  submissionDeadline: Date;
  openingDate?: Date;
  contractStartDate?: Date;
  contractEndDate?: Date;
  estimatedValue?: number;
  budget?: number;
  currency?: string;
  bidSecurityAmount?: number;
  deliveryLocation?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  specialConditions?: string;
  evaluationCriteria?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  assignedUserId?: string;
}

export interface UpdateTenderDto extends CreateTenderDto {
  id: number;
  internalNotes?: string;
}

export interface AddTenderItemDto {
  productId?: number;
  description: string;
  specification?: string;
  quantity: number;
  unit?: string;
  estimatedUnitPrice?: number;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface AddTenderBidDto {
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  currency?: string;
  validityDays?: number;
  deliveryDays?: number;
  warrantyMonths?: number;
  paymentTerms?: string;
  technicalProposal?: string;
  notes?: string;
  items: AddTenderBidItemDto[];
}

export interface AddTenderBidItemDto {
  tenderItemId?: number;
  productId?: number;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  finalUnitPrice: number;
  deliveryDays?: number;
  warrantyMonths?: number;
  notes?: string;
}

export interface TenderFilterDto {
  searchTerm?: string;
  status?: TenderStatus;
  type?: TenderType;
  priority?: TenderPriority;
  customerId?: number;
  assignedUserId?: string;
  startDate?: Date;
  endDate?: Date;
  isOpen?: boolean;
  minValue?: number;
  maxValue?: number;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface TenderStatsDto {
  totalTenders: number;
  draftTenders: number;
  openTenders: number;
  awardedTenders: number;
  expiredTenders: number;
  totalValue: number;
  totalBids: number;
  successRate: number;
  averageResponseTime: number;
  tendersByStatus: TenderStatusCount[];
  tendersByType: TenderTypeCount[];
}

export interface TenderStatusCount {
  status: TenderStatus;
  count: number;
}

export interface TenderTypeCount {
  type: TenderType;
  count: number;
}

// Helper functions for status display
export const tenderStatusLabels: Record<TenderStatus, string> = {
  Draft: 'TENDERS.STATUS.DRAFT',
  Published: 'TENDERS.STATUS.PUBLISHED',
  Open: 'TENDERS.STATUS.OPEN',
  UnderEvaluation: 'TENDERS.STATUS.UNDER_EVALUATION',
  Awarded: 'TENDERS.STATUS.AWARDED',
  Cancelled: 'TENDERS.STATUS.CANCELLED',
  Expired: 'TENDERS.STATUS.EXPIRED',
  Completed: 'TENDERS.STATUS.COMPLETED'
};

export const tenderStatusColors: Record<TenderStatus, string> = {
  Draft: 'text-gray-600 bg-gray-100',
  Published: 'text-blue-600 bg-blue-100',
  Open: 'text-green-600 bg-green-100',
  UnderEvaluation: 'text-yellow-600 bg-yellow-100',
  Awarded: 'text-purple-600 bg-purple-100',
  Cancelled: 'text-red-600 bg-red-100',
  Expired: 'text-orange-600 bg-orange-100',
  Completed: 'text-teal-600 bg-teal-100'
};

export const tenderTypeLabels: Record<TenderType, string> = {
  OpenTender: 'TENDERS.TYPE.OPEN',
  RestrictedTender: 'TENDERS.TYPE.RESTRICTED',
  NegotiatedProcurement: 'TENDERS.TYPE.NEGOTIATED',
  FrameworkAgreement: 'TENDERS.TYPE.FRAMEWORK',
  QuoteRequest: 'TENDERS.TYPE.QUOTE_REQUEST'
};

export const tenderPriorityLabels: Record<TenderPriority, string> = {
  Low: 'COMMON.PRIORITY.LOW',
  Medium: 'COMMON.PRIORITY.MEDIUM',
  High: 'COMMON.PRIORITY.HIGH',
  Critical: 'COMMON.PRIORITY.CRITICAL'
};

export const tenderPriorityColors: Record<TenderPriority, string> = {
  Low: 'text-gray-600',
  Medium: 'text-blue-600',
  High: 'text-orange-600',
  Critical: 'text-red-600'
};

export const bidStatusLabels: Record<TenderBidStatus, string> = {
  Draft: 'TENDERS.BID_STATUS.DRAFT',
  Submitted: 'TENDERS.BID_STATUS.SUBMITTED',
  UnderReview: 'TENDERS.BID_STATUS.UNDER_REVIEW',
  Shortlisted: 'TENDERS.BID_STATUS.SHORTLISTED',
  Awarded: 'TENDERS.BID_STATUS.AWARDED',
  Rejected: 'TENDERS.BID_STATUS.REJECTED',
  Withdrawn: 'TENDERS.BID_STATUS.WITHDRAWN'
};

export const bidStatusColors: Record<TenderBidStatus, string> = {
  Draft: 'text-gray-600 bg-gray-100',
  Submitted: 'text-blue-600 bg-blue-100',
  UnderReview: 'text-yellow-600 bg-yellow-100',
  Shortlisted: 'text-purple-600 bg-purple-100',
  Awarded: 'text-green-600 bg-green-100',
  Rejected: 'text-red-600 bg-red-100',
  Withdrawn: 'text-orange-600 bg-orange-100'
};
