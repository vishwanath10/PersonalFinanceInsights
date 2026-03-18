import { groupMerchants } from "../analytics/merchantGrouping";
import type { AnalyticsSummary } from "../analytics/metrics";
import type { StatementMetadata } from "../types/statement";
import type { Filters, Transaction } from "../types/transaction";

const SPEND_STORY_TITLES = [
  "Monthly Credit vs Debit",
  "Category Priority Ranking",
  "Weekly Spend Pattern",
  "Transaction Size Distribution",
  "Refund Match Tracker"
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeForCsv(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function toCsv(rows: Transaction[]): string {
  const header = ["Date", "Description", "Amount", "Type", "Category"];
  const escapeValue = (value: string): string =>
    `"${sanitizeForCsv(value).replace(/"/g, "\"\"")}"`;
  const lines = rows.map((row) =>
    [
      escapeValue(row.date),
      escapeValue(row.description),
      escapeValue(String(row.amount)),
      escapeValue(row.type),
      escapeValue(row.category)
    ].join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function getChartSnapshots(): Array<{ title: string; image: string }> {
  const canvases = Array.from(
    document.querySelectorAll("[data-export-section='spend-story'] canvas")
  ) as HTMLCanvasElement[];

  return canvases
    .map((canvas, index) => {
      try {
        return {
          title: SPEND_STORY_TITLES[index] ?? `Chart ${index + 1}`,
          image: canvas.toDataURL("image/png", 1)
        };
      } catch {
        return null;
      }
    })
    .filter((item): item is { title: string; image: string } => Boolean(item));
}

function buildCategoryRows(analytics: AnalyticsSummary): string {
  return Object.entries(analytics.spendingByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, amount]) => `
        <tr>
          <td>${escapeHtml(category)}</td>
          <td class="right">${escapeHtml(formatCurrency(amount))}</td>
        </tr>
      `
    )
    .join("");
}

function buildMerchantRows(transactions: Transaction[]): string {
  return groupMerchants(transactions)
    .slice(0, 12)
    .map(
      (group) => `
        <tr>
          <td>${escapeHtml(group.merchant)}</td>
          <td>${group.transactionCount}</td>
          <td class="right">${escapeHtml(formatCurrency(group.totalSpent))}</td>
        </tr>
      `
    )
    .join("");
}

function buildTransactionRows(transactions: Transaction[]): string {
  return transactions
    .map(
      (txn) => `
        <tr>
          <td>${escapeHtml(formatDate(txn.date))}</td>
          <td>${escapeHtml(txn.description)}</td>
          <td>${escapeHtml(txn.category)}</td>
          <td>${escapeHtml(txn.type)}</td>
          <td class="right">${escapeHtml(formatCurrency(txn.amount))}</td>
        </tr>
      `
    )
    .join("");
}

function buildMetadataRows(statementMetadata: StatementMetadata): string {
  const rows: Array<[string, string]> = [
    ["Bank Name", statementMetadata.bankName ?? "Not detected"],
    [
      "Total Bill Amount",
      statementMetadata.totalBillAmount === undefined
        ? "Not detected"
        : formatCurrency(statementMetadata.totalBillAmount)
    ],
    [
      "Minimum Amount Due",
      statementMetadata.minimumAmountDue === undefined
        ? "Not detected"
        : formatCurrency(statementMetadata.minimumAmountDue)
    ],
    ["Payment Due Date", statementMetadata.paymentDueDate ?? "Not detected"],
    ["Statement Period", statementMetadata.statementPeriod ?? "Not detected"]
  ];

  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td>${escapeHtml(label)}</td>
          <td>${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join("");
}

function buildQuickSummary(
  transactions: Transaction[],
  analytics: AnalyticsSummary,
  filters: Filters
): Array<{ label: string; value: string }> {
  const debitCount = transactions.filter((txn) => txn.type === "debit").length;
  const creditCount = transactions.filter((txn) => txn.type === "credit").length;
  const topCategory = Object.entries(analytics.spendingByCategory).sort((a, b) => b[1] - a[1])[0];

  return [
    { label: "Transactions", value: String(transactions.length) },
    { label: "Debits", value: String(debitCount) },
    { label: "Credits", value: String(creditCount) },
    { label: "Total Spend", value: formatCurrency(analytics.totalSpending) },
    { label: "Largest Transaction", value: formatCurrency(analytics.largestTransaction) },
    { label: "Average Transaction", value: formatCurrency(analytics.averageTransaction) },
    { label: "Monthly Growth", value: `${analytics.monthlyGrowthRate.toFixed(1)}%` },
    { label: "Top Category", value: topCategory ? topCategory[0] : "N/A" },
    { label: "Analysis Range", value: `${filters.startDate} to ${filters.endDate}` }
  ];
}

export function downloadTransactionsCsv(rows: Transaction[]): void {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "statement-transactions.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportDashboardPdfReport(input: {
  transactions: Transaction[];
  analytics: AnalyticsSummary;
  statementMetadata: StatementMetadata;
  filters: Filters;
}): void {
  const { transactions, analytics, statementMetadata, filters } = input;
  const chartSnapshots = getChartSnapshots();
  const summary = buildQuickSummary(transactions, analytics, filters);
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    return;
  }

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Credit Card Statement Report</title>
        <style>
          :root {
            color-scheme: light;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 32px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            color: #0f172a;
            background: #f4f7fb;
          }
          h1, h2, h3, p {
            margin: 0;
          }
          .hero {
            padding: 28px;
            border-radius: 20px;
            background: linear-gradient(135deg, #0f172a 0%, #153968 100%);
            color: white;
          }
          .hero p {
            margin-top: 8px;
            color: rgba(255,255,255,0.82);
          }
          .section {
            margin-top: 24px;
            padding: 20px;
            border: 1px solid #d8e2f0;
            border-radius: 18px;
            background: white;
          }
          .section.tinted {
            background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 16px;
          }
          .summary-card {
            padding: 14px;
            border-radius: 14px;
            border: 1px solid #d8e2f0;
            background: linear-gradient(160deg, #ffffff 0%, #eef5ff 100%);
          }
          .summary-card .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #64748b;
          }
          .summary-card .value {
            margin-top: 6px;
            font-size: 18px;
            font-weight: 700;
          }
          .two-col {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            gap: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 12px;
          }
          th, td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5edf7;
            text-align: left;
            vertical-align: top;
          }
          th {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
          }
          td.right, th.right {
            text-align: right;
          }
          .chart-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
            margin-top: 16px;
          }
          .chart-card {
            padding: 16px;
            border: 1px solid #d8e2f0;
            border-radius: 16px;
            background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
          }
          .chart-card h3 {
            margin-bottom: 12px;
            font-size: 14px;
          }
          .chart-card img {
            width: 100%;
            display: block;
          }
          .muted {
            color: #64748b;
          }
          .actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 18px;
          }
          .action-button {
            padding: 10px 16px;
            border: 1px solid #d8e2f0;
            border-radius: 999px;
            background: white;
            color: #0f172a;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
          }
          .action-button.primary {
            background: #0b84d8;
            border-color: #0b84d8;
            color: white;
          }
          .page-break {
            break-before: page;
            page-break-before: always;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .section {
              break-inside: avoid;
              box-shadow: none;
            }
            .actions {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <section class="hero">
          <h1>Credit Card Statement Insights Report</h1>
          <p>Exported on ${escapeHtml(formatDate(new Date().toISOString()))}. This report includes the current dashboard view, chart snapshots, grouped merchant summary, and transaction-level details.</p>
          <div class="actions">
            <button class="action-button" type="button" onclick="window.close()">Close</button>
            <button class="action-button primary" type="button" onclick="window.print()">Print / Save as PDF</button>
          </div>
        </section>

        <section class="section tinted">
          <h2>Quick Summary</h2>
          <div class="summary-grid">
            ${summary
              .map(
                (item) => `
                  <div class="summary-card">
                    <div class="label">${escapeHtml(item.label)}</div>
                    <div class="value">${escapeHtml(item.value)}</div>
                  </div>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="section">
          <div class="two-col">
            <div>
              <h2>Statement Details</h2>
              <table>
                <tbody>${buildMetadataRows(statementMetadata)}</tbody>
              </table>
            </div>
            <div>
              <h2>Category Spend Table</h2>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th class="right">Spend</th>
                  </tr>
                </thead>
                <tbody>${buildCategoryRows(analytics)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="section tinted">
          <h2>Merchant Spend Summary</h2>
          <p class="muted" style="margin-top: 6px;">Similar merchant names are grouped to make recurring spend easier to review.</p>
          <table>
            <thead>
              <tr>
                <th>Merchant Group</th>
                <th>Transactions</th>
                <th class="right">Total Spend</th>
              </tr>
            </thead>
            <tbody>${buildMerchantRows(transactions)}</tbody>
          </table>
        </section>

        <section class="section page-break">
          <h2>Spend Story Charts</h2>
          <div class="chart-grid">
            ${chartSnapshots
              .map(
                (chart) => `
                  <div class="chart-card">
                    <h3>${escapeHtml(chart.title)}</h3>
                    <img src="${chart.image}" alt="${escapeHtml(chart.title)}" />
                  </div>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="section page-break">
          <h2>Transaction Details</h2>
          <p class="muted" style="margin-top: 6px;">This table includes the transactions currently visible in the dashboard export scope.</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>${buildTransactionRows(transactions)}</tbody>
          </table>
        </section>
        <script>
          (function () {
            function triggerPrint() {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 250);
            }

            function waitForImages() {
              var images = Array.from(document.images);
              if (images.length === 0) {
                triggerPrint();
                return;
              }

              var remaining = images.length;
              function done() {
                remaining -= 1;
                if (remaining <= 0) {
                  triggerPrint();
                }
              }

              images.forEach(function (image) {
                if (image.complete) {
                  done();
                  return;
                }
                image.addEventListener("load", done, { once: true });
                image.addEventListener("error", done, { once: true });
              });
            }

            if (document.readyState === "complete") {
              waitForImages();
              return;
            }

            window.addEventListener("load", waitForImages, { once: true });
          })();
        <\/script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}
