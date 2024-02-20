/* eslint-disable no-restricted-syntax */
import path from "node:path";
import puppeteer from "puppeteer";
import url from "node:url";
import fs from "node:fs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTable(data: any[]) {
  // Convert the data to an HTML table
  let table = "<table>";
  table +=
    "<tr><th>from</th><th>to</th><th>rate</th><th>fee</th><th>feeThreshold</th></tr>";
  // eslint-disable-next-line no-restricted-syntax
  for (const row of data) {
    table += `<tr><td>${row.from}</td><td>${row.to}</td><td>${row.rate}</td><td>${row.fee}</td><td>${row.feeThreshold}</td></tr>`;
  }
  table += "</table>";

  // Get the directory of the current module
  const dirname = path.dirname(url.fileURLToPath(import.meta.url));
  // Delete all old images
  const files = fs.readdirSync(dirname);
  for (const file of files) {
    if (file.startsWith("x") && file.endsWith("table.png")) {
      fs.unlinkSync(path.join(dirname, file));
    }
  }

  // Start a puppeteer browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the HTML content of the page
  const html = `
    <style>
      body { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
      table { border-collapse: collapse; width: auto; height: auto; }
      th, td { border: 1px solid #ddd; padding: 8px; }
      tr:nth-child(even) { background-color: #f2f2f2; }
      th { padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white; }
    </style>
    ${table}
  `;
  await page.setContent(html);

  // Get the table element
  const tableElement = await page.$("table");

  // Take a screenshot of the table element
  const imagePath = path.join(dirname, `x${Date.now()}table.png`);
  if (tableElement) {
    await tableElement.screenshot({ path: imagePath });
  } else {
    throw new Error("Table element not found");
  }

  // Close the browser
  await browser.close();

  return imagePath;
}
