import { useEffect, useMemo, useState } from "react";

type CategoryEditorProps = {
  rules: Record<string, string[]>;
  showFloatingTrigger?: boolean;
  forceOpenToken?: number;
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function CategoryEditor({
  rules,
  showFloatingTrigger = true,
  forceOpenToken
}: CategoryEditorProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () =>
      Object.entries(rules)
        .map(([name, keywords]) => ({ name, keywords }))
        .sort((a, b) => b.keywords.length - a.keywords.length),
    [rules]
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

  return (
    <>
      {showFloatingTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-30 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
        >
          Category Rules ({categories.length})
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
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-hidden bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <header className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Category Rules</h2>
                    <p className="text-xs text-slate-500">
                      {categories.length} categories | {totalKeywords} keyword rules
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-auto px-4 py-3">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find category or keyword"
                  className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-offset-2 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <div className="space-y-2 pb-6">
                  {filteredCategories.length === 0 ? (
                    <p className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500">
                      No category rules match your search.
                    </p>
                  ) : null}

                  {filteredCategories.map((category) => (
                    <div key={category.name} className="rounded-md border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{category.name}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {category.keywords.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {category.keywords.length === 0 ? (
                          <span className="text-xs text-slate-500">No keywords</span>
                        ) : (
                          category.keywords.map((keyword) => (
                            <span
                              key={`${category.name}-${keyword}`}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                            >
                              {keyword}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
