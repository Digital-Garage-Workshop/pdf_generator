import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";

import { router } from "./router";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const jsonParser = bodyParser.json();
const logger = morgan(":method :url :status - :response-time ms");

app.use(jsonParser);
app.use(
  cors({ origin: ["http://localhost:3000", "https://ag-job-sheet.vercel.app"] })
);
app.use(logger);
app.use("/", router);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
