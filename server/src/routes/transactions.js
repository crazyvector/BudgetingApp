import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";
import {
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────────

const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().max(255).default(""),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  categoryId: z.string().min(1, "Category is required"),
});

const updateTransactionSchema = createTransactionSchema.partial();

// ─── Helper: Recalculate budget spent amount ─────────────────────────
async function recalculateBudgetSpent(categoryId, date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  const budget = await prisma.budget.findUnique({
    where: { categoryId_month_year: { categoryId, month, year } },
  });

  if (!budget) return;

  const monthStart = startOfMonth(d);
  const monthEnd = endOfMonth(d);

  const aggregate = await prisma.transaction.aggregate({
    where: {
      categoryId,
      type: "EXPENSE",
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  await prisma.budget.update({
    where: { id: budget.id },
    data: { spent: aggregate._sum.amount || 0 },
  });
}

// ─── GET /api/transactions ───────────────────────────────────────────
// Supports filtering by: type, categoryId, startDate, endDate, search
// Supports sorting by: date, amount, createdAt (asc/desc)
// Supports pagination: page, limit
router.get("/", async (req, res, next) => {
  try {
    const {
      type,
      categoryId,
      startDate,
      endDate,
      search,
      sortBy = "date",
      sortOrder = "desc",
      page = "1",
      limit = "20",
    } = req.query;

    // Build where clause
    const where = {};

    if (type && ["INCOME", "EXPENSE"].includes(type)) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (search) {
      where.description = { contains: search };
    }

    // Validate sort params
    const allowedSortFields = ["date", "amount", "createdAt"];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : "date";
    const orderDir = sortOrder === "asc" ? "asc" : "desc";

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Execute query with count
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { [orderField]: orderDir },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/transactions/:id ───────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { category: true },
    });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/transactions ─────────────────────────────────────────
router.post(
  "/",
  validate(createTransactionSchema),
  async (req, res, next) => {
    try {
      // Verify category exists
      await prisma.category.findUniqueOrThrow({
        where: { id: req.body.categoryId },
      });

      const transaction = await prisma.transaction.create({
        data: {
          ...req.body,
          date: new Date(req.body.date),
        },
        include: { category: true },
      });

      // Recalculate budget if this is an expense
      if (transaction.type === "EXPENSE") {
        await recalculateBudgetSpent(
          transaction.categoryId,
          transaction.date
        );
      }

      res.status(201).json(transaction);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/transactions/:id ──────────────────────────────────────
router.put(
  "/:id",
  validate(updateTransactionSchema),
  async (req, res, next) => {
    try {
      // Get the existing transaction to check if category/date changed
      const existing = await prisma.transaction.findUniqueOrThrow({
        where: { id: req.params.id },
      });

      const updateData = { ...req.body };
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const transaction = await prisma.transaction.update({
        where: { id: req.params.id },
        data: updateData,
        include: { category: true },
      });

      // Recalculate budgets for old and new category/date combinations
      if (existing.type === "EXPENSE") {
        await recalculateBudgetSpent(existing.categoryId, existing.date);
      }
      if (transaction.type === "EXPENSE") {
        await recalculateBudgetSpent(
          transaction.categoryId,
          transaction.date
        );
      }

      res.json(transaction);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/transactions/:id ───────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findUniqueOrThrow({
      where: { id: req.params.id },
    });

    await prisma.transaction.delete({ where: { id: req.params.id } });

    // Recalculate budget after deletion
    if (transaction.type === "EXPENSE") {
      await recalculateBudgetSpent(
        transaction.categoryId,
        transaction.date
      );
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/transactions/bulk-delete ──────────────────────────────
router.post("/bulk-delete", async (req, res, next) => {
  try {
    const { startDate, endDate, categoryId } = req.body;
    
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Get affected categories for budget recalculation BEFORE deleting
    // Only need to recalculate expenses
    const affectedTransactions = await prisma.transaction.findMany({
      where: { ...where, type: "EXPENSE" },
      select: { categoryId: true, date: true }
    });

    const deleted = await prisma.transaction.deleteMany({
      where
    });

    // Recalculate budgets for all affected (category, month) combinations
    const budgetsToRecalc = new Set();
    for (const tx of affectedTransactions) {
      const d = tx.date;
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      budgetsToRecalc.add(`${tx.categoryId}|${year}-${month}-01`);
    }

    for (const item of budgetsToRecalc) {
      const [catId, dateStr] = item.split("|");
      await recalculateBudgetSpent(catId, new Date(dateStr));
    }

    res.json({ message: "Deleted successfully", count: deleted.count });
  } catch (err) {
    next(err);
  }
});

export default router;
