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
import type { Filters, Transaction } from "./types/transaction";
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

function getStatementPeriodRange(
  statementPeriod?: string
): { start: string; end: string } | null {
  if (!statementPeriod) {
    return null;
  }

  const slashMatch =
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*-\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/.exec(
      statementPeriod
    );
  if (slashMatch) {
    const start = toIsoDate(slashMatch[1]);
    const end = toIsoDate(slashMatch[2]);
    if (start && end) {
      return { start, end };
    }
  }

  const toMatch = /(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i.exec(statementPeriod);
  if (toMatch) {
    return {
      start: toMatch[1],
      end: toMatch[2]
    };
  }

  return null;
}

function applyDatasetFilters(
  setFilters: Dispatch<SetStateAction<Filters>>,
  transactions: Transaction[],
  metadata: StatementMetadata
): void {
  const range = getStatementPeriodRange(metadata.statementPeriod) ?? getTransactionDateRange(transactions);
  if (!range) {
    return;
  }

  setFilters((prev) => ({
    ...prev,
    preset: "custom",
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
  const [categoryRules, setCategoryRules] =
    useState<Record<string, string[]>>(defaultCategoryRules);
  const [filters, setFilters] = useState<Filters>(getDefaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingPasswordFile, setPendingPasswordFile] = useState<File | null>(null);
  const [statementMetadata, setStatementMetadata] = useState<StatementMetadata>({});

  useEffect(() => {
    if (filters.preset === "custom") {
      return;
    }

    if (filters.preset === "last30") {
      setFilters((prev) => ({
        ...prev,
        startDate: offsetDate(-30),
        endDate: toIsoDate(new Date())
      }));
    } else if (filters.preset === "last3months") {
      setFilters((prev) => ({
        ...prev,
        startDate: offsetDate(-90),
        endDate: toIsoDate(new Date())
      }));
    } else if (filters.preset === "financialYear") {
      const range = getFinancialYearRange();
      setFilters((prev) => ({
        ...prev,
        startDate: range.start,
        endDate: range.end
      }));
    }
  }, [filters.preset]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

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
      />
    </main>
  );
}
