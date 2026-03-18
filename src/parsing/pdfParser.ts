import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { normalizeTransactions } from "./normalize";
import type { ParseResult, StatementMetadata } from "../types/statement";
import { readFileAsArrayBuffer } from "./fileReader";
import { PdfIncorrectPasswordError, PdfPasswordRequiredError } from "./errors";
import {
  inferBankName,
  inferStatementPeriodFromTransactions,
  parseAmountString
} from "./metadata";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type RawPdfRow = {
  date: string;
  description: string;
  amount: string;
  type?: string;
};

type PdfItem = {
  str: string;
  x: number;
  y: number;
  page: number;
};

const MONTH_MAP: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12"
};

function detectStatementYear(items: PdfItem[]): number {
  const headerText = items
    .slice(0, 300)
    .map((item) => item.str)
    .join(" ");
  const match = headerText.match(/\d{1,2}\s+[A-Za-z]{3}\s*-\s*\d{1,2}\s+[A-Za-z]{3}\s+(\d{4})/);
  if (match) {
    return Number(match[1]);
  }
  return new Date().getFullYear();
}

function parseStructuredRows(items: PdfItem[]): RawPdfRow[] {
  const rows: RawPdfRow[] = [];

  const statementYear = detectStatementYear(items);
  const anchors = items
    .filter(
      (item) =>
        item.x >= 30 &&
        item.x <= 50 &&
        /^\d{1,2}$/.test(item.str) &&
        items.some(
          (peer) =>
            peer.page === item.page &&
            Math.abs(peer.y - item.y) <= 4 &&
            peer.x >= 60 &&
            peer.x <= 420 &&
            /[A-Za-z]/.test(peer.str)
        )
    )
    .sort((a, b) => (a.page === b.page ? b.y - a.y : a.page - b.page));

  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index];
    const next = anchors[index + 1];
    const lowerBound =
      next && next.page === anchor.page ? next.y + 4 : Number.NEGATIVE_INFINITY;

    const windowItems = items.filter(
      (item) =>
        item.page === anchor.page && item.y <= anchor.y + 4 && item.y > lowerBound
    );

    const description = windowItems
      .filter(
        (item) =>
          Math.abs(item.y - anchor.y) <= 4 &&
          item.x >= 60 &&
          item.x <= 420 &&
          /[A-Za-z]/.test(item.str)
      )
      .sort((a, b) => b.str.length - a.str.length)[0]?.str;

    const monthYear = windowItems.find((item) =>
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}$/i.test(item.str)
    )?.str;

    const type = windowItems.find((item) => /^(Dr|Cr)$/i.test(item.str))?.str;

    const amount = windowItems
      .filter(
        (item) =>
          item.x >= 460 &&
          /^(\d{1,3}(,\d{3})*|\d+)\.\d{2}$/.test(item.str.replace(/\s+/g, ""))
      )
      .sort((a, b) => Math.abs(a.y - anchor.y) - Math.abs(b.y - anchor.y))[0]?.str;

    if (!description || !monthYear || !amount) {
      continue;
    }

    const monthYearMatch =
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2})$/i.exec(monthYear);
    if (!monthYearMatch) {
      continue;
    }

    const month = MONTH_MAP[monthYearMatch[1].toLowerCase()];
    const yearTwoDigit = Number(monthYearMatch[2]);
    const year = yearTwoDigit >= 70 ? 1900 + yearTwoDigit : 2000 + yearTwoDigit;
    const resolvedYear = Math.abs(year - statementYear) <= 1 ? year : statementYear;
    const day = anchor.str.padStart(2, "0");

    rows.push({
      date: `${resolvedYear}-${month}-${day}`,
      description,
      amount,
      type: type?.toLowerCase() === "cr" ? "credit" : "debit"
    });
  }

  return rows;
}

function parseDateTableRows(items: PdfItem[]): RawPdfRow[] {
  const rows: RawPdfRow[] = [];
  const pages = [...new Set(items.map((item) => item.page))];

  for (const page of pages) {
    const pageItems = items.filter((item) => item.page === page);
    const dateHeader = pageItems.find((item) => /^date$/i.test(item.str));
    const detailsHeader = pageItems.find((item) => /^transaction details$/i.test(item.str));
    const merchantCategoryHeader = pageItems.find((item) =>
      /^merchant category$/i.test(item.str)
    );
    const amountHeader = pageItems.find((item) =>
      /^amount$/i.test(item.str) || /^amount\s*\([^)]*\)$/i.test(item.str)
    );
    const rewardHeader =
      pageItems.find((item) => /^reward points$/i.test(item.str)) ??
      pageItems.find((item) => /^reward$/i.test(item.str));

    if (!detailsHeader || !amountHeader) {
      continue;
    }

    const dateX = dateHeader?.x ?? Math.min(...pageItems.map((item) => item.x));
    const detailsX = detailsHeader.x;
    const amountX = amountHeader.x;
    const descriptionBoundaries = [amountX - 20];
    if (rewardHeader && rewardHeader.x > detailsX) {
      descriptionBoundaries.push(rewardHeader.x - 10);
    }
    if (merchantCategoryHeader && merchantCategoryHeader.x > detailsX) {
      descriptionBoundaries.push(merchantCategoryHeader.x - 30);
    }
    const descriptionMaxX = Math.min(...descriptionBoundaries);

    const anchors = pageItems
      .filter(
        (item) =>
          /^\d{2}\/\d{2}\/\d{4}$/.test(item.str) &&
          item.x >= dateX - 30 &&
          item.x <= dateX + 50
      )
      .sort((a, b) => b.y - a.y);

    for (let index = 0; index < anchors.length; index += 1) {
      const anchor = anchors[index];
      const next = anchors[index + 1];
      const lowerBound = Math.max(next ? next.y + 2 : Number.NEGATIVE_INFINITY, anchor.y - 14);

      const rowItems = pageItems.filter(
        (item) => item.y <= anchor.y + 2 && item.y > lowerBound
      );
      const descriptionMinX = Math.min(detailsX - 8, anchor.x + 45);

      const description = rowItems
        .filter((item) => item.x >= descriptionMinX && item.x < descriptionMaxX)
        .sort((a, b) => (a.y === b.y ? a.x - b.x : b.y - a.y))
        .map((item) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const amountRaw = rowItems
        .filter(
          (item) =>
            item.x >= amountX - 25 &&
            /^(\d{1,3}(,\d{3})*|\d+)\.\d{2}(\s*(CR|DR))?$/i.test(item.str)
        )
        .sort((a, b) => Math.abs(a.y - anchor.y) - Math.abs(b.y - anchor.y))[0]?.str;

      if (!description || !amountRaw) {
        continue;
      }

      rows.push({
        date: anchor.str,
        description,
        amount: amountRaw.replace(/\s+/g, " ").trim(),
        type: /\bCR\b/i.test(amountRaw) ? "credit" : "debit"
      });
    }
  }

  return rows;
}

export async function parsePdfFile(
  file: File,
  categoryRules: Record<string, string[]>,
  password?: string
): Promise<ParseResult> {
  const bytes = await readFileAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: bytes, password });
  let pdf: Awaited<typeof loadingTask.promise>;
  try {
    pdf = await loadingTask.promise;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("no password given")) {
      throw new PdfPasswordRequiredError();
    }
    if (message.includes("incorrect password")) {
      throw new PdfIncorrectPasswordError();
    }
    throw error;
  }

  const items: PdfItem[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!("str" in item)) {
        continue;
      }
      const str = item.str.replace(/\s+/g, " ").trim();
      if (!str) {
        continue;
      }
      items.push({
        str,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        page: pageNumber
      });
    }
  }

  const verticalRows = parseStructuredRows(items);
  const dateTableRows = parseDateTableRows(items);
  const parsedRows = dateTableRows.length > verticalRows.length ? dateTableRows : verticalRows;

  const transactions = normalizeTransactions(parsedRows, categoryRules);
  const metadata = parsePdfMetadata(items, file.name, transactions);

  return { transactions, metadata };
}

function findValueNearLabel(
  items: PdfItem[],
  labelPatterns: RegExp[],
  valuePattern: RegExp
): string | undefined {
  for (const labelPattern of labelPatterns) {
    const label = items.find((item) => labelPattern.test(item.str));
    if (!label) {
      continue;
    }

    const candidates = items
      .filter(
        (item) =>
          item.page === label.page &&
          valuePattern.test(item.str) &&
          item.x >= label.x - 20 &&
          item.x <= label.x + 260 &&
          item.y <= label.y + 10 &&
          item.y >= label.y - 60
      )
      .sort(
        (a, b) =>
          Math.abs(a.y - label.y) - Math.abs(b.y - label.y) ||
          Math.abs(a.x - label.x) - Math.abs(b.x - label.x)
      );

    if (candidates[0]?.str) {
      return candidates[0].str;
    }
  }
  return undefined;
}

function parsePdfMetadata(
  items: PdfItem[],
  fileName: string,
  transactions: import("../types/transaction").Transaction[]
): StatementMetadata {
  const firstPageItems = items.filter((item) => item.page === 1);
  const fullText = items.map((item) => item.str).join(" ");
  const findMetadataValue = (labelPatterns: RegExp[], valuePattern: RegExp): string | undefined =>
    findValueNearLabel(firstPageItems, labelPatterns, valuePattern) ??
    findValueNearLabel(items, labelPatterns, valuePattern);
  const totalBillRaw = findValueNearLabel(
    firstPageItems,
    [
      /total payment due/i,
      /total bill amount/i,
      /total amount due/i,
      /total amount payable/i,
      /amount due/i
    ],
    /^(\d{1,3}(,\d{3})*|\d+)\.\d{2}$/
  ) ?? findMetadataValue([/total payment due/i, /total bill amount/i], /^(\d{1,3}(,\d{3})*|\d+)\.\d{2}$/);
  const minimumDueRaw = findMetadataValue(
    [/minimum amount due/i, /minimum payment due/i, /\bmad\b/i],
    /^(\d{1,3}(,\d{3})*|\d+)\.\d{2}$/
  );
  const paymentDueDateRaw = findMetadataValue(
    [/payment due date/i, /due date/i],
    /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}$|^[A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}$|^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/
  );
  const statementPeriodRaw = findMetadataValue(
    [/statement period/i],
    /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s*-\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/
  );

  const statementPeriodMatch = fullText.match(
    /statement period\s*[:\-]\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}\s+to\s+[A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})|statement for.*?\(([^)]+)\)/i
  );

  return {
    bankName: inferBankName(fullText, fileName),
    totalBillAmount: totalBillRaw ? parseAmountString(totalBillRaw) : undefined,
    minimumAmountDue: minimumDueRaw ? parseAmountString(minimumDueRaw) : undefined,
    paymentDueDate: paymentDueDateRaw,
    statementPeriod:
      statementPeriodRaw ??
      statementPeriodMatch?.[1]?.trim() ??
      statementPeriodMatch?.[2]?.trim() ??
      inferStatementPeriodFromTransactions(transactions)
  };
}
