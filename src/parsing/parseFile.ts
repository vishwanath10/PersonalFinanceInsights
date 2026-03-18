import type { ParseResult } from "../types/statement";
import { parsePdfFile } from "./pdfParser";

type ParseOptions = {
  pdfPassword?: string;
};

export async function parseStatementFile(
  file: File,
  categoryRules: Record<string, string[]>,
  options?: ParseOptions
): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    return parsePdfFile(file, categoryRules, options?.pdfPassword);
  }

  throw new Error("Unsupported file type. Please upload a PDF statement.");
}
