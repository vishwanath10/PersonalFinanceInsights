import type { UpiFilters } from "./types";

type UpiFiltersPanelProps = {
  filters: UpiFilters;
  categories: string[];
  onChange: (next: UpiFilters) => void;
  onReset: () => void;
};

export function UpiFiltersPanel({
  filters,
  categories,
  onChange,
  onReset
}: UpiFiltersPanelProps): JSX.Element {
  return (
    <section className="card-mint p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Refine the View</h2>
          <p className="mt-1 text-xs muted">
            These filters update both the story above and the UPI transactions below.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={onReset}>
          Reset Filters
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="text-sm">
          Search
          <input
            type="search"
            className="input-field mt-1 w-full"
            value={filters.search}
            placeholder="Merchant or description"
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </label>

        <label className="text-sm">
          Category
          <select
            className="input-field mt-1 w-full"
            value={filters.category}
            onChange={(event) => onChange({ ...filters, category: event.target.value })}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Type
          <select
            className="input-field mt-1 w-full"
            value={filters.type}
            onChange={(event) =>
              onChange({ ...filters, type: event.target.value as UpiFilters["type"] })
            }
          >
            <option value="all">All Types</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </label>

        <label className="text-sm">
          From
          <input
            type="date"
            className="input-field mt-1 w-full"
            value={filters.startDate}
            onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
          />
        </label>

        <label className="text-sm">
          To
          <input
            type="date"
            className="input-field mt-1 w-full"
            value={filters.endDate}
            onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Min Amount
            <input
              type="number"
              min="0"
              className="input-field mt-1 w-full"
              value={filters.minAmount}
              placeholder="0"
              onChange={(event) => onChange({ ...filters, minAmount: event.target.value })}
            />
          </label>
          <label className="text-sm">
            Max Amount
            <input
              type="number"
              min="0"
              className="input-field mt-1 w-full"
              value={filters.maxAmount}
              placeholder="Any"
              onChange={(event) => onChange({ ...filters, maxAmount: event.target.value })}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
