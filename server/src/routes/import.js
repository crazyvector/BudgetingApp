import { Router } from "express";
import multer from "multer";
import fs from "fs";
import csvParser from "csv-parser";
import prisma from "../utils/prisma.js";
import { execSync } from "child_process";

const router = Router();
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

// ─── Helper: Recalculate budget spent amount ─────────────────────────
async function recalculateBudgetSpent(categoryId, date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  const budget = await prisma.budget.findUnique({
    where: {
      categoryId_month_year: { categoryId, month, year },
    },
  });

  if (!budget) return;

  const expenses = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      categoryId,
      type: "EXPENSE",
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
  });

  await prisma.budget.update({
    where: { id: budget.id },
    data: { spent: expenses._sum.amount || 0 },
  });
}

// ─── Smart Category Guesser ──────────────────────────────────────────
// Simple dictionary to guess categories from descriptions
const keywordToCategoryMap = {
  // Transport
  uber: "Transport",
  bolt: "Transport",
  omv: "Transport",
  petrom: "Transport",
  rompetrol: "Transport",
  lukoil: "Transport",
  mol: "Transport",
  socar: "Transport",
  cfr: "Transport",
  stb: "Transport",
  metrorex: "Transport",
  tazz: "Dining", // although delivery, usually dining
  glovo: "Dining",
  foodpanda: "Dining",
  
  // Groceries
  "mega image": "Groceries",
  "mega-image": "Groceries",
  kaufland: "Groceries",
  lidl: "Groceries",
  carrefour: "Groceries",
  auchan: "Groceries",
  profi: "Groceries",
  penny: "Groceries",
  cora: "Groceries",
  supeco: "Groceries",
  market: "Groceries",
  supermarket: "Groceries",
  nemarval: "Groceries",
  "nemarval market": "Groceries",
  
  // Entertainment & Subscriptions
  netflix: "Subscriptions",
  spotify: "Subscriptions",
  hbo: "Subscriptions",
  disney: "Subscriptions",
  amazon: "Shopping",
  prime: "Subscriptions",
  youtube: "Subscriptions",
  apple: "Subscriptions",
  "google proxima": "Subscriptions",
  cinema: "Entertainment",
  steam: "Entertainment",
  playstation: "Entertainment",
  xbox: "Entertainment",
  superbet: "Entertainment",
  "superbet.ro": "Entertainment",
  
  // Shopping
  emag: "Shopping",
  altex: "Shopping",
  flanco: "Shopping",
  zara: "Shopping",
  "h&m": "Shopping",
  hhm: "Shopping",
  bershka: "Shopping",
  pullbear: "Shopping",
  stradivarius: "Shopping",
  dedeman: "Shopping",
  ikea: "Shopping",
  jysk: "Shopping",
  pepco: "Shopping",
  aliexpress: "Shopping",
  shein: "Shopping",
  temu: "Shopping",
  
  // Health
  farmacia: "Health",
  dr_max: "Health",
  "dr max": "Health",
  catena: "Health",
  helpnet: "Health",
  dona: "Health",
  medlife: "Health",
  regina_maria: "Health",
  "regina maria": "Health",
  synevo: "Health",
  
  // Bills & Utilities
  enel: "Utilities",
  engie: "Utilities",
  digi: "Utilities",
  orange: "Utilities",
  vodafone: "Utilities",
  telekom: "Utilities",
  eon: "Utilities",
  "e.on": "Utilities",
  hidroelectrica: "Utilities",
  apa: "Utilities",
  salubritate: "Utilities",
  întreținere: "Utilities",
  intretinere: "Utilities",
  
  // Travel
  wizz: "Travel",
  ryanair: "Travel",
  tarom: "Travel",
  airbnb: "Travel",
  booking: "Travel",
  hotel: "Travel",
  agoda: "Travel",
  expedia: "Travel",
  
  // Dining
  kfc: "Dining",
  mcdonalds: "Dining",
  "mcdonald's": "Dining",
  "mc donald": "Dining",
  starbucks: "Dining",
  "5 to go": "Dining",
  tucano: "Dining",
  restaurant: "Dining",
  pizza: "Dining",
  bistro: "Dining",
  pub: "Dining",
  bar: "Dining",
  cafe: "Dining",
  bakery: "Dining",
  simigerie: "Dining",
  luca: "Dining",
  matei: "Dining",
  paul: "Dining",
  "food cottage": "Dining",
  "taco bell": "Dining",
  dallmayr: "Dining",
  burger: "Dining",
  "burger king": "Dining",
  tsv: "Dining",
  
  // Income
  salariu: "Salary",
  salary: "Salary",
  upwork: "Freelance",
  fiverr: "Freelance",
  dividende: "Investments",
  dobanda: "Investments",
};

// Caches categories so we don't query the DB per transaction
let categoryCache = null;
let defaultCategory = null;

async function loadCategories() {
  const cats = await prisma.category.findMany();
  categoryCache = cats;
  defaultCategory = cats.find((c) => c.name === "Other" || c.name === "Altele") || cats[0];
}

function guessCategory(description, historicalCategoryMap = new Map()) {
  if (!categoryCache) return null;
  const descLower = description.toLowerCase().trim();
  
  // 1. Dynamic Auto-Learning: Check if we have assigned a category to this exact description before
  if (historicalCategoryMap.has(descLower)) {
    const histCatId = historicalCategoryMap.get(descLower);
    const match = categoryCache.find(c => c.id === histCatId);
    if (match) return match;
  }

  // 2. Static Dictionary: Fallback to keyword guessing
  for (const [keyword, catName] of Object.entries(keywordToCategoryMap)) {
    if (descLower.includes(keyword)) {
      const match = categoryCache.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (match) return match;
    }
  }
  
  // 3. Fallback: Default category
  return defaultCategory;
}

// ─── CSV Parser (Revolut & BT) ──────────────────────────────────────────────
async function parseCSV(filePath, bank) {
  return new Promise((resolve, reject) => {
    const transactions = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        if (bank === "revolut") {
          // Revolut Logic
          if (row.State && row.State !== "COMPLETED") return;
          const rawAmount = parseFloat(row.Amount);
          const fee = parseFloat(row.Fee) || 0;
          if (isNaN(rawAmount) || rawAmount === 0) return;
          const date = new Date(row["Started Date"] || row["Completed Date"]);
          if (isNaN(date)) return;
          const type = rawAmount < 0 ? "EXPENSE" : "INCOME";
          
          let amount = Math.abs(rawAmount);
          if (type === "EXPENSE") amount += Math.abs(fee);
          else amount -= Math.abs(fee);
          
          const description = row.Description || "Revolut Transaction";
          transactions.push({ date, amount, type, description });
        } else if (bank === "bt") {
          // BT Logic (Basic fallback, needs adjustment based on actual headers)
          // For now, try to find Amount/Suma and Date/Data
          const keys = Object.keys(row);
          const amountKey = keys.find(k => k.toLowerCase().includes("amount") || k.toLowerCase().includes("suma") || k.toLowerCase().includes("valoare"));
          const dateKey = keys.find(k => k.toLowerCase().includes("date") || k.toLowerCase().includes("data"));
          const descKey = keys.find(k => k.toLowerCase().includes("desc") || k.toLowerCase().includes("detalii") || k.toLowerCase().includes("explicatii"));
          
          if (!amountKey || !dateKey) return;
          
          let rawAmountStr = row[amountKey].replace(/\./g, "").replace(",", ".");
          const rawAmount = parseFloat(rawAmountStr);
          if (isNaN(rawAmount) || rawAmount === 0) return;
          
          // BT date usually DD.MM.YYYY
          let date;
          const rawDate = row[dateKey];
          if (rawDate.includes(".")) {
            const parts = rawDate.split(" ")[0].split(".");
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
          } else {
            date = new Date(rawDate);
          }
          if (isNaN(date)) return;

          const type = rawAmount < 0 ? "EXPENSE" : "INCOME";
          const amount = Math.abs(rawAmount);
          const description = descKey ? row[descKey] : "BT Transaction";

          transactions.push({ date, amount, type, description });
        }
      })
      .on("end", () => resolve(transactions))
      .on("error", reject);
  });
}

// ─── PDF Parser (BT) ────────────────────────────────────────────────────────
function parseBTPdf(filePath) {
  try {
    const output = execSync(`pdftotext -layout "${filePath}" -`, { encoding: "utf8" });
    const lines = output.split('\n');
    
    let transactions = [];
    let currentTx = null;
    let currentDate = null;
    
    const dateRegex = /^\s*(\d{2}\/\d{2}\/\d{4})\s+/;
    const amountRegex = /^[\d,]+\.\d{2}$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\r/g, '');
      if (line.trim() === '') continue;

      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('/');
        currentDate = new Date(`${year}-${month}-${day}T12:00:00Z`);
      }

      if (!currentDate) continue;

      const descPart = line.substring(17, 94).trim();
      const debitPart = line.substring(94, 115).trim().split(' ')[0];
      const creditPart = line.substring(115).trim().split(' ')[0];

      if (
        descPart === "" ||
        descPart.includes("RULAJ ZI") || 
        descPart.includes("SOLD FINAL") || 
        descPart.includes("RULAJ TOTAL") || 
        descPart.includes("SOLD ANTERIOR") || 
        descPart.includes("TOTAL DISPONIBIL") || 
        descPart.includes("Fonduri proprii") || 
        descPart.includes("Credit neutilizat") ||
        descPart.includes("SUME DATORATE") ||
        descPart.includes("SUME BLOCATE") ||
        descPart.includes("Acest extras de cont este valabil") ||
        line.includes("BANCA TRANSILVANIA S.A.") ||
        line.includes("Info clienti:") ||
        line.includes("CRISTESCU ANDREI-STEFAN") ||
        line.includes("Informatii noi pentru clientii") ||
        line.includes("Fondurile pe care le aveti") ||
        line.includes("Garantare a Depozitelor") ||
        line.includes("ro/garantarea") ||
        line.includes("EXTRAS CONT") ||
        line.includes("Cod IBAN:") ||
        line.includes("Data             Descriere")
      ) {
        continue;
      }

      let amount = 0;
      let type = null;

      if (creditPart && amountRegex.test(creditPart)) {
        amount = parseFloat(creditPart.replace(/,/g, ''));
        type = "INCOME";
      } else if (debitPart && amountRegex.test(debitPart)) {
        amount = parseFloat(debitPart.replace(/,/g, ''));
        type = "EXPENSE";
      }

      if (amount > 0) {
        if (currentTx) transactions.push(currentTx);
        currentTx = { date: currentDate, description: descPart, amount, type };
      } else if (currentTx && descPart) {
        currentTx.description += " " + descPart;
      }
    }
    
    if (currentTx) transactions.push(currentTx);
    return transactions;
  } catch (err) {
    console.error("Error parsing PDF:", err);
    throw new Error("Eroare la parsarea PDF-ului BT. Asigurati-va ca aveti 'poppler-utils' instalat.");
  }
}

// ─── Import Route ────────────────────────────────────────────────────
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    const { bank, accountId } = req.body; // "revolut" or "bt", and optional accountId

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!bank || !["revolut", "bt"].includes(bank)) {
      return res.status(400).json({ message: "Invalid or missing bank type" });
    }

    // Auto-resolve accountId if not provided
    let finalAccountId = accountId;
    if (!finalAccountId) {
      const allAccounts = await prisma.account.findMany();
      if (bank === "revolut") {
        const revAcc = allAccounts.find(a => a.name.toLowerCase().includes("revolut"));
        if (revAcc) finalAccountId = revAcc.id;
      } else if (bank === "bt") {
        const btAcc = allAccounts.find(a => a.name.toLowerCase().includes("transilvania") || a.name.toLowerCase().includes("bt"));
        if (btAcc) finalAccountId = btAcc.id;
      }
    }

    await loadCategories();
    if (!categoryCache || categoryCache.length === 0) {
      return res.status(400).json({ message: "Please seed or create categories first." });
    }

    let extractedData = [];
    if (bank === "revolut") {
      extractedData = await parseCSV(file.path, bank);
    } else if (bank === "bt") {
      extractedData = parseBTPdf(file.path);
    }

    // Clean up temporary file
    fs.unlinkSync(file.path);

    if (extractedData.length === 0) {
      return res.status(400).json({ message: "No valid transactions found in file." });
    }

    // Fetch existing transactions to avoid duplicates AND build historical memory
    const existingTx = await prisma.transaction.findMany({
      select: { date: true, amount: true, description: true, categoryId: true },
      orderBy: { date: 'asc' } // Older first, so newer transactions overwrite the map
    });
    
    const existingSet = new Set();
    const historicalCategoryMap = new Map();
    
    for (const t of existingTx) {
      existingSet.add(`${t.date.getTime()}-${t.type}-${t.amount}-${t.description}`);
      historicalCategoryMap.set(t.description.toLowerCase().trim(), t.categoryId);
    }

    // Save to DB in bulk for extreme speed
    const transactionsToInsert = [];
    let duplicateCount = 0;

    for (const tx of extractedData) {
      const descLimited = tx.description.substring(0, 255);
      const hash = `${tx.date.getTime()}-${tx.type}-${tx.amount}-${descLimited}`;
      
      if (existingSet.has(hash)) {
        duplicateCount++;
        continue;
      }
      existingSet.add(hash);

      const category = guessCategory(tx.description, historicalCategoryMap);
      const catId = category ? category.id : defaultCategory.id;

      transactionsToInsert.push({
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        description: descLimited,
        categoryId: catId,
        accountId: finalAccountId || null,
      });
    }

    if (transactionsToInsert.length > 0) {
      await prisma.transaction.createMany({
        data: transactionsToInsert,
      });

      // Mass recalculate budgets for affected months and categories
      const budgetsToRecalc = new Set();
      for (const tx of transactionsToInsert) {
        if (tx.type === "EXPENSE") {
          const d = new Date(tx.date);
          budgetsToRecalc.add(`${tx.categoryId}|${d.getFullYear()}-${d.getMonth() + 1}-01`);
        }
      }

      for (const item of budgetsToRecalc) {
        const [catId, dateStr] = item.split("|");
        await recalculateBudgetSpent(catId, new Date(dateStr));
      }
    }

    res.json({ 
      message: "Import successful", 
      count: transactionsToInsert.length,
      duplicatesSkipped: duplicateCount 
    });
  } catch (error) {
    console.error("Import error:", error);
    next(error);
  } finally {
    // Failsafe cleanup
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export default router;
