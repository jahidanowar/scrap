const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");

const company = require("./models/company.model");

async function scrape(url, id) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  const rejectRequestPattern = [
    "googlesyndication.com",
    "/*.doubleclick.net",
    "/*.amazon-adsystem.com",
    "/*.adnxs.com",
  ];
  const blockList = [];

  page.on("request", (request) => {
    if (rejectRequestPattern.find((pattern) => request.url().match(pattern))) {
      blockList.push(request.url());
      request.abort();
    } else request.continue();
  });

  await page.goto(url);

  console.log("Scraping url: " + url);

  const registrationNumber = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[1]/table/tbody/tr[4]/td[2]/p`
  );

  // When Google ads are detected
  //*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[2]/table/tbody/tr[4]/td[2]/p

  console.log("registrationNumber: " + registrationNumber);

  const category = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[1]/table/tbody/tr[5]/td[2]/p`
  );

  console.log("category: " + category);

  const sub_category = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[1]/table/tbody/tr[6]/td[2]/p`
  );

  console.log("sub_category: " + sub_category);

  const company_class = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[1]/table/tbody/tr[7]/td[2]/p`
  );

  console.log("company_class: " + company_class);

  const date_of_incorporation = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[1]/table/tbody/tr[8]/td[2]/p`
  );

  console.log("date_of_incorporation: " + date_of_incorporation);

  const activity = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[1]/table/tbody/tr[10]/td[2]/p[1]`
  );

  console.log("activity: " + activity);

  const authorised_capital = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[4]/table/tbody/tr[1]/td[2]/p`
  );

  console.log("authorised_capital: " + authorised_capital);

  const paid_up_capital = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[4]/table/tbody/tr[2]/td[2]/p`
  );

  console.log("paid_up_capital: " + paid_up_capital);

  const listing_status = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[5]/table/thead/tr/td[2]/p`
  );

  console.log("listing_status: " + listing_status);

  const last_anoual_general_meeting = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[5]/table/tbody/tr[1]/td[2]/p`
  );

  console.log("last_anoual_general_meeting: " + last_anoual_general_meeting);

  const last_balance_sheet = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[1]/div[5]/table/tbody/tr[2]/td[2]/p`
  );

  console.log("last_balance_sheet: " + last_balance_sheet);

  const adderess = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[5]/div/div[1]/p[4]`
  );

  console.log("adderess: " + adderess);

  const email = await extractTextFromXPath(
    page,
    `//*[@id="block-system-main"]/div[2]/div[1]/div[5]/div/div[1]/p[1]/text()`
  );

  console.log("email: " + email);

  const directorsTables = await page.$x(
    `//*[@id="block-system-main"]/div[2]/div[1]/div[7]/table/tbody`
  );

  // Extract data from table
  const directors = await directorsTables[0].$$eval("tr.main-row", (trs) => {
    return trs.map((tr) => {
      // select td that dosent have .hidden class
      const tds = tr.querySelectorAll("td:not(.hiddenRow)");
      return {
        din: tds[0].innerText,
        name: tds[1].innerText,
        designation: tds[2].innerText,
        appointment_date: tds[3].innerText,
      };
    });
  });

  console.log("directors: " + directors);

  //   console.log({
  //     registrationNumber,
  //     category,
  //     sub_category,
  //     company_class,
  //     date_of_incorporation,
  //     activity,
  //     authorised_capital,
  //     paid_up_capital,
  //     listing_status,
  //     last_anoual_general_meeting,
  //     last_balance_sheet,
  //     adderess,
  //     email,
  //     directors,
  //   });

  try {
    await company.findByIdAndUpdate(id, {
      $set: {
        registrationNumber,
        category,
        sub_category,
        company_class,
        date_of_incorporation,
        activity,
        authorised_capital,
        paid_up_capital,
        listing_status,
        last_anoual_general_meeting,
        last_balance_sheet,
        adderess,
        email,
        directors,
      },
    });
    console.log("Company updated in database");
  } catch (err) {
    console.log("Unable to store", err);
  }
  await browser.close();
  console.log("Scrapping Finished");
}

async function extractTextFromXPath(page, xpath) {
  try {
    const text = await page.$x(xpath);
    if (!text[0] || !text[0].evaluate) {
      return null;
    }
    const textContent = await text[0].evaluate((node) => node.textContent);
    return Promise.resolve(textContent);
  } catch (err) {
    return Promise.reject(err);
  }
}

// Connect to MongoDB
(async () => {
  try {
    mongoose.connect(process.env.MONGODB_URI);
  } catch (err) {
    console.log(err);
  }
})();

(async () => {
  const companies = await company.find({}).limit(10);
  let loopCount = 0;
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    // console.log(company.company.link);
    await scrape(company.company.link, company._id);
    loopCount++;
  }
  //   for (let company of companies) {
  //     setTimeout(async () => {
  //       scrape(company.company.link, company._id);
  //       loopCount++;
  //     }, loopCount * 5000);
  //   }
})();
