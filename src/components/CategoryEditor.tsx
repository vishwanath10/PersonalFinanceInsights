import { useEffect, useMemo, useState } from "react";
import {
  areCategoryRulesEqual,
  cloneCategoryRules
} from "../utils/categoryRules";

type CategoryEditorProps = {
  rules: Record<string, string[]>;
  showFloatingTrigger?: boolean;
  forceOpenToken?: number;
  onSave?: (nextRules: Record<string, string[]>) => void;
  onReset?: () => void;
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function CategoryEditor({
  rules,
  showFloatingTrigger = true,
  forceOpenToken,
  onSave,
  onReset
}: CategoryEditorProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draftRules, setDraftRules] = useState<Record<string, string[]>>(() =>
    cloneCategoryRules(rules)
  );
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const editable = Boolean(onSave);

  const categories = useMemo(
    () =>
      Object.entries(draftRules)
        .map(([name, keywords]) => ({ name, keywords }))
        .sort((a, b) => b.keywords.length - a.keywords.length || a.name.localeCompare(b.name)),
    [draftRules]
  );

  const filteredCategories = useMemo(() => {
    const term = normalize(search);
    if (!term) {
      return categories;
    }
    return categories.filter(
      (category) =>
        normalize(category.name).includes(term) ||
        category.keywords.some((keyword) => normalize(keyword).includes(term))
    );
  }, [categories, search]);

  const totalKeywords = useMemo(
    () => categories.reduce((sum, category) => sum + category.keywords.length, 0),
    [categories]
  );

  const hasChanges = useMemo(
    () => !areCategoryRulesEqual(draftRules, rules),
    [draftRules, rules]
  );

  useEffect(() => {
    setDraftRules(cloneCategoryRules(rules));
  }, [rules]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (forceOpenToken === undefined || forceOpenToken <= 0) {
      return;
    }
    setOpen(true);
  }, [forceOpenToken]);

  function handleOpen(): void {
    setDraftRules(cloneCategoryRules(rules));
    setDraftInputs({});
    setSearch("");
    setOpen(true);
  }

  function handleKeywordAdd(categoryName: string): void {
    const nextKeyword = normalize(draftInputs[categoryName] ?? "");
    if (!nextKeyword) {
      return;
    }

    setDraftRules((current) => {
      const currentKeywords = current[categoryName] ?? [];
      if (currentKeywords.includes(nextKeyword)) {
        return current;
      }

      return {
        ...current,
        [categoryName]: [...currentKeywords, nextKeyword].sort()
      };
    });

    setDraftInputs((current) => ({
      ...current,
      [categoryName]: ""
    }));
  }

  function handleKeywordRemove(categoryName: string, keyword: string): void {
    setDraftRules((current) => ({
      ...current,
      [categoryName]: (current[categoryName] ?? []).filter((entry) => entry !== keyword)
    }));
  }

  function handleSave(): void {
    if (!onSave) {
      setOpen(false);
      return;
    }

    onSave(cloneCategoryRules(draftRules));
    setOpen(false);
  }

  return (
    <>
      {showFloatingTrigger ? (
        <button
          type="button"
          onClick={handleOpen}
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
        >
          <span>Category Rules</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white">
            {categories.length}
          </span>
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close category rules drawer"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/35"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-hidden bg-white shadow-2xl dark:bg-slate-950">
            <div className="flex h-full flex-col">
              <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Category Rules
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {categories.length} categories | {totalKeywords} keyword rules
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {editable
                    ? "Edit keyword mappings here to change how transactions are auto-categorized across the full experience."
                    : "Review the keyword mappings currently used for auto-categorization."}
                </p>
              </header>

              <div className="flex-1 overflow-auto px-4 py-3">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find category or keyword"
                  className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-offset-2 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />

                <div className="space-y-3 pb-6">
                  {filteredCategories.length === 0 ? (
                    <p className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No category rules match your search.
                    </p>
                  ) : null}

                  {filteredCategories.map((category) => (
                    <div
                      key={category.name}
                      className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {category.name}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {category.keywords.length}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {category.keywords.length === 0 ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            No keywords
                          </span>
                        ) : (
                          category.keywords.map((keyword) => (
                            <span
                              key={`${category.name}-${keyword}`}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              <span>{keyword}</span>
                              {editable ? (
                                <button
                                  type="button"
                                  onClick={() => handleKeywordRemove(category.name, keyword)}
                                  className="font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                  aria-label={`Remove ${keyword} from ${category.name}`}
                                >
                                  x
                                </button>
                              ) : null}
                            </span>
                          ))
                        )}
                      </div>

                      {editable ? (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={draftInputs[category.name] ?? ""}
                            onChange={(event) =>
                              setDraftInputs((current) => ({
                                ...current,
                                [category.name]: event.target.value
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleKeywordAdd(category.name);
                              }
                            }}
                            placeholder="Add keyword"
                            className="input-field flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleKeywordAdd(category.name)}
                            className="btn-secondary"
                          >
                            Add
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {editable ? (
                <footer className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onReset?.();
                        setDraftInputs({});
                      }}
                      className="btn-secondary"
                    >
                      Reset to Defaults
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </footer>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
