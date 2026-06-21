import prisma from "./src/utils/prisma.js";

async function main() {
  console.log("Deleting all transactions...");
  const res = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${res.count} transactions.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
