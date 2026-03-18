import type { Transaction } from "../types/transaction";
import { merchantCategoryMap, sortedMerchantPatterns } from "./merchantMappings";

const OTHER_CATEGORY = "Others";

function normalizeMerchantText(description: string): string {
  return description
    .toUpperCase()
    .replace(/\b(UPI|POS|ECOM|NEFT|IMPS|RTGS|PG|P2M|P2A|CARD|TXN|TRF|PYMNT|RCV)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\b(INDIA|IND|PVT|LTD|LIMITED)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMerchantCategory(description: string): string | undefined {
  const normalized = normalizeMerchantText(description);
  if (!normalized) {
    return undefined;
  }

  for (const pattern of sortedMerchantPatterns) {
    if (normalized.includes(pattern)) {
      return merchantCategoryMap[pattern];
    }
  }

  return undefined;
}

export function categorizeDescription(
  description: string,
  rules: Record<string, string[]>
): string {
  const merchantCategory = findMerchantCategory(description);
  if (merchantCategory) {
    return merchantCategory;
  }

  const text = description.toLowerCase();

  for (const [category, keywords] of Object.entries(rules)) {
    if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return OTHER_CATEGORY;
}

export function applyCategories(
  transactions: Transaction[],
  rules: Record<string, string[]>
): Transaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    category: categorizeDescription(transaction.description, rules)
  }));
}
