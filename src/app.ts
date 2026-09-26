import express from "express";
import { receiptsRouter } from "./routes/receipts.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/receipts", receiptsRouter);
  return app;
}
