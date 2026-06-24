import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";
import { addDays, addMonths, addYears, parseISO, startOfDay, isBefore, isEqual } from "date-fns";

const router = Router();

const recurringSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().max(255),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val))),
  categoryId: z.string()
});

function calculateNextDate(date, frequency) {
  switch (frequency) {
    case "DAILY": return addDays(date, 1);
    case "WEEKLY": return addDays(date, 7);
    case "MONTHLY": return addMonths(date, 1);
    case "YEARLY": return addYears(date, 1);
    default: return date;
  }
}

// ─── GET /api/recurring ──────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const recurrings = await prisma.recurringTransaction.findMany({
      include: { category: true },
      orderBy: { nextDate: 'asc' }
    });
    res.json(recurrings);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/recurring ─────────────────────────────────────────────
router.post("/", validate(recurringSchema), async (req, res, next) => {
  try {
    const startDate = new Date(req.body.startDate);
    const nextDate = calculateNextDate(startDate, req.body.frequency);
    
    const recurring = await prisma.recurringTransaction.create({
      data: {
        ...req.body,
        startDate,
        nextDate
      },
      include: { category: true }
    });
    res.status(201).json(recurring);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/recurring/:id ──────────────────────────────────────────
router.put("/:id", async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.nextDate) {
      updateData.nextDate = new Date(updateData.nextDate);
    }
    
    const recurring = await prisma.recurringTransaction.update({
      where: { id: req.params.id },
      data: updateData,
      include: { category: true }
    });
    res.json(recurring);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/recurring/:id ───────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.recurringTransaction.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/recurring/process ─────────────────────────────────────
router.post("/process", async (req, res, next) => {
  try {
    const now = new Date();
    
    const activeRecurrings = await prisma.recurringTransaction.findMany({
      where: {
        active: true,
        nextDate: { lte: now }
      }
    });

    const createdTransactions = [];

    for (const rec of activeRecurrings) {
      // Create actual transaction
      const tx = await prisma.transaction.create({
        data: {
          amount: rec.amount,
          type: rec.type,
          description: rec.description,
          categoryId: rec.categoryId,
          date: rec.nextDate,
        }
      });
      createdTransactions.push(tx);

      // Advance the nextDate
      const newNextDate = calculateNextDate(rec.nextDate, rec.frequency);
      await prisma.recurringTransaction.update({
        where: { id: rec.id },
        data: { nextDate: newNextDate }
      });
      
      // Update Budget if Expense
      if (tx.type === "EXPENSE") {
        const d = tx.date;
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const budget = await prisma.budget.findUnique({
          where: { categoryId_month_year: { categoryId: tx.categoryId, month, year } },
        });
        
        if (budget) {
          // Re-aggregate
          const { startOfMonth, endOfMonth } = await import("date-fns");
          const monthStart = startOfMonth(d);
          const monthEnd = endOfMonth(d);
          
          const aggregate = await prisma.transaction.aggregate({
            where: {
              categoryId: tx.categoryId,
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
      }
    }

    res.json({ processed: createdTransactions.length, transactions: createdTransactions });
  } catch (err) {
    next(err);
  }
});

export default router;
