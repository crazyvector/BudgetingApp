import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().max(500).default(""),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  recurring: z.boolean().default(false),
  recurrenceRule: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).nullable().optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  completed: z.boolean().optional(),
});

// ─── GET /api/tasks ───────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { completed } = req.query;
    
    const where = {};
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { completed: "asc" }, // Incomplete first
        { dueDate: "asc" },   // Soonest first
        { priority: "desc" }, // High priority first
      ],
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/tasks ──────────────────────────────────────────────────
router.post("/", validate(createTaskSchema), async (req, res, next) => {
  try {
    const task = await prisma.task.create({
      data: {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────
router.put("/:id", validate(updateTaskSchema), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.dueDate !== undefined) {
      data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
    });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
