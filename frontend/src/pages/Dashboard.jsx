import { useEffect, useState } from "react";
import { Server, Wifi, WifiOff, Archive, UploadCloud, Loader2, AlertTriangle } from "lucide-react";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import DonutChart from "../components/charts/DonutChart";
import TopDevicesBarChart from "../components/charts/TopDevicesBarChart";
import DeploymentTrendChart from "../components/charts/DeploymentTrendChart";
import { dashboardApi } from "../api/dashboard";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    dashboardApi
      .summary()
      .then(({ data }) => setSummary(data))
      .catch(() => setError("Couldn't reach the API. Make sure the Django backend is running."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Dashboard" subtitle="Overview of your network environment" />
        <main className="flex-1 flex items-center justify-center text-slate-400 gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading dashboard…
        </main>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Dashboard" subtitle="Overview of your network environment" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <AlertTriangle size={28} className="mx-auto mb-2" />
            <p className="font-medium text-slate-500">{error || "No data available"}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Dashboard" subtitle="Overview of your network environment" />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard icon={Server} label="Total Devices" value={summary.total_devices} hint="All registered devices" tone="brand" />
          <StatCard
            icon={Wifi}
            label="Online Devices"
            value={summary.online_devices}
            hint={summary.total_devices ? `${Math.round((summary.online_devices / summary.total_devices) * 100)}% online` : "—"}
            tone="ok"
          />
          <StatCard
            icon={WifiOff}
            label="Offline Devices"
            value={summary.offline_devices}
            hint={summary.total_devices ? `${Math.round((summary.offline_devices / summary.total_devices) * 100)}% offline` : "—"}
            tone="warn"
          />
          <StatCard icon={Archive} label="Backups" value={summary.backups_last_7_days} hint="Last 7 days" tone="amber" />
          <StatCard icon={UploadCloud} label="Deployments" value={summary.deployments_last_7_days} hint="Last 7 days" tone="violet" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-2">Devices Status</h3>
            <DonutChart online={summary.online_devices} offline={summary.offline_devices} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
            {summary.recent_activity.length === 0 ? (
              <p className="text-sm text-slate-400">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-4">
                {summary.recent_activity.map((log) => (
                  <li key={log.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-slate-700">
                        {log.action} {log.status === "Success" ? "completed" : "failed"} for{" "}
                        <span className="font-medium">{log.target}</span>
                      </p>
                      <p className="text-xs text-slate-400">{timeAgo(log.timestamp)}</p>
                    </div>
                    <StatusBadge status={log.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-2">Top Devices by Backup (7 days)</h3>
            {summary.top_devices_by_backup.length === 0 ? (
              <p className="text-sm text-slate-400">No backups in the last 7 days.</p>
            ) : (
              <TopDevicesBarChart data={summary.top_devices_by_backup} />
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-2">Deployment Summary</h3>
          {summary.deployment_trend.length === 0 ? (
            <p className="text-sm text-slate-400">No deployments in the last 7 days.</p>
          ) : (
            <DeploymentTrendChart data={summary.deployment_trend} />
          )}
        </div>
      </main>
    </div>
  );
}

function timeAgo(iso) {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  return `${Math.round(diffHr / 24)} day(s) ago`;
}