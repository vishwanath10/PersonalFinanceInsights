import { Line } from "react-chartjs-2";

type TrendLineChartProps = {
  trendData: Record<string, number>;
};

export function TrendLineChart({ trendData }: TrendLineChartProps): JSX.Element {
  const labels = Object.keys(trendData).sort();
  const values = labels.map((key) => trendData[key]);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">Spend Trend</h2>
      <div className="h-72">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Spend Trend",
                data: values,
                borderColor: "#0284c7",
                backgroundColor: "rgba(2,132,199,0.25)",
                tension: 0.2,
                fill: true
              }
            ]
          }}
          options={{ maintainAspectRatio: false }}
        />
      </div>
    </section>
  );
}
