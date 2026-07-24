import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Topbar from "../components/Topbar";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { logsApi } from "../api/logs";
import { mockLogs } from "../mock/data";

export default function Logs() {
  const [logs, setLogs] = useState(mockLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    logsApi.list().then(({ data }) => setLogs(data.results ?? data)).catch(() => {});
  }, []);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.target.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "ALL" || l.action === actionFilter;
    const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });

  async function handleExport() {
    try {
      const { data } = await logsApi.export({ search, action: actionFilter, status: statusFilter });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activity-logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export will be available once the backend is connected.");
    }
  }

  const columns = [
    { key: "timestamp", header: "Time", render: (l) => new Date(l.timestamp).toLocaleString() },
    { key: "user", header: "User" },
    { key: "action", header: "Action" },
    { key: "target", header: "Target", render: (l) => <span className="font-medium">{l.target}</span> },
    { key: "status", header: "Status", render: (l) => <StatusBadge status={l.status} /> },
    { key: "details", header: "Details" },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Logs" subtitle={`Showing ${filtered.length} of ${logs.length} entries`} />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <input className="input w-56" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input w-40" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="ALL">All Actions</option>
              <option value="Backup">Backup</option>
              <option value="Deployment">Deployment</option>
              <option value="Password Change">Password Change</option>
              <option value="Login">Login</option>
            </select>
            <select className="input w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <button onClick={handleExport} className="btn-secondary">
            <Download size={16} /> Export
          </button>
        </div>

        <DataTable columns={columns} rows={filtered} page={page} pageCount={Math.max(1, Math.ceil(filtered.length / 10))} onPageChange={setPage} />
      </main>
    </div>
  );
}
