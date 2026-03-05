// Territory & Assignment interfaces matching backend DTOs

// Enums
export enum TerritoryType { Region = 1, Canton = 2, Custom = 3 }
export enum AssignmentType { Exclusive = 1, Shared = 2 }

export const TERRITORY_TYPE_LABELS: Record<number, string> = {
  1: 'Region', 2: 'Canton', 3: 'Custom'
};

export const ASSIGNMENT_TYPE_LABELS: Record<number, string> = {
  1: 'Exclusive', 2: 'Shared'
};

// Territory interfaces
export interface Territory {
  id: number;
  name: string;
  nameLocal?: string;
  type: TerritoryType;
  typeName: string;
  parentTerritoryId?: number;
  parentTerritoryName?: string;
  cantonIds?: string;
  cantonNames: string[];
  municipalityIds?: string;
  description?: string;
  isActive: boolean;
  assignedRepCount: number;
  customerCount: number;
  assignments: TerritoryAssignment[];
  children?: Territory[];
  createdAt: string;
  updatedAt?: string;
}

export interface TerritorySummary {
  id: number;
  name: string;
  nameLocal?: string;
  type: TerritoryType;
  typeName: string;
  parentTerritoryName?: string;
  assignedRepCount: number;
  customerCount: number;
  isActive: boolean;
}

export interface CreateTerritoryRequest {
  name: string;
  nameLocal?: string;
  type: TerritoryType;
  parentTerritoryId?: number;
  cantonIds?: string;
  municipalityIds?: string;
  description?: string;
}

export interface UpdateTerritoryRequest {
  name: string;
  nameLocal?: string;
  type: TerritoryType;
  parentTerritoryId?: number;
  cantonIds?: string;
  municipalityIds?: string;
  description?: string;
  isActive: boolean;
}

// Territory Assignment interfaces
export interface TerritoryAssignment {
  id: number;
  territoryId: number;
  territoryName: string;
  repId: number;
  repName: string;
  repEmployeeCode?: string;
  startDate: string;
  endDate?: string;
  isPrimary: boolean;
  assignmentType: AssignmentType;
  assignmentTypeName: string;
  notes?: string;
}

export interface CreateTerritoryAssignmentRequest {
  repId: number;
  startDate: string;
  endDate?: string;
  isPrimary: boolean;
  assignmentType: AssignmentType;
  notes?: string;
}

// Customer Assignment interfaces
export interface BulkAssignCustomersRequest {
  repId: number;
  customerIds: number[];
  requiredVisitsPerMonth?: number;
}

export interface TransferCustomersRequest {
  fromRepId: number;
  toRepId: number;
  customerIds: number[];
}

// Analytics interfaces
export interface TerritoryPerformance {
  territoryId: number;
  territoryName: string;
  type: TerritoryType;
  totalCustomers: number;
  activeCustomers: number;
  totalReps: number;
  totalVisits: number;
  plannedVisits: number;
  visitCompliancePercent: number;
  overdueVisits: number;
  uniqueFieldDays: number;
  avgVisitsPerFieldDay: number;
  visitsByCustomerType: Record<string, number>;
  monthlyVisitTrend: Record<string, number>;
}

export interface VisitFrequency {
  customerId: number;
  customerName: string;
  customerType?: string;
  customerTier?: string;
  repId: number;
  repName: string;
  requiredVisitsPerMonth: number;
  completedVisitsThisMonth: number;
  completedVisitsThisCycle: number;
  compliancePercent: number;
  lastVisitDate?: string;
  daysSinceLastVisit: number;
  isOverdue: boolean;
}

export interface FieldWorkMetrics {
  repId: number;
  repName: string;
  employeeCode?: string;
  uniqueFieldDays: number;
  totalVisits: number;
  avgVisitsPerFieldDay: number;
  totalCustomersVisited: number;
  visitsByCustomerType: Record<string, number>;
  visitsByTier: Record<string, number>;
  monthlyVisits: Record<string, number>;
  monthlyFieldDays: Record<string, number>;
}

export interface InstitutionAnalytics {
  customerType: string;
  totalInstitutions: number;
  activeInstitutions: number;
  visitedThisPeriod: number;
  totalVisits: number;
  avgVisitsPerInstitution: number;
  coveragePercent: number;
  byTier: Record<string, number>;
  byCanton: Record<string, number>;
}

// Filter interfaces
export interface TerritoryFilters {
  page: number;
  pageSize: number;
  search?: string;
  type?: number;
  activeOnly?: boolean;
  sortBy?: string;
  sortDirection?: string;
}

export interface AnalyticsFilters {
  fromDate?: string;
  toDate?: string;
  repId?: number;
  territoryId?: number;
  overdueOnly?: boolean;
}
