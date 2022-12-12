import express from "express";
import type { Request, Response } from "express";

import { generatePDF } from "./pdf_generator";

export const router = express.Router();

router.get("/", (request: Request, response: Response) => {
  response.send("Express + TypeScript Server");
});

router.post("/pdf", async (request: Request, response: Response) => {
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
