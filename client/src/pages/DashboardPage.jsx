import { useState, useEffect } from "react";
import SummaryCards from "../components/dashboard/SummaryCards.jsx";
import ExpensePieChart from "../components/dashboard/ExpensePieChart.jsx";
import TrendBarChart from "../components/dashboard/TrendBarChart.jsx";
import RecentTransactions from "../components/dashboard/RecentTransactions.jsx";
import {
  getSummary,
  getExpensesByCategory,
  getRecentTransactions,
} from "../api/reports.js";
import { fetchAccounts } from "../api/client.js";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [summaryData, categoryData, trendData, recentData, accountsData] =
          await Promise.all([
            getSummary(),
            getExpensesByCategory(),
            getMonthlyTrend(6),
            getRecentTransactions(7),
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
