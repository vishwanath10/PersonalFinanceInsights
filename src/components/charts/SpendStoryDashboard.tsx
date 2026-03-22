import { Bar, Doughnut } from "react-chartjs-2";
import type { Transaction } from "../../types/transaction";

type SpendStoryDashboardProps = {
  transactions: Transaction[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function toMonthLabel(monthKey: string): string {
  const date = new Date(`${monthKey}-01`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(date);
}

function safeDate(dateStr: string): Date | null {
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.min(sortedValues.length - 1, Math.floor(p * sortedValues.length));
  return sortedValues[index];
}

function axisCurrency(value: string | number): string {
  return `Rs${Number(value).toLocaleString("en-IN")}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function formatSignedCurrency(amount: number): string {
  if (amount === 0) {
    return "Rs0";
  }
  const prefix = amount > 0 ? "+" : "-";
  return `${prefix}Rs${Math.abs(amount).toLocaleString("en-IN")}`;
}

function daysBetween(a: Date, b: Date): number {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.floor((b.getTime() - a.getTime()) / oneDayMs);
}

function HelpTip({ text }: { text: string }): JSX.Element {
  return (
    <span
      title={text}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 shadow-sm dark:border-slate-500 dark:bg-white dark:text-slate-900"
    >
      i
    </span>
  );
}

export function SpendStoryDashboard({ transactions }: SpendStoryDashboardProps): JSX.Element {
  const debits = transactions.filter((txn) => txn.type === "debit");
  const credits = transactions.filter((txn) => txn.type === "credit");
  const totalSpend = debits.reduce((sum, txn) => sum + txn.amount, 0);

  const monthlyDebitMap: Record<string, number> = {};
  const monthlyCreditMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};
  const weekdayMap: Record<string, number> = Object.fromEntries(
    WEEKDAYS.map((day) => [day, 0])
  ) as Record<string, number>;

  for (const txn of debits) {
    const month = txn.date.slice(0, 7);
    monthlyDebitMap[month] = (monthlyDebitMap[month] ?? 0) + txn.amount;
    categoryMap[txn.category] = (categoryMap[txn.category] ?? 0) + txn.amount;

    const date = safeDate(txn.date);
    if (date) {
      const jsDay = date.getDay();
      const weekday = WEEKDAYS[(jsDay + 6) % 7];
      weekdayMap[weekday] += txn.amount;
    }
  }

  for (const txn of credits) {
    const month = txn.date.slice(0, 7);
    monthlyCreditMap[month] = (monthlyCreditMap[month] ?? 0) + txn.amount;
  }

  const monthlyKeys = [...new Set([...Object.keys(monthlyDebitMap), ...Object.keys(monthlyCreditMap)])].sort();
  const monthlyDebitValues = monthlyKeys.map((key) => monthlyDebitMap[key] ?? 0);
  const monthlyCreditValues = monthlyKeys.map((key) => monthlyCreditMap[key] ?? 0);
  const monthlyFlow = monthlyKeys.map((month, index) => ({
    month,
    debit: monthlyDebitValues[index],
    credit: monthlyCreditValues[index],
    net: monthlyCreditValues[index] - monthlyDebitValues[index]
  }));
  const peakDebitMonth = [...monthlyFlow].sort((a, b) => b.debit - a.debit)[0];
  const peakCreditMonth = [...monthlyFlow].sort((a, b) => b.credit - a.credit)[0];
  const widestGapMonth = [...monthlyFlow].sort((a, b) => Math.abs(b.net) - Math.abs(a.net))[0];

  const rankedCategories = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const categorySlices = rankedCategories.slice(0, 5);
  const remainingCategoryAmount = rankedCategories
    .slice(5)
    .reduce((sum, item) => sum + item.amount, 0);
  const categoryMix =
    remainingCategoryAmount > 0
      ? [...categorySlices, { category: "Others", amount: remainingCategoryAmount }]
      : categorySlices;
  const categoryPalette = ["#fb7185", "#fb923c", "#fbbf24", "#2dd4bf", "#38bdf8", "#818cf8"];
  const topCategory = categoryMix[0];

  const weekdayLabels = WEEKDAYS;
  const weekdayValues = weekdayLabels.map((day) => weekdayMap[day]);

  const amountsAsc = debits.map((txn) => txn.amount).sort((a, b) => a - b);
  const minAmount = amountsAsc[0] ?? 0;
  const maxAmount = amountsAsc[amountsAsc.length - 1] ?? 0;
  const binCount = 6;
  const binSize = maxAmount > minAmount ? (maxAmount - minAmount) / binCount : 1;
  const histogramBins = new Array(binCount).fill(0);
  for (const amount of amountsAsc) {
    const rawIndex = Math.floor((amount - minAmount) / binSize);
    const index = Math.min(binCount - 1, Math.max(0, rawIndex));
    histogramBins[index] += 1;
  }
  const histogramLabels = histogramBins.map((_, index) => {
    const start = minAmount + index * binSize;
    const end = start + binSize;
    return `${Math.max(0, Math.round(start / 1000))}k-${Math.max(
      0,
      Math.round(end / 1000)
    )}k`;
  });

  const highThreshold = percentile(amountsAsc, 0.9);
  const highValueTransactions = debits
    .filter((txn) => txn.amount >= highThreshold)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const sortedCredits = [...credits]
    .map((txn) => ({ txn, date: safeDate(txn.date) }))
    .filter((item): item is { txn: Transaction; date: Date } => Boolean(item.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const usedCreditIds = new Set<string>();
  const matchedDebitIds = new Set<string>();

  for (const debit of debits) {
    const debitDate = safeDate(debit.date);
    if (!debitDate) {
      continue;
    }

    let bestCredit: Transaction | null = null;
    let bestGapDays = Number.POSITIVE_INFINITY;
    const tolerance = Math.max(10, debit.amount * 0.03);

    for (const creditItem of sortedCredits) {
      if (usedCreditIds.has(creditItem.txn.id)) {
        continue;
      }
      const dayGap = daysBetween(debitDate, creditItem.date);
      if (dayGap < 0 || dayGap > 60) {
        continue;
      }
      if (Math.abs(creditItem.txn.amount - debit.amount) > tolerance) {
        continue;
      }
      if (dayGap < bestGapDays) {
        bestGapDays = dayGap;
        bestCredit = creditItem.txn;
      }
    }

    if (bestCredit) {
      matchedDebitIds.add(debit.id);
      usedCreditIds.add(bestCredit.id);
    }
  }

  const monthlyRefundMatchMap = Object.fromEntries(
    monthlyKeys.map((month) => [month, { matched: 0, unmatched: 0 }])
  ) as Record<string, { matched: number; unmatched: number }>;
  for (const debit of debits) {
    const month = debit.date.slice(0, 7);
    if (!monthlyRefundMatchMap[month]) {
      monthlyRefundMatchMap[month] = { matched: 0, unmatched: 0 };
    }
    if (matchedDebitIds.has(debit.id)) {
      monthlyRefundMatchMap[month].matched += 1;
    } else {
      monthlyRefundMatchMap[month].unmatched += 1;
    }
  }
  const monthlyMatchedCount = monthlyKeys.map((month) => monthlyRefundMatchMap[month].matched);
  const monthlyUnmatchedCount = monthlyKeys.map((month) => monthlyRefundMatchMap[month].unmatched);
  const unmatchedDebits = debits
    .filter((debit) => !matchedDebitIds.has(debit.id))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return (
    <section className="card p-4" data-export-section="spend-story">
      <div className="mb-4">
        <h2 className="section-title">Spend Story</h2>
        <p className="text-xs muted">
          Six views to quickly explain where your money goes and what needs attention.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="card-subtle rounded-lg p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">1) Monthly Money Flow</p>
            <HelpTip text="Credits, refunds, and payments sit above zero. Debit spend sits below zero. The wider the gap, the more uneven that month was." />
          </div>
          <p className="mb-2 text-xs text-slate-500">
            Rounded bars make the monthly inflow-versus-spend split easier to scan, with one shared zero line for quick comparison.
          </p>
          {monthlyFlow.length === 0 ? (
            <p className="text-sm text-slate-500">No monthly transactions found.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                  Debit spend below zero
                </span>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                  Credits and payments above zero
                </span>
              </div>
              <div className="h-56">
                <Bar
                  data={{
                    labels: monthlyKeys.map(toMonthLabel),
                    datasets: [
                      {
                        label: "Debit Spend",
                        data: monthlyDebitValues.map((value) => value * -1),
                        backgroundColor: "rgba(244, 63, 94, 0.55)",
                        borderColor: "#f43f5e",
                        borderWidth: 1.5,
                        borderRadius: 18,
                        borderSkipped: false,
                        maxBarThickness: 34
                      },
                      {
                        label: "Credits / Payments",
                        data: monthlyCreditValues,
                        backgroundColor: "rgba(56, 189, 248, 0.55)",
                        borderColor: "#38bdf8",
                        borderWidth: 1.5,
                        borderRadius: 18,
                        borderSkipped: false,
                        maxBarThickness: 34
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    interaction: {
                      mode: "index",
                      intersect: false
                    },
                    plugins: {
                      legend: {
                        position: "top",
                        labels: {
                          usePointStyle: true,
                          padding: 18
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const raw = Number(context.raw ?? 0);
                            return `${context.dataset.label}: ${formatSignedCurrency(raw)}`;
                          },
                          afterBody: (items) => {
                            const monthKey = monthlyKeys[items[0]?.dataIndex ?? 0];
                            const flow = monthlyFlow.find((item) => item.month === monthKey);
                            if (!flow) {
                              return "";
                            }
                            return `Net: ${formatSignedCurrency(flow.net)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        ticks: {
                          callback: (value) => formatSignedCurrency(Number(value))
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <article className="rounded-xl border border-slate-200 bg-white/75 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Peak Debit</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {toMonthLabel(peakDebitMonth.month)}
                  </p>
                  <p className="text-xs text-slate-500">{formatCurrency(peakDebitMonth.debit)}</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white/75 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Peak Credit</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {toMonthLabel(peakCreditMonth.month)}
                  </p>
                  <p className="text-xs text-slate-500">{formatCurrency(peakCreditMonth.credit)}</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white/75 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Widest Gap</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {toMonthLabel(widestGapMonth.month)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {widestGapMonth.net >= 0
                      ? `Credits ahead ${formatCurrency(widestGapMonth.net)}`
                      : `Debits ahead ${formatCurrency(Math.abs(widestGapMonth.net))}`}
                  </p>
                </article>
              </div>
            </>
          )}
        </article>

        <article className="card-subtle rounded-lg p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">2) Category Spend Mix</p>
            <HelpTip text="The doughnut shows how your spending is split across categories. Bigger slices mean a bigger share of your wallet." />
          </div>
          <p className="mb-2 text-xs text-slate-500">
            A doughnut view makes your share-of-wallet by category easier to scan at a glance.
          </p>
          {categoryMix.length === 0 ? (
            <p className="text-sm text-slate-500">No category spending found.</p>
          ) : (
            <>
              <div className="h-56">
                <Doughnut
                  data={{
                    labels: categoryMix.map((item) => item.category),
                    datasets: [
                      {
                        label: "Spend share",
                        data: categoryMix.map((item) => item.amount),
                        backgroundColor: categoryPalette.slice(0, categoryMix.length),
                        borderColor: "#ffffff",
                        borderWidth: 2,
                        hoverOffset: 10
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    cutout: "58%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          usePointStyle: true,
                          padding: 16
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const amount = Number(context.raw ?? 0);
                            const share = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
                            return `${context.label}: ${formatCurrency(amount)} (${formatPercent(share)})`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Largest share
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {topCategory.category} takes{" "}
                  {formatPercent(totalSpend > 0 ? (topCategory.amount / totalSpend) * 100 : 0)} of
                  debit spend.
                </p>
                <div className="mt-3 space-y-2">
                  {categoryMix.map((item, index) => {
                    const share = totalSpend > 0 ? (item.amount / totalSpend) * 100 : 0;
                    return (
                      <div
                        key={item.category}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: categoryPalette[index] }}
                          />
                          <span className="truncate text-slate-600">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(item.amount)}
                          </span>
                          <span className="ml-2 text-slate-500">{formatPercent(share)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </article>

        <article className="card-subtle rounded-lg p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">3) Weekly Spend Pattern</p>
            <HelpTip text="Higher weekday bars indicate your habitual spend days. Use this to time budgets and card limits." />
          </div>
          <p className="mb-2 text-xs text-slate-500">
            Reveals which weekdays consistently trigger higher card usage.
          </p>
          <div className="h-56">
            <Bar
              data={{
                labels: weekdayLabels,
                datasets: [
                  {
                    label: "Spend by weekday",
                    data: weekdayValues,
                    backgroundColor: "#14b8a6"
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { ticks: { callback: axisCurrency } } }
              }}
            />
          </div>
        </article>

        <article className="card-subtle rounded-lg p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">4) Transaction Size Distribution</p>
            <HelpTip text="Each bar is a spend range. Taller bars mean more transactions in that range." />
          </div>
          <p className="mb-2 text-xs text-slate-500">
            Shows whether spend comes from many small purchases or fewer large ones.
          </p>
          <div className="h-56">
            <Bar
              data={{
                labels: histogramLabels,
                datasets: [
                  {
                    label: "Transaction count",
                    data: histogramBins,
                    backgroundColor: "#6366f1"
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </article>

        <article className="card-subtle rounded-lg p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">5) Refund Match Tracker</p>
            <HelpTip text="Matched means a likely refund credit exists for that debit amount within 60 days. Unmatched means you may want to verify manually." />
          </div>
          <p className="mb-2 text-xs text-slate-500">
            Quickly shows which debit transactions have likely credit matches and which may need follow-up.
          </p>
          <div className="h-40">
            <Bar
              data={{
                labels: monthlyKeys.map(toMonthLabel),
                datasets: [
                  {
                    label: "Matched debits",
                    data: monthlyMatchedCount,
                    backgroundColor: "#22c55e"
                  },
                  {
                    label: "Unmatched debits",
                    data: monthlyUnmatchedCount,
                    backgroundColor: "#f97316"
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Top unmatched debits
            </p>
            {unmatchedDebits.length === 0 ? (
              <p className="text-xs text-slate-500">No unmatched debits found.</p>
            ) : (
              <ul className="space-y-1.5">
                {unmatchedDebits.map((txn) => (
                  <li key={txn.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-slate-600">
                      {txn.description} ({txn.date})
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(txn.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        <article className="card-subtle rounded-lg p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">6) High-Value Transactions</p>
            <HelpTip text="These are your top 10% largest debits. Start review here for quickest spend optimization." />
          </div>
          <p className="mb-2 text-xs text-slate-500">
            Focus list of top 10% spends to review and control quickly.
          </p>
          {highValueTransactions.length === 0 ? (
            <p className="text-sm text-slate-500">No high-value transactions found.</p>
          ) : (
            <ul className="space-y-2">
              {highValueTransactions.map((txn) => {
                const width = Math.max(8, (txn.amount / (highValueTransactions[0].amount || 1)) * 100);
                return (
                  <li key={txn.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-slate-600">{txn.description}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(txn.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-rose-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
