import { Router } from "express";
import prisma from "../utils/prisma.js";

const router = Router();

// GET all accounts with their calculated balances
router.get("/", async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { name: "asc" }
    });

    // Calculate the balances dynamically based on transactions
    const balances = await prisma.transaction.groupBy({
      by: ['accountId', 'type'],
      _sum: { amount: true },
      where: { accountId: { not: null } }
    });

    // Process balances into a map
    const balanceMap = {};
    for (const b of balances) {
      if (!balanceMap[b.accountId]) balanceMap[b.accountId] = 0;
      if (b.type === "INCOME") balanceMap[b.accountId] += b._sum.amount;
      else balanceMap[b.accountId] -= b._sum.amount;
    }

    const accountsWithBalance = accounts.map(acc => ({
      ...acc,
      balance: balanceMap[acc.id] || 0
    }));

    res.json(accountsWithBalance);
  } catch (err) {
    next(err);
  }
});

// POST new account
router.post("/", async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const account = await prisma.account.create({
      data: { name, icon, color: color || "#94A3B8" }
    });
    res.json(account);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Account with this name already exists" });
    }
    next(err);
  }
});

// PUT update account
router.put("/:id", async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;
    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: { name, icon, color }
    });
    res.json(account);
  } catch (err) {
    next(err);
  }
});

// DELETE account
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.account.delete({
      where: { id: req.params.id }
    });
    res.json({ message: "Account deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
