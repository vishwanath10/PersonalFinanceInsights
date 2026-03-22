import type { Transaction } from "../types/transaction";

export type ChatIntentType =
  | "merchant_spend"
  | "category_spend"
  | "month_spend"
  | "top_merchants"
  | "merchant_credits"
  | "top_category"
  | "spending_change"
  | "top_category_this_month"
  | "help";

export type ParsedIntent = {
  type: ChatIntentType;
  merchant?: string;
  category?: string;
  month?: number;
  year?: number;
  limit?: number;
};

export type ChatResult = {
  answer: string;
  matchedTransactions: Transaction[];
};
