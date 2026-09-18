const { Router } = require('express');
const reporteController = require('../controllers/reporteController');
const { requireRole } = require('../middleware/authMiddleware');
const router = Router();

router.get('/reportes', (req, res) => reporteController.getReportes(req, res));
router.get('/reportes/stats', requireRole('admin'), (req, res) => reporteController.getDashboardStats(req, res));
router.post('/reportes', (req, res) => reporteController.createReporte(req, res));
router.delete('/reportes/:id', requireRole('admin'), (req, res) => reporteController.deleteReporte(req, res));

module.exports = router;