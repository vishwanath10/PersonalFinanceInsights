import { UI_STRINGS } from "../constants/strings";

type HeaderProps = {
  onClearAll: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Header({ onClearAll, theme, onToggleTheme }: HeaderProps): JSX.Element {
  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs font-medium text-slate-100">
            {UI_STRINGS.privacyMode}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {UI_STRINGS.appTitle}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-200 sm:text-base">
            {UI_STRINGS.appDescription}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-100">
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1">
              Merchant grouping and breakup
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1">
              Spend story in 6 visuals
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1">
              No upload, no data leak risk
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-md border border-red-300 bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            {UI_STRINGS.clearAll}
          </button>
        </div>
      </div>
    </header>
  );
}
