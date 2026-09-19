const { createTaskService } = require('../services/taskService');

class TaskController {
  constructor(service) {
    this.service = service;
  }

  async getTasks(req, res) {
    try {
      const tasks = await this.service.getAllTasks();
      return res.status(200).json({ data: tasks });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Ocurrió un error interno al recuperar el listado de tareas.'
      });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const stats = await this.service.getDashboardStats();
      return res.status(200).json({ data: stats });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Ocurrió un error interno al generar las estadísticas del dashboard.'
      });
    }
  }

  async createTask(req, res) {
    const { title } = req.body || {};

    if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        error: 'El campo "title" es obligatorio y debe ser una cadena de texto.',
        field: 'title'
      });
    }

    try {
      const created = await this.service.createTask(title);
      return res.status(201).json({
        message: 'Tarea creada exitosamente.',
        data: created
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        error: err.message,
        field: err.field || null
      });
    }
  }

  async toggleStatus(req, res) {
    const { id } = req.params;

    if (id === undefined || id === null || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'El identificador de la tarea debe ser un valor numérico.',
        field: 'id'
      });
    }

    try {
      const updated = await this.service.toggleTaskStatus(id);
      return res.status(200).json({
        message: 'Estado de la tarea actualizado con éxito.',
        data: updated
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        error: err.message,
        field: err.field || null
      });
    }
  }

  async deleteTask(req, res) {
    const { id } = req.params;

    if (id === undefined || id === null || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'El identificador de la tarea debe ser un valor numérico.',
        field: 'id'
      });
    }

    try {
      await this.service.deleteTask(id);
      return res.status(200).json({
        message: 'Tarea eliminada exitosamente.'
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        error: err.message,
        field: err.field || null
      });
    }
  }
}

function createTaskController(service) {
  return new TaskController(service || createTaskService());
}

module.exports = { TaskController, createTaskController };