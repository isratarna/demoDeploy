import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// GET /api/tasks - list all tasks
router.get("/", async (_req: Request, res: Response) => {
  const [rows] = await pool.query("SELECT * FROM tasks ORDER BY created_at DESC");
  res.json(rows);
});

// POST /api/tasks - create a task
router.post("/", async (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }
  const [result]: any = await pool.query("INSERT INTO tasks (title) VALUES (?)", [title]);
  res.status(201).json({ id: result.insertId, title, done: false });
});

// PUT /api/tasks/:id - update a task
router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, done } = req.body;
  await pool.query("UPDATE tasks SET title = COALESCE(?, title), done = COALESCE(?, done) WHERE id = ?", [
    title ?? null,
    done ?? null,
    id,
  ]);
  res.json({ message: "updated" });
});

// DELETE /api/tasks/:id - delete a task
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
  res.json({ message: "deleted" });
});

export default router;
