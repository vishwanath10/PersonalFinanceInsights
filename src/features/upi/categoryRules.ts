import { defaultCategoryRules } from "../../categorization/defaultRules";
import type { Transaction, TransactionType } from "../../types/transaction";

function combineKeywords(...groups: string[][]): string[] {
  return [...new Set(groups.flat().map((keyword) => keyword.trim().toLowerCase()).filter(Boolean))].sort();
}

export const upiCategoryRules: Record<string, string[]> = {
  "Food and Dining": combineKeywords(defaultCategoryRules["Food and Dining"], [
    "idli",
    "udupi",
    "dosa",
    "thali",
    "chaat"
  ]),
  Transportation: combineKeywords(defaultCategoryRules.Transportation, [
    "ticketing",
    "cab",
    "auto",
    "rickshaw",
    "namma metro"
  ]),
  Travel: combineKeywords(defaultCategoryRules.Travel, [
    "ixigo",
    "stay",
    "resort",
    "holiday",
    "trip split"
  ]),
  Shopping: combineKeywords(defaultCategoryRules.Shopping, [
    "retail",
    "shop",
    "store",
    "fashion",
    "electronics"
  ]),
  Groceries: combineKeywords(defaultCategoryRules.Groceries, [
    "super market",
    "fresh",
    "essentials",
    "home restock"
  ]),
  Entertainment: combineKeywords(defaultCategoryRules.Entertainment, [
    "cinemas",
    "movie",
    "games"
  ]),
  Utilities: combineKeywords(defaultCategoryRules.Utilities, ["bill"]),
  Fuel: combineKeywords(defaultCategoryRules.Fuel, ["fuel station"]),
  Healthcare: combineKeywords(defaultCategoryRules.Healthcare, [
    "clinic",
    "lab"
  ]),
  "Finance and Wallet": combineKeywords(defaultCategoryRules["Finance and Wallet"], [
    "google pay",
    "gpay",
    "cashfree",
    "razorpay"
  ]),
  Investments: combineKeywords(defaultCategoryRules.Investments, ["stocks"]),
  Insurance: combineKeywords(defaultCategoryRules.Insurance, ["acko"]),
  Education: combineKeywords(defaultCategoryRules.Education, [
    "fees",
    "tuition"
  ]),
  "Government and Tax": combineKeywords(defaultCategoryRules["Government and Tax"], [
    "road tax"
  ]),
  Transfers: combineKeywords([
    "received from",
    "transfer to",
    "sent to",
    "credited to",
    "bank transfer",
    "self transfer",
    "to xxxxxx",
    "from xxxxxx"
  ]),
  Others: []
};

export const upiCategoryOptions = Object.keys(upiCategoryRules);

const BUSINESS_HINTS = [
  "amazon",
  "flipkart",
  "myntra",
  "ajio",
  "nykaa",
  "blinkit",
  "zepto",
  "market",
  "mart",
  "store",
  "super",
  "restaurant",
  "hotel",
  "cafe",
  "express",
  "dining",
  "clinic",
  "medico",
  "pharmacy",
  "enterprise",
  "railways",
  "ticketing",
  "club",
  "bookmyshow",
  "airtel",
  "jio",
  "act",
  "bescom",
  "apollo",
  "cashfree",
  "phonepe",
  "gpay",
  "cred",
  "groww",
  "zerodha",
  "upstox",
  "acko",
  "school",
  "college",
  "fastag"
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function merchantWithoutPrefix(description: string): string {
  return description
    .replace(/^(paid to|received from|refund from|cashback from|credited to|transfer to|sent to)\s+/i, "")
    .trim();
}

export function extractUpiMerchantName(description: string): string {
  return merchantWithoutPrefix(description).replace(/\s+/g, " ").trim();
}

function looksLikePerson(merchant: string): boolean {
  const normalized = normalizeText(merchant);
  if (!normalized) {
    return false;
  }
  if (BUSINESS_HINTS.some((hint) => normalized.includes(hint))) {
    return false;
  }
  if (/x{4,}|\d{4,}/i.test(normalized)) {
    return true;
  }
  const words = merchant.trim().split(/\s+/);
  return (
    words.length >= 2 &&
    words.length <= 5 &&
    words.every((word) => /^[A-Za-z.'-]+$/.test(word))
  );
}

export function categorizeUpiDescription(
  description: string,
  type: TransactionType,
  rules: Record<string, string[]> = upiCategoryRules
): string {
  const text = normalizeText(description);
  const merchant = merchantWithoutPrefix(description);

  if (type === "credit" && /^(received from|credited to)/i.test(description)) {
    return "Transfers";
  }

  if (type === "debit" && /^(transfer to|sent to)/i.test(description)) {
    return "Transfers";
  }

  for (const category of Object.keys(rules)) {
    if (category === "Others") {
      continue;
    }
    if ((rules[category] ?? []).some((keyword) => text.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  if (type === "debit" && /^paid to /i.test(description) && looksLikePerson(merchant)) {
    return "Transfers";
  }

  return "Others";
}

export function applyUpiCategories(
  transactions: Transaction[],
  rules: Record<string, string[]>
): Transaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    category: categorizeUpiDescription(transaction.description, transaction.type, rules)
  }));
}
