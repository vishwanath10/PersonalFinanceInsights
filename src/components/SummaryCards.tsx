import { UI_STRINGS } from "../constants/strings";

type SummaryCardsProps = {
  totalSpending: number;
  largestTransaction: number;
  averageTransaction: number;
  recurringCount: number;
  monthlyGrowthRate: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

export function SummaryCards({
  totalSpending,
  largestTransaction,
  averageTransaction,
  recurringCount,
  monthlyGrowthRate
}: SummaryCardsProps): JSX.Element {
  const cards = [
    { label: UI_STRINGS.totalSpend, value: formatCurrency(totalSpending), tone: "card-tint" },
    { label: UI_STRINGS.largestTxn, value: formatCurrency(largestTransaction), tone: "card-subtle" },
    { label: UI_STRINGS.avgTxn, value: formatCurrency(averageTransaction), tone: "card-indigo" },
    { label: UI_STRINGS.recurringCount, value: String(recurringCount), tone: "card-mint" },
    { label: "Monthly Growth %", value: `${monthlyGrowthRate.toFixed(1)}%`, tone: "card-subtle" }
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <article key={card.label} className={`card ${card.tone} card-hover p-4`}>
          <p className="text-xs muted">{card.label}</p>
          <p className="mt-1 text-lg font-semibold">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
