import bodyParser from "body-parser";
import chromium from "chrome-aws-lambda";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import morgan from "morgan";
import playwright from "playwright";
import type { Browser } from "playwright";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const jsonParser = bodyParser.json();
app.use(jsonParser);

app.use(
  cors({ origin: ["http://localhost:3000", "https://ag-job-sheet.vercel.app"] })
);

const logger = morgan(
  ":method :url :status :res[content-length] - :response-time ms"
);
app.use(logger);

app.get("/", (request: Request, response: Response) => {
  response.send("Express + TypeScript Server");
});

app.post("/pdf", async (request: Request, response: Response) => {
  const { pageRanges, path } = request.body;

  const pdf = request.headers.origin
    ? await generatePDF({
        pageRanges,
        path: `${request.headers.origin}${path}`,
      })
    : null;

  if (!pdf) {
    return response.status(400).send("PDF generation failed");
  }

  return response
    .status(200)
    .setHeader("Content-Type", "application/pdf")
    .send(pdf);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

interface IOptions {
  pageRanges?: string;
  path: string;
}
let browser: Browser | null = null;
export const generatePDF = async ({ pageRanges, path }: IOptions) => {
  try {
    if (!browser) {
      browser = await playwright.chromium.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });
    }

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

    return pdf;
  } catch (error) {
    console.log(error);
    await browser?.close();
  }
};
