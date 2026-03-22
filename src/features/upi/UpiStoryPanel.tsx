import type { ReactNode } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { StoryTone, UpiDashboardData, UpiStoryInsights } from "./types";

const DEBIT_STRONG = "#dc2626";
const DEBIT_MAIN = "#ef4444";
const DEBIT_SOFT = "rgba(239, 68, 68, 0.18)";
const SLATE_MAIN = "#94a3b8";
const SLATE_MUTED = "rgba(148, 163, 184, 0.75)";
const GRID_COLOR = "rgba(148, 163, 184, 0.18)";
const TICK_COLOR = "#64748b";

type UpiStoryPanelProps = {
  dashboardData: UpiDashboardData;
  storyInsights: UpiStoryInsights;
};

type StoryNote = {
  label: string;
  value: string;
};

type StorySectionProps = {
  step: string;
  title: string;
  question: string;
  headline: string;
  detail: string;
  tone: StoryTone;
  notes?: StoryNote[];
  reverse?: boolean;
  visual: ReactNode;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatPercent(value: number): string {
  const absoluteValue = Math.abs(value);
  return `${absoluteValue.toFixed(absoluteValue >= 10 ? 0 : 1)}%`;
}

function formatAxisCurrency(value: string | number): string {
  const amount = Number(value);

  if (Math.abs(amount) >= 100000) {
    return `Rs${(amount / 100000).toFixed(1)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `Rs${(amount / 1000).toFixed(0)}k`;
  }

  return `Rs${amount.toFixed(0)}`;
}

function toMonthLabel(monthKey: string): string {
  const date = new Date(`${monthKey}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit"
  }).format(date);
}

function toDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short"
  }).format(date);
}

function truncateLabel(label: string, limit = 26): string {
  return label.length > limit ? `${label.slice(0, limit - 3)}...` : label;
}

function getToneClasses(tone: StoryTone): string {
  if (tone === "watch") {
    return "border-rose-200 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.1),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(255,250,250,0.98))] dark:border-rose-900/60 dark:bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.16),_transparent_26%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96))]";
  }

  if (tone === "positive") {
    return "border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.1),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(247,254,249,0.98))] dark:border-emerald-900/60 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_26%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96))]";
  }

  return "border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.12),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96))]";
}

function SummaryMetric({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint: string;
  tone: "debit" | "credit" | "neutral";
}): JSX.Element {
  const toneClass =
    tone === "debit"
      ? "border-rose-200 bg-rose-50/85 dark:border-rose-900/60 dark:bg-rose-950/20"
      : tone === "credit"
        ? "border-emerald-200 bg-emerald-50/85 dark:border-emerald-900/60 dark:bg-emerald-950/20"
        : "border-slate-200 bg-slate-50/85 dark:border-slate-700 dark:bg-slate-900/60";

  return (
    <article className={`rounded-[22px] border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
    </article>
  );
}

function StorySection({
  step,
  title,
  question,
  headline,
  detail,
  tone,
  notes = [],
  reverse = false,
  visual
}: StorySectionProps): JSX.Element {
  return (
    <section
      className={`story-section grid grid-cols-1 gap-6 p-5 md:p-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] ${getToneClasses(tone)}`}
    >
      <div className={reverse ? "xl:order-2" : ""}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {step}
        </p>
        <h2 className="mt-3 text-[1.85rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {question}
        </p>
        <p className="mt-2 text-xl font-semibold leading-8 text-slate-900 dark:text-slate-100">
          {headline}
        </p>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          {detail}
        </p>

        {notes.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <article
                key={note.label}
                className="story-note rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {note.label}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {note.value}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={`story-chart-frame rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/30 ${reverse ? "xl:order-1" : ""}`}
      >
        {visual}
      </div>
    </section>
  );
}

function EmptyVisual({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-[20px] border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">
      {message}
    </div>
  );
}

function toPhaseLabel(phase: UpiStoryInsights["momentum"]["dominantPhase"]): string {
  if (phase === "early") {
    return "Days 1-10";
  }

  if (phase === "mid") {
    return "Days 11-20";
  }

  if (phase === "late") {
    return "Days 21+";
  }

  return "Evenly spread";
}

export function UpiStoryPanel({
  dashboardData,
  storyInsights
}: UpiStoryPanelProps): JSX.Element {
  const monthlyData = dashboardData.monthly;
  const categoryBreakdown = dashboardData.categoryBreakdown;
  const topMerchants = dashboardData.topMerchants;
  const weeklyPattern = dashboardData.weeklyPattern;
  const transactionSizeDistribution = dashboardData.transactionSizeDistribution;
  const cumulativeSpendCurve = dashboardData.cumulativeSpendCurve;
  const monthlyPeakIndex = monthlyData.findIndex(
    (item) => item.monthKey === storyInsights.monthly.peakMonthKey
  );
  const monthlyDropIndex = monthlyData.findIndex(
    (item) => item.monthKey === storyInsights.monthly.dropMonthKey
  );
  const dominantCategory = storyInsights.category.dominantCategory;
  const dominantDay = storyInsights.behavior.dominantDay;
  const dominantBucket = storyInsights.size.dominantBucket;
  const topThreeCategoryShare = categoryBreakdown
    .slice(0, 3)
    .reduce((sum, item) => sum + item.percentage, 0);

  const categoryColors = categoryBreakdown.map((item, index) => {
    if (item.label === dominantCategory) {
      return DEBIT_STRONG;
    }

    if (item.label === "Others") {
      return SLATE_MUTED;
    }

    return [
      "rgba(248, 113, 113, 0.85)",
      "rgba(251, 113, 133, 0.7)",
      "rgba(251, 146, 60, 0.72)",
      "rgba(250, 204, 21, 0.7)",
      "rgba(203, 213, 225, 0.9)",
      "rgba(148, 163, 184, 0.72)"
    ][index] ?? SLATE_MUTED;
  });

  return (
    <div className="space-y-8">
      <section
        className={`story-section grid grid-cols-1 gap-5 p-4 md:p-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] ${getToneClasses(
          storyInsights.category.tone
        )}`}
      >
        <div className="story-chart-frame rounded-[24px] border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-950/30">
          {categoryBreakdown.length === 0 ? (
            <EmptyVisual message="No category split is available for the current filters." />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-center lg:gap-7 xl:gap-8">
              <div className="relative mx-auto h-[220px] w-[220px] sm:h-[240px] sm:w-[240px] lg:mx-0 lg:h-[250px] lg:w-[250px]">
                <Doughnut
                  data={{
                    labels: categoryBreakdown.map((item) => item.label),
                    datasets: [
                      {
                        data: categoryBreakdown.map((item) => item.amount),
                        backgroundColor: categoryColors,
                        borderWidth: 0
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "72%",
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const item = categoryBreakdown[context.dataIndex];
                            return `${item.label}: ${formatCurrency(item.amount)} (${formatPercent(item.percentage)})`;
                          }
                        }
                      }
                    }
                  }}
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Lead Category
                  </p>
                  <p className="mt-1 max-w-[7.5rem] text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {dominantCategory ?? "No leader"}
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {formatPercent(storyInsights.category.dominantShare)}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:pl-1">
                {categoryBreakdown.map((item, index) => (
                  <article
                    key={item.label}
                    className={`rounded-[16px] border px-3 py-2.5 ${
                      item.label === dominantCategory
                        ? "border-rose-200 bg-rose-50/85 dark:border-rose-900/60 dark:bg-rose-950/20"
                        : "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: categoryColors[index] }}
                      />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {formatPercent(item.percentage)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: categoryColors[index],
                            width: `${Math.max(item.percentage, item.label === dominantCategory ? 18 : 8)}%`
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Section 1
          </p>
          <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-[1.9rem]">
            Where Your Money Goes
          </h2>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Which category dominates your wallet?
          </p>
          <p className="mt-2 text-xl font-semibold leading-8 text-slate-900 dark:text-slate-100">
            {storyInsights.category.headline}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {storyInsights.category.detail}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <article className="story-note rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Leading Category
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {storyInsights.category.dominantCategory
                  ? `${storyInsights.category.dominantCategory} | ${formatPercent(storyInsights.category.dominantShare)}`
                  : "No category leader"}
              </p>
            </article>
            <article className="story-note rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Next in Line
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {storyInsights.category.secondaryCategory ?? "No second category"}
              </p>
            </article>
            <article className="story-note rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Top 3 Share
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {formatPercent(topThreeCategoryShare)} of spend
              </p>
            </article>
          </div>
        </div>
      </section>

      <StorySection
        step="Section 2"
        title="Your Behavioral Patterns"
        question="What days trigger your heaviest spending?"
        headline={storyInsights.behavior.headline}
        detail={storyInsights.behavior.detail}
        tone={storyInsights.behavior.tone}
        reverse
        notes={[
          {
            label: "Busiest Day",
            value: storyInsights.behavior.dominantDay ?? "No dominant day"
          },
          {
            label: "Weekend Share",
            value: `${formatPercent(storyInsights.behavior.weekendShare)} of total spend`
          }
        ]}
        visual={
          weeklyPattern.every((item) => item.amount === 0) ? (
            <EmptyVisual message="No weekly spend rhythm is available for the current filters." />
          ) : (
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: weeklyPattern.map((item) => item.day),
                  datasets: [
                    {
                      data: weeklyPattern.map((item) => item.amount),
                      backgroundColor: weeklyPattern.map((item) =>
                        item.day === dominantDay ? DEBIT_STRONG : SLATE_MUTED
                      ),
                      borderRadius: 12,
                      borderSkipped: false
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      displayColors: false,
                      callbacks: {
                        label: (context) => {
                          const item = weeklyPattern[context.dataIndex];
                          return `${formatCurrency(item.amount)} | ${formatPercent(item.percentage)} of spend`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: { color: TICK_COLOR, font: { size: 11 } }
                    },
                    y: {
                      grid: { color: GRID_COLOR },
                      border: { display: false },
                      ticks: {
                        color: TICK_COLOR,
                        font: { size: 11 },
                        callback: (value) => formatAxisCurrency(value)
                      }
                    }
                  }
                }}
              />
            </div>
          )
        }
      />

      <section
        className={`story-section grid grid-cols-1 gap-6 p-5 md:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] ${getToneClasses(
          storyInsights.snapshot.tone
        )}`}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Section 3
          </p>
          <h2 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Your Financial Snapshot
          </h2>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            What does the overall money movement look like?
          </p>
          <p className="mt-2 text-xl font-semibold leading-8 text-slate-900 dark:text-slate-100">
            {storyInsights.snapshot.headline}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {storyInsights.snapshot.detail}
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryMetric
              label="Total Spend"
              value={formatCurrency(dashboardData.summary.totalSpend)}
              hint={`${dashboardData.summary.debitCount} debit transactions in this view`}
              tone="debit"
            />
            <SummaryMetric
              label="Credits"
              value={formatCurrency(dashboardData.summary.totalCredits)}
              hint={`${dashboardData.summary.creditCount} credit transactions in this view`}
              tone="credit"
            />
            <SummaryMetric
              label="Net Flow"
              value={formatCurrency(dashboardData.summary.netFlow)}
              hint={
                dashboardData.summary.netFlow >= 0
                  ? "Credits are currently ahead of spending"
                  : "Spending is currently ahead of credits"
              }
              tone={dashboardData.summary.netFlow >= 0 ? "credit" : "neutral"}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <article className="rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Monthly Average Spend
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {formatCurrency(dashboardData.summary.monthlyAverageSpend)}
              </p>
            </article>
            <article className="rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Credit Cover
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {formatPercent(storyInsights.snapshot.coverageRatio)} of total spend
              </p>
            </article>
          </div>
        </div>
      </section>

      <StorySection
        step="Section 4"
        title="How Your Spending Evolved"
        question="When did your spending spike or cool off?"
        headline={storyInsights.monthly.headline}
        detail={storyInsights.monthly.detail}
        tone={storyInsights.monthly.tone}
        notes={[
          {
            label: "Peak Month",
            value:
              storyInsights.monthly.peakMonthKey && storyInsights.monthly.peakMonthAmount !== undefined
                ? `${toMonthLabel(storyInsights.monthly.peakMonthKey)} | ${formatCurrency(storyInsights.monthly.peakMonthAmount)}`
                : "No visible peak"
          },
          {
            label: "Largest Pullback",
            value:
              storyInsights.monthly.dropMonthKey && storyInsights.monthly.dropMonthAmount !== undefined
                ? `${toMonthLabel(storyInsights.monthly.dropMonthKey)} | ${formatCurrency(storyInsights.monthly.dropMonthAmount)}`
                : "No visible pullback"
          }
        ]}
        visual={
          monthlyData.length === 0 ? (
            <EmptyVisual message="No monthly debit pattern is available for the current filters." />
          ) : (
            <div className="h-[320px]">
              <Line
                data={{
                  labels: monthlyData.map((item) => toMonthLabel(item.monthKey)),
                  datasets: [
                    {
                      data: monthlyData.map((item) => item.debit),
                      borderColor: DEBIT_MAIN,
                      backgroundColor: DEBIT_SOFT,
                      fill: true,
                      tension: 0.28,
                      borderWidth: 2.5,
                      pointRadius: monthlyData.map((_, index) =>
                        index === monthlyPeakIndex || index === monthlyDropIndex ? 4.5 : 0
                      ),
                      pointHoverRadius: monthlyData.map((_, index) =>
                        index === monthlyPeakIndex || index === monthlyDropIndex ? 5.5 : 3.5
                      ),
                      pointBackgroundColor: monthlyData.map((_, index) =>
                        index === monthlyPeakIndex
                          ? DEBIT_STRONG
                          : index === monthlyDropIndex
                            ? SLATE_MAIN
                            : DEBIT_MAIN
                      ),
                      pointBorderWidth: 0
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      displayColors: false,
                      callbacks: {
                        label: (context) => `Spend: ${formatCurrency(Number(context.raw ?? 0))}`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: { color: TICK_COLOR, font: { size: 11 } }
                    },
                    y: {
                      grid: { color: GRID_COLOR },
                      border: { display: false },
                      ticks: {
                        color: TICK_COLOR,
                        font: { size: 11 },
                        callback: (value) => formatAxisCurrency(value)
                      }
                    }
                  }
                }}
              />
            </div>
          )
        }
      />

      <StorySection
        step="Section 5"
        title="Who You Pay the Most"
        question="Which merchants absorb the highest share of outflow?"
        headline={storyInsights.merchant.headline}
        detail={storyInsights.merchant.detail}
        tone={storyInsights.merchant.tone}
        notes={[
          {
            label: "Top 3 Concentration",
            value: `${formatPercent(storyInsights.merchant.topThreeShare)} of total spend`
          },
          {
            label: "Lead Merchant",
            value: storyInsights.merchant.leadMerchant ?? "No merchant leader"
          }
        ]}
        visual={
          topMerchants.length === 0 ? (
            <EmptyVisual message="No merchant concentration is available for the current filters." />
          ) : (
            <div className="h-[320px]">
              <Bar
                data={{
                  labels: topMerchants.map((item) => truncateLabel(item.merchant)),
                  datasets: [
                    {
                      data: topMerchants.map((item) => item.amount),
                      backgroundColor: topMerchants.map((_, index) =>
                        index === 0
                          ? DEBIT_STRONG
                          : index < 3
                            ? DEBIT_MAIN
                            : SLATE_MUTED
                      ),
                      borderRadius: 12,
                      borderSkipped: false
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      displayColors: false,
                      callbacks: {
                        title: (items) => topMerchants[items[0]?.dataIndex ?? 0]?.merchant ?? "",
                        label: (context) => {
                          const item = topMerchants[context.dataIndex];
                          return `${formatCurrency(item.amount)} | ${formatPercent(item.percentage)} of spend`;
                        },
                        afterLabel: (context) => {
                          const item = topMerchants[context.dataIndex];
                          return `${item.count} payments`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: GRID_COLOR },
                      border: { display: false },
                      ticks: {
                        color: TICK_COLOR,
                        font: { size: 11 },
                        callback: (value) => formatAxisCurrency(value)
                      }
                    },
                    y: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: { color: TICK_COLOR, font: { size: 11 } }
                    }
                  }
                }}
              />
            </div>
          )
        }
      />

      <StorySection
        step="Section 6"
        title="Spending Style Analysis"
        question="Are you making many small payments or fewer large ones?"
        headline={storyInsights.size.headline}
        detail={storyInsights.size.detail}
        tone={storyInsights.size.tone}
        notes={[
          {
            label: "Under Rs500 Share",
            value: `${formatPercent(storyInsights.size.smallTicketShare)} of transaction count`
          },
          {
            label: "Most Common Ticket",
            value: storyInsights.size.dominantBucket ?? "No dominant bucket"
          }
        ]}
        visual={
          transactionSizeDistribution.every((bucket) => bucket.count === 0) ? (
            <EmptyVisual message="No transaction-size pattern is available for the current filters." />
          ) : (
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: transactionSizeDistribution.map((item) => item.label),
                  datasets: [
                    {
                      data: transactionSizeDistribution.map((item) => item.count),
                      backgroundColor: transactionSizeDistribution.map((item) =>
                        item.label === dominantBucket ? DEBIT_STRONG : SLATE_MUTED
                      ),
                      borderRadius: 12,
                      borderSkipped: false
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      displayColors: false,
                      callbacks: {
                        label: (context) => {
                          const bucket = transactionSizeDistribution[context.dataIndex];
                          return `${bucket.count} transactions | ${formatPercent(bucket.percentage)} of count`;
                        },
                        afterLabel: (context) => {
                          const bucket = transactionSizeDistribution[context.dataIndex];
                          return formatCurrency(bucket.totalAmount);
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: { color: TICK_COLOR, font: { size: 11 } }
                    },
                    y: {
                      grid: { color: GRID_COLOR },
                      border: { display: false },
                      ticks: {
                        color: TICK_COLOR,
                        font: { size: 11 },
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </div>
          )
        }
      />

      <StorySection
        step="Section 7"
        title="Momentum and Control"
        question="How quickly does spend build through the month?"
        headline={storyInsights.momentum.headline}
        detail={storyInsights.momentum.detail}
        tone={storyInsights.momentum.tone}
        reverse
        notes={[
          {
            label: "Strongest Phase",
            value: `${toPhaseLabel(storyInsights.momentum.dominantPhase)} | ${formatPercent(storyInsights.momentum.phaseShare)}`
          },
          {
            label: "Spend by Mid-Month",
            value: `${formatPercent(storyInsights.momentum.midpointShare)} on average`
          }
        ]}
        visual={
          cumulativeSpendCurve.length === 0 ? (
            <EmptyVisual message="No cumulative spend curve is available for the current filters." />
          ) : (
            <div className="h-[320px]">
              <Line
                data={{
                  labels: cumulativeSpendCurve.map((item) => toDateLabel(item.date)),
                  datasets: [
                    {
                      data: cumulativeSpendCurve.map((item) => item.runningTotal),
                      borderColor: DEBIT_MAIN,
                      backgroundColor: DEBIT_SOFT,
                      fill: true,
                      tension: 0.22,
                      borderWidth: 2.5,
                      pointRadius: cumulativeSpendCurve.map((_, index) =>
                        index === cumulativeSpendCurve.length - 1 ? 3.5 : 0
                      ),
                      pointHoverRadius: 4.5,
                      pointBackgroundColor: DEBIT_STRONG,
                      pointBorderWidth: 0
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      displayColors: false,
                      callbacks: {
                        title: (items) => cumulativeSpendCurve[items[0]?.dataIndex ?? 0]?.date ?? "",
                        label: (context) => {
                          const item = cumulativeSpendCurve[context.dataIndex];
                          return `Running total: ${formatCurrency(item.runningTotal)}`;
                        },
                        afterLabel: (context) => {
                          const item = cumulativeSpendCurve[context.dataIndex];
                          return `Day spend: ${formatCurrency(item.amount)}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: {
                        color: TICK_COLOR,
                        font: { size: 11 },
                        maxTicksLimit: 8
                      }
                    },
                    y: {
                      grid: { color: GRID_COLOR },
                      border: { display: false },
                      ticks: {
                        color: TICK_COLOR,
                        font: { size: 11 },
                        callback: (value) => formatAxisCurrency(value)
                      }
                    }
                  }
                }}
              />
            </div>
          )
        }
      />
    </div>
  );
}
