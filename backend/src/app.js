const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const { authMiddleware, requireRole } = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);

app.use('/api/reportes', authMiddleware);
app.use('/api', reporteRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[GreenLight API Server] Ejecutándose en http://localhost:${PORT}`);
});