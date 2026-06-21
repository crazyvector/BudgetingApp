import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  icon: z.string().min(1).max(10).default("📁"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .default("#6B7280"),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]).default("EXPENSE"),
});

const updateCategorySchema = createCategorySchema.partial();

// ─── GET /api/categories ─────────────────────────────────────────────
// List all categories, optionally filtered by type.
router.get("/", async (req, res, next) => {
  try {
    const { type } = req.query;

    const where = {};
    if (type && ["INCOME", "EXPENSE", "BOTH"].includes(type)) {
      // Return categories matching the type OR type "BOTH"
      where.OR = [{ type }, { type: "BOTH" }];
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/categories/:id ─────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const category = await prisma.category.findUniqueOrThrow({
      where: { id: req.params.id },
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/categories ────────────────────────────────────────────
router.post("/", validate(createCategorySchema), async (req, res, next) => {
  try {
    const category = await prisma.category.create({
      data: {
        ...req.body,
        isDefault: false, // User-created categories are never defaults
      },
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/categories/:id ─────────────────────────────────────────
router.put("/:id", validate(updateCategorySchema), async (req, res, next) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/categories/:id ──────────────────────────────────────
// Prevent deletion of default categories or categories with transactions.
router.delete("/:id", async (req, res, next) => {
  try {
    const category = await prisma.category.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { _count: { select: { transactions: true } } },
    });

    if (category.isDefault) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Default categories cannot be deleted.",
      });
    }

    if (category._count.transactions > 0) {
      return res.status(409).json({
        error: "Conflict",
        message: `Cannot delete category "${category.name}" — it has ${category._count.transactions} transaction(s). Reassign them first.`,
      });
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
