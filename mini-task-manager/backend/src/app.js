const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { createTaskRoutes } = require('./routes/taskRoutes');
const { createTaskController } = require('./controllers/taskController');
const { createTaskService } = require('./services/taskService');
const { authMiddleware } = require('./middleware/authMiddleware');

function createApp({ taskRepository } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', authRoutes);

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', servicio: 'greenlight-api', hora: new Date().toISOString() });
  });

  const taskRoutes = createTaskRoutes(createTaskController(createTaskService(taskRepository)));

  app.use('/api/tasks', authMiddleware);
  app.use('/api', taskRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
  });

  app.use((err, req, res, next) => {
    if (req.headersSent) return next(err);
    console.error(err);
    return res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
  });

  return app;
}

module.exports = { createApp };

if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[GreenLight API Server] Ejecutándose en http://localhost:${PORT}`);
  });
}