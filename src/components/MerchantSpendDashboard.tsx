import { useMemo, useState } from "react";
import { groupMerchants } from "../analytics/merchantGrouping";
import type { Transaction } from "../types/transaction";

type MerchantSpendDashboardProps = {
  transactions: Transaction[];
};

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

export function MerchantSpendDashboard({
  transactions
}: MerchantSpendDashboardProps): JSX.Element {
  const [search, setSearch] = useState("");
  const [openMerchantId, setOpenMerchantId] = useState<string | null>(null);

  const groupedMerchants = useMemo(() => groupMerchants(transactions), [transactions]);
  const totalSpend = useMemo(
    () => groupedMerchants.reduce((sum, group) => sum + group.totalSpent, 0),
    [groupedMerchants]
  );

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return groupedMerchants;
    }
    return groupedMerchants.filter((group) =>
      group.merchant.toLowerCase().includes(term)
    );
  }, [groupedMerchants, search]);

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Merchant Spend Dashboard</h2>
          <p className="text-xs muted">
            Similar merchant names are grouped together for a cleaner spend view.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs muted">Total grouped spend</p>
          <p className="text-sm font-semibold">{formatCurrency(totalSpend)}</p>
        </div>
      </div>

      <div className="mb-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search merchant group..."
          className="input-field w-full"
        />
      </div>

      {visibleGroups.length === 0 ? (
        <p className="text-sm text-slate-500">No merchant groups found.</p>
      ) : (
        <ul className="space-y-2">
          {visibleGroups.map((group) => {
            const isOpen = openMerchantId === group.id;
            const share = totalSpend > 0 ? (group.totalSpent / totalSpend) * 100 : 0;

            return (
              <li key={group.id} className="card-subtle rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    setOpenMerchantId((prev) => (prev === group.id ? null : group.id))
                  }
                  className="w-full px-3 py-2 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{group.merchant}</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(group.totalSpent)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{group.transactionCount} transaction(s)</span>
                    <span>{share.toFixed(1)}% of spend</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-slate-800"
                      style={{ width: `${Math.max(share, 2)}%` }}
                    />
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-t border-slate-200 px-3 py-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Transaction breakup
                    </p>
                    <div className="max-h-56 overflow-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="px-1 py-1">Date</th>
                            <th className="px-1 py-1">Description</th>
                            <th className="px-1 py-1 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.transactions.map((txn) => (
                            <tr key={txn.id} className="border-b border-slate-100">
                              <td className="px-1 py-1">{formatDate(txn.date)}</td>
                              <td className="px-1 py-1">{txn.description}</td>
                              <td className="px-1 py-1 text-right font-medium">
                                {formatCurrency(txn.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
