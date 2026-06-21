import { PrismaClient } from "@prisma/client";
import { subDays, subMonths, format } from "date-fns";

const prisma = new PrismaClient();

// ─── Default Categories ──────────────────────────────────────────────
const defaultCategories = [
  // Income categories
  { name: "Salary", icon: "💰", color: "#10B981", type: "INCOME", isDefault: true },
  { name: "Freelance", icon: "💻", color: "#06B6D4", type: "INCOME", isDefault: true },
  { name: "Investments", icon: "📈", color: "#8B5CF6", type: "INCOME", isDefault: true },
  { name: "Other Income", icon: "💵", color: "#14B8A6", type: "INCOME", isDefault: true },

  // Expense categories
  { name: "Rent", icon: "🏠", color: "#EF4444", type: "EXPENSE", isDefault: true },
  { name: "Groceries", icon: "🛒", color: "#F59E0B", type: "EXPENSE", isDefault: true },
  { name: "Dining", icon: "🍽️", color: "#EC4899", type: "EXPENSE", isDefault: true },
  { name: "Utilities", icon: "⚡", color: "#F97316", type: "EXPENSE", isDefault: true },
  { name: "Transport", icon: "🚗", color: "#3B82F6", type: "EXPENSE", isDefault: true },
  { name: "Entertainment", icon: "🎬", color: "#A855F7", type: "EXPENSE", isDefault: true },
  { name: "Health", icon: "🏥", color: "#EF4444", type: "EXPENSE", isDefault: true },
  { name: "Shopping", icon: "🛍️", color: "#F472B6", type: "EXPENSE", isDefault: true },
  { name: "Education", icon: "📚", color: "#6366F1", type: "EXPENSE", isDefault: true },
  { name: "Subscriptions", icon: "📱", color: "#8B5CF6", type: "EXPENSE", isDefault: true },
];

// ─── Sample Transactions ─────────────────────────────────────────────
// Generate realistic demo data across the last 6 months.
function generateSampleTransactions(categoryMap) {
  const transactions = [];
  const now = new Date();

  for (let m = 5; m >= 0; m--) {
    const baseDate = subMonths(now, m);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    // Monthly salary
    transactions.push({
      amount: 5200,
      type: "INCOME",
      description: "Monthly salary",
      date: new Date(year, month, 1),
      categoryId: categoryMap["Salary"],
    });

    // Occasional freelance
    if (m % 2 === 0) {
      transactions.push({
        amount: 800 + Math.floor(Math.random() * 700),
        type: "INCOME",
        description: "Freelance project payment",
        date: new Date(year, month, 15),
        categoryId: categoryMap["Freelance"],
      });
    }

    // Rent
    transactions.push({
      amount: 1500,
      type: "EXPENSE",
      description: "Monthly rent",
      date: new Date(year, month, 1),
      categoryId: categoryMap["Rent"],
    });

    // Groceries (2–3 per month)
    for (let g = 0; g < 2 + Math.floor(Math.random() * 2); g++) {
      transactions.push({
        amount: 50 + Math.floor(Math.random() * 120),
        type: "EXPENSE",
        description: ["Weekly groceries", "Costco run", "Farmer's market"][g % 3],
        date: new Date(year, month, 5 + g * 8),
        categoryId: categoryMap["Groceries"],
      });
    }

    // Dining
    transactions.push({
      amount: 30 + Math.floor(Math.random() * 70),
      type: "EXPENSE",
      description: "Dinner out",
      date: new Date(year, month, 10 + Math.floor(Math.random() * 10)),
      categoryId: categoryMap["Dining"],
    });

    // Utilities
    transactions.push({
      amount: 80 + Math.floor(Math.random() * 60),
      type: "EXPENSE",
      description: "Electricity & water bill",
      date: new Date(year, month, 20),
      categoryId: categoryMap["Utilities"],
    });

    // Transport
    transactions.push({
      amount: 40 + Math.floor(Math.random() * 60),
      type: "EXPENSE",
      description: "Gas & transit",
      date: new Date(year, month, 12),
      categoryId: categoryMap["Transport"],
    });

    // Entertainment (some months)
    if (m % 2 === 1 || m === 0) {
      transactions.push({
        amount: 15 + Math.floor(Math.random() * 50),
        type: "EXPENSE",
        description: "Streaming & movies",
        date: new Date(year, month, 18),
        categoryId: categoryMap["Entertainment"],
      });
    }

    // Subscriptions
    transactions.push({
      amount: 45,
      type: "EXPENSE",
      description: "Monthly subscriptions (Spotify, Netflix, iCloud)",
      date: new Date(year, month, 3),
      categoryId: categoryMap["Subscriptions"],
    });

    // Shopping (occasional)
    if (m % 3 === 0) {
      transactions.push({
        amount: 60 + Math.floor(Math.random() * 200),
        type: "EXPENSE",
        description: "Online shopping",
        date: new Date(year, month, 22),
        categoryId: categoryMap["Shopping"],
      });
    }
  }

  return transactions;
}

// ─── Seed Script ─────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data (order matters for foreign keys)
  await prisma.goalContribution.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.task.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();

  // Seed categories
  console.log("  📁 Creating default categories...");
  const categories = [];
  for (const cat of defaultCategories) {
    const created = await prisma.category.create({ data: cat });
    categories.push(created);
  }
  const categoryMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  console.log(`     ✓ ${categories.length} categories created`);

  // Seed transactions
  console.log("  💳 Creating sample transactions...");
  const txData = generateSampleTransactions(categoryMap);
  for (const tx of txData) {
    await prisma.transaction.create({ data: tx });
  }
  console.log(`     ✓ ${txData.length} transactions created`);

  // Seed budgets for current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  console.log("  📊 Creating sample budgets...");
  const budgetData = [
    { categoryId: categoryMap["Groceries"], limit: 400, month: currentMonth, year: currentYear },
    { categoryId: categoryMap["Dining"], limit: 200, month: currentMonth, year: currentYear },
    { categoryId: categoryMap["Entertainment"], limit: 100, month: currentMonth, year: currentYear },
    { categoryId: categoryMap["Transport"], limit: 150, month: currentMonth, year: currentYear },
    { categoryId: categoryMap["Shopping"], limit: 250, month: currentMonth, year: currentYear },
    { categoryId: categoryMap["Subscriptions"], limit: 50, month: currentMonth, year: currentYear },
  ];

  for (const budget of budgetData) {
    await prisma.budget.create({ data: budget });
  }
  console.log(`     ✓ ${budgetData.length} budgets created`);

  // Seed savings goals
  console.log("  🎯 Creating sample savings goals...");
  const emergencyGoal = await prisma.goal.create({
    data: {
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 3500,
      deadline: new Date(currentYear, 11, 31),
      color: "#10B981",
      icon: "🛡️",
    },
  });

  await prisma.goalContribution.createMany({
    data: [
      { amount: 1000, date: subMonths(now, 4), note: "Initial deposit", goalId: emergencyGoal.id },
      { amount: 500, date: subMonths(now, 3), note: "Monthly savings", goalId: emergencyGoal.id },
      { amount: 800, date: subMonths(now, 2), note: "Bonus savings", goalId: emergencyGoal.id },
      { amount: 700, date: subMonths(now, 1), note: "Monthly savings", goalId: emergencyGoal.id },
      { amount: 500, date: now, note: "Monthly savings", goalId: emergencyGoal.id },
    ],
  });

  const vacationGoal = await prisma.goal.create({
    data: {
      name: "Summer Vacation",
      targetAmount: 3000,
      currentAmount: 1200,
      deadline: new Date(currentYear + 1, 6, 1),
      color: "#F59E0B",
      icon: "✈️",
    },
  });

  await prisma.goalContribution.createMany({
    data: [
      { amount: 400, date: subMonths(now, 2), note: "Vacation fund", goalId: vacationGoal.id },
      { amount: 400, date: subMonths(now, 1), note: "Vacation fund", goalId: vacationGoal.id },
      { amount: 400, date: now, note: "Vacation fund", goalId: vacationGoal.id },
    ],
  });
  console.log("     ✓ 2 savings goals created with contributions");

  // Seed tasks
  console.log("  ✅ Creating sample tasks...");
  const tasks = [
    {
      title: "Pay mortgage",
      description: "Monthly mortgage payment due on the 15th",
      dueDate: new Date(currentYear, now.getMonth(), 15),
      priority: "HIGH",
      recurring: true,
      recurrenceRule: "MONTHLY",
    },
    {
      title: "Review investment portfolio",
      description: "Quarterly review of stock and bond allocations",
      dueDate: new Date(currentYear, now.getMonth() + 1, 1),
      priority: "MEDIUM",
    },
    {
      title: "Cancel old gym membership",
      description: "Cancel the membership that auto-renews next month",
      dueDate: new Date(currentYear, now.getMonth(), 28),
      priority: "HIGH",
    },
    {
      title: "File quarterly taxes",
      description: "Prepare and file estimated quarterly tax payment",
      dueDate: new Date(currentYear, now.getMonth() + 1, 15),
      priority: "HIGH",
      recurring: true,
      recurrenceRule: "MONTHLY",
    },
    {
      title: "Update budget spreadsheet",
      description: "Sync all transactions with the master budget tracker",
      dueDate: subDays(now, 2),
      priority: "LOW",
      completed: true,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }
  console.log(`     ✓ ${tasks.length} tasks created`);

  // Recalculate budget spent amounts
  console.log("\n  🔄 Recalculating budget spent amounts...");
  const budgets = await prisma.budget.findMany();
  for (const budget of budgets) {
    const monthStart = new Date(budget.year, budget.month - 1, 1);
    const monthEnd = new Date(budget.year, budget.month, 0, 23, 59, 59);

    const agg = await prisma.transaction.aggregate({
      where: {
        categoryId: budget.categoryId,
        type: "EXPENSE",
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });

    await prisma.budget.update({
      where: { id: budget.id },
      data: { spent: agg._sum.amount || 0 },
    });
  }
  console.log("     ✓ Budget amounts synced");

  console.log("\n✅ Seed complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
