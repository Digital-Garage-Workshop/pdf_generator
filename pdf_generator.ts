import chromium from "chrome-aws-lambda";
import playwright from "playwright";
import type { Browser } from "playwright";

interface IOptions {
  pageRanges?: string;
  path: string;
}
let browser: Browser | null = null;
export const generatePDF = async ({ pageRanges, path }: IOptions) => {
  const start = new Date().getTime();
  try {
    if (!browser) {
      browser = await playwright.chromium.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });
    }
    console.log("browser", new Date().getTime() - start);

    const context = await browser.newContext();
    console.log("context", new Date().getTime() - start);
    const page = await context.newPage();
    console.log("page", new Date().getTime() - start);
    await page.goto(path, { waitUntil: "networkidle" });
    console.log("goto", new Date().getTime() - start);

    const pdfGenerator = page.locator(".fixed");
    await pdfGenerator.evaluate((node) => (node.style.visibility = "hidden"));
    console.log("evaluate", new Date().getTime() - start);

    const pdf = await page.pdf({
      format: "A4",
      pageRanges,
      preferCSSPageSize: true,
      printBackground: true,
    });
    console.log("pdf", new Date().getTime() - start);

    return pdf;
  } catch (error) {
    console.log(error);
    await browser?.close();
  }
};
