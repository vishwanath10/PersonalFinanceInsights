import { useMemo, useRef, useState } from "react";
import type { AnalyticsSummary } from "../../analytics/metrics";
import { CategoryEditor } from "../CategoryEditor";
import { ChatPanel } from "../ChatPanel";
import { FiltersPanel } from "../FiltersPanel";
import { MerchantSpendDashboard } from "../MerchantSpendDashboard";
import { PdfPasswordPrompt } from "../PdfPasswordPrompt";
import { PrivacyNotice } from "../PrivacyNotice";
import { SpendStoryDashboard } from "../charts/SpendStoryDashboard";
import { StatementDetailsPanel } from "../StatementDetailsPanel";
import { SummaryCards } from "../SummaryCards";
import { SupportedStatementsDialog } from "../SupportedStatementsDialog";
import { TransactionTable } from "../TransactionTable";
import type { StatementMetadata } from "../../types/statement";
import type { Filters, SortDirection, SortField, Transaction } from "../../types/transaction";
import { downloadTransactionsCsv, exportDashboardPdfReport } from "../../utils/exportReport";

type PremiumDashboardProps = {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  analytics: AnalyticsSummary;
  categories: string[];
  anomalies: Set<string>;
  filters: Filters;
  loading: boolean;
  error: string;
  statementMetadata: StatementMetadata;
  pendingPasswordFile: File | null;
  onFileSelected: (file: File) => Promise<void>;
  onLoadMock: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onPdfPasswordSubmit: (password: string) => Promise<void>;
  onCancelPdfPassword: () => void;
  onFiltersChange: (next: Filters) => void;
  onSortChange: (field: SortField) => void;
  onCategoryChange: (id: string, category: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  categoryRules: Record<string, string[]>;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function PremiumDashboard({
  transactions,
  filteredTransactions,
  analytics,
  categories,
  anomalies,
  filters,
  loading,
  error,
  statementMetadata,
  pendingPasswordFile,
  onFileSelected,
  onLoadMock,
  theme,
  onToggleTheme,
  onPdfPasswordSubmit,
  onCancelPdfPassword,
  onFiltersChange,
  onSortChange,
  onCategoryChange,
  sortField,
  sortDirection,
  categoryRules
}: PremiumDashboardProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [rulesOpenToken, setRulesOpenToken] = useState(0);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const debitCount = filteredTransactions.filter((txn) => txn.type === "debit").length;
  const creditCount = filteredTransactions.filter((txn) => txn.type === "credit").length;
  const hasData = filteredTransactions.length > 0;

  const visibleTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return filteredTransactions;
    }
    return filteredTransactions.filter((txn) => {
      return (
        txn.description.toLowerCase().includes(term) ||
        txn.category.toLowerCase().includes(term) ||
        txn.type.toLowerCase().includes(term) ||
        txn.date.includes(term) ||
        String(txn.amount).includes(term)
      );
    });
  }, [filteredTransactions, searchTerm]);

  const keyInsights = useMemo(() => {
    const topCategory = Object.entries(analytics.spendingByCategory).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const monthlyKeys = Object.keys(analytics.monthlySpending).sort();
    const latestMonth = monthlyKeys[monthlyKeys.length - 1];
    const latestAmount = latestMonth ? analytics.monthlySpending[latestMonth] : 0;
    const uniqueDebitDays = new Set(
      filteredTransactions.filter((txn) => txn.type === "debit").map((txn) => txn.date)
    ).size;
    const avgDailySpend =
      uniqueDebitDays > 0 ? analytics.totalSpending / uniqueDebitDays : 0;

    return [
      {
        title: "Top spend category",
        value: topCategory ? `${topCategory[0]} (${formatCurrency(topCategory[1])})` : "N/A"
      },
      {
        title: "Latest monthly spend",
        value: latestMonth ? `${latestMonth}: ${formatCurrency(latestAmount)}` : "N/A"
      },
      {
        title: "Anomaly watch",
        value: `${analytics.anomalies.length} transaction(s) flagged for review`
      },
      {
        title: "Largest transaction",
        value: formatCurrency(analytics.largestTransaction)
      },
      {
        title: "Average daily spend",
        value: formatCurrency(avgDailySpend)
      }
    ];
  }, [analytics, filteredTransactions]);

  const quickLabels = useMemo(
    () => [
      { label: "Transactions", value: String(filteredTransactions.length) },
      { label: "Debits", value: String(debitCount) },
      { label: "Credits", value: String(creditCount) },
      { label: "Active Filters", value: `${filters.startDate} to ${filters.endDate}` },
      { label: "Bank", value: statementMetadata.bankName ?? "Not detected" },
      { label: "Statement Period", value: statementMetadata.statementPeriod ?? "Not detected" }
    ],
    [
      creditCount,
      debitCount,
      filteredTransactions.length,
      filters.endDate,
      filters.startDate,
      statementMetadata.bankName,
      statementMetadata.statementPeriod
    ]
  );

  function handleExportCsv(): void {
    if (visibleTransactions.length === 0) {
      return;
    }
    downloadTransactionsCsv(visibleTransactions);
  }

  function handleExportPdf(): void {
    if (visibleTransactions.length === 0) {
      return;
    }
    exportDashboardPdfReport({
      transactions: visibleTransactions,
      analytics,
      statementMetadata,
      filters
    });
  }

  function handleDrop(file: File | undefined): void {
    if (!file) {
      return;
    }
    void onFileSelected(file);
  }

  return (
    <div className="space-y-6">
      {/* Minimal top navigation keeps primary actions visible with low cognitive load */}
      <nav className="card px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Spend Story</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Credit Card Statement Insights Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasData ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => uploadInputRef.current?.click()}
              >
                Upload Statement
              </button>
            ) : null}
            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void onFileSelected(file);
                }
                event.target.value = "";
              }}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={onLoadMock}
            >
              Load Mock Data
            </button>
            <SupportedStatementsDialog />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRulesOpenToken((prev) => prev + 1)}
            >
              Category Rules
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onToggleTheme}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      </nav>

      <PrivacyNotice />

      <section className="card-tint p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="card-mint p-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              How to use this dashboard
            </h2>
            <ol className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              <li>1. Upload your PDF statement or load mock data.</li>
              <li>2. Check summary cards for total spend and trend direction.</li>
              <li>3. Review Spend Story visuals to spot category and refund patterns.</li>
              <li>4. Use Transaction Explorer to search, filter, and validate details.</li>
              <li>5. Track unmatched debits in Refund Match Tracker for follow-up.</li>
            </ol>
          </article>

          <article className="card-indigo p-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Why regular analysis matters
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              <li>Find missed refunds before dispute windows close.</li>
              <li>Catch unusual or duplicate transactions early.</li>
              <li>Identify high-spend categories and reduce avoidable costs.</li>
              <li>Monitor recurring charges and cancel unused subscriptions.</li>
              <li>Build better monthly payment and budgeting discipline.</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Guided first-load onboarding with progressive disclosure */}
      {!hasData ? (
        <section className="card-tint p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Start in 3 simple steps
          </h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>1. Upload your PDF statement using the button above.</li>
            <li>2. Wait for analysis to complete locally in your browser.</li>
            <li>3. Review insights, merchant breakdown, and refund tracking.</li>
          </ol>
          <div
            className={`mt-4 rounded-xl border border-dashed p-8 text-center transition ${
              isDragging
                ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                : "border-slate-300 bg-white/70 dark:border-slate-600 dark:bg-slate-800"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleDrop(event.dataTransfer.files?.[0]);
            }}
          >
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Drag and drop your PDF statement here
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              No upload to server. Data stays on your device.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => uploadInputRef.current?.click()}
              >
                Upload PDF Statement
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onLoadMock}
              >
                Load Mock Data
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {loading ? (
        <section className="card-indigo p-3">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            Analyzing statement...
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-2 w-1/2 animate-pulse rounded-full bg-slate-600 dark:bg-slate-300" />
          </div>
        </section>
      ) : null}

      {pendingPasswordFile ? (
        <PdfPasswordPrompt
          fileName={pendingPasswordFile.name}
          loading={loading}
          onSubmit={(password) => {
            void onPdfPasswordSubmit(password);
          }}
          onCancel={onCancelPdfPassword}
        />
      ) : null}

      {error ? (
        <section className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SummaryCards
            totalSpending={analytics.totalSpending}
            largestTransaction={analytics.largestTransaction}
            averageTransaction={analytics.averageTransaction}
            recurringCount={analytics.recurringTransactions.length}
            monthlyGrowthRate={analytics.monthlyGrowthRate}
          />
          <section className="card-tint mt-4 p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Quick Labels
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {quickLabels.map((item) => (
                <article key={item.label} className="card-indigo p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="h-full rounded-2xl border border-sky-900/50 bg-gradient-to-b from-slate-950 to-sky-950 p-4 text-white shadow-sm dark:border-sky-700 dark:from-slate-900 dark:to-sky-900">
          <h3 className="text-sm font-semibold text-white">
            Key Insights
          </h3>
          <ul className="mt-3 space-y-3">
            {keyInsights.map((item) => (
              <li key={item.title}>
                <p className="text-xs text-sky-100/80">{item.title}</p>
                <p className="text-sm font-semibold text-white">
                  {item.value}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <StatementDetailsPanel metadata={statementMetadata} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Spending Breakdown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Category and trend story</p>
        </div>
        <SpendStoryDashboard transactions={filteredTransactions} />
      </section>

      {/* Explorer focuses on one primary task: find, filter, inspect, export */}
      <section className="card-mint p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Transaction Explorer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search, filter, and inspect transaction-level detail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search merchant, date, category"
              className="input-field w-full sm:w-80 lg:w-[28rem]"
            />
            <button type="button" onClick={handleExportCsv} className="btn-secondary">
              Export CSV
            </button>
            <button type="button" onClick={handleExportPdf} className="btn-primary">
              Export PDF
            </button>
          </div>
        </div>

        <FiltersPanel filters={filters} onChange={onFiltersChange} />
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Showing {visibleTransactions.length} of {filteredTransactions.length} transactions
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TransactionTable
              transactions={visibleTransactions}
              categories={categories}
              anomalies={anomalies}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
              onCategoryChange={onCategoryChange}
            />
          </div>
          <aside className="space-y-4">
            <MerchantSpendDashboard transactions={visibleTransactions} />
          </aside>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChatPanel transactions={filteredTransactions} />
        </div>
        <aside className="card-indigo p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Spending Warnings & Savings
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              Warning: {analytics.anomalies.length} unusual transaction(s) detected. Review for
              accidental or duplicate payments.
            </li>
            <li>
              Opportunity: Focus on your top category first to reduce monthly spend fastest.
            </li>
            <li>
              Opportunity: Use Refund Match Tracker to follow up unmatched debit entries.
            </li>
          </ul>
        </aside>
      </section>

      <CategoryEditor
        rules={categoryRules}
        showFloatingTrigger={false}
        forceOpenToken={rulesOpenToken}
      />
    </div>
  );
}
