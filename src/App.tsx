import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import { applyFiltersAndSort } from "./analytics/filtering";
import { computeAnalytics } from "./analytics/metrics";
import { applyCategories } from "./categorization/categorizer";
import { defaultCategoryRules } from "./categorization/defaultRules";
import { PremiumDashboard } from "./components/premium/PremiumDashboard";
import { mockStatementMetadata, mockTransactions } from "./mock/mockTransactions";
import {
  PdfIncorrectPasswordError,
  PdfPasswordRequiredError
} from "./parsing/errors";
import { parseStatementFile } from "./parsing/parseFile";
import type { StatementMetadata } from "./types/statement";
import type { DatePreset, Filters, Transaction } from "./types/transaction";
import { loadStoredCategoryRules, persistCategoryRules } from "./utils/categoryRules";
import { getFinancialYearRange, offsetDate, toIsoDate } from "./utils/date";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

function getDefaultFilters(): Filters {
  const end = toIsoDate(new Date());
  return {
    preset: "last30",
    startDate: offsetDate(-30),
    endDate: end,
    sortField: "date",
    sortDirection: "desc"
  };
}

const MAX_STATEMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UNSUPPORTED_STATEMENT_MESSAGE =
  "This file is either not a supported credit card statement yet, or it is not an actual credit card statement. Please upload a valid credit card statement PDF.";
const CREDIT_CARD_CATEGORY_RULES_STORAGE_KEY = "credit-card-category-rules-v1";

function getTransactionDateRange(transactions: Transaction[]): { start: string; end: string } | null {
  const dates = transactions.map((txn) => txn.date).filter(Boolean).sort();
  if (dates.length === 0) {
    return null;
  }
  return {
    start: dates[0],
    end: dates[dates.length - 1]
  };
}

const MONTH_NUMBERS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12
};

function buildIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function maxIsoDate(first: string, second: string): string {
  return first > second ? first : second;
}

function minIsoDate(first: string, second: string): string {
  return first < second ? first : second;
}

function parseNamedDate(
  value: string,
  fallbackYear?: number
): { year: number; month: number; day: number; explicitYear: boolean } | null {
  const match = /^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const month = MONTH_NUMBERS[match[2].toLowerCase()];
  const yearText = match[3];
  const year = yearText ? Number(yearText) : fallbackYear;
  if (!month || !year) {
    return null;
  }

  return {
    year,
    month,
    day: Number(match[1]),
    explicitYear: Boolean(yearText)
  };
}

function getStatementPeriodRange(
  statementPeriod?: string
): { start: string; end: string } | null {
  if (!statementPeriod) {
    return null;
  }

  const slashMatch =
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:-|to)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i.exec(
      statementPeriod
    );
  if (slashMatch) {
    const start = toIsoDate(slashMatch[1]);
    const end = toIsoDate(slashMatch[2]);
    if (start && end) {
      return { start, end };
    }
  }

  const namedDashMatch =
    /(\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{4})?)\s*-\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i.exec(
      statementPeriod
    );
  if (namedDashMatch) {
    const end = parseNamedDate(namedDashMatch[2]);
    if (end) {
      const provisionalStart = parseNamedDate(namedDashMatch[1], end.year);
      if (provisionalStart) {
        const startYear =
          provisionalStart.explicitYear || provisionalStart.month <= end.month
            ? provisionalStart.year
            : provisionalStart.year - 1;
        return {
          start: buildIsoDate(startYear, provisionalStart.month, provisionalStart.day),
          end: buildIsoDate(end.year, end.month, end.day)
        };
      }
    }
  }

  const namedToMatch =
    /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\s+to\s+(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i.exec(
      statementPeriod
    );
  if (namedToMatch) {
    const start = parseNamedDate(namedToMatch[1]);
    const end = parseNamedDate(namedToMatch[2]);
    if (start && end) {
      return {
        start: buildIsoDate(start.year, start.month, start.day),
        end: buildIsoDate(end.year, end.month, end.day)
      };
    }
  }

  const toMatch = /(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i.exec(statementPeriod);
  if (toMatch) {
    return {
      start: toMatch[1],
      end: toMatch[2]
    };
  }

  const longToMatch =
    /([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})\s+to\s+([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})/i.exec(
      statementPeriod
    );
  if (longToMatch) {
    const start = toIsoDate(longToMatch[1]);
    const end = toIsoDate(longToMatch[2]);
    if (start && end) {
      return { start, end };
    }
  }

  return null;
}

function getDatasetRange(
  transactions: Transaction[],
  metadata: StatementMetadata
): { start: string; end: string } | null {
  return getStatementPeriodRange(metadata.statementPeriod) ?? getTransactionDateRange(transactions);
}

function getPresetDateRange(
  preset: Exclude<DatePreset, "custom">,
  transactions: Transaction[],
  metadata: StatementMetadata
): { start: string; end: string } {
  const datasetRange = getDatasetRange(transactions, metadata);
  const anchorDate = datasetRange?.end ?? toIsoDate(new Date());
  const anchor = new Date(`${anchorDate}T12:00:00`);

  if (preset === "financialYear") {
    const range = getFinancialYearRange(anchor);
    if (!datasetRange) {
      return range;
    }
    return {
      start: maxIsoDate(range.start, datasetRange.start),
      end: minIsoDate(range.end, datasetRange.end)
    };
  }

  const days = preset === "last30" ? -30 : -90;
  const start = offsetDate(days, anchor);
  if (!datasetRange) {
    return {
      start,
      end: anchorDate
    };
  }

  return {
    start: maxIsoDate(start, datasetRange.start),
    end: datasetRange.end
  };
}

function applyDatasetFilters(
  setFilters: Dispatch<SetStateAction<Filters>>,
  transactions: Transaction[],
  metadata: StatementMetadata
): void {
  const range = getPresetDateRange("last3months", transactions, metadata);

  setFilters((prev) => ({
    ...prev,
    preset: "last3months",
    startDate: range.start,
    endDate: range.end
  }));
}

function getUserFriendlyParseError(error: unknown): string {
  if (!(error instanceof Error)) {
    return UNSUPPORTED_STATEMENT_MESSAGE;
  }

  const message = error.message.toLowerCase();
  if (
    message.includes("unsupported file type") ||
    message.includes("invalid pdf") ||
    message.includes("format") ||
    message.includes("parse")
  ) {
    return UNSUPPORTED_STATEMENT_MESSAGE;
  }

  return UNSUPPORTED_STATEMENT_MESSAGE;
}

export default function App(): JSX.Element {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    return "light";
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryRules, setCategoryRules] = useState<Record<string, string[]>>(() =>
    loadStoredCategoryRules(CREDIT_CARD_CATEGORY_RULES_STORAGE_KEY, defaultCategoryRules)
  );
  const [filters, setFilters] = useState<Filters>(getDefaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingPasswordFile, setPendingPasswordFile] = useState<File | null>(null);
  const [statementMetadata, setStatementMetadata] = useState<StatementMetadata>({});

  useEffect(() => {
    if (filters.preset === "custom") {
      return;
    }

    const range = getPresetDateRange(filters.preset, transactions, statementMetadata);
    setFilters((prev) => {
      if (prev.preset === "custom") {
        return prev;
      }
      if (prev.startDate === range.start && prev.endDate === range.end) {
        return prev;
      }
      return {
        ...prev,
        startDate: range.start,
        endDate: range.end
      };
    });
  }, [filters.preset, statementMetadata.statementPeriod, transactions]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    persistCategoryRules(
      CREDIT_CARD_CATEGORY_RULES_STORAGE_KEY,
      categoryRules,
      defaultCategoryRules
    );
  }, [categoryRules]);

  useEffect(() => {
    setTransactions((prev) => applyCategories(prev, categoryRules));
  }, [categoryRules]);

  const filteredTransactions = useMemo(
    () => applyFiltersAndSort(transactions, filters),
    [transactions, filters]
  );

  const analytics = useMemo(
    () => computeAnalytics(filteredTransactions),
    [filteredTransactions]
  );

  const anomalyIds = useMemo(
    () => new Set(analytics.anomalies.map((txn) => txn.id)),
    [analytics.anomalies]
  );

  const categories = useMemo(
    () => [...Object.keys(categoryRules), "Others"].sort(),
    [categoryRules]
  );

  async function handleFileSelected(file: File): Promise<void> {
    if (file.size > MAX_STATEMENT_FILE_SIZE_BYTES) {
      setError("File too large. Please upload a PDF statement up to 10 MB.");
      setPendingPasswordFile(null);
      return;
    }

    setLoading(true);
    setError("");
    setPendingPasswordFile(null);
    setStatementMetadata({});
    try {
      const parsed = await parseStatementFile(file, categoryRules);
      if (parsed.transactions.length === 0) {
        setError(UNSUPPORTED_STATEMENT_MESSAGE);
        setTransactions([]);
        setStatementMetadata({});
        return;
      }
      setTransactions(parsed.transactions);
      setStatementMetadata(parsed.metadata);
      applyDatasetFilters(setFilters, parsed.transactions, parsed.metadata);
    } catch (err) {
      if (err instanceof PdfPasswordRequiredError || err instanceof PdfIncorrectPasswordError) {
        setPendingPasswordFile(file);
        setError(err.message);
      } else {
        setError(getUserFriendlyParseError(err));
        setTransactions([]);
        setStatementMetadata({});
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePdfPasswordSubmit(password: string): Promise<void> {
    if (!pendingPasswordFile) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const parsed = await parseStatementFile(pendingPasswordFile, categoryRules, {
        pdfPassword: password
      });
      if (parsed.transactions.length === 0) {
        setError(UNSUPPORTED_STATEMENT_MESSAGE);
        setTransactions([]);
        setStatementMetadata({});
        return;
      }
      setTransactions(parsed.transactions);
      setStatementMetadata(parsed.metadata);
      applyDatasetFilters(setFilters, parsed.transactions, parsed.metadata);
      setPendingPasswordFile(null);
    } catch (err) {
      if (err instanceof PdfIncorrectPasswordError || err instanceof PdfPasswordRequiredError) {
        setError(err.message);
      } else {
        setError(getUserFriendlyParseError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
      <PremiumDashboard
        transactions={transactions}
        filteredTransactions={filteredTransactions}
        analytics={analytics}
        categories={categories}
        anomalies={anomalyIds}
        filters={filters}
        loading={loading}
        error={error}
        statementMetadata={statementMetadata}
        pendingPasswordFile={pendingPasswordFile}
        onFileSelected={handleFileSelected}
        onLoadMock={() => {
          setTransactions(mockTransactions);
          setStatementMetadata(mockStatementMetadata);
          applyDatasetFilters(setFilters, mockTransactions, mockStatementMetadata);
          setError("");
          setPendingPasswordFile(null);
        }}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        onPdfPasswordSubmit={handlePdfPasswordSubmit}
        onCancelPdfPassword={() => {
          setPendingPasswordFile(null);
          setError("");
        }}
        onFiltersChange={setFilters}
        onSortChange={(field) => {
          setFilters((prev) => {
            if (prev.sortField === field) {
              return {
                ...prev,
                sortDirection: prev.sortDirection === "asc" ? "desc" : "asc"
              };
            }
            return {
              ...prev,
              sortField: field,
              sortDirection: field === "date" ? "desc" : "asc"
            };
          });
        }}
        onCategoryChange={(id, category) => {
          setTransactions((prev) =>
            prev.map((txn) => (txn.id === id ? { ...txn, category } : txn))
          );
        }}
        sortField={filters.sortField}
        sortDirection={filters.sortDirection}
        categoryRules={categoryRules}
        onCategoryRulesSave={setCategoryRules}
        onCategoryRulesReset={() => setCategoryRules(defaultCategoryRules)}
      />
    </main>
  );
}
