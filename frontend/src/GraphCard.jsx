import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function GraphCard({ title, labels, data, color }) {

  // Convert timestamps to HH:MM:SS
  const formattedLabels = labels.map((t) => {
    const d = new Date(t);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    const s = d.getSeconds().toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  });

  return (
    <div
      style={{
        width: "300px",
        background: "white",
        borderRadius: "14px",
        padding: "12px",
        marginTop: "12px",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h4
        style={{
          margin: "0 0 8px 0",
          fontSize: "14px",
          fontWeight: "600",
          color: "#333",
        }}
      >
        {title}
      </h4>

      <div style={{ height: "150px" }}>
        <Line
          data={{
            labels: formattedLabels,
            datasets: [
              {
                label: "",
                data: data,
                borderColor: color,
                backgroundColor: color + "33",
                tension: 0.35,
                pointRadius: 0,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: {
                  maxTicksLimit: 8,      // still readable even for long history
                  font: { size: 8 },
                },
                grid: { display: false },
              },
              y: {
                ticks: { font: { size: 9 } },
                grid: { color: "#eee" },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true },
            },
          }}
        />
      </div>
    </div>
  );
}
