// components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, Settings } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const menu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <Home size={18} />,
    },
    {
      name: "Wallet",
      path: "/wallet",
      icon: <Wallet size={18} />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings size={18} />,
    },
  ];

  return (
    <aside className="fixed w-64 bg-white border-r h-screen inset-y-0 left-0 z-50 ">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg text-blue-700">
          My Lbp Wallet
        </h2>
      </div>

      {/* Make The SideBar In front of the gui*/}

      <nav className="p-3 flex flex-col gap-2">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex  items-center gap-3 px-3 py-2 rounded-lg transition ${
              location.pathname === item.path
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}