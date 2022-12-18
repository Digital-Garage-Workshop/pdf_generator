import chromium from "chrome-aws-lambda";
import playwright from "playwright";
import type { Browser } from "playwright";

interface IOptions {
  pageRanges?: string;
  path: string;
}
export const generatePDF = async ({ pageRanges, path }: IOptions) => {
  let browser: Browser | null = null;

  try {
    const timer: { key: string; time: number }[] = [];
    const start = new Date().getTime();

    const options =
      process.env.NODE_ENV === "production"
        ? {
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
          }
        : {};
    browser = await playwright.chromium.launch(options);
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

    const pdfGenerator = page.getByTestId("pdf_generator");
    await pdfGenerator.evaluate((node) => (node.style.visibility = "hidden"));

    const main = page.getByTestId("main");
    await main.evaluate((node) => (node.style.padding = "0px"));

    const pages = page.getByTestId("pages");
    await pages.evaluate((node) => (node.style.rowGap = "0px"));

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

    // timer.forEach(({ key, time }) => {
    //   console.log(key, time - start);
    // });

    return pdf;
  } catch (error) {
    console.log(error);
  } finally {
    await browser?.close();
  }
};
