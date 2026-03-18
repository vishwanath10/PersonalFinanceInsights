export type TransactionType = "debit" | "credit";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
};

export type DatePreset = "last30" | "last3months" | "financialYear" | "custom";

export type SortField = "amount" | "date" | "merchant" | "type" | "category";

export type SortDirection = "asc" | "desc";

export type Filters = {
  preset: DatePreset;
  startDate: string;
  endDate: string;
  sortField: SortField;
  sortDirection: SortDirection;
};
