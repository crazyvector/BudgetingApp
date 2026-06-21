import { Router } from "express";
import prisma from "../utils/prisma.js";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from "date-fns";

const router = Router();

// ─── GET /api/reports/summary ────────────────────────────────────────
// Returns current month's total income, total expenses, and balance.
// Optionally accepts ?month=YYYY-MM to query a specific month.
router.get("/summary", async (req, res, next) => {
  try {
    const targetDate = req.query.month
      ? new Date(`${req.query.month}-01`)
      : new Date();

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          type: "INCOME",
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: "EXPENSE",
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;

    res.json({
      month: format(targetDate, "yyyy-MM"),
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/reports/expenses-by-category ───────────────────────────
// Returns expense totals grouped by category for the pie chart.
// Optionally accepts ?month=YYYY-MM.
router.get("/expenses-by-category", async (req, res, next) => {
  try {
    const targetDate = req.query.month
      ? new Date(`${req.query.month}-01`)
      : new Date();

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    const expenses = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        type: "EXPENSE",
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });

    // Enrich with category info
    const categoryIds = expenses.map((e) => e.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = Object.fromEntries(
      categories.map((c) => [c.id, c])
    );

    const data = expenses
      .map((e) => ({
        categoryId: e.categoryId,
        categoryName: categoryMap[e.categoryId]?.name || "Unknown",
        color: categoryMap[e.categoryId]?.color || "#6B7280",
        icon: categoryMap[e.categoryId]?.icon || "📁",
        total: e._sum.amount || 0,
      }))
      .sort((a, b) => b.total - a.total);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/reports/monthly-trend ──────────────────────────────────
// Returns income vs. expense totals for the last N months (default 6).
// Used by the bar chart on the dashboard.
router.get("/monthly-trend", async (req, res, next) => {
  try {
    const months = Math.min(12, Math.max(1, parseInt(req.query.months) || 6));
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = subMonths(now, i);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);

      const [incomeAgg, expenseAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            type: "INCOME",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            type: "EXPENSE",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      results.push({
        month: format(targetDate, "yyyy-MM"),
        monthLabel: format(targetDate, "MMM yyyy"),
        income: incomeAgg._sum.amount || 0,
        expenses: expenseAgg._sum.amount || 0,
      });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/reports/recent-transactions ────────────────────────────
// Returns the N most recent transactions (default 5). Used by the dashboard.
router.get("/recent-transactions", async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));

    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      take: limit,
    });

    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

export default router;
