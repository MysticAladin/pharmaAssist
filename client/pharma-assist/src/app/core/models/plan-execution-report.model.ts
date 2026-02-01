// Plan Execution Report Models

// Daily Activity Report
export interface DailyActivityReport {
  date: string;
  repId: number;
  repName: string;
  plannedVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  visitCompletionRate: number;
  customersVisited: VisitedCustomer[];
  ordersCollected: number;
  orderValue: number;
  orderItems: number;
  productsPresented: string[];
  samplesDistributed: number;
  issuesEncountered: VisitIssue[];
  travelDistanceKm?: number;
  totalVisitTime: string;
  totalTravelTime: string;
  timeUtilization: TimeUtilization;
}

export interface VisitedCustomer {
  customerId: number;
  customerName: string;
  customerType?: string;
  city?: string;
  outcome?: string;
  outcomeName: string;
  checkInTime: string;
  checkOutTime?: string;
  duration: string;
  hasOrder: boolean;
  orderAmount?: number;
  notes?: string;
}

export interface VisitIssue {
  customerId: number;
  customerName: string;
  issue: string;
  resolution?: string;
}

export interface TimeUtilization {
  customerFacingTime: string;
  travelTime: string;
  adminTime: string;
  totalWorkTime: string;
  customerFacingPercent: number;
}

// Weekly Activity Report
export interface WeeklyActivityReport {
  weekStart: string;
  weekEnd: string;
  repId: number;
  repName: string;
  plannedVisits: number;
  completedVisits: number;
  visitCompletionRate: number;
  tierACoverage: CustomerCoverage;
  tierBCoverage: CustomerCoverage;
  tierCCoverage: CustomerCoverage;
  orderValue: number;
  orderValuePreviousWeek: number;
  orderValueGrowth: number;
  totalOrders: number;
  newLeads: number;
  convertedLeads: number;
  pipelineValue?: number;
  keyWins: string[];
  challenges: string[];
  nextWeekFocus: string[];
  dailyBreakdown: DailySummary[];
}

export interface CustomerCoverage {
  totalCustomers: number;
  visitedCustomers: number;
  coveragePercent: number;
}

export interface DailySummary {
  date: string;
  dayName: string;
  plannedVisits: number;
  completedVisits: number;
  orderValue: number;
  orders: number;
}

// Monthly Activity Report
export interface MonthlyActivityReport {
  year: number;
  month: number;
  monthName: string;
  repId: number;
  repName: string;
  monthlyPlanId?: number;
  planStatus?: string;
  revenueTarget: number;
  revenueActual: number;
  revenueAchievement: number;
  visitsTarget: number;
  visitsActual: number;
  visitsAchievement: number;
  tierATarget: CustomerTarget;
  tierBTarget: CustomerTarget;
  tierCTarget: CustomerTarget;
  productPerformance: ProductPerformance[];
  topCustomers: CustomerPerformance[];
  territoryPerformance: TerritoryPerformance[];
  weeklyTrends: WeeklySummary[];
  travelExpenses?: number;
  otherExpenses?: number;
  totalExpenses?: number;
  trainingActivities: string[];
  competitiveInsights: CompetitiveInsight[];
}

export interface CustomerTarget {
  tier: string;
  target: number;
  actual: number;
  achievement: number;
}

export interface ProductPerformance {
  productId: number;
  productName: string;
  category?: string;
  target?: number;
  actual: number;
  achievement?: number;
  unitsSold: number;
  timesPresented: number;
}

export interface CustomerPerformance {
  customerId: number;
  customerName: string;
  tier?: string;
  city?: string;
  revenue: number;
  revenuePreviousMonth: number;
  growth: number;
  orderCount: number;
  visitCount: number;
}

export interface TerritoryPerformance {
  territory: string;
  canton?: string;
  revenue: number;
  customerCount: number;
  visitCount: number;
  revenuePerVisit: number;
}

export interface WeeklySummary {
  weekNumber: number;
  weekStart: string;
  visits: number;
  revenue: number;
  orders: number;
}

export interface CompetitiveInsight {
  competitor: string;
  product: string;
  insight: string;
  reportedAt: string;
}

// Plan Execution Report
export interface PlanExecutionReport {
  repId: number;
  repName: string;
  periodStart: string;
  periodEnd: string;
  annualExecution?: AnnualExecution;
  quarterlyExecution?: QuarterlyExecution;
  monthlyExecution?: MonthlyExecution;
  weeklyExecutions: WeeklyExecution[];
  overallMetrics: OverallExecutionMetrics;
}

export interface AnnualExecution {
  planId: number;
  year: number;
  status: string;
  revenueTarget: number;
  revenueActual: number;
  revenueProgress: number;
  visitsTarget: number;
  visitsActual: number;
  visitsProgress: number;
  quartersCompleted: number;
  quartersTotal: number;
}

export interface QuarterlyExecution {
  planId: number;
  year: number;
  quarter: number;
  status: string;
  revenueTarget: number;
  revenueActual: number;
  revenueProgress: number;
  visitsTarget: number;
  visitsActual: number;
  visitsProgress: number;
  monthsCompleted: number;
  monthsTotal: number;
}

export interface MonthlyExecution {
  planId: number;
  year: number;
  month: number;
  status: string;
  revenueTarget: number;
  revenueActual: number;
  revenueProgress: number;
  visitsTarget: number;
  visitsActual: number;
  visitsProgress: number;
  weeksCompleted: number;
  weeksTotal: number;
}

export interface WeeklyExecution {
  planId: number;
  weekStart: string;
  status: string;
  plannedVisits: number;
  executedVisits: number;
  completionRate: number;
  ordersCollected?: number;
}

export interface OverallExecutionMetrics {
  overallRevenueProgress: number;
  overallVisitsProgress: number;
  planAdherence: number;
  onTrackMetrics: number;
  behindMetrics: number;
  aheadMetrics: number;
  performanceRating: string;
}

// Team Execution Summary
export interface TeamExecutionSummary {
  periodStart: string;
  periodEnd: string;
  periodName: string;
  totalReps: number;
  totalRevenueTarget: number;
  totalRevenueActual: number;
  revenueProgress: number;
  totalVisitsTarget: number;
  totalVisitsActual: number;
  visitsProgress: number;
  repsOnTarget: number;
  repsAboveTarget: number;
  repsBelowTarget: number;
  repSummaries: RepExecutionSummary[];
  topPerformers: RepExecutionSummary[];
  needingAttention: RepExecutionSummary[];
}

export interface RepExecutionSummary {
  repId: number;
  repName: string;
  territory?: string;
  revenueTarget: number;
  revenueActual: number;
  revenueProgress: number;
  visitsTarget: number;
  visitsActual: number;
  visitsProgress: number;
  orderCount: number;
  performanceStatus: string;
  rank: number;
}
