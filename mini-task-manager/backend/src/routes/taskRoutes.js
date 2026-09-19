const { Router } = require('express');
const { createTaskController } = require('../controllers/taskController');
const { requireRole } = require('../middleware/authMiddleware');

function createTaskRoutes(controller) {
  const ctrl = controller || createTaskController();
  const router = Router();

  router.get('/tasks', (req, res) => ctrl.getTasks(req, res));
  router.get('/tasks/stats', requireRole('admin'), (req, res) => ctrl.getDashboardStats(req, res));
  router.post('/tasks', (req, res) => ctrl.createTask(req, res));
  router.patch('/tasks/:id/toggle', (req, res) => ctrl.toggleStatus(req, res));
  router.delete('/tasks/:id', requireRole('admin'), (req, res) => ctrl.deleteTask(req, res));

  return router;
}

module.exports = { createTaskRoutes };