import type { Transaction } from "../../types/transaction";

export type SupportedUpiProvider = "PhonePe" | "Google Pay";
export type UpiProvider = SupportedUpiProvider | "Unknown";

export type UpiStatementMetadata = {
  provider: UpiProvider;
  statementPeriod?: string;
  sourceAccounts: string[];
  fileType: "pdf" | "html" | "sample";
  transactionCount: number;
};

export type UpiParseResult = {
  transactions: Transaction[];
  metadata: UpiStatementMetadata;
};

export type UpiParseOptions = {
  preferredProvider?: SupportedUpiProvider;
  pdfPassword?: string;
  categoryRules?: Record<string, string[]>;
};

export type UpiFilters = {
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  category: string;
  type: "all" | "debit" | "credit";
  search: string;
};

export type UpiSummary = {
  totalSpend: number;
  totalCredits: number;
  netFlow: number;
  monthlyAverageSpend: number;
  debitCount: number;
  creditCount: number;
};

export type MonthlyAggregate = {
  monthKey: string;
  debit: number;
  credit: number;
  net: number;
  shareOfSpend: number;
};

export type CategoryBreakdownItem = {
  label: string;
  amount: number;
  percentage: number;
};

export type MerchantSpendItem = {
  merchant: string;
  amount: number;
  count: number;
  percentage: number;
};

export type WeeklyPatternItem = {
  day: string;
  amount: number;
  percentage: number;
};

export type TransactionSizeBucket = {
  label: string;
  count: number;
  totalAmount: number;
  percentage: number;
};

export type CumulativeSpendPoint = {
  date: string;
  amount: number;
  runningTotal: number;
  percentage: number;
};

export type UpiDashboardData = {
  summary: UpiSummary;
  monthly: MonthlyAggregate[];
  categoryBreakdown: CategoryBreakdownItem[];
  topMerchants: MerchantSpendItem[];
  weeklyPattern: WeeklyPatternItem[];
  transactionSizeDistribution: TransactionSizeBucket[];
  cumulativeSpendCurve: CumulativeSpendPoint[];
  dateRange?: { start: string; end: string };
};

export type StoryTone = "watch" | "positive" | "steady";

export type StoryInsight = {
  headline: string;
  detail: string;
  tone: StoryTone;
};

export type SnapshotStoryInsight = StoryInsight & {
  coverageRatio: number;
  recentChange?: number;
};

export type MonthlyStoryInsight = StoryInsight & {
  peakMonthKey?: string;
  peakMonthAmount?: number;
  dropMonthKey?: string;
  dropMonthAmount?: number;
  sharpestChange?: number;
  sharpestChangeMonthKey?: string;
};

export type CategoryStoryInsight = StoryInsight & {
  dominantCategory?: string;
  dominantShare: number;
  secondaryCategory?: string;
};

export type MerchantStoryInsight = StoryInsight & {
  leadMerchant?: string;
  topThreeShare: number;
};

export type BehaviorStoryInsight = StoryInsight & {
  dominantDay?: string;
  weekendShare: number;
};

export type SizeStoryInsight = StoryInsight & {
  dominantBucket?: string;
  smallTicketShare: number;
};

export type MomentumStoryInsight = StoryInsight & {
  dominantPhase: "early" | "mid" | "late" | "balanced";
  phaseShare: number;
  midpointShare: number;
};

export type UpiStoryInsights = {
  snapshot: SnapshotStoryInsight;
  monthly: MonthlyStoryInsight;
  category: CategoryStoryInsight;
  merchant: MerchantStoryInsight;
  behavior: BehaviorStoryInsight;
  size: SizeStoryInsight;
  momentum: MomentumStoryInsight;
};
