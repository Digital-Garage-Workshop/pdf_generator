import chromium from "chrome-aws-lambda";
import playwright from "playwright";
import type { Browser } from "playwright";

interface IOptions {
  pageRanges?: string;
  path: string;
}
let browser: Browser | null = null;
export const generatePDF = async ({ pageRanges, path }: IOptions) => {
  const timer: { key: string; time: number }[] = [];
  const start = new Date().getTime();
  try {
    if (!browser) {
      browser = await playwright.chromium.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });
    }

    timer.push({
      key: "browser",
      time: new Date().getTime(),
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(path, { waitUntil: "networkidle" });
    timer.push({
      key: "goto",
      time: new Date().getTime(),
    });

    const pdfGenerator = page.locator(".fixed");
    await pdfGenerator.evaluate((node) => (node.style.visibility = "hidden"));

    const pdf = await page.pdf({
      format: "A4",
      pageRanges,
      preferCSSPageSize: true,
      printBackground: true,
    });
    timer.push({
      key: "pdf",
      time: new Date().getTime(),
    });

    timer.forEach(({ key, time }) => {
      console.log(key, time - start);
    });

    return pdf;
  } catch (error) {
    console.log(error);
  } finally {
    await browser?.close();
  }
};
