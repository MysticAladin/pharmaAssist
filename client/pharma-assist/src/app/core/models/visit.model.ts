export enum VisitType {
  Planned = 1,
  AdHoc = 2
}

export enum VisitPlanStatus {
  Draft = 1,
  Submitted = 2,
  Approved = 3,
  Rejected = 4,
  InProgress = 5,
  Completed = 6
}

export enum VisitOutcome {
  Positive = 1,
  Neutral = 2,
  Negative = 3
}

export interface PlannedVisitSummary {
  plannedVisitId: number;
  planId: number;
  plannedDate: string;
  plannedTime?: string | null;
  customerId: number;
  customerName: string;
  objective?: string | null;
  sequenceNumber: number;
  hasExecutedVisit: boolean;
  executedVisitId?: number | null;
}

export interface ExecutedVisitSummary {
  id: number;
  customerId: number;
  customerName: string;
  plannedVisitId?: number | null;
  visitType: VisitType;
  checkInTime: string;
  checkOutTime?: string | null;
  isCompleted: boolean;
}

export interface ExecutedVisit {
  id: number;
  repId: number;
  customerId: number;
  customerName: string;
  plannedVisitId?: number | null;
  visitType: VisitType;
  checkInTime: string;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInAddress?: string | null;
  checkOutTime?: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  locationVerified: boolean;
  distanceFromCustomerMeters?: number | null;
  outcome?: VisitOutcome | null;
  summary?: string | null;
  productsDiscussed?: string | null;
  // Visit notes
  generalComment?: string | null;
  agreedDeals?: string | null;
  competitionNotes?: string | null;
  isCompleted: boolean;
}

// Manager reporting
export interface TeamVisitPlanSummary {
  planId: number;
  repId: number;
  repName: string;
  planWeek: string;
  status: VisitPlanStatus;
  plannedCount: number;
  executedCount: number;
}

export interface VisitPlanReport {
  planId: number;
  repId: number;
  repName: string;
  planWeek: string;
  status: VisitPlanStatus;
  rejectionReason?: string | null;
  approvalComments?: string | null;
  plannedVisits: PlannedVisitSummary[];
}

export interface CheckInVisitRequest {
  plannedVisitId?: number | null;
  customerId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export interface UpdateExecutedVisitRequest {
  outcome?: VisitOutcome | null;
  summary?: string | null;
  productsDiscussed?: string | null;
  // Visit notes
  generalComment?: string | null;
  agreedDeals?: string | null;
  competitionNotes?: string | null;
  followUpRequired?: boolean | null;
  followUpDate?: string | null;
}

export interface CheckOutVisitRequest {
  latitude?: number | null;
  longitude?: number | null;
}

// Visit Plan DTOs
export interface VisitPlanSummary {
  id: number;
  planWeek: string;
  status: VisitPlanStatus;
  statusName: string;
  plannedVisitsCount: number;
  executedVisitsCount: number;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

export interface VisitPlanDetail {
  id: number;
  repId: number;
  planWeek: string;
  status: VisitPlanStatus;
  statusName: string;
  submittedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  plannedVisits: PlannedVisit[];
}

export interface PlannedVisit {
  id: number;
  planId: number;
  customerId: number;
  customerName: string;
  customerCity?: string | null;
  plannedDate: string;
  plannedTime?: string | null;
  estimatedDurationMinutes: number;
  visitObjective?: string | null;
  productsToPresent?: string | null;
  notes?: string | null;
  sequenceNumber: number;
  hasExecutedVisit: boolean;
  executedVisitId?: number | null;
}

export interface CreatePlannedVisitRequest {
  customerId: number;
  plannedDate: string;
  plannedTime?: string | null;
  estimatedDurationMinutes: number;
  visitObjective?: string | null;
  productsToPresent?: string | null;
  notes?: string | null;
  sequenceNumber: number;
}

export interface UpdatePlannedVisitRequest {
  plannedDate?: string | null;
  plannedTime?: string | null;
  estimatedDurationMinutes?: number | null;
  visitObjective?: string | null;
  productsToPresent?: string | null;
  notes?: string | null;
  sequenceNumber?: number | null;
}

// Visit History
export interface VisitHistoryFilter {
  fromDate?: string | null;
  toDate?: string | null;
  customerId?: number | null;
  outcome?: VisitOutcome | null;
  searchTerm?: string | null;
  page: number;
  pageSize: number;
}

export interface VisitHistoryResult {
  items: VisitHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VisitHistoryItem {
  id: number;
  customerId: number;
  customerName: string;
  customerCity?: string | null;
  visitType: VisitType;
  checkInTime: string;
  checkOutTime?: string | null;
  durationMinutes?: number | null;
  locationVerified: boolean;
  distanceFromCustomerMeters?: number | null;
  outcome?: VisitOutcome | null;
  summary?: string | null;
  isCompleted: boolean;
}

// Team Activity Dashboard
export interface TeamActivityDashboard {
  date: string;
  repActivities: RepActivitySummary[];
  totals: TeamActivityTotals;
}

export interface RepActivitySummary {
  repId: number;
  repName: string;
  repType: number;
  plannedVisitsCount: number;
  executedVisitsCount: number;
  completedVisitsCount: number;
  completionRate: number;
  locationVerifiedCount: number;
  locationAlertCount: number;
  currentVisit?: VisitActivity | null;
  todayVisits: VisitActivity[];
}

export interface VisitActivity {
  visitId: number;
  customerId: number;
  customerName: string;
  customerCity?: string | null;
  checkInTime: string;
  checkOutTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationVerified: boolean;
  distanceFromCustomerMeters?: number | null;
  outcome?: VisitOutcome | null;
  isActive: boolean;
}

export interface TeamActivityTotals {
  totalReps: number;
  activeReps: number;
  totalPlannedVisits: number;
  totalExecutedVisits: number;
  totalCompletedVisits: number;
  overallCompletionRate: number;
  locationVerifiedCount: number;
  locationAlertCount: number;
}

// Visit Audit Log
export interface VisitAuditFilter {
  fromDate?: string | null;
  toDate?: string | null;
  repId?: number | null;
  locationVerified?: boolean | null;
  hasLocationAlert?: boolean | null;
  page: number;
  pageSize: number;
}

export interface VisitAuditResult {
  items: VisitAuditItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VisitAuditItem {
  visitId: number;
  repId: number;
  repName: string;
  customerId: number;
  customerName: string;
  customerCity?: string | null;
  checkInTime: string;
  checkOutTime?: string | null;
  visitLatitude?: number | null;
  visitLongitude?: number | null;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
  distanceFromCustomerMeters?: number | null;
  locationVerified: boolean;
  locationStatus: 'Valid' | 'Warning' | 'Alert' | 'Unknown';
}
