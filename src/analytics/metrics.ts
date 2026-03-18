import type { Transaction } from "../types/transaction";

export type AnalyticsSummary = {
  totalSpending: number;
  largestTransaction: number;
  averageTransaction: number;
  spendingByCategory: Record<string, number>;
  monthlySpending: Record<string, number>;
  trendData: Record<string, number>;
  topMerchants: Array<{ merchant: string; amount: number }>;
  recurringTransactions: Array<{ merchant: string; avgAmount: number; count: number }>;
  monthlyGrowthRate: number;
  anomalies: Transaction[];
};

function getDebitTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((txn) => txn.type === "debit");
}

function merchantFromDescription(description: string): string {
  return description.trim().toLowerCase().replace(/\s+/g, " ");
}

function findRecurring(transactions: Transaction[]): AnalyticsSummary["recurringTransactions"] {
  const groups = new Map<string, number[]>();

  for (const txn of transactions) {
    const merchant = merchantFromDescription(txn.description);
    const list = groups.get(merchant) ?? [];
    list.push(txn.amount);
    groups.set(merchant, list);
  }

  const recurring: AnalyticsSummary["recurringTransactions"] = [];
  for (const [merchant, amounts] of groups.entries()) {
    if (amounts.length < 2) {
      continue;
    }
    const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const isRecurring = amounts.every(
      (amount) => Math.abs(amount - average) <= average * 0.05
    );
    if (isRecurring) {
      recurring.push({
        merchant,
        avgAmount: average,
        count: amounts.length
      });
    }
  }

  return recurring.sort((a, b) => b.count - a.count);
}

function detectAnomalies(transactions: Transaction[]): Transaction[] {
  if (transactions.length < 2) {
    return [];
  }
  const amounts = transactions.map((t) => t.amount);
  const mean = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
  const variance =
    amounts.reduce((sum, value) => sum + (value - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return [];
  }

  return transactions.filter((txn) => Math.abs((txn.amount - mean) / stdDev) > 2.5);
}

export function computeAnalytics(transactions: Transaction[]): AnalyticsSummary {
  const debits = getDebitTransactions(transactions);
  const totalSpending = debits.reduce((sum, txn) => sum + txn.amount, 0);
  const largestTransaction = debits.reduce((max, txn) => Math.max(max, txn.amount), 0);
  const averageTransaction = debits.length > 0 ? totalSpending / debits.length : 0;

  const spendingByCategory: Record<string, number> = {};
  const monthlySpending: Record<string, number> = {};
  const merchantSpend: Record<string, number> = {};

  for (const txn of debits) {
    spendingByCategory[txn.category] = (spendingByCategory[txn.category] ?? 0) + txn.amount;
    const month = txn.date.slice(0, 7);
    monthlySpending[month] = (monthlySpending[month] ?? 0) + txn.amount;
    const merchant = merchantFromDescription(txn.description);
    merchantSpend[merchant] = (merchantSpend[merchant] ?? 0) + txn.amount;
  }

  const sortedMonths = Object.keys(monthlySpending).sort();
  const monthlyGrowthRate =
    sortedMonths.length >= 2
      ? ((monthlySpending[sortedMonths[sortedMonths.length - 1]] -
          monthlySpending[sortedMonths[sortedMonths.length - 2]]) /
          Math.max(monthlySpending[sortedMonths[sortedMonths.length - 2]], 1)) *
        100
      : 0;

  const topMerchants = Object.entries(merchantSpend)
    .map(([merchant, amount]) => ({ merchant, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    totalSpending,
    largestTransaction,
    averageTransaction,
    spendingByCategory,
    monthlySpending,
    trendData: monthlySpending,
    topMerchants,
    recurringTransactions: findRecurring(debits),
    monthlyGrowthRate,
    anomalies: detectAnomalies(debits)
  };
}
