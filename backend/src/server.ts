import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ensureSchema } from "./db";
import tasksRouter from "./routes/tasks";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4056;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/tasks", tasksRouter);

async function start() {
  await ensureSchema();
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
