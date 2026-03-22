import { startTransition, useRef, useState } from "react";
import { CategoryEditor } from "../../components/CategoryEditor";
import { PdfPasswordPrompt } from "../../components/PdfPasswordPrompt";
import { UI_STRINGS } from "../../constants/strings";
import { PdfIncorrectPasswordError, PdfPasswordRequiredError } from "../../parsing/errors";
import type { Transaction } from "../../types/transaction";
import {
  applyUpiCategories,
  upiCategoryRules
} from "./categoryRules";
import { upiMockStatementMetadata, upiMockTransactions } from "./mockData";
import { SupportedUpiAppsDialog } from "./SupportedUpiAppsDialog";
import { UpiDashboard } from "./UpiDashboard";
import { parseUpiStatementFile } from "./parser";
import type { SupportedUpiProvider, UpiStatementMetadata } from "./types";

type UpiAnalysisPageProps = {
  onBack: () => void;
};

const MAX_UPI_STATEMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UNSUPPORTED_UPI_STATEMENT_MESSAGE =
  "This file could not be read as a supported PhonePe or Google Pay statement. Please upload a valid PDF or HTML statement up to 10 MB.";
const UNSUPPORTED_UPI_FILE_TYPE_MESSAGE =
  "Unsupported file type. Please upload a PDF or HTML UPI statement up to 10 MB.";

const EMPTY_METADATA: UpiStatementMetadata = {
  provider: "Unknown",
  sourceAccounts: [],
  fileType: "pdf",
  transactionCount: 0
};
const SUPPORTED_UPI_APPS: SupportedUpiProvider[] = ["PhonePe", "Google Pay"];

function getUserFriendlyUpiParseError(error: unknown): string {
  if (!(error instanceof Error)) {
    return UNSUPPORTED_UPI_STATEMENT_MESSAGE;
  }

  const message = error.message.toLowerCase();

  if (message.includes("unsupported file type")) {
    return UNSUPPORTED_UPI_FILE_TYPE_MESSAGE;
  }

  if (
    message.includes("unable to extract transactions") ||
    message.includes("invalid pdf") ||
    message.includes("parse") ||
    message.includes("statement")
  ) {
    return UNSUPPORTED_UPI_STATEMENT_MESSAGE;
  }

  return UNSUPPORTED_UPI_STATEMENT_MESSAGE;
}

export function UpiAnalysisPage({ onBack }: UpiAnalysisPageProps): JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metadata, setMetadata] = useState<UpiStatementMetadata>(EMPTY_METADATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedApp, setSelectedApp] = useState<SupportedUpiProvider>("PhonePe");
  const [pendingPasswordFile, setPendingPasswordFile] = useState<File | null>(null);
  const [rulesOpenToken, setRulesOpenToken] = useState(0);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const hasData = transactions.length > 0;
  const isSampleMode = metadata.fileType === "sample";

  async function handleFileSelected(file: File): Promise<void> {
    if (file.size > MAX_UPI_STATEMENT_FILE_SIZE_BYTES) {
      setError("File too large. Please upload a UPI statement up to 10 MB.");
      setPendingPasswordFile(null);
      return;
    }

    setLoading(true);
    setError("");
    setSelectedFileName(file.name);
    setPendingPasswordFile(null);

    try {
      const parsed = await parseUpiStatementFile(file, {
        preferredProvider: selectedApp,
        categoryRules: upiCategoryRules
      });
      startTransition(() => {
        setTransactions(parsed.transactions);
        setMetadata(parsed.metadata);
        if (parsed.metadata.provider !== "Unknown") {
          setSelectedApp(parsed.metadata.provider);
        }
      });
    } catch (parseError) {
      if (
        parseError instanceof PdfPasswordRequiredError ||
        parseError instanceof PdfIncorrectPasswordError
      ) {
        setPendingPasswordFile(file);
        setError(parseError.message);
      } else {
        setTransactions([]);
        setMetadata(EMPTY_METADATA);
        setError(getUserFriendlyUpiParseError(parseError));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePdfPasswordSubmit(password: string): Promise<void> {
    if (!pendingPasswordFile) {
      return;
    }

    setLoading(true);
    setError("");
    setSelectedFileName(pendingPasswordFile.name);

    try {
      const parsed = await parseUpiStatementFile(pendingPasswordFile, {
        preferredProvider: selectedApp,
        pdfPassword: password,
        categoryRules: upiCategoryRules
      });
      startTransition(() => {
        setTransactions(parsed.transactions);
        setMetadata(parsed.metadata);
        if (parsed.metadata.provider !== "Unknown") {
          setSelectedApp(parsed.metadata.provider);
        }
      });
      setPendingPasswordFile(null);
    } catch (parseError) {
      if (
        parseError instanceof PdfIncorrectPasswordError ||
        parseError instanceof PdfPasswordRequiredError
      ) {
        setError(parseError.message);
      } else {
        setError(getUserFriendlyUpiParseError(parseError));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLoadSampleData(): void {
    setLoading(false);
    setError("");
    setPendingPasswordFile(null);
    setSelectedFileName("Sample Data");
    startTransition(() => {
      setTransactions(
        applyUpiCategories(
          upiMockTransactions.map((transaction) => ({ ...transaction })),
          upiCategoryRules
        )
      );
      setMetadata({ ...upiMockStatementMetadata, provider: selectedApp });
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back to analysis modes
        </button>
        {hasData ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Parser template: {selectedApp}
            </span>
            <SupportedUpiAppsDialog />
            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={handleLoadSampleData}
            >
              {isSampleMode ? "Reload Sample Data" : "Try with Sample Data"}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={() => uploadRef.current?.click()}
            >
              {isSampleMode ? "Upload Real UPI Statement" : "Upload Another UPI Statement"}
            </button>
          </div>
        ) : null}
        <div className="hidden">
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,.html,.htm,application/pdf,text/html"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleFileSelected(file);
              }
              event.target.value = "";
            }}
          />
        </div>
      </section>

      {!hasData ? (
        <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(240,249,255,0.96))] p-6 shadow-sm dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.95))]">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_340px] xl:items-start">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800 shadow-sm dark:border-sky-900/60 dark:bg-slate-900/70 dark:text-sky-200">
                Privacy First
              </div>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                {UI_STRINGS.privacyMode}. UPI statements are parsed locally in this browser session,
                with no server upload or password storage.
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
                UPI Statement Analysis
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Parse PhonePe and Google Pay statements into a readable spending story.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Upload a PDF or HTML export to turn raw UPI history into a narrative view of spend
                trends, merchant concentration, behavioral patterns, and cash movement.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                  PhonePe and Google Pay
                </span>
                <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                  PDF and HTML support
                </span>
                <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                  Password-protected PDFs
                </span>
              </div>
            </div>

            <UpiEntryVisual />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white/80 p-1 dark:border-slate-700 dark:bg-slate-900/60">
              {SUPPORTED_UPI_APPS.map((app) => {
                const active = app === selectedApp;
                return (
                  <button
                    key={app}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setSelectedApp(app)}
                  >
                    {app}
                  </button>
                );
              })}
            </div>
            <SupportedUpiAppsDialog />
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => setRulesOpenToken((current) => current + 1)}
            >
              <span>Categories</span>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900 dark:bg-sky-900/50 dark:text-sky-100">
                {Object.keys(upiCategoryRules).length}
              </span>
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            The selected app guides provider-specific parsing before generic UPI fallbacks are used.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="card p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">1. Upload</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Accepts `.pdf`, `.html`, and `.htm` statement exports up to 10 MB, including
                encrypted PDFs.
              </p>
            </article>
            <article className="card p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">2. Parse</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Extracts dates, merchants, amounts, direction, and account references using the
                selected app template.
              </p>
            </article>
            <article className="card p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">3. Explore</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Follow the guided story first, then inspect filtered transactions only when needed.
              </p>
            </article>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Upload File
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Analyze your own PhonePe or Google Pay history
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Upload a PDF or HTML statement and run it through the same storytelling,
                categorization, and insight pipeline used throughout the product.
              </p>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/85 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Selected app: {selectedApp}
                </p>
                <p className="mt-1">
                  Use the matching provider for the cleanest parse and metadata detection.
                </p>
                <p className="mt-1">Maximum file size: 10 MB.</p>
              </div>
              <button
                type="button"
                className="btn-primary mt-5"
                disabled={loading}
                onClick={() => uploadRef.current?.click()}
              >
                {loading ? "Parsing statement..." : "Upload File"}
              </button>
            </article>

            <article className="rounded-[24px] border border-emerald-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(236,253,245,0.98))] p-5 shadow-sm dark:border-emerald-900/60 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(20,83,45,0.2))]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Sample Data
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Explore the full experience instantly
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Open a realistic one-year UPI dataset with mixed debits, credits, merchants, and
                categories so you can understand the product before uploading your own file.
              </p>
              <button
                type="button"
                className="btn-primary mt-5"
                disabled={loading}
                onClick={handleLoadSampleData}
              >
                Try with Sample Data
              </button>
            </article>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>Files stay local to this browser session.</span>
            <span>You can switch between sample data and a real upload at any time.</span>
          </div>
        </section>
      ) : null}

      {loading ? (
        <section className="card-indigo p-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Parsing {selectedFileName || "statement"}...
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Reading transactions, classifying activity, and preparing the spending story.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-2 w-1/2 animate-pulse rounded-full bg-sky-500" />
          </div>
        </section>
      ) : null}

      {pendingPasswordFile ? (
        <PdfPasswordPrompt
          fileName={pendingPasswordFile.name}
          loading={loading}
          onSubmit={(password) => {
            void handlePdfPasswordSubmit(password);
          }}
          onCancel={() => {
            setPendingPasswordFile(null);
            setError("");
          }}
        />
      ) : null}

      {error ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </section>
      ) : null}

      {hasData ? (
        <UpiDashboard
          transactions={transactions}
          metadata={metadata}
          categoryRules={upiCategoryRules}
        />
      ) : null}

      {!hasData ? (
        <CategoryEditor
          rules={upiCategoryRules}
          showFloatingTrigger={false}
          forceOpenToken={rulesOpenToken}
        />
      ) : null}
    </main>
  );
}

function UpiEntryVisual(): JSX.Element {
  return (
    <aside className="rounded-[24px] border border-slate-200 bg-white/88 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            What the parser builds
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            A clean UPI story from raw transaction history
          </h2>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          Local only
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/85 p-4 dark:border-slate-700 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
            Statement
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PDF or HTML</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-2 w-[78%] rounded-full bg-sky-500" />
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-2 w-[56%] rounded-full bg-emerald-500" />
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-2 w-[34%] rounded-full bg-amber-400" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Extracted
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Merchant, amount, date, type
            </p>
          </article>
          <article className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Output
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Story, filters, and explorer
            </p>
          </article>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">
          No file upload to any server
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">
          App-specific templates with generic fallbacks
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">
          Same charts and insights for sample data and real statements
        </div>
      </div>
    </aside>
  );
}
