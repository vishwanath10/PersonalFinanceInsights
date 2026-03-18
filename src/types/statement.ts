export type StatementMetadata = {
  bankName?: string;
  totalBillAmount?: number;
  minimumAmountDue?: number;
  paymentDueDate?: string;
  statementPeriod?: string;
};

export type ParseResult = {
  transactions: import("./transaction").Transaction[];
  metadata: StatementMetadata;
};
