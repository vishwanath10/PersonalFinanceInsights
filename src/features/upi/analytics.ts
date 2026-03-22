import type { Transaction } from "../../types/transaction";
import type {
  CategoryBreakdownItem,
  CumulativeSpendPoint,
  MerchantSpendItem,
  MonthlyAggregate,
  TransactionSizeBucket,
  UpiDashboardData,
  UpiSummary,
  WeeklyPatternItem
} from "./types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SIZE_BUCKETS: Array<{ label: string; min: number; max?: number }> = [
  { label: "0-100", min: 0, max: 100 },
  { label: "100-500", min: 100, max: 500 },
  { label: "500-2000", min: 500, max: 2000 },
  { label: "2000+", min: 2000 }
];

function getDebitTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((transaction) => transaction.type === "debit");
}

function getCreditTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((transaction) => transaction.type === "credit");
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getMerchantName(transaction: Transaction): string {
  const raw = transaction.merchant ?? transaction.description;
  const merchant = raw
    .replace(/^(paid to|received from|cashback from|refund from|transfer to|sent to)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return merchant ? titleCase(merchant) : "Unknown";
}

function safeDate(dateString: string): Date {
  return new Date(`${dateString}T12:00:00`);
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

function getDateRange(transactions: Transaction[]): { start: string; end: string } | undefined {
  const dates = transactions.map((transaction) => transaction.date).sort();
  if (dates.length === 0) {
    return undefined;
  }
  return {
    start: dates[0],
    end: dates[dates.length - 1]
  };
}

export function getSummaryMetrics(transactions: Transaction[]): UpiSummary {
  const debits = getDebitTransactions(transactions);
  const credits = getCreditTransactions(transactions);
  const monthlyDebitData = aggregateMonthlyData(transactions).filter((month) => month.debit > 0);
  const totalSpend = debits.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalCredits = credits.reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    totalSpend,
    totalCredits,
    netFlow: totalCredits - totalSpend,
    monthlyAverageSpend:
      monthlyDebitData.length > 0 ? totalSpend / monthlyDebitData.length : 0,
    debitCount: debits.length,
    creditCount: credits.length
  };
}

export function aggregateMonthlyData(transactions: Transaction[]): MonthlyAggregate[] {
  const monthlyMap = new Map<string, { debit: number; credit: number }>();

  for (const transaction of transactions) {
    const key = toMonthKey(transaction.date);
    const current = monthlyMap.get(key) ?? { debit: 0, credit: 0 };
    if (transaction.type === "debit") {
      current.debit += transaction.amount;
    } else {
      current.credit += transaction.amount;
    }
    monthlyMap.set(key, current);
  }

  const totalDebit = [...monthlyMap.values()].reduce((sum, item) => sum + item.debit, 0);

  return [...monthlyMap.entries()]
    .sort(([firstMonth], [secondMonth]) => firstMonth.localeCompare(secondMonth))
    .map(([monthKey, values]) => ({
      monthKey,
      debit: values.debit,
      credit: values.credit,
      net: values.credit - values.debit,
      shareOfSpend: percent(values.debit, totalDebit)
    }));
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  limit = 6
): CategoryBreakdownItem[] {
  const totals = new Map<string, number>();
  const debits = getDebitTransactions(transactions);

  for (const transaction of debits) {
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
  }

  const totalSpend = debits.reduce((sum, transaction) => sum + transaction.amount, 0);
  const ranked = [...totals.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((first, second) => second.amount - first.amount);

  const primary = ranked.slice(0, limit);
  const othersAmount = ranked.slice(limit).reduce((sum, item) => sum + item.amount, 0);
  const combined = othersAmount > 0 ? [...primary, { label: "Others", amount: othersAmount }] : primary;

  return combined.map((item) => ({
    ...item,
    percentage: percent(item.amount, totalSpend)
  }));
}

export function getTopMerchants(transactions: Transaction[], limit = 10): MerchantSpendItem[] {
  const merchantMap = new Map<string, { amount: number; count: number }>();
  const debits = getDebitTransactions(transactions);
  const totalSpend = debits.reduce((sum, transaction) => sum + transaction.amount, 0);

  for (const transaction of debits) {
    const merchant = getMerchantName(transaction);
    const current = merchantMap.get(merchant) ?? { amount: 0, count: 0 };
    merchantMap.set(merchant, {
      amount: current.amount + transaction.amount,
      count: current.count + 1
    });
  }

  return [...merchantMap.entries()]
    .map(([merchant, values]) => ({
      merchant,
      amount: values.amount,
      count: values.count,
      percentage: percent(values.amount, totalSpend)
    }))
    .sort((first, second) => second.amount - first.amount)
    .slice(0, limit);
}

export function getWeeklyPattern(transactions: Transaction[]): WeeklyPatternItem[] {
  const dayMap = new Map<string, number>(WEEKDAYS.map((day) => [day, 0]));
  const debits = getDebitTransactions(transactions);
  const totalSpend = debits.reduce((sum, transaction) => sum + transaction.amount, 0);

  for (const transaction of debits) {
    const date = safeDate(transaction.date);
    const weekday = WEEKDAYS[(date.getDay() + 6) % 7];
    dayMap.set(weekday, (dayMap.get(weekday) ?? 0) + transaction.amount);
  }

  return WEEKDAYS.map((day) => {
    const amount = dayMap.get(day) ?? 0;
    return {
      day,
      amount,
      percentage: percent(amount, totalSpend)
    };
  });
}

export function getTransactionSizeDistribution(
  transactions: Transaction[]
): TransactionSizeBucket[] {
  const debits = getDebitTransactions(transactions);
  const totalCount = debits.length;

  const buckets = SIZE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: 0,
    totalAmount: 0,
    percentage: 0
  }));

  for (const transaction of debits) {
    const bucketIndex = SIZE_BUCKETS.findIndex((bucket) => {
      if (bucket.max === undefined) {
        return transaction.amount >= bucket.min;
      }
      return transaction.amount >= bucket.min && transaction.amount < bucket.max;
    });

    const index = bucketIndex === -1 ? buckets.length - 1 : bucketIndex;
    buckets[index].count += 1;
    buckets[index].totalAmount += transaction.amount;
  }

  return buckets.map((bucket) => ({
    ...bucket,
    percentage: percent(bucket.count, totalCount)
  }));
}

export function getCumulativeSpendCurve(
  transactions: Transaction[]
): CumulativeSpendPoint[] {
  const debits = getDebitTransactions(transactions);
  const dailyMap = new Map<string, number>();

  for (const transaction of debits) {
    dailyMap.set(transaction.date, (dailyMap.get(transaction.date) ?? 0) + transaction.amount);
  }

  const totalSpend = debits.reduce((sum, transaction) => sum + transaction.amount, 0);
  let runningTotal = 0;

  return [...dailyMap.entries()]
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, amount]) => {
      runningTotal += amount;
      return {
        date,
        amount,
        runningTotal,
        percentage: percent(runningTotal, totalSpend)
      };
    });
}

export function buildUpiDashboardData(transactions: Transaction[]): UpiDashboardData {
  return {
    summary: getSummaryMetrics(transactions),
    monthly: aggregateMonthlyData(transactions),
    categoryBreakdown: getCategoryBreakdown(transactions),
    topMerchants: getTopMerchants(transactions),
    weeklyPattern: getWeeklyPattern(transactions),
    transactionSizeDistribution: getTransactionSizeDistribution(transactions),
    cumulativeSpendCurve: getCumulativeSpendCurve(transactions),
    dateRange: getDateRange(transactions)
  };
}
