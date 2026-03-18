import type { DatePreset, Filters, SortDirection, SortField } from "../types/transaction";

type FiltersPanelProps = {
  filters: Filters;
  onChange: (next: Filters) => void;
};

function DatePresetButton({
  preset,
  activePreset,
  onClick,
  label
}: {
  preset: DatePreset;
  activePreset: DatePreset;
  onClick: (preset: DatePreset) => void;
  label: string;
}): JSX.Element {
  const active = preset === activePreset;
  return (
    <button
      type="button"
      onClick={() => onClick(preset)}
      className={`rounded-md px-3 py-1.5 text-sm ${
        active ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

export function FiltersPanel({ filters, onChange }: FiltersPanelProps): JSX.Element {
  return (
    <section className="card p-4">
      <div className="flex flex-wrap gap-2">
        <DatePresetButton
          preset="last30"
          activePreset={filters.preset}
          onClick={(preset) => onChange({ ...filters, preset })}
          label="Last 30 Days"
        />
        <DatePresetButton
          preset="last3months"
          activePreset={filters.preset}
          onClick={(preset) => onChange({ ...filters, preset })}
          label="Last 3 Months"
        />
        <DatePresetButton
          preset="financialYear"
          activePreset={filters.preset}
          onClick={(preset) => onChange({ ...filters, preset })}
          label="Financial Year"
        />
        <DatePresetButton
          preset="custom"
          activePreset={filters.preset}
          onClick={(preset) => onChange({ ...filters, preset })}
          label="Custom"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          Start Date
          <input
            type="date"
            className="input-field mt-1 w-full"
            value={filters.startDate}
            onChange={(event) =>
              onChange({ ...filters, preset: "custom", startDate: event.target.value })
            }
          />
        </label>
        <label className="text-sm">
          End Date
          <input
            type="date"
            className="input-field mt-1 w-full"
            value={filters.endDate}
            onChange={(event) =>
              onChange({ ...filters, preset: "custom", endDate: event.target.value })
            }
          />
        </label>
        <label className="text-sm">
          Sort By
          <select
            className="input-field mt-1 w-full"
            value={filters.sortField}
            onChange={(event) =>
              onChange({ ...filters, sortField: event.target.value as SortField })
            }
          >
            <option value="amount">Amount</option>
            <option value="date">Date</option>
            <option value="merchant">Merchant</option>
            <option value="type">Type</option>
            <option value="category">Category</option>
          </select>
        </label>
        <label className="text-sm">
          Direction
          <select
            className="input-field mt-1 w-full"
            value={filters.sortDirection}
            onChange={(event) =>
              onChange({ ...filters, sortDirection: event.target.value as SortDirection })
            }
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>
    </section>
  );
}
