import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import categoriesRouter from "./routes/categories.js";
import transactionsRouter from "./routes/transactions.js";
import reportsRouter from "./routes/reports.js";
import budgetsRouter from "./routes/budgets.js";
import goalsRouter from "./routes/goals.js";
import tasksRouter from "./routes/tasks.js";
import importRouter from "./routes/import.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Public Routes ───────────────────────────────────────────────────
app.use("/api/auth", authRouter);

// ─── Protected Routes ────────────────────────────────────────────────
app.use("/api/categories", requireAuth, categoriesRouter);
app.use("/api/transactions", requireAuth, transactionsRouter);
app.use("/api/reports", requireAuth, reportsRouter);
app.use("/api/budgets", requireAuth, budgetsRouter);
app.use("/api/goals", requireAuth, goalsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);
app.use("/api/transactions/import", requireAuth, importRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found", message: "Route not found." });
});

// ─── Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🚀 BudgetingApp API Server`);
  console.log(`  ─────────────────────────`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  Docs:    Routes mounted at /api/*\n`);
});

export default app;
