/**
 * Planning hierarchy models
 */

export type PlanStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Active' | 'Completed' | 'Archived';

// Annual Plan
export interface AnnualPlanSummary {
  id: number;
  repId: number;
  repName: string;
  year: number;
  title: string;
  status: PlanStatus;
  statusName: string;
  revenueTarget?: number;
  visitsTarget?: number;
  newCustomersTarget?: number;
  quarterlyPlansCount: number;
  createdAt: string;
  approvedAt?: string;
}

export interface AnnualPlanDetail extends AnnualPlanSummary {
  territoryDescription?: string;
  assignedCantons?: string;
  majorEvents?: string;
  strategicPriorities?: string;
  focusProducts?: string;
  approvedBy?: string;
  notes?: string;
  updatedAt?: string;
  quarterlyPlans: QuarterlyPlanSummary[];
}

export interface CreateAnnualPlanRequest {
  year: number;
  title: string;
  territoryDescription?: string;
  assignedCantons?: string;
  revenueTarget?: number;
  visitsTarget?: number;
  newCustomersTarget?: number;
  majorEvents?: string;
  strategicPriorities?: string;
  focusProducts?: string;
  notes?: string;
}

export interface UpdateAnnualPlanRequest {
  title?: string;
  territoryDescription?: string;
  assignedCantons?: string;
  revenueTarget?: number;
  visitsTarget?: number;
  newCustomersTarget?: number;
  majorEvents?: string;
  strategicPriorities?: string;
  focusProducts?: string;
  notes?: string;
}

// Quarterly Plan
export interface QuarterlyPlanSummary {
  id: number;
  annualPlanId?: number;
  repId: number;
  repName: string;
  year: number;
  quarter: number;
  title: string;
  status: PlanStatus;
  statusName: string;
  revenueTarget?: number;
  visitsTarget?: number;
  newCustomersTarget?: number;
  monthlyPlansCount: number;
  createdAt: string;
  approvedAt?: string;
}

export interface QuarterlyPlanDetail extends QuarterlyPlanSummary {
  campaignSchedule?: string;
  trainingSchedule?: string;
  resourceAllocation?: string;
  keyObjectives?: string;
  focusProducts?: string;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
  updatedAt?: string;
  monthlyPlans: MonthlyPlanSummary[];
}

export interface CreateQuarterlyPlanRequest {
  annualPlanId: number;
  quarter: number;
  title: string;
  revenueTarget?: number;
  visitsTarget?: number;
  newCustomersTarget?: number;
  campaignSchedule?: string;
  trainingSchedule?: string;
  resourceAllocation?: string;
  keyObjectives?: string;
  focusProducts?: string;
  notes?: string;
}

export interface UpdateQuarterlyPlanRequest {
  title?: string;
  revenueTarget?: number;
  visitsTarget?: number;
  newCustomersTarget?: number;
  campaignSchedule?: string;
  trainingSchedule?: string;
  resourceAllocation?: string;
  keyObjectives?: string;
  focusProducts?: string;
  notes?: string;
}

// Monthly Plan
export interface MonthlyPlanSummary {
  id: number;
  quarterlyPlanId?: number;
  repId: number;
  repName: string;
  year: number;
  month: number;
  monthName: string;
  title: string;
  status: PlanStatus;
  statusName: string;
  revenueTarget?: number;
  visitsTarget?: number;
  weeklyPlansCount: number;
  actualRevenue?: number;
  actualVisits?: number;
  createdAt: string;
  approvedAt?: string;
}

export interface MonthlyPlanDetail extends MonthlyPlanSummary {
  tierACoverageTarget?: number;
  tierBCoverageTarget?: number;
  tierCCoverageTarget?: number;
  promotionalActivities?: string;
  trainingSchedule?: string;
  focusProducts?: string;
  priorityCustomers?: string;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
  updatedAt?: string;
  weeklyPlans: WeeklyPlanSummary[];
}

export interface CreateMonthlyPlanRequest {
  quarterlyPlanId: number;
  month: number;
  title: string;
  revenueTarget?: number;
  visitsTarget?: number;
  tierACoverageTarget?: number;
  tierBCoverageTarget?: number;
  tierCCoverageTarget?: number;
  promotionalActivities?: string;
  trainingSchedule?: string;
  focusProducts?: string;
  priorityCustomers?: string;
  notes?: string;
}

export interface UpdateMonthlyPlanRequest {
  title?: string;
  revenueTarget?: number;
  visitsTarget?: number;
  tierACoverageTarget?: number;
  tierBCoverageTarget?: number;
  tierCCoverageTarget?: number;
  promotionalActivities?: string;
  trainingSchedule?: string;
  focusProducts?: string;
  priorityCustomers?: string;
  notes?: string;
}

// Weekly Plan (existing VisitPlan)
export interface WeeklyPlanSummary {
  id: number;
  planWeek: string;
  status: string;
  plannedVisitsCount: number;
  executedVisitsCount: number;
  submittedAt?: string;
  approvedAt?: string;
}

// Planning Overview
export interface PlanningHierarchyOverview {
  currentAnnualPlan?: AnnualPlanSummary;
  currentQuarterlyPlan?: QuarterlyPlanSummary;
  currentMonthlyPlan?: MonthlyPlanSummary;
  currentWeeklyPlan?: WeeklyPlanSummary;
  progress: PlanningProgress;
}

export interface PlanningProgress {
  annualRevenueTarget: number;
  annualRevenueActual: number;
  annualRevenueProgress: number;
  annualVisitsTarget: number;
  annualVisitsActual: number;
  annualVisitsProgress: number;
  quarterlyPlansCompleted: number;
  monthlyPlansCompleted: number;
  weeklyPlansCompleted: number;
}

// Pending Plans for Manager
export interface PendingPlansSummary {
  pendingAnnualPlansCount: number;
  pendingQuarterlyPlansCount: number;
  pendingMonthlyPlansCount: number;
  totalPendingCount: number;
  annualPlans: AnnualPlanSummary[];
  quarterlyPlans: QuarterlyPlanSummary[];
  monthlyPlans: MonthlyPlanSummary[];
}

// Action DTOs
export interface PlanActionRequest {
  comments?: string;
  rejectionReason?: string;
}
