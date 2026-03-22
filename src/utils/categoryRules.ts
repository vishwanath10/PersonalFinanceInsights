function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

export function cloneCategoryRules(
  rules: Record<string, string[]>
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(rules).map(([category, keywords]) => [category, [...keywords]])
  );
}

export function sanitizeCategoryRules(
  rules: Record<string, string[]>,
  defaults: Record<string, string[]>
): Record<string, string[]> {
  return Object.fromEntries(
    Object.keys(defaults).map((category) => {
      const keywords = Array.isArray(rules[category]) ? rules[category] : defaults[category];
      const normalized = [...new Set(keywords.map(normalizeKeyword).filter(Boolean))].sort();
      return [category, normalized];
    })
  );
}

export function loadStoredCategoryRules(
  storageKey: string,
  defaults: Record<string, string[]>
): Record<string, string[]> {
  if (typeof window === "undefined") {
    return cloneCategoryRules(defaults);
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return cloneCategoryRules(defaults);
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return cloneCategoryRules(defaults);
    }

    const mapped = Object.fromEntries(
      Object.entries(parsed).map(([category, keywords]) => [
        category,
        Array.isArray(keywords) ? keywords.filter((keyword): keyword is string => typeof keyword === "string") : []
      ])
    );

    return sanitizeCategoryRules(mapped, defaults);
  } catch {
    return cloneCategoryRules(defaults);
  }
}

export function persistCategoryRules(
  storageKey: string,
  rules: Record<string, string[]>,
  defaults: Record<string, string[]>
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify(sanitizeCategoryRules(rules, defaults))
  );
}

export function areCategoryRulesEqual(
  first: Record<string, string[]>,
  second: Record<string, string[]>
): boolean {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);

  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  return firstKeys.every((key) => {
    const firstKeywords = first[key] ?? [];
    const secondKeywords = second[key] ?? [];
    if (firstKeywords.length !== secondKeywords.length) {
      return false;
    }

    return firstKeywords.every((keyword, index) => keyword === secondKeywords[index]);
  });
}
