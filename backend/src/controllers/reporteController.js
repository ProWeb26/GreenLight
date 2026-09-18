const reporteService = require('../services/reporteService');

const REQUIRED_FIELDS = [
  'comunidad_id',
  'usuario_id',
  'tipo_id',
  'ubicacion_texto',
  'latitud',
  'longitud'
];

class ReporteController {
  async getDashboardStats(req, res) {
    try {
      const stats = await reporteService.getDashboardStats();
      return res.status(200).json({ data: stats });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Ocurrió un error interno al generar las estadísticas del dashboard.'
      });
    }
  }

  async getReportes(req, res) {
    try {
      const reportes = await reporteService.getAllReportes();
      return res.status(200).json({ data: reportes });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Ocurrió un error interno al recuperar el listado de reportes.'
      });
    }
  }

  async createReporte(req, res) {
    for (const field of REQUIRED_FIELDS) {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        return res.status(400).json({
          error: `El campo "${field}" es obligatorio.`,
          field
        });
      }
    }

    if (isNaN(Number(req.body.tipo_id))) {
      return res.status(400).json({
        error: 'El campo "tipo_id" debe ser un valor numérico.',
        field: 'tipo_id'
      });
    }

    if (isNaN(Number(req.body.latitud)) || isNaN(Number(req.body.longitud))) {
      return res.status(400).json({
        error: 'Los campos "latitud" y "longitud" deben ser valores numéricos.',
        field: 'latitud'
      });
    }

    try {
      const nuevoReporte = await reporteService.createReporte(req.body);
      return res.status(201).json({
        message: 'Reporte creado exitosamente.',
        data: nuevoReporte
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        error: err.message,
        field: err.field || null
      });
    }
  }

  async deleteReporte(req, res) {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'El identificador del reporte es obligatorio.',
        field: 'id'
      });
    }

    try {
      await reporteService.deleteReporte(id);
      return res.status(200).json({
        message: 'Reporte eliminado exitosamente.'
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        error: err.message
      });
    }
  }
}

module.exports = new ReporteController();