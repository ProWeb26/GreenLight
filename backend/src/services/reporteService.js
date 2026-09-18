const reporteRepository = require('../repositories/reporteRepository');

class ReporteService {
  async getAllReportes() {
    return await reporteRepository.findAll();
  }

  async createReporte(data) {
    const ubicacionLimpia = data.ubicacion_texto.trim().replace(/\s+/g, ' ');

    if (ubicacionLimpia.length < 5) {
      const error = new Error('La descripción de la ubicación debe tener al menos 5 caracteres.');
      error.statusCode = 422;
      error.field = 'ubicacion_texto';
      throw error;
    }

    const latitud = Number(data.latitud);
    const longitud = Number(data.longitud);

    if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
      const error = new Error('Coordenadas geográficas fuera del rango permitido.');
      error.statusCode = 422;
      error.field = 'latitud';
      throw error;
    }

    return await reporteRepository.create({
      ...data,
      ubicacion_texto: ubicacionLimpia
    });
  }

  async deleteReporte(id) {
    const existe = await reporteRepository.findById(id);
    if (!existe) {
      const error = new Error(`El reporte con ID ${id} no existe.`);
      error.statusCode = 404;
      error.field = 'id';
      throw error;
    }
    return await reporteRepository.delete(id);
  }
}

module.exports = new ReporteService();