import Papa from "papaparse";
import { normalizeTransactions } from "./normalize";
import type { ParseResult } from "../types/statement";
import { readFileAsText } from "./fileReader";
import {
  inferBankName,
  inferStatementPeriodFromTransactions,
  parseAmountString
} from "./metadata";

type CsvRow = Record<string, string>;

function mapCsvRow(row: CsvRow): {
  date: string;
  description: string;
  amount: string;
  type?: string;
  category?: string;
} {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
  );

  return {
    date: normalized.date ?? normalized["txn date"] ?? normalized.transaction_date ?? "",
    description:
      normalized.description ??
      normalized.narration ??
      normalized.merchant ??
      normalized.details ??
      "",
    amount: normalized.amount ?? normalized.debit ?? normalized.value ?? "0",
    type: normalized.type ?? (normalized.debit ? "debit" : undefined),
    category: normalized.category
  };
}

export function parseCsvFile(
  file: File,
  categoryRules: Record<string, string[]>
): Promise<ParseResult> {
  return readFileAsText(file).then(
    (text) =>
      new Promise<ParseResult>((resolve, reject) => {
        Papa.parse<CsvRow>(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            if (result.errors.length > 0) {
              reject(new Error(result.errors[0].message));
              return;
            }
            const mapped = result.data.map(mapCsvRow);
            const transactions = normalizeTransactions(mapped, categoryRules);
            const lowerText = text.toLowerCase();

            const totalBillMatch = lowerText.match(
              /total bill amount[^0-9]*([\d,]+\.\d{2})/i
            );
            const minimumDueMatch = lowerText.match(
              /minimum amount due[^0-9]*([\d,]+\.\d{2})/i
            );
            const dueDateMatch = text.match(
              /payment due date[^A-Za-z0-9]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i
            );
            const statementPeriodMatch = text.match(
              /(statement period|statement for).*?(\d{1,2}\s+[A-Za-z]{3,9}\s*-\s*\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i
            );

            resolve({
              transactions,
              metadata: {
                bankName: inferBankName(text, file.name),
                totalBillAmount: totalBillMatch
                  ? parseAmountString(totalBillMatch[1])
                  : undefined,
                minimumAmountDue: minimumDueMatch
                  ? parseAmountString(minimumDueMatch[1])
                  : undefined,
                paymentDueDate: dueDateMatch?.[1],
                statementPeriod:
                  statementPeriodMatch?.[2] ??
                  inferStatementPeriodFromTransactions(transactions)
              }
            });
          },
          error: (error: Error) => reject(error)
        });
      })
  );
}
