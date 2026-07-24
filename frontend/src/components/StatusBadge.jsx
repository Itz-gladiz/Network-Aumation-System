const STYLES = {
  ONLINE: "bg-emerald-50 text-emerald-700",
  SUCCESS: "bg-emerald-50 text-emerald-700",
  Success: "bg-emerald-50 text-emerald-700",
  OFFLINE: "bg-rose-50 text-rose-700",
  FAILED: "bg-rose-50 text-rose-700",
  Failed: "bg-rose-50 text-rose-700",
  PENDING: "bg-amber-50 text-amber-700",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
