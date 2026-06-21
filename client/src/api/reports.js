import api from "./client.js";

export const getSummary = (month) =>
  api.get("/reports/summary", { params: month ? { month } : {} }).then((r) => r.data);

export const getExpensesByCategory = (month) =>
  api.get("/reports/expenses-by-category", { params: month ? { month } : {} }).then((r) => r.data);

export const getMonthlyTrend = (months = 6) =>
  api.get("/reports/monthly-trend", { params: { months } }).then((r) => r.data);

export const getRecentTransactions = (limit = 5) =>
  api.get("/reports/recent-transactions", { params: { limit } }).then((r) => r.data);
