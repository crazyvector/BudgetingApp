import api from "./client.js";

export const getSummary = (month, accountId) =>
  api.get("/reports/summary", { params: { ...(month && { month }), ...(accountId && { accountId }) } }).then((r) => r.data);

export const getExpensesByCategory = (month, accountId) =>
  api.get("/reports/expenses-by-category", { params: { ...(month && { month }), ...(accountId && { accountId }) } }).then((r) => r.data);

export const getMonthlyTrend = (months = 6, accountId) =>
  api.get("/reports/monthly-trend", { params: { months, ...(accountId && { accountId }) } }).then((r) => r.data);

export const getRecentTransactions = (limit = 5, accountId) =>
  api.get("/reports/recent-transactions", { params: { limit, ...(accountId && { accountId }) } }).then((r) => r.data);
