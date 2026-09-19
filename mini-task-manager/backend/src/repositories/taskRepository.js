const defaultDb = require('../config/db');
const { InMemoryTaskRepository } = require('./memoryTaskRepository');

class TaskRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    const query = `SELECT * FROM tasks ORDER BY created_at DESC;`;
    const { rows } = await this.db.query(query);
    return rows;
  }

  async findById(id) {
    const query = `SELECT * FROM tasks WHERE id = $1;`;
    const { rows } = await this.db.query(query, [id]);
    return rows[0] || null;
  }

  async create({ title, status }) {
    const query = `
      INSERT INTO tasks (title, status)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await this.db.query(query, [title, status]);
    return rows[0];
  }

  async updateStatus(id, status) {
    const query = `
      UPDATE tasks
      SET status = $2
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await this.db.query(query, [id, status]);
    return rows[0] || null;
  }

  async delete(id) {
    const query = `DELETE FROM tasks WHERE id = $1 RETURNING id;`;
    const { rows } = await this.db.query(query, [id]);
    return rows.length > 0;
  }

  async getSummary() {
    const query = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_TIMESTAMP))::int AS este_mes
      FROM tasks;
    `;
    const { rows } = await this.db.query(query);
    return rows[0];
  }

  async countByStatus() {
    const query = `
      SELECT status, COUNT(*)::int AS total
      FROM tasks
      GROUP BY status
      ORDER BY total DESC;
    `;
    const { rows } = await this.db.query(query);
    return rows;
  }

  async countByMonth(limit = 6) {
    const query = `
      SELECT
        to_char(created_at, 'YYYY-MM') AS mes,
        COUNT(*)::int AS total
      FROM tasks
      GROUP BY to_char(created_at, 'YYYY-MM')
      ORDER BY mes DESC
      LIMIT $1;
    `;
    const { rows } = await this.db.query(query, [limit]);
    return rows.reverse();
  }

  async findRecent(limit = 5) {
    const query = `
      SELECT id, title, status, created_at
      FROM tasks
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const { rows } = await this.db.query(query, [limit]);
    return rows;
  }
}

function createTaskRepository(db) {
  // TASK_STORE=memory ejecuta la API 100% simulada (sin PostgreSQL).
  if (process.env.TASK_STORE === 'memory') return new InMemoryTaskRepository();
  return new TaskRepository(db || defaultDb);
}

module.exports = { TaskRepository, createTaskRepository };