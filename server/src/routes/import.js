import { Router } from "express";
import multer from "multer";
import fs from "fs";
import csvParser from "csv-parser";
import prisma from "../utils/prisma.js";

const router = Router();
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

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

function guessCategory(description) {
  if (!categoryCache) return null;
  const descLower = description.toLowerCase();
  
  for (const [keyword, catName] of Object.entries(keywordToCategoryMap)) {
    if (descLower.includes(keyword)) {
      const match = categoryCache.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (match) return match;
    }
  }
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
          if (isNaN(rawAmount) || rawAmount === 0) return;
          const date = new Date(row["Started Date"] || row["Completed Date"]);
          if (isNaN(date)) return;
          const type = rawAmount < 0 ? "EXPENSE" : "INCOME";
          const amount = Math.abs(rawAmount);
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

// ─── Import Route ────────────────────────────────────────────────────
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    const { bank } = req.body; // "revolut" or "bt"

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!bank || !["revolut", "bt"].includes(bank)) {
      return res.status(400).json({ message: "Invalid or missing bank type" });
    }

    await loadCategories();
    if (!categoryCache || categoryCache.length === 0) {
      return res.status(400).json({ message: "Please seed or create categories first." });
    }

    const extractedData = await parseCSV(file.path, bank);

    // Clean up temporary file
    fs.unlinkSync(file.path);

    if (extractedData.length === 0) {
      return res.status(400).json({ message: "No valid transactions found in file." });
    }

    // Save to DB in bulk for extreme speed
    const transactionsToInsert = [];
    for (const tx of extractedData) {
      const category = guessCategory(tx.description);
      const catId = category ? category.id : defaultCategory.id;

      transactionsToInsert.push({
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        description: tx.description.substring(0, 255), // limit length
        categoryId: catId,
      });
    }

    if (transactionsToInsert.length > 0) {
      await prisma.transaction.createMany({
        data: transactionsToInsert,
      });
    }

    res.json({ message: "Import successful", count: transactionsToInsert.length });
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
