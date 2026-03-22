import type { Transaction } from "../types/transaction";
import { parseIntent } from "./intentParser";
import type { ChatResult } from "./types";

function currency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function displayName(text: string): string {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTopMerchants(transactions: Transaction[], limit: number): string {
  const merchantTotals: Record<string, number> = {};
  for (const txn of transactions.filter((t) => t.type === "debit")) {
    const merchant = normalize(txn.merchant ?? txn.description);
    merchantTotals[merchant] = (merchantTotals[merchant] ?? 0) + txn.amount;
  }

  const top = Object.entries(merchantTotals)
    .map(([merchant, amount]) => ({ merchant, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  if (top.length === 0) {
    return "No spending transactions found.";
  }

  return top
    .map((item, index) => `${index + 1}. ${displayName(item.merchant)} (${currency(item.amount)})`)
    .join(" | ");
}

function formatMonthLabel(monthKey: string): string {
  const date = new Date(`${monthKey}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric"
  }).format(date);
}

function getDebitTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((transaction) => transaction.type === "debit");
}

function getCategoryLeaderboard(
  transactions: Transaction[],
  monthKey?: string
): Array<{ category: string; total: number; transactions: Transaction[] }> {
  const totals = new Map<string, { total: number; transactions: Transaction[] }>();

  for (const transaction of getDebitTransactions(transactions)) {
    if (monthKey && !transaction.date.startsWith(monthKey)) {
      continue;
    }

    const current = totals.get(transaction.category) ?? { total: 0, transactions: [] };
    current.total += transaction.amount;
    current.transactions.push(transaction);
    totals.set(transaction.category, current);
  }

  return [...totals.entries()]
    .map(([category, value]) => ({
      category,
      total: value.total,
      transactions: value.transactions
    }))
    .sort((first, second) => second.total - first.total);
}

function getLatestMonthKey(transactions: Transaction[]): string | undefined {
  const monthKeys = getDebitTransactions(transactions)
    .map((transaction) => transaction.date.slice(0, 7))
    .sort();
  return monthKeys[monthKeys.length - 1];
}

function formatPercent(value: number): string {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function answerTopCategory(
  transactions: Transaction[],
  monthKey?: string
): ChatResult {
  const leaderboard = getCategoryLeaderboard(transactions, monthKey);
  const lead = leaderboard[0];
  const runnerUp = leaderboard[1];
  const total = leaderboard.reduce((sum, item) => sum + item.total, 0);

  if (!lead || total <= 0) {
    return {
      answer: monthKey
        ? `No debit category data is available for ${formatMonthLabel(monthKey)}.`
        : "No debit category data is available in the current view.",
      matchedTransactions: []
    };
  }

  const share = (lead.total / total) * 100;
  const answer = monthKey
    ? `${lead.category} is the highest category in ${formatMonthLabel(monthKey)} at ${currency(
        lead.total
      )}, which is ${formatPercent(share)} of debit spend${
        runnerUp ? `. Next is ${runnerUp.category} at ${currency(runnerUp.total)}.` : "."
      }`
    : `You are spending the most in ${lead.category} at ${currency(lead.total)}, which is ${formatPercent(
        share
      )} of debit spend${
        runnerUp ? `. ${runnerUp.category} follows at ${currency(runnerUp.total)}.` : "."
      }`;

  return {
    answer,
    matchedTransactions: lead.transactions
  };
}

function answerSpendingChange(transactions: Transaction[]): ChatResult {
  const monthlyTotals = new Map<string, number>();

  for (const transaction of getDebitTransactions(transactions)) {
    const monthKey = transaction.date.slice(0, 7);
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) ?? 0) + transaction.amount);
  }

  const monthly = [...monthlyTotals.entries()]
    .map(([monthKey, total]) => ({ monthKey, total }))
    .sort((first, second) => first.monthKey.localeCompare(second.monthKey));

  if (monthly.length === 0) {
    return {
      answer: "No debit transactions are visible, so there is no spending trend to compare yet.",
      matchedTransactions: []
    };
  }

  if (monthly.length === 1) {
    return {
      answer: `Only ${formatMonthLabel(monthly[0].monthKey)} is visible right now, with debit spend of ${currency(
        monthly[0].total
      )}.`,
      matchedTransactions: getDebitTransactions(transactions)
    };
  }

  const latest = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];
  const peak = [...monthly].sort((first, second) => second.total - first.total)[0];
  const change =
    previous.total > 0 ? ((latest.total - previous.total) / previous.total) * 100 : undefined;
  const direction =
    change === undefined || change === 0 ? "was flat" : change > 0 ? "increased" : "decreased";
  const changeText =
    change === undefined
      ? ""
      : ` It ${direction} ${formatPercent(Math.abs(change))} from ${currency(previous.total)} in ${formatMonthLabel(
          previous.monthKey
        )} to ${currency(latest.total)} in ${formatMonthLabel(latest.monthKey)}.`;

  return {
    answer: `Your latest visible month is ${formatMonthLabel(latest.monthKey)} at ${currency(
      latest.total
    )}.${changeText} The peak month in this view is ${formatMonthLabel(
      peak.monthKey
    )} at ${currency(peak.total)}.`,
    matchedTransactions: getDebitTransactions(transactions).filter((transaction) =>
      transaction.date.startsWith(latest.monthKey)
    )
  };
}

export function answerQuery(query: string, transactions: Transaction[]): ChatResult {
  const intent = parseIntent(query);

  if (transactions.length === 0) {
    return {
      answer: "No transactions loaded yet. Upload a statement first.",
      matchedTransactions: []
    };
  }

  if (intent.type === "merchant_spend" && intent.merchant) {
    const term = normalize(intent.merchant);
    const matches = transactions.filter(
      (txn) =>
        txn.type === "debit" &&
        normalize(`${txn.merchant ?? ""} ${txn.description}`).includes(term)
    );
    const total = matches.reduce((sum, txn) => sum + txn.amount, 0);
    return {
      answer:
        matches.length > 0
          ? `You spent ${currency(total)} on ${intent.merchant}.`
          : `No spending found for ${intent.merchant}.`,
      matchedTransactions: matches
    };
  }

  if (intent.type === "category_spend" && intent.category) {
    const category = normalize(intent.category);
    const matches = transactions.filter(
      (txn) => txn.type === "debit" && normalize(txn.category) === category
    );
    const total = matches.reduce((sum, txn) => sum + txn.amount, 0);
    return {
      answer:
        matches.length > 0
          ? `You spent ${currency(total)} in ${intent.category}.`
          : `No spending found in ${intent.category}.`,
      matchedTransactions: matches
    };
  }

  if (intent.type === "month_spend" && intent.month) {
    const matches = transactions.filter((txn) => {
      const [year, month] = txn.date.split("-").map(Number);
      if (month !== intent.month) {
        return false;
      }
      if (intent.year && year !== intent.year) {
        return false;
      }
      return txn.type === "debit";
    });
    const total = matches.reduce((sum, txn) => sum + txn.amount, 0);
    return {
      answer:
        matches.length > 0
          ? `Your spending for month ${intent.month}${intent.year ? `/${intent.year}` : ""} is ${currency(total)}.`
          : "No spending found for that month.",
      matchedTransactions: matches
    };
  }

  if (intent.type === "top_merchants") {
    const answer = formatTopMerchants(transactions, intent.limit ?? 5);
    return { answer, matchedTransactions: [] };
  }

  if (intent.type === "top_category") {
    return answerTopCategory(transactions);
  }

  if (intent.type === "spending_change") {
    return answerSpendingChange(transactions);
  }

  if (intent.type === "top_category_this_month") {
    const latestMonthKey = getLatestMonthKey(transactions);
    if (!latestMonthKey) {
      return {
        answer: "No debit transactions are visible, so there is no current-month category leader yet.",
        matchedTransactions: []
      };
    }

    return answerTopCategory(transactions, latestMonthKey);
  }

  if (intent.type === "merchant_credits" && intent.merchant) {
    const term = normalize(intent.merchant);
    const matches = transactions.filter(
      (txn) =>
        txn.type === "credit" &&
        normalize(`${txn.merchant ?? ""} ${txn.description}`).includes(term)
    );
    const total = matches.reduce((sum, txn) => sum + txn.amount, 0);
    return {
      answer:
        matches.length > 0
          ? `Credits from ${intent.merchant}: ${matches.length} transaction(s), total ${currency(total)}.`
          : `No credits found from ${intent.merchant}.`,
      matchedTransactions: matches
    };
  }

  return {
    answer:
      "Try queries like: 'Where am I spending the most?', 'How has my spending changed over time?', 'Which category is highest this month?', 'Top 10 merchants', or 'How much did I spend in Travel?'.",
    matchedTransactions: []
  };
}
