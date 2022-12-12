import chromium from "chrome-aws-lambda";
import playwright from "playwright";
import type { Browser } from "playwright";

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
