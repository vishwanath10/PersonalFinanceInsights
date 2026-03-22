import { useState } from "react";
import { answerQuery } from "../chat/queryExecutor";
import type { Transaction } from "../types/transaction";

type ChatPanelProps = {
  transactions: Transaction[];
  title?: string;
  description?: string;
  placeholder?: string;
  suggestions?: string[];
  initialAnswer?: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

const DEFAULT_SUGGESTIONS = [
  "How much did I spend on Amazon?",
  "Top 5 merchants",
  "How much spent in Feb 2026?",
  "How much did I spend in Groceries?",
  "Credits from IRCTC",
  "How much did I spend on Swiggy?",
  "Top 10 merchants",
  "How much spent in Jan 2026?",
  "How much did I spend in Travel?",
  "Refunds from Amazon"
];

export function ChatPanel({
  transactions,
  title = "Ask Your Statement",
  description = "Uses in-browser rule-based analysis. No cloud calls.",
  placeholder = "Ask a question about spending, merchants, categories, or months",
  suggestions = DEFAULT_SUGGESTIONS,
  initialAnswer = "Ask a question about your statement data. Responses are generated locally from current data."
}: ChatPanelProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string>(initialAnswer);
  const [matched, setMatched] = useState<Transaction[]>([]);

  function runQuestion(question: string): void {
    const result = answerQuery(question, transactions);
    setAnswer(result.answer);
    setMatched(result.matchedTransactions.slice(0, 10));
  }

  return (
    <section className="card p-4">
      <h2 className="section-title">{title}</h2>
      <p className="mt-1 text-xs muted">{description}</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="input-field w-full"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              runQuestion(query);
            }
          }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => runQuestion(query)}
        >
          Ask
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:bg-slate-50"
            onClick={() => {
              setQuery(suggestion);
              runQuestion(suggestion);
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="card-subtle mt-3 p-3 text-sm">
        {answer}
      </div>

      {matched.length > 0 ? (
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Description</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {matched.map((txn) => (
                <tr key={txn.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{txn.date}</td>
                  <td className="px-2 py-2">{txn.description}</td>
                  <td className="px-2 py-2">{formatCurrency(txn.amount)}</td>
                  <td className="px-2 py-2">{txn.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
