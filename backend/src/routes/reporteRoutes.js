const { Router } = require('express');
const reporteController = require('../controllers/reporteController');
const router = Router();

router.get('/reportes', (req, res) => reporteController.getReportes(req, res));
router.post('/reportes', (req, res) => reporteController.createReporte(req, res));
router.delete('/reportes/:id', (req, res) => reporteController.deleteReporte(req, res));

module.exports = router;