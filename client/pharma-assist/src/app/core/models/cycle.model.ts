// Cycle & Campaign interfaces matching backend DTOs

// Enums
export enum CycleStatus { Draft = 0, Active = 1, Paused = 2, Completed = 3, Cancelled = 4 }
export enum CampaignType { Launch = 1, Reminder = 2, Detail = 3, Event = 4, Sampling = 5 }
export enum CampaignStatus { Draft = 0, Active = 1, Paused = 2, Completed = 3, Cancelled = 4 }
export enum CampaignTargetStatus { Pending = 0, Contacted = 1, InProgress = 2, Completed = 3, Skipped = 4 }
export enum CampaignExpenseCategory { Travel = 1, Accommodation = 2, Materials = 3, Samples = 4, Events = 5, Sponsorship = 6, Promotional = 7, Other = 8 }

export const CYCLE_STATUS_LABELS: Record<number, string> = {
  0: 'Draft', 1: 'Active', 2: 'Paused', 3: 'Completed', 4: 'Cancelled'
};

export const CAMPAIGN_TYPE_LABELS: Record<number, string> = {
  1: 'Launch', 2: 'Reminder', 3: 'Detail', 4: 'Event', 5: 'Sampling'
};

export const CAMPAIGN_STATUS_LABELS: Record<number, string> = {
  0: 'Draft', 1: 'Active', 2: 'Paused', 3: 'Completed', 4: 'Cancelled'
};

export const CAMPAIGN_TARGET_STATUS_LABELS: Record<number, string> = {
  0: 'Pending', 1: 'Contacted', 2: 'In Progress', 3: 'Completed', 4: 'Skipped'
};

export const EXPENSE_CATEGORY_LABELS: Record<number, string> = {
  1: 'Travel', 2: 'Accommodation', 3: 'Materials', 4: 'Samples', 5: 'Events', 6: 'Sponsorship', 7: 'Promotional', 8: 'Other'
};

// Cycle interfaces
export interface Cycle {
  id: number;
  name: string;
  nameLocal?: string;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  statusName: string;
  focusBrandIds?: string;
  focusBrandNames: string[];
  description?: string;
  ownerId?: number;
  ownerName?: string;
  plannedBudget: number;
  isActive: boolean;
  totalTargets: number;
  completedTargets: number;
  completionPercentage: number;
  targets: CycleTarget[];
  campaigns: CampaignSummary[];
  createdAt: string;
  updatedAt?: string;
}

export interface CycleSummary {
  id: number;
  name: string;
  nameLocal?: string;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  statusName: string;
  ownerName?: string;
  plannedBudget: number;
  totalTargets: number;
  completedTargets: number;
  completionPercentage: number;
  campaignCount: number;
  isActive: boolean;
}

export interface CreateCycleRequest {
  name: string;
  nameLocal?: string;
  startDate: string;
  endDate: string;
  focusBrandIds?: string;
  description?: string;
  ownerId?: number;
  plannedBudget: number;
}

export interface UpdateCycleRequest {
  name: string;
  nameLocal?: string;
  startDate: string;
  endDate: string;
  focusBrandIds?: string;
  description?: string;
  ownerId?: number;
  plannedBudget: number;
  isActive: boolean;
}

// Cycle Target interfaces
export interface CycleTarget {
  id: number;
  cycleId: number;
  customerId: number;
  customerName: string;
  customerType?: string;
  repId: number;
  repName: string;
  requiredVisits: number;
  completedVisits: number;
  completionPercentage: number;
  priority: number;
  targetProducts?: string;
  notes?: string;
}

export interface CreateCycleTargetRequest {
  customerId: number;
  repId: number;
  requiredVisits: number;
  priority: number;
  targetProducts?: string;
  notes?: string;
}

export interface BulkCreateCycleTargetsRequest {
  customerIds: number[];
  repId: number;
  requiredVisits: number;
  priority: number;
  targetProducts?: string;
}

// Campaign interfaces
export interface Campaign {
  id: number;
  cycleId?: number;
  cycleName?: string;
  name: string;
  nameLocal?: string;
  type: CampaignType;
  typeName: string;
  startDate: string;
  endDate: string;
  plannedBudget: number;
  actualSpent: number;
  status: CampaignStatus;
  statusName: string;
  targetingCriteria?: string;
  description?: string;
  isActive: boolean;
  totalTargets: number;
  completedTargets: number;
  contactedTargets: number;
  completionPercentage: number;
  targets: CampaignTarget[];
  expenses: CampaignExpense[];
  createdAt: string;
  updatedAt?: string;
}

export interface CampaignSummary {
  id: number;
  name: string;
  nameLocal?: string;
  cycleId?: number;
  cycleName?: string;
  type: CampaignType;
  typeName: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  statusName: string;
  plannedBudget: number;
  actualSpent: number;
  totalTargets: number;
  completedTargets: number;
  completionPercentage: number;
  isActive: boolean;
}

export interface CreateCampaignRequest {
  cycleId?: number;
  name: string;
  nameLocal?: string;
  type: CampaignType;
  startDate: string;
  endDate: string;
  plannedBudget: number;
  targetingCriteria?: string;
  description?: string;
}

export interface UpdateCampaignRequest {
  cycleId?: number;
  name: string;
  nameLocal?: string;
  type: CampaignType;
  startDate: string;
  endDate: string;
  plannedBudget: number;
  targetingCriteria?: string;
  description?: string;
  isActive: boolean;
}

// Campaign Target interfaces
export interface CampaignTarget {
  id: number;
  campaignId: number;
  customerId: number;
  customerName: string;
  customerType?: string;
  repId?: number;
  repName?: string;
  status: CampaignTargetStatus;
  statusName: string;
  contactedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface CreateCampaignTargetRequest {
  customerId: number;
  repId?: number;
}

export interface UpdateCampaignTargetStatusRequest {
  status: CampaignTargetStatus;
  notes?: string;
}

// Budget Expense interfaces
export interface CampaignExpense {
  id: number;
  campaignId?: number;
  campaignName?: string;
  cycleId?: number;
  cycleName?: string;
  customerId?: number;
  customerName?: string;
  repId?: number;
  repName?: string;
  category: CampaignExpenseCategory;
  categoryName: string;
  description: string;
  amount: number;
  expenseDate: string;
  referenceNumber?: string;
  attachmentPath?: string;
  isApproved: boolean;
  approvalNotes?: string;
  createdAt: string;
}

export interface CreateCampaignExpenseRequest {
  campaignId?: number;
  cycleId?: number;
  customerId?: number;
  repId?: number;
  category: CampaignExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  referenceNumber?: string;
  attachmentPath?: string;
}

// Client Investment
export interface ClientInvestment {
  customerId: number;
  customerName: string;
  customerType: string;
  totalVisits: number;
  travelExpenses: number;
  materialExpenses: number;
  sampleExpenses: number;
  eventExpenses: number;
  promotionalExpenses: number;
  otherExpenses: number;
  totalExpenses: number;
  campaignSpend: number;
  totalInvestment: number;
  recentExpenses: CampaignExpense[];
  byCategory: Record<string, number>;
  byMonth: Record<string, number>;
}

// Filters
export interface CycleFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: number;
  activeOnly?: boolean;
  sortBy?: string;
  sortDirection?: string;
}

export interface CampaignFilters {
  page: number;
  pageSize: number;
  search?: string;
  cycleId?: number;
  type?: number;
  status?: number;
  sortBy?: string;
  sortDirection?: string;
}
