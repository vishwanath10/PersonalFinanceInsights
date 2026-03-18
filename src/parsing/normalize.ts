import { categorizeDescription } from "../categorization/categorizer";
import type { Transaction, TransactionType } from "../types/transaction";
import { toIsoDate } from "../utils/date";

type RawTransaction = {
  date: string;
  description: string;
  amount: number | string;
  type?: TransactionType | string;
  category?: string;
};

function normalizeAmount(value: number | string): number {
  if (typeof value === "number") {
    return Math.abs(value);
  }
  const cleaned = value.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function inferType(value: number | string, declared?: string): TransactionType {
  if (declared) {
    const normalized = declared.toLowerCase();
    if (normalized.includes("credit")) {
      return "credit";
    }
    if (normalized.includes("debit")) {
      return "debit";
    }
  }

  const numeric = typeof value === "number" ? value : Number(value);
  return numeric < 0 ? "credit" : "debit";
}

export function normalizeTransactions(
  rawRows: RawTransaction[],
  categoryRules: Record<string, string[]>
): Transaction[] {
  return rawRows
    .filter((row) => row.date && row.description && row.amount !== undefined)
    .map((row, index) => {
      const normalizedDate = toIsoDate(row.date);
      if (!normalizedDate) {
        return null;
      }
      const type = inferType(row.amount, row.type);
      const amount = normalizeAmount(row.amount);
      const category =
        row.category && row.category.trim().length > 0
          ? row.category.trim()
          : categorizeDescription(row.description, categoryRules);

      return {
        id: `${normalizedDate}-${row.description}-${index}`,
        date: normalizedDate,
        description: row.description.trim(),
        amount,
        type,
        category
      };
    })
    .filter((txn): txn is Transaction => txn !== null);
}
