import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { normalizeTransactions } from "../../parsing/normalize";
import { PdfIncorrectPasswordError, PdfPasswordRequiredError } from "../../parsing/errors";
import { readFileAsArrayBuffer, readFileAsText } from "../../parsing/fileReader";
import { toIsoDate } from "../../utils/date";
import {
  categorizeUpiDescription,
  extractUpiMerchantName,
  upiCategoryRules
} from "./categoryRules";
import type { UpiParseOptions, UpiParseResult, UpiProvider, UpiStatementMetadata } from "./types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type RawUpiRow = {
  date: string;
  description: string;
  amount: string;
  type: "debit" | "credit";
};

const DATE_LINE = /^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}$/;
const TIME_LINE = /^\d{1,2}:\d{2}\s+(am|pm)$/i;
const TYPE_LINE = /^(DEBIT|CREDIT)$/i;
const AMOUNT_LINE = /^\u20B9\s?[\d,]+(?:\.\d+)?$/;
const PERIOD_LINE = /^(\d{1,2}\s+[A-Za-z]{3},\s+\d{4})\s*-\s*(\d{1,2}\s+[A-Za-z]{3},\s+\d{4})$/;
const GENERIC_DATE_LINE =
  /^(?:[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{2}[/-]\d{2}[/-]\d{4})$/;
const GENERIC_AMOUNT_LINE = /^(?:\u20B9|INR)\s?[\d,]+(?:\.\d+)?$/i;

function detectProvider(text: string, preferredProvider?: UpiProvider): UpiProvider {
  if (/phonepe/i.test(text)) {
    return "PhonePe";
  }
  if (/google pay|\bgpay\b/i.test(text)) {
    return "Google Pay";
  }
  return preferredProvider ?? "Unknown";
}

function isIgnorableLine(line: string): boolean {
  return (
    /^Date$/i.test(line) ||
    /^Transaction Details$/i.test(line) ||
    /^Type$/i.test(line) ||
    /^Amount$/i.test(line) ||
    /^Page \d+ of \d+$/i.test(line) ||
    /support\.phonepe\.com\/statement/i.test(line) ||
    /^This is (a|an)/i.test(line) ||
    /^Disclaimer\b/i.test(line) ||
    /^terms-conditions/i.test(line) ||
    /^of any errors in the statement/i.test(line)
  );
}

function cleanupLines(lines: string[]): string[] {
  return lines
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0 && !isIgnorableLine(line));
}

function buildStatementPeriod(line: string): string | undefined {
  const match = PERIOD_LINE.exec(line);
  if (!match) {
    return undefined;
  }
  const start = toIsoDate(match[1]);
  const end = toIsoDate(match[2]);
  if (!start || !end) {
    return undefined;
  }
  return `${start} to ${end}`;
}

function parsePhonePeTextBlocks(lines: string[]): {
  rows: RawUpiRow[];
  metadata: Pick<UpiStatementMetadata, "statementPeriod" | "sourceAccounts">;
} {
  const rows: RawUpiRow[] = [];
  const sourceAccounts = new Set<string>();
  let statementPeriod: string | undefined;
  let index = 0;

  while (index < lines.length) {
    const current = lines[index];

    if (!statementPeriod) {
      statementPeriod = buildStatementPeriod(current) ?? statementPeriod;
    }

    if (!DATE_LINE.test(current)) {
      index += 1;
      continue;
    }

    const rawDate = current;
    let cursor = index + 1;

    if (cursor < lines.length && TIME_LINE.test(lines[cursor])) {
      cursor += 1;
    }

    while (cursor < lines.length && !TYPE_LINE.test(lines[cursor]) && !DATE_LINE.test(lines[cursor])) {
      cursor += 1;
    }
    if (cursor >= lines.length || !TYPE_LINE.test(lines[cursor])) {
      index += 1;
      continue;
    }
    const type = lines[cursor].toLowerCase() as "debit" | "credit";
    cursor += 1;

    while (cursor < lines.length && !AMOUNT_LINE.test(lines[cursor]) && !DATE_LINE.test(lines[cursor])) {
      cursor += 1;
    }
    if (cursor >= lines.length || !AMOUNT_LINE.test(lines[cursor])) {
      index += 1;
      continue;
    }
    const amount = lines[cursor];
    cursor += 1;

    const descriptionLines: string[] = [];
    while (
      cursor < lines.length &&
      !/^Transaction ID\b/i.test(lines[cursor]) &&
      !DATE_LINE.test(lines[cursor])
    ) {
      const line = lines[cursor];
      if (!/^(UTR No\.|Paid by|Credited to)$/i.test(line) && !AMOUNT_LINE.test(line)) {
        descriptionLines.push(line);
      }
      cursor += 1;
    }

    while (cursor < lines.length && !DATE_LINE.test(lines[cursor])) {
      if (/^(Paid by|Credited to)$/i.test(lines[cursor])) {
        const account = lines[cursor + 1];
        if (account && !DATE_LINE.test(account)) {
          sourceAccounts.add(account.replace(/\s+/g, " ").trim());
          cursor += 2;
          continue;
        }
      }
      cursor += 1;
    }

    const description = descriptionLines.join(" ").replace(/\s+/g, " ").trim();
    if (description) {
      rows.push({
        date: rawDate,
        description,
        amount,
        type
      });
    }

    index = cursor;
  }

  return {
    rows,
    metadata: {
      statementPeriod,
      sourceAccounts: [...sourceAccounts].sort()
    }
  };
}

function inferTypeFromDescription(description: string): "debit" | "credit" {
  return /received from|refund from|cashback from|credited to/i.test(description)
    ? "credit"
    : "debit";
}

function parseGenericUpiTextBlocks(lines: string[]): {
  rows: RawUpiRow[];
  metadata: Pick<UpiStatementMetadata, "statementPeriod" | "sourceAccounts">;
} {
  const rows: RawUpiRow[] = [];
  const sourceAccounts = new Set<string>();
  let statementPeriod: string | undefined;
  let index = 0;

  while (index < lines.length) {
    const current = lines[index];

    if (!statementPeriod) {
      statementPeriod = buildStatementPeriod(current) ?? statementPeriod;
    }

    if (!GENERIC_DATE_LINE.test(current)) {
      index += 1;
      continue;
    }

    let cursor = index + 1;
    if (cursor < lines.length && TIME_LINE.test(lines[cursor])) {
      cursor += 1;
    }

    const segment: string[] = [];
    while (cursor < lines.length && !GENERIC_DATE_LINE.test(lines[cursor])) {
      segment.push(lines[cursor]);
      cursor += 1;
    }

    const amountIndex = segment.findIndex((line) => GENERIC_AMOUNT_LINE.test(line));
    if (amountIndex === -1) {
      index = cursor;
      continue;
    }

    const amount = segment[amountIndex];
    const typeLine = segment.find((line) => TYPE_LINE.test(line));
    const description = segment
      .filter((line, segmentIndex) => {
        if (segmentIndex === amountIndex) {
          return false;
        }
        return (
          !TYPE_LINE.test(line) &&
          !GENERIC_AMOUNT_LINE.test(line) &&
          !/^transaction id\b/i.test(line) &&
          !/^utr\b/i.test(line) &&
          !/^upi ref\b/i.test(line)
        );
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    for (const line of segment) {
      if (/x{4,}|\d{4,}/i.test(line)) {
        sourceAccounts.add(line.replace(/\s+/g, " ").trim());
      }
    }

    if (description) {
      rows.push({
        date: current,
        description,
        amount,
        type: typeLine
          ? (typeLine.toLowerCase() as "debit" | "credit")
          : inferTypeFromDescription(description)
      });
    }

    index = cursor;
  }

  return {
    rows,
    metadata: {
      statementPeriod,
      sourceAccounts: [...sourceAccounts].sort()
    }
  };
}

function parseHtmlTables(document: Document): RawUpiRow[] {
  const rows: RawUpiRow[] = [];
  const tables = [...document.querySelectorAll("table")];

  for (const table of tables) {
    const headerCells = [...table.querySelectorAll("tr:first-child th, tr:first-child td")].map((cell) =>
      cell.textContent?.toLowerCase().trim() ?? ""
    );
    const dateIndex = headerCells.findIndex((cell) => cell.includes("date"));
    const detailsIndex = headerCells.findIndex(
      (cell) => cell.includes("detail") || cell.includes("description") || cell.includes("merchant")
    );
    const typeIndex = headerCells.findIndex((cell) => cell.includes("type"));
    const amountIndex = headerCells.findIndex((cell) => cell.includes("amount"));

    if (dateIndex === -1 || detailsIndex === -1 || typeIndex === -1 || amountIndex === -1) {
      continue;
    }

    const bodyRows = [...table.querySelectorAll("tr")].slice(1);
    for (const row of bodyRows) {
      const cells = [...row.querySelectorAll("td, th")].map(
        (cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? ""
      );
      if (!cells[dateIndex] || !cells[detailsIndex] || !cells[typeIndex] || !cells[amountIndex]) {
        continue;
      }

      rows.push({
        date: cells[dateIndex],
        description: cells[detailsIndex],
        amount: cells[amountIndex],
        type: /credit/i.test(cells[typeIndex]) ? "credit" : "debit"
      });
    }
  }

  return rows;
}

function parseTextFallback(
  text: string,
  preferredProvider?: UpiProvider
): {
  rows: RawUpiRow[];
  metadata: Pick<UpiStatementMetadata, "statementPeriod" | "sourceAccounts">;
} {
  const lines = cleanupLines(text.split(/\r?\n/));
  if (preferredProvider === "PhonePe") {
    return parsePhonePeTextBlocks(lines);
  }

  const genericParsed = parseGenericUpiTextBlocks(lines);
  if (genericParsed.rows.length > 0) {
    return genericParsed;
  }

  return parsePhonePeTextBlocks(lines);
}

function normalizeUpiRows(
  rawRows: RawUpiRow[],
  categoryRules: Record<string, string[]>
) {
  return normalizeTransactions(
    rawRows.map((row) => ({
      ...row,
      merchant: extractUpiMerchantName(row.description),
      category: categorizeUpiDescription(row.description, row.type, categoryRules)
    })),
    categoryRules,
    { source: "UPI" }
  );
}

function parsePdfRowsByProvider(
  lines: string[],
  provider: UpiProvider
): {
  rows: RawUpiRow[];
  metadata: Pick<UpiStatementMetadata, "statementPeriod" | "sourceAccounts">;
} {
  if (provider === "PhonePe") {
    return parsePhonePeTextBlocks(lines);
  }

  const genericParsed = parseGenericUpiTextBlocks(lines);
  if (genericParsed.rows.length > 0) {
    return genericParsed;
  }

  return parsePhonePeTextBlocks(lines);
}

async function parseUpiPdf(file: File, options: UpiParseOptions = {}): Promise<UpiParseResult> {
  const bytes = await readFileAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: bytes, password: options.pdfPassword });
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
  const lines: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    lines.push(
      ...content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
    );
  }

  const cleanedLines = cleanupLines(lines);
  const text = cleanedLines.join("\n");
  const provider = detectProvider(text, options.preferredProvider);
  const parsed = parsePdfRowsByProvider(cleanedLines, provider);
  const transactions = normalizeUpiRows(parsed.rows, options.categoryRules ?? upiCategoryRules);
  if (transactions.length === 0) {
    throw new Error("Unable to extract transactions from this UPI PDF statement.");
  }

  return {
    transactions,
    metadata: {
      provider,
      fileType: "pdf",
      statementPeriod: parsed.metadata.statementPeriod,
      sourceAccounts: parsed.metadata.sourceAccounts,
      transactionCount: transactions.length
    }
  };
}

async function parseUpiHtml(file: File, options: UpiParseOptions = {}): Promise<UpiParseResult> {
  const html = await readFileAsText(file);
  const document = new DOMParser().parseFromString(html, "text/html");
  const tableRows = parseHtmlTables(document);
  const provider = detectProvider(document.body.textContent ?? html, options.preferredProvider);
  const parsed =
    tableRows.length > 0
      ? { rows: tableRows, metadata: { statementPeriod: undefined, sourceAccounts: [] } }
      : parseTextFallback(document.body.innerText ?? "", provider);
  const transactions = normalizeUpiRows(parsed.rows, options.categoryRules ?? upiCategoryRules);

  if (transactions.length === 0) {
    throw new Error("Unable to extract transactions from this UPI HTML statement.");
  }

  return {
    transactions,
    metadata: {
      provider,
      fileType: "html",
      statementPeriod: parsed.metadata.statementPeriod,
      sourceAccounts: parsed.metadata.sourceAccounts,
      transactionCount: transactions.length
    }
  };
}

export async function parseUpiStatementFile(
  file: File,
  options: UpiParseOptions = {}
): Promise<UpiParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    return parseUpiPdf(file, options);
  }

  if (extension === "html" || extension === "htm") {
    return parseUpiHtml(file, options);
  }

  throw new Error("Unsupported file type. Please upload a PDF or HTML UPI statement.");
}
