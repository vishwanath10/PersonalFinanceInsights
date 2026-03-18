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

function formatTopMerchants(transactions: Transaction[], limit: number): string {
  const merchantTotals: Record<string, number> = {};
  for (const txn of transactions.filter((t) => t.type === "debit")) {
    const merchant = normalize(txn.description);
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
    .map((item, index) => `${index + 1}. ${item.merchant} (${currency(item.amount)})`)
    .join(" | ");
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
      (txn) => txn.type === "debit" && normalize(txn.description).includes(term)
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

  if (intent.type === "merchant_credits" && intent.merchant) {
    const term = normalize(intent.merchant);
    const matches = transactions.filter(
      (txn) => txn.type === "credit" && normalize(txn.description).includes(term)
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
      "Try queries like: 'How much did I spend on Amazon?', 'Top 5 merchants', 'How much spent in Feb 2026?', 'Credits from IRCTC'.",
    matchedTransactions: []
  };
}
