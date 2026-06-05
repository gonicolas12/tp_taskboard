require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool, getAllTasks, createTask } = require("./db");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Healthcheck DB error:", error);
    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error("GET /tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { title, description = "" } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    const task = await createTask(title.trim(), String(description).trim());
    res.status(201).json(task);
  } catch (error) {
    console.error("POST /tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});