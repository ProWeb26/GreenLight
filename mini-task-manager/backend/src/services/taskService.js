const { createTaskRepository } = require('../repositories/taskRepository');

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 255;

class TaskService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAllTasks() {
    return await this.repository.findAll();
  }

  async getDashboardStats() {
    const [summary, porEstado, porMes, recientes] = await Promise.all([
      this.repository.getSummary(),
      this.repository.countByStatus(),
      this.repository.countByMonth(),
      this.repository.findRecent()
    ]);

    return {
      summary,
      porEstado,
      porMes,
      recientes
    };
  }

  async createTask(title) {
    const tituloLimpio = title.trim().replace(/\s+/g, ' ');

    if (tituloLimpio.length < MIN_TITLE_LENGTH) {
      const error = new Error(`El título de la tarea debe tener al menos ${MIN_TITLE_LENGTH} caracteres.`);
      error.statusCode = 422;
      error.field = 'title';
      throw error;
    }

    if (tituloLimpio.length > MAX_TITLE_LENGTH) {
      const error = new Error(`El título de la tarea no puede superar los ${MAX_TITLE_LENGTH} caracteres.`);
      error.statusCode = 422;
      error.field = 'title';
      throw error;
    }

    return await this.repository.create({ title: tituloLimpio, status: 'pending' });
  }

  async toggleTaskStatus(id) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      const error = new Error(`No se encontró la tarea con identificador ${id}.`);
      error.statusCode = 404;
      error.field = 'id';
      throw error;
    }

    const nextStatus = existing.status === 'done' ? 'pending' : 'done';
    return await this.repository.updateStatus(id, nextStatus);
  }

  async deleteTask(id) {
    const exists = await this.repository.findById(id);
    if (!exists) {
      const error = new Error(`No se encontró la tarea con identificador ${id}.`);
      error.statusCode = 404;
      error.field = 'id';
      throw error;
    }

    return await this.repository.delete(id);
  }
}

function createTaskService(repository) {
  return new TaskService(repository || createTaskRepository());
}

module.exports = { TaskService, createTaskService };