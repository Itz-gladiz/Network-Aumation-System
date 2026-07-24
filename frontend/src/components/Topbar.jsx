import { Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search devices, jobs..."
            className="pl-9 pr-3 py-2 w-72 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <button className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 rounded-full bg-brand-500 text-white text-sm font-semibold flex items-center justify-center">
            {(user?.username || "A")[0].toUpperCase()}
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-slate-800 leading-tight">{user?.username || "Admin"}</p>
            <p className="text-xs text-slate-400 leading-tight capitalize">{(user?.role || "administrator").toLowerCase()}</p>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
