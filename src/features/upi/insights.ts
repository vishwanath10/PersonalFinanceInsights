import type { Transaction } from "../../types/transaction";
import type {
  BehaviorStoryInsight,
  CategoryStoryInsight,
  MomentumStoryInsight,
  MerchantStoryInsight,
  MonthlyStoryInsight,
  SizeStoryInsight,
  SnapshotStoryInsight,
  UpiDashboardData,
  UpiStoryInsights
} from "./types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatPercent(value: number): string {
  const absoluteValue = Math.abs(value);
  return `${absoluteValue.toFixed(absoluteValue >= 10 ? 0 : 1)}%`;
}

function formatSignedPercent(value: number): string {
  if (value === 0) {
    return "0%";
  }

  const sign = value > 0 ? "+" : "-";
  const absoluteValue = Math.abs(value);
  return `${sign}${absoluteValue.toFixed(absoluteValue >= 10 ? 0 : 1)}%`;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function toMonthLabel(monthKey: string): string {
  const date = new Date(`${monthKey}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric"
  }).format(date);
}

function toMonthKey(dateString: string): string {
  return dateString.slice(0, 7);
}

function percent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return (value / total) * 100;
}

function percentChange(current: number, previous: number): number | undefined {
  if (previous <= 0) {
    return undefined;
  }

  return ((current - previous) / previous) * 100;
}

function getDebitTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((transaction) => transaction.type === "debit");
}

function getMerchantName(transaction: Transaction): string {
  const raw = transaction.merchant ?? transaction.description;
  return raw
    .replace(/^(paid to|received from|cashback from|refund from|transfer to|sent to)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCoverageSentence(data: UpiDashboardData, coverageRatio: number): string {
  if (data.summary.totalSpend <= 0) {
    return "No debit activity is visible in the current filter selection.";
  }

  if (data.summary.totalCredits <= 0) {
    return "No credits landed in this view, so the movement here is entirely outward.";
  }

  if (data.summary.netFlow >= 0) {
    return `Credits covered ${formatPercent(coverageRatio)} of spend and still left a net inflow of ${formatCurrency(data.summary.netFlow)}.`;
  }

  return `Credits covered ${formatPercent(coverageRatio)} of spend, leaving a net outflow of ${formatCurrency(Math.abs(data.summary.netFlow))}.`;
}

function getTopMonthMerchantShare(
  transactions: Transaction[],
  monthKey: string
): { merchant?: string; share: number } {
  const monthlyDebits = getDebitTransactions(transactions).filter((transaction) =>
    transaction.date.startsWith(monthKey)
  );
  const monthTotal = sum(monthlyDebits.map((transaction) => transaction.amount));

  if (monthTotal <= 0) {
    return { share: 0 };
  }

  const merchantTotals = new Map<string, number>();

  for (const transaction of monthlyDebits) {
    const merchant = getMerchantName(transaction) || "Unknown";
    merchantTotals.set(merchant, (merchantTotals.get(merchant) ?? 0) + transaction.amount);
  }

  let topMerchant: string | undefined;
  let topAmount = 0;

  for (const [merchant, amount] of merchantTotals.entries()) {
    if (amount > topAmount) {
      topMerchant = merchant;
      topAmount = amount;
    }
  }

  return {
    merchant: topMerchant,
    share: percent(topAmount, monthTotal)
  };
}

function getMonthlyPhaseMetrics(transactions: Transaction[]): {
  dominantPhase: "early" | "mid" | "late" | "balanced";
  phaseShare: number;
  midpointShare: number;
} {
  const debitTransactions = getDebitTransactions(transactions);
  const totals = { early: 0, mid: 0, late: 0 };
  const monthlyMap = new Map<string, { total: number; firstHalf: number }>();

  for (const transaction of debitTransactions) {
    const dayOfMonth = Number(transaction.date.slice(8, 10));
    const monthKey = toMonthKey(transaction.date);
    const current = monthlyMap.get(monthKey) ?? { total: 0, firstHalf: 0 };

    current.total += transaction.amount;
    if (dayOfMonth <= 15) {
      current.firstHalf += transaction.amount;
    }
    monthlyMap.set(monthKey, current);

    if (dayOfMonth <= 10) {
      totals.early += transaction.amount;
    } else if (dayOfMonth <= 20) {
      totals.mid += transaction.amount;
    } else {
      totals.late += transaction.amount;
    }
  }

  const totalSpend = sum(debitTransactions.map((transaction) => transaction.amount));
  const earlyShare = percent(totals.early, totalSpend);
  const midShare = percent(totals.mid, totalSpend);
  const lateShare = percent(totals.late, totalSpend);
  const orderedShares = [
    { phase: "early" as const, share: earlyShare },
    { phase: "mid" as const, share: midShare },
    { phase: "late" as const, share: lateShare }
  ].sort((first, second) => second.share - first.share);

  const midpointShare =
    monthlyMap.size > 0
      ? sum([...monthlyMap.values()].map((item) => percent(item.firstHalf, item.total))) /
        monthlyMap.size
      : 0;

  if (orderedShares[0].share - orderedShares[2].share < 8) {
    return {
      dominantPhase: "balanced",
      phaseShare: orderedShares[0].share,
      midpointShare
    };
  }

  return {
    dominantPhase: orderedShares[0].phase,
    phaseShare: orderedShares[0].share,
    midpointShare
  };
}

export function generateSnapshotInsight(data: UpiDashboardData): SnapshotStoryInsight {
  const monthly = data.monthly.filter((month) => month.debit > 0);
  const recentQuarter = sum(monthly.slice(-3).map((month) => month.debit));
  const previousQuarter = sum(monthly.slice(-6, -3).map((month) => month.debit));
  const recentChange =
    previousQuarter > 0
      ? percentChange(recentQuarter, previousQuarter)
      : monthly.length >= 2
        ? percentChange(monthly[monthly.length - 1].debit, monthly[monthly.length - 2].debit)
        : undefined;
  const coverageRatio = percent(data.summary.totalCredits, data.summary.totalSpend);
  const topCategories = data.categoryBreakdown.filter((item) => item.label !== "Others").slice(0, 2);
  const coverageSentence = getCoverageSentence(data, coverageRatio);

  if (recentChange !== undefined && Math.abs(recentChange) >= 10) {
    return {
      headline: `Spending ${recentChange > 0 ? "picked up" : "eased"} in the latest stretch of the statement.`,
      detail: `Debit outflow moved ${formatSignedPercent(recentChange)} versus the prior period${topCategories.length > 0 ? `, with ${topCategories.map((item) => item.label.toLowerCase()).join(" and ")} shaping most of that movement` : ""}. ${coverageSentence}`,
      tone: recentChange > 0 ? "watch" : "steady",
      coverageRatio,
      recentChange
    };
  }

  if (topCategories[0]) {
    return {
      headline: `${topCategories[0].label} sets the tone for your current UPI profile.`,
      detail: `${topCategories[0].label} contributes ${formatPercent(topCategories[0].percentage)} of total spend${topCategories[1] ? `, followed by ${topCategories[1].label} at ${formatPercent(topCategories[1].percentage)}` : ""}. ${coverageSentence}`,
      tone: topCategories[0].percentage >= 35 ? "watch" : "steady",
      coverageRatio,
      recentChange
    };
  }

  return {
    headline:
      data.summary.netFlow >= 0
        ? "Credits currently outweigh your spending."
        : "Outflow dominates the current view.",
    detail: coverageSentence,
    tone: data.summary.netFlow >= 0 ? "positive" : "watch",
    coverageRatio,
    recentChange
  };
}

export function generateMonthlyInsight(
  transactions: Transaction[],
  data: UpiDashboardData
): MonthlyStoryInsight {
  const monthly = data.monthly.filter((month) => month.debit > 0);

  if (monthly.length === 0) {
    return {
      headline: "There is not enough debit activity to tell a month-by-month story yet.",
      detail:
        "Upload or filter to a range with debit transactions to surface a clearer evolution pattern.",
      tone: "steady"
    };
  }

  const peakMonth = [...monthly].sort((first, second) => second.debit - first.debit)[0];
  const quietestMonth = [...monthly].sort((first, second) => first.debit - second.debit)[0];
  const changes = monthly.slice(1).map((month, index) => {
    const previous = monthly[index];
    return {
      month,
      previous,
      change: percentChange(month.debit, previous.debit) ?? 0
    };
  });
  const sharpestRise = [...changes]
    .filter((item) => item.change > 0)
    .sort((first, second) => second.change - first.change)[0];
  const sharpestDrop = [...changes]
    .filter((item) => item.change < 0)
    .sort((first, second) => first.change - second.change)[0];
  const peakMerchantShare = getTopMonthMerchantShare(transactions, peakMonth.monthKey);

  if (sharpestRise && sharpestRise.change >= 15) {
    const cooldownSentence = sharpestDrop
      ? `The sharpest pullback came in ${toMonthLabel(sharpestDrop.month.monthKey)}, when spend fell ${formatPercent(sharpestDrop.change)} from the prior month.`
      : "";

    return {
      headline: `${toMonthLabel(sharpestRise.month.monthKey)} marks your clearest spending spike.`,
      detail: `Debit spend jumped ${formatPercent(sharpestRise.change)} versus ${toMonthLabel(sharpestRise.previous.monthKey)}.${peakMerchantShare.merchant && peakMerchantShare.share >= 20 ? ` ${peakMerchantShare.merchant} alone represented ${formatPercent(peakMerchantShare.share)} of spend in the peak month, so concentration was part of the surge.` : " The spike was distributed across multiple payments rather than one isolated transfer."} ${cooldownSentence}`.trim(),
      tone: "watch",
      peakMonthKey: peakMonth.monthKey,
      peakMonthAmount: peakMonth.debit,
      dropMonthKey: sharpestDrop?.month.monthKey ?? quietestMonth.monthKey,
      dropMonthAmount: sharpestDrop?.month.debit ?? quietestMonth.debit,
      sharpestChange: sharpestRise.change,
      sharpestChangeMonthKey: sharpestRise.month.monthKey
    };
  }

  return {
    headline: `${toMonthLabel(peakMonth.monthKey)} still stands out as your most expensive month.`,
    detail: `The period stayed more stable than spiky overall, but spend still peaked at ${formatCurrency(peakMonth.debit)} in ${toMonthLabel(peakMonth.monthKey)} and softened to ${formatCurrency(quietestMonth.debit)} in ${toMonthLabel(quietestMonth.monthKey)}.`,
    tone: "steady",
    peakMonthKey: peakMonth.monthKey,
    peakMonthAmount: peakMonth.debit,
    dropMonthKey: quietestMonth.monthKey,
    dropMonthAmount: quietestMonth.debit
  };
}

export function generateCategoryInsight(data: UpiDashboardData): CategoryStoryInsight {
  const dominantCategory = data.categoryBreakdown[0];
  const secondCategory = data.categoryBreakdown[1];

  if (!dominantCategory) {
    return {
      headline: "There is no category distribution to interpret in the current view.",
      detail:
        "Once debit transactions appear, this section will show which spending bucket dominates.",
      tone: "steady",
      dominantShare: 0
    };
  }

  if (
    secondCategory &&
    Math.abs(dominantCategory.percentage - secondCategory.percentage) <= 6 &&
    secondCategory.label !== "Others"
  ) {
    return {
      headline: `${dominantCategory.label} and ${secondCategory.label} are carrying the spend mix together.`,
      detail: `${dominantCategory.label} leads at ${formatPercent(dominantCategory.percentage)}, but the gap to ${secondCategory.label} is narrow enough that your outflow is split across two major themes rather than one dominant category.`,
      tone: "steady",
      dominantCategory: dominantCategory.label,
      dominantShare: dominantCategory.percentage,
      secondaryCategory: secondCategory.label
    };
  }

  return {
    headline: `${dominantCategory.label} is the clearest destination for your money.`,
    detail: `${dominantCategory.label} accounts for ${formatPercent(dominantCategory.percentage)} of total spend${secondCategory ? `, comfortably ahead of ${secondCategory.label}` : ""}, so it deserves the most attention if you want to control overall outflow.`,
    tone: dominantCategory.percentage >= 35 ? "watch" : "steady",
    dominantCategory: dominantCategory.label,
    dominantShare: dominantCategory.percentage,
    secondaryCategory: secondCategory?.label
  };
}

export function generateMerchantInsight(data: UpiDashboardData): MerchantStoryInsight {
  const merchants = data.topMerchants;
  const leadMerchant = merchants[0];
  const topThreeShare = sum(merchants.slice(0, 3).map((item) => item.percentage));

  if (!leadMerchant) {
    return {
      headline: "There are no debit merchants to rank in the current view.",
      detail:
        "Once merchant-level debit activity is available, this section will highlight concentration risk.",
      tone: "steady",
      topThreeShare: 0
    };
  }

  if (topThreeShare >= 40) {
    return {
      headline: "A small merchant set absorbs a large share of your spend.",
      detail: `Your top 3 merchants contribute ${formatPercent(topThreeShare)} of total debit value, with ${leadMerchant.merchant} alone taking ${formatPercent(leadMerchant.percentage)} across ${leadMerchant.count} payments.`,
      tone: "watch",
      leadMerchant: leadMerchant.merchant,
      topThreeShare
    };
  }

  return {
    headline: "Merchant spend is relatively spread out rather than concentrated.",
    detail: `Even your top 3 merchants account for only ${formatPercent(topThreeShare)} of debit value, which suggests your UPI usage is distributed across many destinations instead of a few recurring anchors.`,
    tone: "steady",
    leadMerchant: leadMerchant.merchant,
    topThreeShare
  };
}

export function generateBehaviorInsight(data: UpiDashboardData): BehaviorStoryInsight {
  const weekly = data.weeklyPattern;
  const peakDay = [...weekly].sort((first, second) => second.amount - first.amount)[0];
  const weekendAmount = sum(
    weekly.filter((item) => item.day === "Sat" || item.day === "Sun").map((item) => item.amount)
  );
  const weekdayAmount = sum(
    weekly.filter((item) => item.day !== "Sat" && item.day !== "Sun").map((item) => item.amount)
  );
  const totalSpend = weekendAmount + weekdayAmount;
  const weekendShare = percent(weekendAmount, totalSpend);
  const weekendDailyAverage = weekendAmount / 2;
  const weekdayDailyAverage = weekdayAmount / 5;

  if (!peakDay || totalSpend <= 0) {
    return {
      headline: "There is not enough weekly behavior data to interpret yet.",
      detail: "Debit activity needs to be present before a weekly rhythm becomes visible.",
      tone: "steady",
      weekendShare: 0
    };
  }

  if (weekendDailyAverage > weekdayDailyAverage * 1.15) {
    return {
      headline: "Weekend spending is your clearest recurring habit.",
      detail: `Saturday and Sunday average ${formatCurrency(weekendDailyAverage)} per day versus ${formatCurrency(weekdayDailyAverage)} on weekdays, which points to more discretionary use near the end of the week.`,
      tone: "watch",
      dominantDay: peakDay.day,
      weekendShare
    };
  }

  return {
    headline: `${peakDay.day} carries your heaviest routine spend load.`,
    detail: `${peakDay.day} contributes the highest daily total in the week pattern, while weekends together make up ${formatPercent(weekendShare)} of overall debit value.`,
    tone: peakDay.day === "Sat" || peakDay.day === "Sun" ? "watch" : "steady",
    dominantDay: peakDay.day,
    weekendShare
  };
}

export function generateSpendingStyleInsight(data: UpiDashboardData): SizeStoryInsight {
  const buckets = data.transactionSizeDistribution;
  const dominantBucket = [...buckets].sort((first, second) => second.count - first.count)[0];
  const smallTicketCount = sum(
    buckets
      .filter((bucket) => bucket.label === "0-100" || bucket.label === "100-500")
      .map((bucket) => bucket.count)
  );
  const totalCount = sum(buckets.map((bucket) => bucket.count));
  const totalAmount = sum(buckets.map((bucket) => bucket.totalAmount));
  const smallTicketShare = percent(smallTicketCount, totalCount);
  const largeAmountShare = percent(
    sum(buckets.filter((bucket) => bucket.label === "2000+").map((bucket) => bucket.totalAmount)),
    totalAmount
  );

  if (!dominantBucket || totalCount <= 0) {
    return {
      headline: "Transaction-size patterns are not available yet.",
      detail:
        "A visible mix of debit transactions is needed before spending style becomes readable.",
      tone: "steady",
      smallTicketShare: 0
    };
  }

  if (smallTicketShare >= 70) {
    return {
      headline: "Your UPI usage is high-frequency and low-value.",
      detail: `${formatPercent(smallTicketShare)} of transactions are under ${formatCurrency(500)}, which is typical of everyday checkout, food, and convenience spending rather than occasional large transfers.`,
      tone: "steady",
      dominantBucket: dominantBucket.label,
      smallTicketShare
    };
  }

  if (largeAmountShare >= 45) {
    return {
      headline: "Larger transfers are shaping more of your spend than quick micropayments.",
      detail: `The ${formatCurrency(2000)}+ bucket contributes ${formatPercent(largeAmountShare)} of total debit value, so a relatively small set of larger payments is influencing the story more than the low-ticket tail.`,
      tone: "watch",
      dominantBucket: dominantBucket.label,
      smallTicketShare
    };
  }

  return {
    headline: `${dominantBucket.label} is the most common ticket size in your UPI activity.`,
    detail: `Your spending style sits in the middle rather than at the extremes, with the ${dominantBucket.label} bucket showing up most often and smaller tickets still making up ${formatPercent(smallTicketShare)} of transaction count.`,
    tone: "steady",
    dominantBucket: dominantBucket.label,
    smallTicketShare
  };
}

export function generateMomentumInsight(
  transactions: Transaction[],
  data: UpiDashboardData
): MomentumStoryInsight {
  const phaseMetrics = getMonthlyPhaseMetrics(transactions);

  if (data.cumulativeSpendCurve.length === 0) {
    return {
      headline: "The cumulative spend curve needs debit activity before it can show momentum.",
      detail:
        "Once spending data is present, this section will reveal whether your outflow is front-loaded, mid-month heavy, or late-building.",
      tone: "steady",
      dominantPhase: "balanced",
      phaseShare: 0,
      midpointShare: 0
    };
  }

  if (phaseMetrics.dominantPhase === "balanced") {
    return {
      headline: "Your spend accumulates at a relatively even pace.",
      detail: `You typically reach about ${formatPercent(phaseMetrics.midpointShare)} of monthly spend by the 15th, so the cumulative curve climbs steadily instead of lurching in one concentrated phase.`,
      tone: "steady",
      dominantPhase: phaseMetrics.dominantPhase,
      phaseShare: phaseMetrics.phaseShare,
      midpointShare: phaseMetrics.midpointShare
    };
  }

  if (phaseMetrics.dominantPhase === "mid") {
    return {
      headline: "Spending accelerates in the middle of the month.",
      detail: `${formatPercent(phaseMetrics.phaseShare)} of debit value lands between the 11th and 20th, so the cumulative curve steepens around the midpoint and leaves less room to course-correct later.`,
      tone: "watch",
      dominantPhase: phaseMetrics.dominantPhase,
      phaseShare: phaseMetrics.phaseShare,
      midpointShare: phaseMetrics.midpointShare
    };
  }

  if (phaseMetrics.dominantPhase === "early") {
    return {
      headline: "Most months are front-loaded.",
      detail: `${formatPercent(phaseMetrics.phaseShare)} of debit value lands in the first ten days, which makes the cumulative curve jump early and can tighten the rest of the month.`,
      tone: "watch",
      dominantPhase: phaseMetrics.dominantPhase,
      phaseShare: phaseMetrics.phaseShare,
      midpointShare: phaseMetrics.midpointShare
    };
  }

  return {
    headline: "Spending gathers pace later in the month.",
    detail: `${formatPercent(phaseMetrics.phaseShare)} of debit value arrives after the 20th, so the cumulative curve stays calm early and steepens in the closing stretch of most months.`,
    tone: "watch",
    dominantPhase: phaseMetrics.dominantPhase,
    phaseShare: phaseMetrics.phaseShare,
    midpointShare: phaseMetrics.midpointShare
  };
}

export function buildUpiStoryInsights(
  transactions: Transaction[],
  data: UpiDashboardData
): UpiStoryInsights {
  return {
    snapshot: generateSnapshotInsight(data),
    monthly: generateMonthlyInsight(transactions, data),
    category: generateCategoryInsight(data),
    merchant: generateMerchantInsight(data),
    behavior: generateBehaviorInsight(data),
    size: generateSpendingStyleInsight(data),
    momentum: generateMomentumInsight(transactions, data)
  };
}
