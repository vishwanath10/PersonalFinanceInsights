import { Pie } from "react-chartjs-2";

type CategoryPieChartProps = {
  dataByCategory: Record<string, number>;
};

export function CategoryPieChart({ dataByCategory }: CategoryPieChartProps): JSX.Element {
  const labels = Object.keys(dataByCategory);
  const values = labels.map((label) => dataByCategory[label]);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">Category Distribution</h2>
      <div className="h-72">
        <Pie
          data={{
            labels,
            datasets: [
              {
                label: "Spend",
                data: values,
                backgroundColor: [
                  "#0f766e",
                  "#0891b2",
                  "#0284c7",
                  "#2563eb",
                  "#7c3aed",
                  "#c2410c",
                  "#16a34a"
                ]
              }
            ]
          }}
          options={{ maintainAspectRatio: false }}
        />
      </div>
    </section>
  );
}
