const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "taskboard",
  user: process.env.DB_USER || "taskboard_user",
  password: process.env.DB_PASSWORD || "taskboard_password"
});

async function getAllTasks() {
  const result = await pool.query(`
    SELECT id, title, description, created_at
    FROM tasks
    ORDER BY created_at DESC, id DESC
  `);

  return result.rows;
}

async function createTask(title, description) {
  const result = await pool.query(
    `
    INSERT INTO tasks (title, description)
    VALUES ($1, $2)
    RETURNING id, title, description, created_at
    `,
    [title, description]
  );

  return result.rows[0];
}

module.exports = {
  pool,
  getAllTasks,
  createTask
};