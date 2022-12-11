import bodyParser from "body-parser";
import chromium from "chrome-aws-lambda";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import playwright from "playwright-core";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(jsonParser);
app.use(
  cors({ origin: ["http://localhost:3000", "https://ag-job-sheet.vercel.app"] })
);

app.get("/", (request: Request, response: Response) => {
  response.send("Express + TypeScript Server");
});

app.post("/pdf", async (request: Request, response: Response) => {
  try {
    const { pageRanges, path } = request.body;

    const pdf = request.headers.origin
      ? await generatePDF({
          pageRanges,
          path: `${request.headers.origin}${path}`,
        })
      : null;

    return response
      .status(200)
      .setHeader("Content-Type", "application/pdf")
      .send(pdf);
  } catch (error) {
    return response.status(400).send(error);
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

interface IOptions {
  pageRanges?: string;
  path: string;
}
export const generatePDF = async ({ pageRanges, path }: IOptions) => {
  const browser = await playwright.chromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(path, { waitUntil: "networkidle" });

  const pdfGenerator = page.locator(".fixed");
  await pdfGenerator.evaluate((node) => (node.style.visibility = "hidden"));

  const pdf = await page.pdf({
    format: "A4",
    pageRanges,
    preferCSSPageSize: true,
    printBackground: true,
  });
  await browser.close();

  return pdf;
};
