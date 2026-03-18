import type { Transaction } from "../types/transaction";

export type MerchantGroup = {
  id: string;
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  transactions: Transaction[];
};

const NOISE_TOKENS = new Set([
  "PAY",
  "PAYMENT",
  "PAYOUT",
  "RETAIL",
  "STORE",
  "SHOP",
  "SHOPPING",
  "ONLINE",
  "MARKETPLACE",
  "SERVICES",
  "SERVICE",
  "INDIA",
  "PRIVATE",
  "PVT",
  "LTD",
  "LIMITED",
  "CARD",
  "CREDIT",
  "DEBIT",
  "PURCHASE",
  "TXN",
  "UPI",
  "POS",
  "NEFT",
  "IMPS",
  "RTGS",
  "BANK",
  "REF",
  "ORDER",
  "MOBILE"
]);

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function tokenize(description: string): string[] {
  return description
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token.length >= 3 && !NOISE_TOKENS.has(token));
}

function canonicalMerchant(description: string): string {
  const tokens = tokenize(description);
  if (tokens.length === 0) {
    return "Other";
  }
  return toTitleCase(tokens[0]);
}

export function groupMerchants(transactions: Transaction[]): MerchantGroup[] {
  const debitTransactions = transactions.filter((txn) => txn.type === "debit");
  const groups = new Map<string, MerchantGroup>();

  for (const txn of debitTransactions) {
    const merchant = canonicalMerchant(txn.description);
    const existing = groups.get(merchant);
    if (existing) {
      existing.totalSpent += txn.amount;
      existing.transactionCount += 1;
      existing.transactions.push(txn);
      continue;
    }

    groups.set(merchant, {
      id: merchant.toLowerCase().replace(/\s+/g, "-"),
      merchant,
      totalSpent: txn.amount,
      transactionCount: 1,
      transactions: [txn]
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      transactions: [...group.transactions].sort((a, b) => {
        if (a.date === b.date) {
          return b.amount - a.amount;
        }
        return b.date.localeCompare(a.date);
      })
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}
