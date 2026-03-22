import { useDeferredValue, useMemo, useState } from "react";
import type { Transaction } from "../../types/transaction";

type UpiTransactionTableProps = {
  transactions: Transaction[];
  frameless?: boolean;
};

type UpiSortField = "date" | "description" | "amount" | "type" | "category";
type UpiSortDirection = "asc" | "desc";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function typeBadgeClass(type: Transaction["type"]): string {
  return type === "credit"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
}

export function UpiTransactionTable({
  transactions,
  frameless = false
}: UpiTransactionTableProps): JSX.Element {
  const [sortField, setSortField] = useState<UpiSortField>("date");
  const [sortDirection, setSortDirection] = useState<UpiSortDirection>("desc");
  const [merchantSearch, setMerchantSearch] = useState("");
  const deferredMerchantSearch = useDeferredValue(merchantSearch.trim().toLowerCase());

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((first, second) => {
      let result = 0;

      if (sortField === "date") {
        result = first.date.localeCompare(second.date);
      } else if (sortField === "description") {
        result = (first.merchant ?? first.description).localeCompare(
          second.merchant ?? second.description
        );
      } else if (sortField === "amount") {
        result = first.amount - second.amount;
      } else if (sortField === "type") {
        result = first.type.localeCompare(second.type);
      } else {
        result = first.category.localeCompare(second.category);
      }

      if (result === 0) {
        result = first.date.localeCompare(second.date);
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [transactions, sortDirection, sortField]);

  const visibleTransactions = useMemo(() => {
    if (!deferredMerchantSearch) {
      return sortedTransactions;
    }

    return sortedTransactions.filter((transaction) => {
      const merchant = (transaction.merchant ?? transaction.description).toLowerCase();
      return (
        merchant.includes(deferredMerchantSearch) ||
        transaction.description.toLowerCase().includes(deferredMerchantSearch)
      );
    });
  }, [sortedTransactions, deferredMerchantSearch]);

  const columns: Array<{ label: string; field: UpiSortField }> = [
    { label: "Date", field: "date" },
    { label: "Merchant / Description", field: "description" },
    { label: "Amount", field: "amount" },
    { label: "Type", field: "type" },
    { label: "Category", field: "category" }
  ];

  function handleSort(nextField: UpiSortField): void {
    if (sortField === nextField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(nextField);
    setSortDirection(nextField === "date" ? "desc" : "asc");
  }

  return (
    <section className={frameless ? "" : "card p-4"}>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="section-title">UPI Transactions</h2>
          <p className="mt-1 text-xs muted">
            Merchant, amount, flow type, and auto-category in one compact review table. Click any
            header to sort when you need to validate a pattern from the story above.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            className="input-field w-full sm:w-64"
            value={merchantSearch}
            placeholder="Search merchant"
            onChange={(event) => setMerchantSearch(event.target.value)}
          />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {visibleTransactions.length}
            {deferredMerchantSearch ? ` of ${transactions.length}` : ""} rows
          </span>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              {columns.map((column) => (
                <th key={column.field} className="px-2 py-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium transition hover:text-slate-900"
                    onClick={() => handleSort(column.field)}
                  >
                    {column.label}
                    {sortField === column.field ? (
                      <span>{sortDirection === "asc" ? "^" : "v"}</span>
                    ) : (
                      <span className="text-slate-400">&lt;&gt;</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.length > 0 ? (
              visibleTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 align-top">{transaction.date}</td>
                  <td className="px-2 py-2 align-top">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {transaction.merchant ?? transaction.description}
                      </p>
                      {transaction.merchant ? (
                        <p className="mt-1 text-xs text-slate-500">{transaction.description}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-2 py-2 align-top font-medium text-slate-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${typeBadgeClass(
                        transaction.type
                      )}`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {transaction.category}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-sm text-slate-500">
                  No transactions match this merchant search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
