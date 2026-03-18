import type { Transaction } from "../types/transaction";

const BANK_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  {
    name: "AU Small Finance Bank",
    patterns: [/au small finance/i, /\bau 0101\b/i, /aubl0ccards/i]
  },
  { name: "HDFC Bank", patterns: [/hdfc/i] },
  { name: "ICICI Bank", patterns: [/icici/i] },
  { name: "SBI Card", patterns: [/sbi card/i, /\bsbi\b/i] },
  { name: "Axis Bank", patterns: [/axis/i] },
  { name: "Kotak Mahindra Bank", patterns: [/kotak/i] },
  { name: "RBL Bank", patterns: [/\brbl\b/i] },
  { name: "IndusInd Bank", patterns: [/indusind/i] },
  { name: "Yes Bank", patterns: [/\byes bank\b/i] },
  { name: "HSBC", patterns: [/hsbc/i] },
  { name: "Citibank", patterns: [/citibank/i, /\bciti\b/i] },
  { name: "IDFC FIRST Bank", patterns: [/idfc/i] },
  { name: "Bank of Baroda", patterns: [/bank of baroda/i, /\bbob\b/i] },
  { name: "Punjab National Bank", patterns: [/punjab national/i, /\bpnb\b/i] }
];

export function parseAmountString(value: string): number | undefined {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.abs(num) : undefined;
}

export function inferBankName(text: string, fileName: string): string | undefined {
  for (const bank of BANK_PATTERNS) {
    if (bank.patterns.some((pattern) => pattern.test(text) || pattern.test(fileName))) {
      return bank.name;
    }
  }
  return undefined;
}

export function inferStatementPeriodFromTransactions(
  transactions: Transaction[]
): string | undefined {
  if (transactions.length === 0) {
    return undefined;
  }
  const dates = transactions.map((txn) => txn.date).sort();
  return `${dates[0]} to ${dates[dates.length - 1]}`;
}
