# Private Credit Card Statement Analyzer

Client-side React application for statement parsing, categorization, and analytics.
All processing stays in-browser memory only.

## Privacy Guarantees

- No backend server
- No API calls
- No analytics or telemetry
- No cookies
- No persistent storage unless user chooses browser-level actions manually
- Data resets on page refresh
- `Clear All Data` button wipes all in-memory state

## Tech Stack

- React + Vite
- TypeScript
- TailwindCSS
- Chart.js via `react-chartjs-2`
- `pdf.js` (`pdfjs-dist`) for PDF parsing

## Setup (Vite)

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

4. Preview production bundle:

```bash
npm run preview
```

## Project Structure

```text
.
├─ src/
│  ├─ analytics/
│  │  ├─ filtering.ts
│  │  └─ metrics.ts
│  ├─ categorization/
│  │  ├─ categorizer.ts
│  │  └─ defaultRules.ts
│  ├─ components/
│  │  ├─ charts/
│  │  │  ├─ CategoryPieChart.tsx
│  │  │  ├─ MonthlyBarChart.tsx
│  │  │  └─ TrendLineChart.tsx
│  │  ├─ CategoryEditor.tsx
│  │  ├─ FileUpload.tsx
│  │  ├─ FiltersPanel.tsx
│  │  ├─ Header.tsx
│  │  ├─ PrivacyNotice.tsx
│  │  ├─ SummaryCards.tsx
│  │  ├─ TopMerchants.tsx
│  │  └─ TransactionTable.tsx
│  ├─ constants/
│  │  └─ strings.ts
│  ├─ mock/
│  │  └─ mockTransactions.ts
│  ├─ parsing/
│  │  ├─ csvParser.ts
│  │  ├─ normalize.ts
│  │  ├─ parseFile.ts
│  │  ├─ pdfParser.ts
│  │  └─ xlsxParser.ts
│  ├─ types/
│  │  └─ transaction.ts
│  ├─ utils/
│  │  └─ date.ts
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts
```

## Notes

- PDF parsing uses a generic statement-row regex and may need adjustment for specific bank formats.
- Password-protected PDFs are supported via local password prompt and in-memory decrypt/parse.
- Current upload support: PDF only (up to 10 MB).
- Dashboard includes extracted statement fields: bank name, total bill amount, minimum due, payment due date, and statement period.
- If any field cannot be confidently extracted from a bank format, the field remains editable so you can fill it manually.
- Recurring detection logic uses merchant + amount similarity (`+-5%`).
- Anomaly highlighting uses z-score threshold `> 2.5`.
