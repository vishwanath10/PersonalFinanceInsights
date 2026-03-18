import { Bar } from "react-chartjs-2";

type MonthlyBarChartProps = {
  monthlyData: Record<string, number>;
};

export function MonthlyBarChart({ monthlyData }: MonthlyBarChartProps): JSX.Element {
  const labels = Object.keys(monthlyData).sort();
  const values = labels.map((key) => monthlyData[key]);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">Monthly Spend</h2>
      <div className="h-72">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Monthly Spend",
                data: values,
                backgroundColor: "#0f766e"
              }
            ]
          }}
          options={{ maintainAspectRatio: false }}
        />
      </div>
    </section>
  );
}
