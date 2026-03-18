import * as XLSX from "xlsx";
import { normalizeTransactions } from "./normalize";
import type { ParseResult } from "../types/statement";
import { readFileAsArrayBuffer } from "./fileReader";
import {
  inferBankName,
  inferStatementPeriodFromTransactions,
  parseAmountString
} from "./metadata";

export async function parseXlsxFile(
  file: File,
  categoryRules: Record<string, string[]>
): Promise<ParseResult> {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);

  const mapped = rows.map((row) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), String(v ?? "")])
    );
    return {
      date: normalized.date ?? normalized["txn date"] ?? "",
      description:
        normalized.description ?? normalized.narration ?? normalized.merchant ?? "",
      amount: normalized.amount ?? normalized.debit ?? "0",
      type: normalized.type,
      category: normalized.category
    };
  });

  const transactions = normalizeTransactions(mapped, categoryRules);

  const rawSheetText = rows
    .flatMap((row) => Object.values(row))
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();

  const totalBillMatch = rawSheetText.match(/total bill amount[^0-9]*([\d,]+\.\d{2})/i);
  const minimumDueMatch = rawSheetText.match(
    /minimum amount due[^0-9]*([\d,]+\.\d{2})/i
  );
  const dueDateMatch = rawSheetText.match(
    /payment due date[^A-Za-z0-9]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i
  );
  const statementPeriodMatch = rawSheetText.match(
    /(statement period|statement for).*?(\d{1,2}\s+[A-Za-z]{3,9}\s*-\s*\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i
  );

  return {
    transactions,
    metadata: {
      bankName: inferBankName(rawSheetText, file.name),
      totalBillAmount: totalBillMatch ? parseAmountString(totalBillMatch[1]) : undefined,
      minimumAmountDue: minimumDueMatch ? parseAmountString(minimumDueMatch[1]) : undefined,
      paymentDueDate: dueDateMatch?.[1],
      statementPeriod:
        statementPeriodMatch?.[2] ?? inferStatementPeriodFromTransactions(transactions)
    }
  };
}
