import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().positive("Target amount must be greater than 0"),
  deadline: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").default("#6366F1"),
  icon: z.string().min(1).max(10).default("🎯"),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  completed: z.boolean().optional(),
});

const addContributionSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().optional(),
  note: z.string().max(255).default(""),
});

// ─── GET /api/goals ──────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        contributions: {
          orderBy: { date: "desc" },
          take: 5, // Just return recent ones for the overview
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const computedGoals = await Promise.all(
      goals.map(async (goal) => {
        const aggregate = await prisma.goalContribution.aggregate({
          where: { goalId: goal.id },
          _sum: { amount: true },
        });

        return {
          ...goal,
          currentAmount: aggregate._sum.amount || 0,
        };
      })
    );
    res.json(computedGoals);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/goals/:id ──────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const goal = await prisma.goal.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
    });
    const aggregate = await prisma.goalContribution.aggregate({
      where: { goalId: goal.id },
      _sum: { amount: true },
    });

    const computedGoal = {
      ...goal,
      currentAmount: aggregate._sum.amount || 0,
    };

    res.json(computedGoal);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/goals ─────────────────────────────────────────────────
router.post("/", validate(createGoalSchema), async (req, res, next) => {
  try {
    const goal = await prisma.goal.create({
      data: {
        ...req.body,
        deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      },
    });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/goals/:id ──────────────────────────────────────────────
router.put("/:id", validate(updateGoalSchema), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.deadline !== undefined) {
      data.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data,
    });
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/goals/:id ───────────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.goal.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/goals/:id/contributions ───────────────────────────────
router.post("/:id/contributions", validate(addContributionSchema), async (req, res, next) => {
  try {
    const goalId = req.params.id;
    
    // Ensure goal exists
    const goal = await prisma.goal.findUniqueOrThrow({ where: { id: goalId } });

    // Transaction to add contribution
    const contribution = await prisma.goalContribution.create({
      data: {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date(),
        goalId,
      },
    });

    const aggregate = await prisma.goalContribution.aggregate({
      where: { goalId },
      _sum: { amount: true },
    });

    const updatedGoal = {
      ...goal,
      currentAmount: aggregate._sum.amount || 0,
    };

    res.status(201).json({ contribution, goal: updatedGoal });
  } catch (err) {
    next(err);
  }
});

export default router;
