import type { SortDirection, SortField, Transaction } from "../types/transaction";

type TransactionTableProps = {
  transactions: Transaction[];
  categories: string[];
  anomalies: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  onCategoryChange: (id: string, category: string) => void;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

export function TransactionTable({
  transactions,
  categories,
  anomalies,
  sortField,
  sortDirection,
  onSortChange,
  onCategoryChange
}: TransactionTableProps): JSX.Element {
  const columns: Array<{ label: string; field: SortField }> = [
    { label: "Date", field: "date" },
    { label: "Merchant", field: "merchant" },
    { label: "Amount", field: "amount" },
    { label: "Type", field: "type" },
    { label: "Category", field: "category" }
  ];

  return (
    <section className="card p-4">
      <h2 className="section-title mb-3">Transactions</h2>
      <div className="overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              {columns.map((column) => (
                <th key={column.label} className="px-2 py-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium hover:text-slate-900"
                    onClick={() => onSortChange(column.field)}
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
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className={`border-b border-slate-100 ${
                  anomalies.has(txn.id) ? "bg-amber-50" : "bg-white"
                }`}
              >
                <td className="px-2 py-2">{txn.date}</td>
                <td className="px-2 py-2">{txn.description}</td>
                <td className="px-2 py-2">{formatCurrency(txn.amount)}</td>
                <td className="px-2 py-2">{txn.type}</td>
                <td className="px-2 py-2">
                  <select
                    value={txn.category}
                    className="input-field py-1"
                    onChange={(event) => onCategoryChange(txn.id, event.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
