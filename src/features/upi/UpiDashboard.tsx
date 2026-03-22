import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { CategoryEditor } from "../../components/CategoryEditor";
import { ChatPanel } from "../../components/ChatPanel";
import { PrivacyNotice } from "../../components/PrivacyNotice";
import { UI_STRINGS } from "../../constants/strings";
import type { Transaction } from "../../types/transaction";
import { buildUpiDashboardData } from "./analytics";
import { UpiFiltersPanel } from "./UpiFiltersPanel";
import { buildUpiStoryInsights } from "./insights";
import { UpiStoryPanel } from "./UpiStoryPanel";
import { UpiTransactionTable } from "./UpiTransactionTable";
import type { UpiFilters, UpiStatementMetadata } from "./types";

type UpiDashboardProps = {
  transactions: Transaction[];
  metadata: UpiStatementMetadata;
  categoryRules: Record<string, string[]>;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function getDefaultFilters(transactions: Transaction[]): UpiFilters {
  const dates = transactions.map((transaction) => transaction.date).sort();
  return {
    startDate: dates[0] ?? "",
    endDate: dates[dates.length - 1] ?? "",
    minAmount: "",
    maxAmount: "",
    category: "all",
    type: "all",
    search: ""
  };
}

export function UpiDashboard({
  transactions,
  metadata,
  categoryRules
}: UpiDashboardProps): JSX.Element {
  const [filters, setFilters] = useState<UpiFilters>(() => getDefaultFilters(transactions));
  const [rulesOpenToken, setRulesOpenToken] = useState(0);
  const deferredSearch = useDeferredValue(filters.search.trim().toLowerCase());

  useEffect(() => {
    setFilters(getDefaultFilters(transactions));
  }, [transactions]);

  const categories = useMemo(
    () =>
      [...new Set([...Object.keys(categoryRules), ...transactions.map((transaction) => transaction.category), "Others"])].sort(),
    [categoryRules, transactions]
  );

  const filteredTransactions = useMemo(() => {
    const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;

    return transactions
      .filter((transaction) => {
        if (filters.startDate && transaction.date < filters.startDate) {
          return false;
        }
        if (filters.endDate && transaction.date > filters.endDate) {
          return false;
        }
        if (filters.category !== "all" && transaction.category !== filters.category) {
          return false;
        }
        if (filters.type !== "all" && transaction.type !== filters.type) {
          return false;
        }
        if (minAmount !== null && transaction.amount < minAmount) {
          return false;
        }
        if (maxAmount !== null && transaction.amount > maxAmount) {
          return false;
        }
        if (
          deferredSearch &&
          !transaction.description.toLowerCase().includes(deferredSearch) &&
          !(transaction.merchant ?? "").toLowerCase().includes(deferredSearch) &&
          !transaction.category.toLowerCase().includes(deferredSearch)
        ) {
          return false;
        }
        return true;
      })
      .sort((first, second) => {
        if (first.date === second.date) {
          return second.amount - first.amount;
        }
        return second.date.localeCompare(first.date);
      });
  }, [
    transactions,
    filters.startDate,
    filters.endDate,
    filters.category,
    filters.type,
    filters.minAmount,
    filters.maxAmount,
    deferredSearch
  ]);

  const dashboardData = useMemo(
    () => buildUpiDashboardData(filteredTransactions),
    [filteredTransactions]
  );
  const storyInsights = useMemo(
    () => buildUpiStoryInsights(filteredTransactions, dashboardData),
    [filteredTransactions, dashboardData]
  );
  const visiblePeriod =
    metadata.statementPeriod ??
    (dashboardData.dateRange
      ? `${dashboardData.dateRange.start} to ${dashboardData.dateRange.end}`
      : undefined);
  const hasVisibleTransactions = filteredTransactions.length > 0;
  const categoryRuleCount = Object.keys(categoryRules).length;
  const debitCount = filteredTransactions.filter((transaction) => transaction.type === "debit").length;
  const creditCount = filteredTransactions.filter((transaction) => transaction.type === "credit").length;

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.04),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] p-5 shadow-sm dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.08),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.94))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800 shadow-sm dark:border-sky-900/60 dark:bg-slate-900/70 dark:text-sky-200">
                Privacy First
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {UI_STRINGS.privacyMode}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
                UPI Analytics
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                {metadata.provider}
              </span>
              {metadata.fileType === "sample" ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                  Sample Data
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Your UPI Spending Story
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              A guided read of how money moved, what shaped the biggest outflows, and where your
              spending pattern looks strongest or most exposed.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {visiblePeriod ?? "Period not detected"}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {filteredTransactions.length} visible transactions
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Avg monthly spend {formatCurrency(dashboardData.summary.monthlyAverageSpend)}
            </span>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => setRulesOpenToken((current) => current + 1)}
            >
              <span>Categories</span>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900 dark:bg-sky-900/50 dark:text-sky-100">
                {categoryRuleCount}
              </span>
            </button>
          </div>
        </div>
      </section>

      <PrivacyNotice />

      <section className="card-tint p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="card-mint p-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              How to use this dashboard
            </h2>
            <ol className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              <li>1. Start with the narrative sections to understand the main takeaways quickly.</li>
              <li>2. Use filters to narrow the story by time range, amount, category, or flow type.</li>
              <li>3. Open Transaction Explorer to validate any insight at row level.</li>
              <li>4. Ask a question in Ask Your Statement for quick, data-backed answers.</li>
            </ol>
          </article>

          <article className="card-indigo p-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Why regular analysis matters
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              <li>Repeated category review shows where routine outflow is quietly compounding.</li>
              <li>Weekly and monthly patterns make discretionary bias easier to spot and correct.</li>
              <li>Merchant concentration helps you notice which payment destinations deserve the most scrutiny.</li>
              <li>Net-flow tracking shows whether credits are actually offsetting your day-to-day spend.</li>
            </ul>
          </article>
        </div>
      </section>

      {hasVisibleTransactions ? (
        <>
          <UpiStoryPanel dashboardData={dashboardData} storyInsights={storyInsights} />

          <UpiFiltersPanel
            filters={filters}
            categories={categories}
            onChange={setFilters}
            onReset={() => setFilters(getDefaultFilters(transactions))}
          />

          <section className="card-mint p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Transaction Explorer
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Validate the story in the underlying ledger
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Search by merchant or description, sort by date or amount, and inspect the exact
                  payments behind any pattern you noticed above.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {filteredTransactions.length} rows
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {debitCount} debits
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {creditCount} credits
                </span>
              </div>
            </div>

            <div className="mt-4">
              <UpiTransactionTable transactions={filteredTransactions} frameless />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ChatPanel
                transactions={filteredTransactions}
                title="Ask Your Statement"
                description="Ask generic questions against the processed UPI dataset in the current filtered view."
                placeholder="Ask about categories, trend changes, merchant concentration, or this month"
                suggestions={[
                  "Where am I spending the most?",
                  "How has my spending changed over time?",
                  "Which category is highest this month?",
                  "Top 5 merchants"
                ]}
                initialAnswer="Ask a question about the visible UPI data. Answers are generated locally from the processed transactions and current filters."
              />
            </div>
            <aside className="card-indigo p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                What This Helps You Decide
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>Which category deserves immediate budget attention.</li>
                <li>Whether weekend or mid-month behavior is pushing spending off track.</li>
                <li>Which merchants or transfers are quietly dominating your UPI flow.</li>
                <li>Whether current credits are meaningfully covering your total outflow.</li>
              </ul>
            </aside>
          </section>
        </>
      ) : (
        <section className="rounded-[24px] border border-dashed border-slate-300 bg-white/85 p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
          No transactions match the current filters. Broaden the date or amount range to rebuild the
          narrative.
        </section>
      )}

      <CategoryEditor
        rules={categoryRules}
        showFloatingTrigger={false}
        forceOpenToken={rulesOpenToken}
      />
    </div>
  );
}
