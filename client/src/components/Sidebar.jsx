// components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import PropTypes from "prop-types";

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user } = useUser();
  const role = user?.publicMetadata?.role || "member";

  const menu = [
    { name: "Home", path: "/home", icon: <Home size={18} /> },
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Wallet", path: "/wallet", icon: <Wallet size={18} /> },
    ...(role === "admin"
      ? [{ name: "Admin Dashboard", path: "/admin-dashboard", icon: <ShieldCheck size={18} /> }]
      : []),
  ];

  return (
    <aside
      className={`fixed bottom-0 left-0 top-14 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-200 md:block ${
        collapsed ? "w-20" : "w-56"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`absolute bottom-3 right-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          collapsed ? "w-8" : "min-w-20"
        }`}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {!collapsed && <span>Collapse</span>}
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="flex h-full flex-col gap-1 p-3 pb-16">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={collapsed ? item.name : undefined}
            className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition ${
              location.pathname === item.path
                ? "bg-blue-100 font-semibold text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            } ${collapsed ? "justify-center" : "gap-3"}`}
          >
            {item.icon}
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};
