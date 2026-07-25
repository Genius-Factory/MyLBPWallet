// components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, Settings, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";

export default function Sidebar() {
  const location = useLocation();
  const { user } = useUser();
  const role = user?.publicMetadata?.role || "member";
  const [isOpen, setIsOpen] = useState(true);

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: <Home size={18} /> },
    { name: "Wallet", path: "/wallet", icon: <Wallet size={18} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={18} /> },
    ...(role === "admin"
      ? [{ name: "Admin Dashboard", path: "/admin-dashboard", icon: <ShieldCheck size={18} /> }]
      : []),
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-20 z-[60] rounded-full border border-slate-200 bg-white p-2 shadow-md transition hover:bg-gray-100"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 border-r bg-white shadow-lg transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-blue-700">My Lbp Wallet</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 transition hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-3">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                location.pathname === item.path
                  ? "bg-blue-100 font-semibold text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
