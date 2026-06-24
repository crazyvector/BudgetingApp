import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  CheckSquare,
  Wallet,
  Repeat
} from "lucide-react";

const iconMap = {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  CheckSquare,
  Repeat
};

const navItems = [
  { path: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { path: "/transactions", label: "Transactions", icon: "ArrowLeftRight" },
  { path: "/recurring", label: "Recurring", icon: "Repeat" },
  { path: "/budgets", label: "Budgets", icon: "PieChart" },
  { path: "/goals", label: "Goals", icon: "Target" },
  { path: "/tasks", label: "Tasks", icon: "CheckSquare" },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-screen fixed left-0 top-0 z-30 glass-card-static rounded-none border-l-0 border-t-0 border-b-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-[64px] border-b border-glass-border">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
          <Wallet size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold text-gradient">FinPilot</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${
                  isActive
                    ? "bg-brand-600/15 text-brand-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-glass-hover"
                }`
              }
            >
              <Icon
                size={18}
                className="transition-transform duration-200 group-hover:scale-110"
              />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-glass-border">
        <div className="px-3 py-2 rounded-xl bg-surface-700/50">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
            FinPilot v1.0
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Personal Finance Manager
          </p>
        </div>
      </div>
    </aside>
  );
}
