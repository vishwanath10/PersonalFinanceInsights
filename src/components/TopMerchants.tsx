import { UI_STRINGS } from "../constants/strings";

type TopMerchantsProps = {
  merchants: Array<{ merchant: string; amount: number }>;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

export function TopMerchants({ merchants }: TopMerchantsProps): JSX.Element {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">{UI_STRINGS.topMerchants}</h2>
      <ol className="space-y-2 text-sm">
        {merchants.length === 0 ? (
          <li className="text-slate-500">No merchant data.</li>
        ) : (
          merchants.map((merchant) => (
            <li key={merchant.merchant} className="flex justify-between gap-2">
              <span className="truncate">{merchant.merchant}</span>
              <span className="font-medium">{formatCurrency(merchant.amount)}</span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
