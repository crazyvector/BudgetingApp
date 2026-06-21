import { useLocation } from "react-router-dom";
import { Wallet, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const pageTitles = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/budgets": "Budgets",
  "/goals": "Savings Goals",
  "/tasks": "Tasks",
};

export default function Header() {
  const location = useLocation();
  const { logout } = useAuth();
  const title = pageTitles[location.pathname] || "FinPilot";

  return (
    <header className="h-[64px] flex items-center justify-between px-4 lg:px-8 border-b border-glass-border glass-card-static rounded-none border-t-0 border-x-0 sticky top-0 z-20">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
          <Wallet size={16} className="text-white" />
        </div>
        <span className="font-bold text-gradient">FinPilot</span>
      </div>

      {/* Page title (desktop) */}
      <h1 className="hidden lg:block text-xl font-semibold text-text-primary">
        {title}
      </h1>

      {/* Right side — date and logout */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-text-muted hidden sm:block">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
