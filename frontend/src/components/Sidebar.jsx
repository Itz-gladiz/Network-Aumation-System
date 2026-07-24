import { NavLink } from "react-router-dom";
import logo1 from "../assets/logo1.png";
import {
  LayoutDashboard,
  Router,
  Archive,
  UploadCloud,
  FileCog,
  ScrollText,
  Users,
  Settings,
  Network,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_SECTIONS = [
  {
    label: "Operations",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/devices", label: "Devices", icon: Router },
      { to: "/backups", label: "Backups", icon: Archive },
      { to: "/deployments", label: "Deployments", icon: UploadCloud },
      { to: "/templates", label: "Templates", icon: FileCog },
      { to: "/logs", label: "Logs", icon: ScrollText },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-navy-950 text-slate-300 shrink-0">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5">
  <img src={logo1} alt="SWECOM Logo" className="w-10 h-10 rounded-lg object-contain shrink-0" />
  <div className="flex flex-col items-end w-fit">
    <span className="text-white font-semibold text-lg tracking-tight leading-tight self-start">
      SWECOM
    </span>
    <span className="text-orange-300 text-xs font-medium leading-tight">
      Always
    </span>
  </div>
</div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => !item.roles || item.roles.includes(user?.role));
          if (items.length === 0) return null;
          return (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-500/15 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-500 transition-opacity ${
                            isActive ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <Icon size={18} className={isActive ? "text-brand-500" : ""} />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/5 text-xs text-slate-500">
        Signed in as <span className="text-slate-300 font-medium">{user?.username}</span>
      </div>
    </aside>
  );
}
