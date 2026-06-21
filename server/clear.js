import prisma from "./src/utils/prisma.js";

async function main() {
  console.log("Cleaning up database...");
  
  // Delete all transactions
  const txRes = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${txRes.count} transactions.`);

  // Delete all goal contributions
  const gcRes = await prisma.goalContribution.deleteMany({});
  console.log(`Deleted ${gcRes.count} goal contributions.`);

  // Reset all budgets' spent amount to 0
  const budgetRes = await prisma.budget.updateMany({
    data: { spent: 0 }
  });
  console.log(`Reset ${budgetRes.count} budgets to 0.`);

  // Reset all goals' currentAmount to 0
  const goalRes = await prisma.goal.updateMany({
    data: { currentAmount: 0 }
  });
  console.log(`Reset ${goalRes.count} goals to 0.`);
  
  console.log("Database perfectly clean!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
