import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SUPPORTED_STATEMENT_BANKS, UI_STRINGS } from "../constants/strings";

export function SupportedStatementsDialog(): JSX.Element {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[80] overflow-y-auto p-4 sm:p-6">
            <button
              type="button"
              aria-label="Close supported banks dialog"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <div className="relative flex min-h-full items-center justify-center py-4 sm:py-8">
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="supported-statements-title"
                className="card relative z-10 w-full max-w-2xl overflow-hidden"
              >
                <header className="border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          id="supported-statements-title"
                          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                        >
                          {UI_STRINGS.supportedStatementsTitle}
                        </h2>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900 dark:bg-sky-900/50 dark:text-sky-100">
                          {SUPPORTED_STATEMENT_BANKS.length} tested
                        </span>
                      </div>
                      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                        {UI_STRINGS.supportedStatementsDescription}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close supported banks dialog"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold leading-none text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      X
                    </button>
                  </div>
                </header>

                <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {SUPPORTED_STATEMENT_BANKS.map((bank) => (
                      <article key={bank} className="card-indigo p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {bank}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              PDF layout tested in this app
                            </p>
                          </div>
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                            Tested
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="card-subtle mt-4 p-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Support coverage note
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {UI_STRINGS.supportedStatementsFootnote}
                    </p>
                  </div>
                </div>

                <footer className="border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </footer>
              </section>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <span>{UI_STRINGS.supportedStatementsButton}</span>
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900 dark:bg-sky-900/50 dark:text-sky-100">
          {SUPPORTED_STATEMENT_BANKS.length}
        </span>
      </button>

      {dialog}
    </>
  );
}
