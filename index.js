const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const Company = require("./models/company.model");

const app = express();

// Connect to MongoDB
(async () => {
  try {
    mongoose.connect(process.env.MONGODB_URI);
  } catch (err) {
    console.log(err);
  }
})();

async function scrape(url) {
  console.log("Scraping:", url);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Select Table by XPath
  const table = await page.$x(`//*[@id="table"]`);
  const tableBody = await table[0].$x("tbody");
  const tableRows = await tableBody[0].$$("tr");

  const tableData = [];

  for (let i = 0; i < tableRows.length; i++) {
    const tableRow = tableRows[i];
    const tableCells = await tableRow.$$("td");

    const tableRowData = {};

    for (let j = 0; j < tableCells.length; j++) {
      const tableCell = tableCells[j];
      const tableCellText = await tableCell.evaluate(
        (node) => node.textContent
      );

      const tableCellLink = await tableCell.evaluate((node) =>
        node.querySelector("a") ? node.querySelector("a").href : null
      );

      if (tableCellLink) {
        tableRowData[getKey(j)] = { link: tableCellLink, title: tableCellText };
      } else {
        tableRowData[getKey(j)] = tableCellText;
      }
    }
    tableData.push(tableRowData);
  }

  if (tableData.length > 0) {
    try {
      await Company.insertMany(tableData);
      console.log("Inserted:", tableData.length);
    } catch (err) {
      console.log(err);
    }
  }
  await browser.close();
  console.log("Done scraping:", url);
}

const getKey = (index) => {
  switch (index) {
    case 0:
      return "cin";
    case 1:
      return "company";
    case 2:
      return "roc";
    case 3:
      return "status";
    default:
      return index;
  }
};

const data = JSON.parse(fs.readFileSync("./data.json"));

const pageStart = data.totalPagesDone;
const scrapeUntil = data.scrapeUnitl;

console.log("Scraping from page:", pageStart);

let loopCount = 1;
for (let page = pageStart; page <= scrapeUntil; page++) {
  setTimeout(() => {
    scrape(`https://www.zaubacorp.com/company-list/p-${page}-company.html`),
      (data.totalPagesDone = page);
    fs.writeFileSync("./data.json", JSON.stringify(data));
  }, loopCount * 5000);
  loopCount++;
}

app.listen(1337, () => {
  console.log("Server is running on port 1337");
});
