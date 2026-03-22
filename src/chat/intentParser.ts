import type { ParsedIntent } from "./types";

const monthMap: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12
};

function extractMonthAndYear(query: string): { month?: number; year?: number } {
  const monthRegex =
    /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct|november|nov|december|dec)\b/i;
  const monthMatch = query.match(monthRegex);
  const yearMatch = query.match(/\b(20\d{2})\b/);

  return {
    month: monthMatch ? monthMap[monthMatch[1].toLowerCase()] : undefined,
    year: yearMatch ? Number(yearMatch[1]) : undefined
  };
}

export function parseIntent(rawQuery: string): ParsedIntent {
  const query = rawQuery.trim().toLowerCase();

  if (
    /\b(which|what)\s+category\b.*\b(highest|top|largest)\b.*\bthis month\b/.test(query) ||
    /\b(highest|top|largest)\s+category\b.*\bthis month\b/.test(query)
  ) {
    return { type: "top_category_this_month" };
  }

  if (
    /\bhow has\b.*\bspending\b.*\bchanged\b/.test(query) ||
    /\bspending\b.*\bchanged over time\b/.test(query) ||
    /\bspending trend\b/.test(query)
  ) {
    return { type: "spending_change" };
  }

  if (
    /\bwhere am i spending the most\b/.test(query) ||
    /\b(top|highest|largest)\s+category\b/.test(query)
  ) {
    return { type: "top_category" };
  }

  const merchantSpendMatch = query.match(
    /(?:how much|total|what).*?(?:spen[dt]|paid).*?(?:on|at|to)\s+(.+)$/
  );
  if (merchantSpendMatch) {
    return { type: "merchant_spend", merchant: merchantSpendMatch[1].trim() };
  }

  const categorySpendMatch = query.match(
    /(?:how much|total|what).*?(?:spen[dt]|paid).*?(?:in|for)\s+(food and dining|food|transportation|travel|shopping|groceries|bills|transfers|entertainment|utilities|fuel|healthcare|finance and wallet|investments|insurance|education|government and tax|others)\b/
  );
  if (categorySpendMatch) {
    return { type: "category_spend", category: categorySpendMatch[1] };
  }

  if (
    /\btop\b.*\bmerchant/.test(query) ||
    /\bwhich merchants?\b.*\b(biggest|highest|top)\b/.test(query) ||
    /\bbiggest merchants?\b/.test(query)
  ) {
    const limit = Number(query.match(/\btop\s+(\d+)\b/)?.[1] ?? "5");
    return { type: "top_merchants", limit: Number.isFinite(limit) ? limit : 5 };
  }

  if (/\bcredit|refund/.test(query) && /\bfrom\b/.test(query)) {
    const merchant = query.match(/\bfrom\s+(.+)$/)?.[1]?.trim();
    return { type: "merchant_credits", merchant };
  }

  if (/\bspen[dt]\b.*\bin\b/.test(query) || /\bmonth\b/.test(query)) {
    const { month, year } = extractMonthAndYear(query);
    if (month) {
      return { type: "month_spend", month, year };
    }
  }

  return { type: "help" };
}
