import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function DonutChart({ online, offline }) {
  const total = online + offline;
  const pct = total ? Math.round((online / total) * 100) : 0;
  const data = [
    { name: "Online", value: online, color: "#16A34A" },
    { name: "Offline", value: offline, color: "#DC2626" },
  ];

  return (
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={62} outerRadius={85} paddingAngle={3} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-slate-900">{pct}%</span>
        <span className="text-xs text-slate-400">Online</span>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}
