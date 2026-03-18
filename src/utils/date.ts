export function toIsoDate(input: string | Date): string {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      return "";
    }
    return input.toISOString().slice(0, 10);
  }

  const value = input.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(value);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3]);
    const parsed = new Date(year, month - 1, day);
    return toIsoDate(parsed);
  }

  const dash = /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/.exec(value);
  if (dash) {
    const day = Number(dash[1]);
    const month = Number(dash[2]);
    const year = Number(dash[3].length === 2 ? `20${dash[3]}` : dash[3]);
    const parsed = new Date(year, month - 1, day);
    return toIsoDate(parsed);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return toIsoDate(parsed);
  }

  return "";
}

export function getFinancialYearRange(today = new Date()): {
  start: string;
  end: string;
} {
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`
  };
}

export function offsetDate(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}
