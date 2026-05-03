# PersonalFinanceInsights

PersonalFinanceInsights is a privacy-first statement analysis web app that runs entirely in the browser. It now supports two distinct workflows from a shared landing page:

- Credit Card Statement Analysis
- UPI Statement Analysis

The app parses supported files locally on your device, normalizes transactions, categorizes spend, and turns raw statements into dashboards, narrative insights, transaction explorers, and local "Ask Your Statement" answers.

## Product Overview

### Landing Experience

- Choose between Credit Card Analysis and UPI Analysis from a dedicated landing page
- See privacy-first messaging before upload
- Review how the product works, why regular analysis matters, and the open-source repository link
- Explore product visuals and workflow summaries before loading data

### Credit Card Analysis

- Upload supported credit card PDF statements
- Load realistic mock data without using a real statement
- Handle password-protected PDFs through an in-session password prompt
- Auto-categorize transactions with editable category rules
- Persist credit-card category-rule overrides locally in the browser
- Review summary cards, statement details, grouped merchants, key insights, and a 6-chart Spend Story
- Use Transaction Explorer with filters, sorting, search, and category edits at transaction level
- Ask natural-language style questions locally through "Ask Your Statement"
- Export visible transactions to CSV
- Export the current credit-card dashboard view to a printable PDF report

### UPI Analysis

- Upload PhonePe or Google Pay statement exports
- Accept PDF and HTML inputs
- Load realistic sample data instantly to explore the full experience without uploading a file
- Handle password-protected PDFs through an in-session password prompt
- Use provider-aware parsing with generic UPI fallbacks
- View a narrative-driven analytics experience instead of a traditional dashboard-first layout
- Review summary metrics, chart-led story sections, privacy guidance, and usage guidance
- Use Transaction Explorer with date, amount, category, type, merchant/description search, and sortable columns
- Ask generic questions against the processed UPI dataset through "Ask Your Statement"
- Review categories in read-only mode using a UPI taxonomy aligned with the credit-card category model

## Core Capabilities

| Capability | Credit Card | UPI |
| --- | --- | --- |
| Entry from shared landing page | Yes | Yes |
| Demo/sample data mode | Yes | Yes |
| Password-protected PDF support | Yes | Yes |
| Input formats | PDF | PDF, HTML |
| Category rules | Editable and locally persisted | Read-only |
| Transaction explorer | Yes | Yes |
| Local "Ask Your Statement" | Yes | Yes |
| CSV export | Yes | Not currently implemented |
| Printable PDF report | Yes | Not currently implemented |

## Privacy Model

This project is designed to be privacy-first, but the README should be precise about what that means:

- No backend server is required for statement parsing or analysis
- No statement file is uploaded to a remote server
- No cloud AI or external analysis service is used
- No analytics or telemetry is built into the app
- Statement contents and PDF passwords are used only inside the current browser session
- Credit-card category-rule overrides are stored locally in browser storage
- Theme preference is stored locally in browser storage
- Sample/demo datasets are bundled with the app and do not come from a remote API

In short: statement data stays on the device, while a small amount of local UI/config state can persist in the browser.

## Supported Inputs And Compatibility

### Credit Card Statements

- File type: PDF
- Maximum file size: 10 MB
- Password-protected PDFs: supported

Tested credit-card statement formats:

- AU Small Finance Bank Credit Card
- ICICI Bank Credit Card
- Axis Bank Credit Card

Compatibility notes:

- Other bank PDFs may still work, but they are not yet regression-tested
- Parsing quality depends on the bank's PDF layout and metadata structure

### UPI Statements

- File types: PDF, HTML
- Maximum file size: 10 MB
- Password-protected PDFs: supported
- Supported providers in UI: PhonePe, Google Pay

Compatibility notes:

- Provider selection guides parser templates before generic UPI fallbacks are used
- PhonePe has been the primary real-world validation path during development
- Google Pay support is implemented, but broader validation with more real exports is still useful

## What Users Can Learn From The App

### Credit Card Mode

- Total spend, largest transaction, average transaction, and recurring count
- Monthly debit and credit movement
- Category mix and top spending areas
- Merchant concentration and grouped merchant spend
- Potential anomalies
- Refund-matching patterns
- Statement metadata such as bank name, due date, and statement period where available

### UPI Mode

- Total spend, credits, net flow, and monthly average spend
- How spending evolved over time
- Where money goes by category
- Which merchants dominate spend
- Weekly behavior patterns
- Transaction size distribution
- Cumulative spend momentum
- Data-backed narrative insights generated from processed transactions

## Local Querying

Both analysis modes include "Ask Your Statement".

- Runs locally in the browser
- Uses processed transaction data, not raw OCR-style text
- Answers questions about merchants, categories, months, credits, refunds, and spending patterns
- Reflects the current filtered dataset in the active module

## Tech Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Chart.js via `react-chartjs-2`
- `pdfjs-dist` for PDF parsing
- `papaparse` and `xlsx` are included in the project dependencies for file/data handling utilities

## Project Structure

```text
src/
  RootApp.tsx                  # landing page and route shell
  App.tsx                      # credit-card analysis flow
  features/home/               # landing page
  features/upi/                # UPI parsing, analytics, story UI, explorer
  components/                  # shared and credit-card-focused UI
  parsing/                     # credit-card parsing pipeline
  analytics/                   # credit-card analytics
  chat/                        # local query parsing and answering
  utils/                       # exports, date helpers, category-rule persistence
```

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

4. Preview the production build:

```bash
npm run preview
```

## Deployment

- Static production builds are now configured to work from a subpath-friendly host such as GitHub Pages
- Automatic deployment can run from GitHub Actions after merges to `main`
- Enable GitHub Pages in the repository settings and choose `GitHub Actions` as the source
- The deployment workflow publishes the contents of `dist/`

## Current Limitations

- Credit-card parsing is still PDF-only
- Unsupported bank formats may fail until explicit parser support is added
- UPI provider coverage is currently focused on PhonePe and Google Pay
- UPI export features are not yet implemented like the credit-card CSV/PDF export flow
- Parsing accuracy always depends on how structured the source statement is

## Open Source

The project is open source and the landing page links directly to the repository so users can inspect the implementation, parser logic, and UI architecture:

- Repository: `https://github.com/vishwanath10/PersonalFinanceInsights`
