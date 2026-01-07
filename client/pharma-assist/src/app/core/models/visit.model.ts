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
  outcome?: VisitOutcome | null;
  summary?: string | null;
  productsDiscussed?: string | null;
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
  followUpRequired?: boolean | null;
  followUpDate?: string | null;
}

export interface CheckOutVisitRequest {
  latitude?: number | null;
  longitude?: number | null;
}
