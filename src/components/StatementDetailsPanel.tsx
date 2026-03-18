import type { StatementMetadata } from "../types/statement";

type StatementDetailsPanelProps = {
  metadata: StatementMetadata;
};

function displayValue(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "Not detected";
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);
  }
  return value;
}

export function StatementDetailsPanel({ metadata }: StatementDetailsPanelProps): JSX.Element {
  const fields: Array<{ label: string; value: string | number | undefined }> = [
    { label: "Bank Name", value: metadata.bankName },
    { label: "Total Bill Amount", value: metadata.totalBillAmount },
    { label: "Minimum Amount Due", value: metadata.minimumAmountDue },
    { label: "Payment Due Date", value: metadata.paymentDueDate },
    { label: "Statement Period", value: metadata.statementPeriod }
  ];

  return (
    <section className="card p-4">
      <h2 className="section-title mb-3 text-slate-900 dark:text-slate-100">
        Statement Details
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {fields.map((field) => (
          <article key={field.label} className="card-subtle rounded-lg p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">{field.label}</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {displayValue(field.value)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
