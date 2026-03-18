# PersonalFinanceInsights

Easily extract transactions from your credit card PDF statements, 100% offline and private. Runs completely locally with no cloud upload and turns messy statements into usable dashboards for secure personal finance tracking.

## What It Does

- Parses supported credit card statement PDFs locally in the browser
- Extracts transactions and statement metadata
- Categorizes spending and groups similar merchants
- Shows dashboards, charts, refund tracking, and transaction search
- Exports transaction CSV and printable PDF reports

## Privacy Guarantees

- No backend server
- No API calls
- No analytics or telemetry
- No cookies
- No persistent storage unless the user explicitly performs a browser-level action
- Data resets on page refresh

## Tech Stack

- React + Vite
- TypeScript
- Tailwind CSS
- Chart.js via `react-chartjs-2`
- `pdfjs-dist` for PDF parsing

## Supported Input

- PDF only
- File size up to 10 MB
- Password-protected PDFs supported through a local password prompt

Currently tested statement formats:

- AU Small Finance Bank Credit Card
- ICICI Bank Credit Card
- Axis Bank Credit Card

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Build the production bundle:

```bash
npm run build
```

4. Preview the production bundle:

```bash
npm run preview
```

## Notes

- Parsing accuracy depends on the PDF layout used by each bank
- Unsupported bank layouts may still fail until explicit parser support is added
- Dashboard metadata includes bank name, total bill amount, minimum due, payment due date, and statement period where extraction is possible
- Recurring detection uses merchant plus amount similarity within a small tolerance
- Anomaly highlighting uses a z-score threshold greater than `2.5`
