import { useState } from "react";

type PdfPasswordPromptProps = {
  fileName: string;
  loading: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
};

export function PdfPasswordPrompt({
  fileName,
  loading,
  onSubmit,
  onCancel
}: PdfPasswordPromptProps): JSX.Element {
  const [password, setPassword] = useState("");
  const [revealPassword, setRevealPassword] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        PDF Password Required
      </h2>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
        Enter password to decrypt and parse this file:
        <span className="ml-1 break-all font-semibold">{fileName}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        The password is used only for this parse attempt and is not stored.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type={revealPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter PDF password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="button"
          onMouseDown={() => setRevealPassword(true)}
          onMouseUp={() => setRevealPassword(false)}
          onMouseLeave={() => setRevealPassword(false)}
          onTouchStart={() => setRevealPassword(true)}
          onTouchEnd={() => setRevealPassword(false)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          Hold to View
        </button>
        <button
          type="button"
          onClick={() => onSubmit(password)}
          disabled={loading || password.trim().length === 0}
          className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Parsing..." : "Unlock & Parse"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
