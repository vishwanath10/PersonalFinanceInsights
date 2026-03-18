export const UI_STRINGS = {
  appTitle: "Credit Card Spend Story Analyzer",
  appDescription:
    "Upload your statement to instantly see where your money goes, which merchants drive your bill, and which transactions need attention.",
  privacyMode: "Your statement stays on your device",
  privacyNotice:
    "Your credit card statement is processed only in this browser on your device. We do not upload, store, or share your statement data.",
  clearAll: "Clear Session Data",
  upload: "Upload Statement",
  loadMockData: "Load Mock Data",
  totalSpend: "Total Spend",
  largestTxn: "Largest Transaction",
  avgTxn: "Avg Transaction",
  recurringCount: "Recurring Transactions",
  topMerchants: "Top 10 Merchants",
  supportedStatementsButton: "Supported Banks",
  supportedStatementsTitle: "Supported credit card statements",
  supportedStatementsDescription:
    "These credit card PDF formats have been tested in this app. Other bank layouts may still be unsupported for now.",
  supportedStatementsFootnote:
    "If your bank is not listed yet, the upload may still work, but that format has not been regression-tested yet."
} as const;

export const SUPPORTED_STATEMENT_BANKS = [
  "AU Small Finance Bank Credit Card",
  "ICICI Bank Credit Card",
  "Axis Bank Credit Card"
] as const;
