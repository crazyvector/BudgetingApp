import { useState, useEffect } from "react";
import SummaryCards from "../components/dashboard/SummaryCards.jsx";
import ExpensePieChart from "../components/dashboard/ExpensePieChart.jsx";
import TrendBarChart from "../components/dashboard/TrendBarChart.jsx";
import RecentTransactions from "../components/dashboard/RecentTransactions.jsx";
import {
  getSummary,
  getExpensesByCategory,
  getRecentTransactions,
  getMonthlyTrend,
} from "../api/reports.js";
import { fetchAccounts } from "../api/client.js";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [summaryData, categoryData, trendData, recentData, accountsData] =
          await Promise.all([
            getSummary(null, selectedAccountId),
            getExpensesByCategory(null, selectedAccountId),
            getMonthlyTrend(6, selectedAccountId),
            getRecentTransactions(7, selectedAccountId),
            fetchAccounts(),
          ]);

        setSummary(summaryData);
        setExpensesByCategory(categoryData);
        setTrend(trendData);
        setRecentTxns(recentData);
        setAccounts(accountsData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [selectedAccountId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-muted">Account:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-surface-primary border border-border-light rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-sm cursor-pointer"
          >
            <option value="">🌐 All Accounts (Global)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards data={summary} accounts={accounts} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensePieChart data={expensesByCategory} />
        <TrendBarChart data={trend} />
      </div>

      {/* Recent transactions */}
      <RecentTransactions data={recentTxns} />
    </div>
  );
}
