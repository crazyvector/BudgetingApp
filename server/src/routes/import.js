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
  uber: "Transport",
  bolt: "Transport",
  omv: "Transport",
  petrom: "Transport",
  rompetrol: "Transport",
  "mega image": "Groceries",
  kaufland: "Groceries",
  lidl: "Groceries",
  carrefour: "Groceries",
  auchan: "Groceries",
  profi: "Groceries",
  netflix: "Entertainment",
  spotify: "Entertainment",
  hbo: "Entertainment",
  cinema: "Entertainment",
  emag: "Shopping",
  altex: "Shopping",
  zara: "Shopping",
  hhm: "Shopping",
  farmacia: "Health",
  dr_max: "Health",
  catena: "Health",
  enel: "Bills",
  engie: "Bills",
  digi: "Bills",
  orange: "Bills",
  vodafone: "Bills",
  salariu: "Salary",
  wizz: "Travel",
  ryanair: "Travel",
  airbnb: "Travel",
  booking: "Travel",
  glovo: "Dining",
  tazz: "Dining",
  kfc: "Dining",
  mcdonalds: "Dining",
  starbucks: "Dining",
  rest: "Dining", // catches restaurant
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

    // Save to DB
    let importedCount = 0;
    for (const tx of extractedData) {
      const category = guessCategory(tx.description);
      const catId = category ? category.id : defaultCategory.id;

      // Optional: Check for duplicates to prevent double-importing
      // We'll skip this for now to keep it simple, or user can delete manually.

      await prisma.transaction.create({
        data: {
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          description: tx.description.substring(0, 255), // limit length
          categoryId: catId,
        },
      });
      importedCount++;
    }

    res.json({ message: "Import successful", count: importedCount });
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
