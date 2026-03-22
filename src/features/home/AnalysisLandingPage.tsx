import { useId } from "react";
import { UI_STRINGS } from "../../constants/strings";

type AnalysisLandingPageProps = {
  onSelect: (mode: "credit-card" | "upi") => void;
};

export function AnalysisLandingPage({ onSelect }: AnalysisLandingPageProps): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 md:gap-8">
      <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(11,132,216,0.14),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] p-6 shadow-sm dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,_rgba(11,132,216,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.94))] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800 shadow-sm dark:border-sky-900/60 dark:bg-slate-900/70 dark:text-sky-200">
              Privacy First
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              {UI_STRINGS.privacyMode}. Statements are parsed locally in your browser and are never
              uploaded to a server.
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">
              Financial Statement Analysis
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              Choose the analysis workflow that matches your statement.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Start with either credit card statements or UPI exports. Each path has its own parser,
              dashboard, and insight layer tuned to the way that statement is structured.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                Credit card PDFs
              </span>
              <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                UPI PDF and HTML exports
              </span>
              <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                Local processing only
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Trusted by design
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Two workflows, one local-first experience
                </h2>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
                No server upload
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <WorkflowPreviewCard
                mode="credit-card"
                badgeClass="bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                title="Credit Card"
                summary="Merchant trends, refunds, and category rules"
              />
              <WorkflowPreviewCard
                mode="upi"
                badgeClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                title="UPI"
                summary="Credits, transfers, and behavioral patterns"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="card card-hover flex flex-col justify-between p-6">
          <div>
            <WorkflowModeVisual mode="credit-card" />
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
              Credit Card Analysis
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Statements, refunds, spending trends, and merchant behavior.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use the existing credit-card workflow for PDF statements, category rules, anomaly
              review, and transaction exploration.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              PDF statements and category rules
            </p>
            <button type="button" className="btn-primary" onClick={() => onSelect("credit-card")}>
              Open Credit Card Analysis
            </button>
          </div>
        </article>

        <article className="card card-hover flex flex-col justify-between p-6">
          <div>
            <WorkflowModeVisual mode="upi" />
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              UPI Statement Analysis
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              PhonePe and Google Pay flows with credits, merchant spend, and transfer insights.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Upload PDF or HTML exports to see total spend, credits, net flow, monthly trend,
              category mix, and a searchable UPI ledger.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              PDF and HTML support
            </p>
            <button type="button" className="btn-primary" onClick={() => onSelect("upi")}>
              Open UPI Analysis
            </button>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            How It Works
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            From statement file to readable insights in three steps
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              {
                step: "1. Choose a workflow",
                body: "Pick credit card for PDF statements or UPI for PhonePe and Google Pay exports."
              },
              {
                step: "2. Parse locally",
                body: "The app extracts dates, amounts, merchants, and categories directly in your browser."
              },
              {
                step: "3. Review the story",
                body: "Use guided insights, charts, and filters to understand what needs attention."
              }
            ].map((item) => (
              <article
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.step}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </article>

        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Why Regular Analysis Matters
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Small review habits create better spending control
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Awareness",
                body: "See which merchants and categories quietly absorb the most money month after month."
              },
              {
                title: "Control",
                body: "Spot weekend, mid-month, or transfer-heavy behavior before it becomes a pattern."
              },
              {
                title: "Optimization",
                body: "Use recurring trends to tighten budgets, adjust limits, or change payment habits."
              },
              {
                title: "Validation",
                body: "Keep refunds, credits, and unusual transactions easy to verify when something looks off."
              }
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

type WorkflowPreviewCardProps = {
  mode: "credit-card" | "upi";
  badgeClass: string;
  title: string;
  summary: string;
};

function WorkflowPreviewCard({
  mode,
  badgeClass,
  title,
  summary
}: WorkflowPreviewCardProps): JSX.Element {
  const illustrationSurfaceClass =
    mode === "credit-card"
      ? "border-sky-100 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(239,246,255,0.9))] dark:border-slate-700 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.72),_rgba(12,74,110,0.18))]"
      : "border-emerald-100 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(236,253,245,0.92))] dark:border-slate-700 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.72),_rgba(6,95,70,0.18))]";

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/65">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          {title}
        </span>
        <div
          className={`h-2.5 w-2.5 rounded-full ${mode === "credit-card" ? "bg-sky-500" : "bg-emerald-500"}`}
        />
      </div>
      <div className={`mt-4 overflow-hidden rounded-2xl border p-3 shadow-sm ${illustrationSurfaceClass}`}>
        <ModeIllustration mode={mode} compact />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{summary}</p>
    </article>
  );
}

type WorkflowModeVisualProps = {
  mode: "credit-card" | "upi";
};

function WorkflowModeVisual({ mode }: WorkflowModeVisualProps): JSX.Element {
  const surfaceClass =
    mode === "credit-card"
      ? "from-white via-slate-50 to-sky-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20"
      : "from-white via-slate-50 to-emerald-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20";

  return (
    <div
      className={`mb-5 overflow-hidden rounded-[22px] border border-slate-200 bg-gradient-to-br p-4 shadow-sm dark:border-slate-700 ${surfaceClass}`}
    >
      <ModeIllustration mode={mode} />
    </div>
  );
}

type ModeIllustrationProps = {
  mode: "credit-card" | "upi";
  compact?: boolean;
};

function ModeIllustration({ mode, compact = false }: ModeIllustrationProps): JSX.Element {
  return mode === "credit-card" ? (
    <CreditCardIllustration compact={compact} />
  ) : (
    <UpiIllustration compact={compact} />
  );
}

type IllustrationProps = {
  compact?: boolean;
};

function CreditCardIllustration({ compact = false }: IllustrationProps): JSX.Element {
  const gradientSeed = useId().replace(/:/g, "");
  const canvasGlowId = `${gradientSeed}-credit-canvas-glow`;
  const cardSurfaceId = `${gradientSeed}-credit-card-surface`;
  const cardShineId = `${gradientSeed}-credit-card-shine`;
  const panelSurfaceId = `${gradientSeed}-credit-panel-surface`;
  const chartFillId = `${gradientSeed}-credit-chart-fill`;
  const panelShadowId = `${gradientSeed}-credit-panel-shadow`;
  const cardShadowId = `${gradientSeed}-credit-card-shadow`;
  const height = compact ? 138 : 190;

  return (
    <svg
      viewBox={`0 0 320 ${height}`}
      className="h-auto w-full"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id={canvasGlowId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform={`translate(246 ${compact ? 38 : 50}) rotate(126) scale(${compact ? 96 : 118} ${compact ? 112 : 136})`}
        >
          <stop stopColor="#dbeafe" stopOpacity="0.95" />
          <stop offset="0.62" stopColor="#e0f2fe" stopOpacity="0.36" />
          <stop offset="1" stopColor="#f8fafc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={cardSurfaceId} x1="46" y1="38" x2="238" y2={compact ? 122 : 168}>
          <stop stopColor="#fdfefe" />
          <stop offset="0.58" stopColor="#edf6ff" />
          <stop offset="1" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id={cardShineId} x1="68" y1="30" x2="194" y2={compact ? 112 : 150}>
          <stop stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={panelSurfaceId} x1="160" y1="26" x2="286" y2={compact ? 128 : 180}>
          <stop stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#f8fafc" stopOpacity="0.84" />
        </linearGradient>
        <linearGradient id={chartFillId} x1="170" y1={compact ? 102 : 138} x2="256" y2={compact ? 60 : 82}>
          <stop stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <filter
          id={panelShadowId}
          x="120"
          y="8"
          width="194"
          height={compact ? 144 : 196}
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
        <filter
          id={cardShadowId}
          x="10"
          y="14"
          width="242"
          height={compact ? 166 : 216}
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#0f172a" floodOpacity="0.16" />
        </filter>
      </defs>

      <rect x="10" y="10" width="300" height={height - 20} rx="34" fill="#f8fafc" />
      <rect x="10" y="10" width="300" height={height - 20} rx="34" fill={`url(#${canvasGlowId})`} />
      <circle cx="74" cy={height - 28} r={compact ? 22 : 28} fill="#ffffff" fillOpacity="0.78" />

      <g filter={`url(#${panelShadowId})`}>
        <rect x="168" y={compact ? 28 : 34} width="118" height={compact ? 80 : 100} rx="28" fill={`url(#${panelSurfaceId})`} />
        <rect
          x="168"
          y={compact ? 28 : 34}
          width="118"
          height={compact ? 80 : 100}
          rx="28"
          stroke="#ffffff"
          strokeOpacity="0.7"
        />
        <rect x="188" y={compact ? 46 : 52} width="56" height="8" rx="4" fill="#0f172a" fillOpacity="0.08" />
        <rect x="188" y={compact ? 62 : 70} width="36" height="6" rx="3" fill="#0f172a" fillOpacity="0.06" />
        <path
          d={`M186 ${compact ? 102 : 136}L206 ${compact ? 84 : 110}L224 ${compact ? 90 : 118}L244 ${compact ? 70 : 84}L268 ${compact ? 78 : 96}`}
          stroke={`url(#${chartFillId})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[
          { x: 206, y: compact ? 84 : 110 },
          { x: 244, y: compact ? 70 : 84 },
          { x: 268, y: compact ? 78 : 96 }
        ].map((point) => (
          <g key={`${point.x}-${point.y}`}>
            <circle cx={point.x} cy={point.y} r="6.5" fill="#ffffff" />
            <circle cx={point.x} cy={point.y} r="3.5" fill="#2563eb" />
          </g>
        ))}
      </g>

      <g filter={`url(#${cardShadowId})`}>
        <g transform={`translate(${compact ? 40 : 46} ${compact ? 36 : 44}) rotate(-10 ${compact ? 82 : 88} ${compact ? 48 : 56})`}>
          <rect width={compact ? 170 : 182} height={compact ? 98 : 112} rx="30" fill={`url(#${cardSurfaceId})`} />
          <rect
            width={compact ? 170 : 182}
            height={compact ? 98 : 112}
            rx="30"
            stroke="#ffffff"
            strokeOpacity="0.88"
          />
          <path
            d={`M0 ${compact ? 62 : 72}C42 ${compact ? 40 : 46}, 120 ${compact ? 94 : 104}, ${compact ? 170 : 182} ${compact ? 78 : 88}V${compact ? 98 : 112}H0Z`}
            fill="#dbeafe"
            fillOpacity="0.72"
          />
          <ellipse
            cx={compact ? 60 : 68}
            cy={compact ? 30 : 34}
            rx={compact ? 64 : 74}
            ry={compact ? 34 : 40}
            fill={`url(#${cardShineId})`}
          />
          <rect x={compact ? 20 : 22} y={compact ? 22 : 26} width="30" height="22" rx="8" fill="#f8fafc" stroke="#bfdbfe" />
          <rect
            x={compact ? 22 : 24}
            y={compact ? 58 : 68}
            width={compact ? 74 : 80}
            height="7"
            rx="3.5"
            fill="#0f172a"
            fillOpacity="0.12"
          />
          <rect
            x={compact ? 22 : 24}
            y={compact ? 72 : 84}
            width={compact ? 52 : 58}
            height="6"
            rx="3"
            fill="#0f172a"
            fillOpacity="0.08"
          />
          <rect
            x={compact ? 116 : 126}
            y={compact ? 26 : 30}
            width={compact ? 34 : 38}
            height="9"
            rx="4.5"
            fill="#ffffff"
            fillOpacity="0.88"
          />
          <circle cx={compact ? 138 : 150} cy={compact ? 70 : 80} r="13" fill="#93c5fd" fillOpacity="0.28" />
          <circle cx={compact ? 152 : 164} cy={compact ? 70 : 80} r="13" fill="#60a5fa" fillOpacity="0.38" />
        </g>
      </g>
    </svg>
  );
}

function UpiIllustration({ compact = false }: IllustrationProps): JSX.Element {
  const gradientSeed = useId().replace(/:/g, "");
  const canvasGlowId = `${gradientSeed}-upi-canvas-glow`;
  const phoneShellId = `${gradientSeed}-upi-phone-shell`;
  const phoneSurfaceId = `${gradientSeed}-upi-phone-surface`;
  const panelSurfaceId = `${gradientSeed}-upi-panel-surface`;
  const phoneShadowId = `${gradientSeed}-upi-phone-shadow`;
  const panelShadowId = `${gradientSeed}-upi-panel-shadow`;
  const height = compact ? 138 : 190;

  return (
    <svg
      viewBox={`0 0 320 ${height}`}
      className="h-auto w-full"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id={canvasGlowId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform={`translate(248 ${compact ? 40 : 50}) rotate(132) scale(${compact ? 102 : 124} ${compact ? 118 : 144})`}
        >
          <stop stopColor="#d1fae5" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#ecfdf5" stopOpacity="0.34" />
          <stop offset="1" stopColor="#f8fafc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={phoneShellId} x1="58" y1="24" x2="176" y2={height}>
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#e5e7eb" />
        </linearGradient>
        <linearGradient id={phoneSurfaceId} x1="64" y1="34" x2="156" y2={height}>
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ecfdf5" />
        </linearGradient>
        <linearGradient id={panelSurfaceId} x1="186" y1="26" x2="288" y2={height}>
          <stop stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#f0fdf4" stopOpacity="0.86" />
        </linearGradient>
        <filter
          id={phoneShadowId}
          x="20"
          y="6"
          width="194"
          height={compact ? 170 : 216}
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow dx="0" dy="22" stdDeviation="20" floodColor="#0f172a" floodOpacity="0.16" />
        </filter>
        <filter
          id={panelShadowId}
          x="156"
          y="18"
          width="150"
          height={compact ? 150 : 196}
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect x="10" y="10" width="300" height={height - 20} rx="34" fill="#f8fafc" />
      <rect x="10" y="10" width="300" height={height - 20} rx="34" fill={`url(#${canvasGlowId})`} />
      <circle cx={compact ? 274 : 282} cy={height - 34} r={compact ? 20 : 26} fill="#ffffff" fillOpacity="0.78" />

      <g filter={`url(#${panelShadowId})`}>
        <rect x="188" y={compact ? 34 : 40} width="98" height={compact ? 82 : 102} rx="28" fill={`url(#${panelSurfaceId})`} />
        <rect
          x="188"
          y={compact ? 34 : 40}
          width="98"
          height={compact ? 82 : 102}
          rx="28"
          stroke="#ffffff"
          strokeOpacity="0.72"
        />
        <rect x="208" y={compact ? 52 : 58} width="42" height="8" rx="4" fill="#0f172a" fillOpacity="0.08" />
        <rect x="208" y={compact ? 70 : 78} width="26" height={compact ? 34 : 42} rx="13" fill="#ef4444" fillOpacity="0.76" />
        <rect x="244" y={compact ? 60 : 62} width="26" height={compact ? 44 : 58} rx="13" fill="#22c55e" fillOpacity="0.8" />
        <path d={`M206 ${compact ? 116 : 136}H270`} stroke="#bbf7d0" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g filter={`url(#${phoneShadowId})`}>
        <rect x="52" y={compact ? 24 : 28} width={compact ? 118 : 126} height={compact ? 100 : 124} rx="34" fill={`url(#${phoneShellId})`} />
        <rect
          x="56"
          y={compact ? 28 : 32}
          width={compact ? 110 : 118}
          height={compact ? 92 : 116}
          rx="30"
          fill={`url(#${phoneSurfaceId})`}
          stroke="#ffffff"
          strokeOpacity="0.84"
        />
        <rect x="92" y={compact ? 36 : 40} width="48" height="6" rx="3" fill="#cbd5e1" />
        <rect x="72" y={compact ? 54 : 60} width={compact ? 86 : 94} height={compact ? 20 : 24} rx="12" fill="#ffffff" fillOpacity="0.94" />
        <circle cx={compact ? 86 : 92} cy={compact ? 64 : 72} r="5" fill="#22c55e" fillOpacity="0.78" />
        <rect x="96" y={compact ? 60 : 68} width={compact ? 50 : 56} height="8" rx="4" fill="#0f172a" fillOpacity="0.12" />
        <rect x="74" y={compact ? 86 : 96} width={compact ? 82 : 90} height="12" rx="6" fill="#ffffff" fillOpacity="0.8" />
        <circle cx={compact ? 84 : 90} cy={compact ? 92 : 102} r="4.5" fill="#ef4444" fillOpacity="0.72" />
        <rect x="96" y={compact ? 88 : 98} width={compact ? 44 : 50} height="6" rx="3" fill="#0f172a" fillOpacity="0.08" />
        <rect x="74" y={compact ? 106 : 120} width={compact ? 82 : 90} height="12" rx="6" fill="#ffffff" fillOpacity="0.8" />
        <circle cx={compact ? 84 : 90} cy={compact ? 112 : 126} r="4.5" fill="#22c55e" fillOpacity="0.76" />
        <rect x="96" y={compact ? 108 : 122} width={compact ? 56 : 60} height="6" rx="3" fill="#0f172a" fillOpacity="0.08" />
      </g>

      <g transform={`translate(${compact ? 154 : 164} ${compact ? 88 : 102})`}>
        <circle r={compact ? 18 : 22} fill="#ffffff" fillOpacity="0.94" />
        <path d="M-6 0H6" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M2 -4L6 0L2 4" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
