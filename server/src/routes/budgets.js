import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";
import { startOfMonth, endOfMonth } from "date-fns";

const router = Router();

const createBudgetSchema = z.object({
  limit: z.number().positive("Limit must be greater than 0"),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  categoryId: z.string().min(1, "Category is required"),
});

const updateBudgetSchema = z.object({
  limit: z.number().positive("Limit must be greater than 0"),
});

// ─── GET /api/budgets ────────────────────────────────────────────────
// Get budgets for a specific month/year
router.get("/", async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
      },
      include: {
        category: true,
      },
      orderBy: {
        limit: 'desc'
      }
    });

    const computedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const monthStart = new Date(budget.year, budget.month - 1, 1);
        const monthEnd = new Date(budget.year, budget.month, 0, 23, 59, 59);

        const aggregate = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            type: "EXPENSE",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        });

        return {
          ...budget,
          spent: aggregate._sum.amount || 0,
        };
      })
    );

    res.json(computedBudgets);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/budgets ───────────────────────────────────────────────
router.post("/", validate(createBudgetSchema), async (req, res, next) => {
  try {
    // Check if category exists
    await prisma.category.findUniqueOrThrow({
      where: { id: req.body.categoryId },
    });

    const budget = await prisma.budget.create({
      data: {
        ...req.body,
        spent: 0, // Ignored, as we compute dynamically on reads
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/budgets/:id ────────────────────────────────────────────
router.put("/:id", validate(updateBudgetSchema), async (req, res, next) => {
  try {
    const budget = await prisma.budget.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        category: true,
      },
    });
    res.json(budget);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/budgets/:id ─────────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.budget.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
