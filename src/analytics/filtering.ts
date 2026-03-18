import type { Filters, Transaction } from "../types/transaction";

export function applyFiltersAndSort(
  transactions: Transaction[],
  filters: Filters
): Transaction[] {
  const filtered = transactions.filter((txn) => {
    if (filters.startDate && txn.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && txn.date > filters.endDate) {
      return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    let result = 0;
    if (filters.sortField === "amount") {
      result = a.amount - b.amount;
    } else if (filters.sortField === "date") {
      result = a.date.localeCompare(b.date);
    } else if (filters.sortField === "merchant") {
      result = a.description.localeCompare(b.description);
    } else if (filters.sortField === "type") {
      result = a.type.localeCompare(b.type);
    } else if (filters.sortField === "category") {
      result = a.category.localeCompare(b.category);
    }
    return filters.sortDirection === "asc" ? result : -result;
  });
}
