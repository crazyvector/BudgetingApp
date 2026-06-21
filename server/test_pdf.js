import fs from 'fs';
import pdfParse from 'pdf-parse';

async function test() {
  const dataBuffer = fs.readFileSync('/Users/andrei/Documents/AntigravityProjects/BudgetingApp/Tranzactii/27 feb. 2026-27 mai 2026.pdf');
  const data = await pdfParse(dataBuffer);
  console.log(data.text.substring(0, 1000));
}

test();
