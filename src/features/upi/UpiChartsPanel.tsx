import type { ReactNode } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { UpiDashboardData } from "./types";

const DEBIT_COLOR = "#ef4444";
const DEBIT_SOFT = "rgba(239, 68, 68, 0.2)";
const DEBIT_MEDIUM = "rgba(248, 113, 113, 0.8)";
const CREDIT_COLOR = "#22c55e";
const CREDIT_SOFT = "rgba(34, 197, 94, 0.18)";
const CREDIT_MEDIUM = "rgba(74, 222, 128, 0.8)";
const DEBIT_PALETTE = ["#ef4444", "#f87171", "#fb7185", "#f97316", "#fb923c", "#fbbf24", "#cbd5e1"];

type UpiChartsPanelProps = {
  dashboardData: UpiDashboardData;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
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
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(date);
}

function toDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

function truncateLabel(label: string, limit = 24): string {
  return label.length > limit ? `${label.slice(0, limit - 3)}...` : label;
}

function ChartCard({
  title,
  insight,
  children
}: {
  title: string;
  insight: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <article className="card p-4">
      <div className="mb-3">
        <h2 className="section-title">{title}</h2>
        <p className="mt-1 text-xs muted">{insight}</p>
      </div>
      {children}
    </article>
  );
}

export function UpiChartsPanel({ dashboardData }: UpiChartsPanelProps): JSX.Element {
  const monthlyData = dashboardData.monthly;
  const categoryBreakdown = dashboardData.categoryBreakdown;
  const topMerchants = dashboardData.topMerchants;
  const weeklyPattern = dashboardData.weeklyPattern;
  const transactionSizeDistribution = dashboardData.transactionSizeDistribution;
  const cumulativeSpendCurve = dashboardData.cumulativeSpendCurve;
  const topMerchantLabels = topMerchants.map((item) => truncateLabel(item.merchant, 26));

  return (
    <>
      <ChartCard
        title="Monthly Spending Trend"
        insight="How debit spending changes over time, with credit context layered in for quick trend comparison."
      >
        <div className="h-80">
          <Line
            data={{
              labels: monthlyData.map((item) => toMonthLabel(item.monthKey)),
              datasets: [
                {
                  label: "Debit spend",
                  data: monthlyData.map((item) => item.debit),
                  borderColor: DEBIT_COLOR,
                  backgroundColor: DEBIT_SOFT,
                  tension: 0.28,
                  fill: true,
                  pointRadius: 3,
                  pointHoverRadius: 5
                },
                {
                  label: "Credit",
                  data: monthlyData.map((item) => item.credit),
                  borderColor: CREDIT_COLOR,
                  backgroundColor: CREDIT_SOFT,
                  tension: 0.28,
                  fill: false,
                  borderDash: [6, 4],
                  pointRadius: 3,
                  pointHoverRadius: 5
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
              plugins: {
                legend: { position: "top", labels: { usePointStyle: true } },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const month = monthlyData[context.dataIndex];
                      const amount = Number(context.raw ?? 0);
                      const share =
                        context.dataset.label === "Credit"
                          ? month.credit > 0 && dashboardData.summary.totalCredits > 0
                            ? (month.credit / dashboardData.summary.totalCredits) * 100
                            : 0
                          : month.shareOfSpend;
                      return `${context.dataset.label}: ${formatCurrency(amount)} (${formatPercent(
                        share
                      )})`;
                    },
                    afterBody: (items) => {
                      const month = monthlyData[items[0]?.dataIndex ?? 0];
                      return `Net flow: ${formatCurrency(month.net)}`;
                    }
                  }
                }
              },
              scales: {
                y: { ticks: { callback: (value) => formatAxisCurrency(value) } }
              }
            }}
          />
        </div>
      </ChartCard>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Category-wise Distribution"
          insight="Where debit money is going after grouping the top six categories and collapsing the rest into Others."
        >
          <div className="h-80">
            {categoryBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                No debit category data for the current filters.
              </div>
            ) : (
              <Doughnut
                data={{
                  labels: categoryBreakdown.map((item) => item.label),
                  datasets: [
                    {
                      data: categoryBreakdown.map((item) => item.amount),
                      backgroundColor: DEBIT_PALETTE.slice(0, categoryBreakdown.length),
                      borderColor: "#ffffff",
                      borderWidth: 2
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "58%",
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { usePointStyle: true, padding: 14 }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const item = categoryBreakdown[context.dataIndex];
                          return `${item.label}: ${formatCurrency(item.amount)} (${formatPercent(
                            item.percentage
                          )})`;
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Top Merchants"
          insight="Which merchants absorb the highest share of UPI debit spend, limited to the top ten destinations."
        >
          <div className="h-80">
            {topMerchants.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                No merchant spend data for the current filters.
              </div>
            ) : (
              <Bar
                data={{
                  labels: topMerchantLabels,
                  datasets: [
                    {
                      label: "Spend",
                      data: topMerchants.map((item) => item.amount),
                      backgroundColor: DEBIT_MEDIUM,
                      borderColor: DEBIT_COLOR,
                      borderWidth: 1.5,
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
                      callbacks: {
                        title: (items) => topMerchants[items[0]?.dataIndex ?? 0]?.merchant ?? "",
                        label: (context) => {
                          const item = topMerchants[context.dataIndex];
                          return `Spend: ${formatCurrency(item.amount)} (${formatPercent(
                            item.percentage
                          )})`;
                        },
                        afterLabel: (context) => {
                          const item = topMerchants[context.dataIndex];
                          return `Transactions: ${item.count}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: { ticks: { callback: (value) => formatAxisCurrency(value) } }
                  }
                }}
              />
            )}
          </div>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Debit vs Credit Flow"
          insight="Month-by-month comparison of inflow and outflow to spot months with strong imbalance."
        >
          <div className="h-72">
            <Bar
              data={{
                labels: monthlyData.map((item) => toMonthLabel(item.monthKey)),
                datasets: [
                  {
                    label: "Debit",
                    data: monthlyData.map((item) => item.debit),
                    backgroundColor: DEBIT_MEDIUM,
                    borderColor: DEBIT_COLOR,
                    borderWidth: 1.5,
                    borderRadius: 10
                  },
                  {
                    label: "Credit",
                    data: monthlyData.map((item) => item.credit),
                    backgroundColor: CREDIT_MEDIUM,
                    borderColor: CREDIT_COLOR,
                    borderWidth: 1.5,
                    borderRadius: 10
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top", labels: { usePointStyle: true } },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const month = monthlyData[context.dataIndex];
                        const amount = Number(context.raw ?? 0);
                        const total = month.debit + month.credit;
                        const share = total > 0 ? (amount / total) * 100 : 0;
                        return `${context.dataset.label}: ${formatCurrency(amount)} (${formatPercent(
                          share
                        )})`;
                      },
                      afterBody: (items) => {
                        const month = monthlyData[items[0]?.dataIndex ?? 0];
                        return `Net flow: ${formatCurrency(month.net)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: { ticks: { callback: (value) => formatAxisCurrency(value) } }
                }
              }}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Weekly Spending Pattern"
          insight="Behavioral view of which weekdays consistently trigger the most debit activity."
        >
          <div className="h-72">
            <Bar
              data={{
                labels: weeklyPattern.map((item) => item.day),
                datasets: [
                  {
                    label: "Spend",
                    data: weeklyPattern.map((item) => item.amount),
                    backgroundColor: [
                      "rgba(248, 113, 113, 0.8)",
                      "rgba(248, 113, 113, 0.8)",
                      "rgba(248, 113, 113, 0.8)",
                      "rgba(239, 68, 68, 0.92)",
                      "rgba(239, 68, 68, 0.92)",
                      "rgba(251, 146, 60, 0.85)",
                      "rgba(251, 146, 60, 0.85)"
                    ],
                    borderRadius: 10,
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
                    callbacks: {
                      label: (context) => {
                        const item = weeklyPattern[context.dataIndex];
                        return `Spend: ${formatCurrency(item.amount)} (${formatPercent(
                          item.percentage
                        )})`;
                      }
                    }
                  }
                },
                scales: {
                  y: { ticks: { callback: (value) => formatAxisCurrency(value) } }
                }
              }}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Transaction Size Distribution"
          insight="How granular your debit behavior is, from tiny daily payments to large-value UPI transfers."
        >
          <div className="h-72">
            <Bar
              data={{
                labels: transactionSizeDistribution.map((item) => item.label),
                datasets: [
                  {
                    label: "Transactions",
                    data: transactionSizeDistribution.map((item) => item.count),
                    backgroundColor: [
                      "rgba(251, 191, 36, 0.85)",
                      "rgba(251, 146, 60, 0.85)",
                      "rgba(248, 113, 113, 0.85)",
                      "rgba(239, 68, 68, 0.92)"
                    ],
                    borderRadius: 10,
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
                    callbacks: {
                      label: (context) => {
                        const bucket = transactionSizeDistribution[context.dataIndex];
                        return `Transactions: ${bucket.count} (${formatPercent(bucket.percentage)})`;
                      },
                      afterLabel: (context) => {
                        const bucket = transactionSizeDistribution[context.dataIndex];
                        return `Spend in bucket: ${formatCurrency(bucket.totalAmount)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Cumulative Spend Curve"
          insight="How quickly debit spending accumulates across the period, revealing acceleration and plateaus."
        >
          <div className="h-72">
            <Line
              data={{
                labels: cumulativeSpendCurve.map((item) => toDateLabel(item.date)),
                datasets: [
                  {
                    label: "Running total spend",
                    data: cumulativeSpendCurve.map((item) => item.runningTotal),
                    borderColor: DEBIT_COLOR,
                    backgroundColor: DEBIT_SOFT,
                    tension: 0.22,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title: (items) =>
                        cumulativeSpendCurve[items[0]?.dataIndex ?? 0]?.date ?? "",
                      label: (context) => {
                        const item = cumulativeSpendCurve[context.dataIndex];
                        return `Running total: ${formatCurrency(item.runningTotal)} (${formatPercent(
                          item.percentage
                        )})`;
                      },
                      afterLabel: (context) => {
                        const item = cumulativeSpendCurve[context.dataIndex];
                        return `Daily spend: ${formatCurrency(item.amount)}`;
                      }
                    }
                  }
                },
                scales: {
                  x: { ticks: { maxTicksLimit: 8 } },
                  y: { ticks: { callback: (value) => formatAxisCurrency(value) } }
                }
              }}
            />
          </div>
        </ChartCard>
      </section>
    </>
  );
}
