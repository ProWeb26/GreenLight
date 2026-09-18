const db = require('../config/db');

class ReporteRepository {
  async findAll() {
    const query = `SELECT * FROM reporte ORDER BY fecha_creacion DESC;`;
    const { rows } = await db.query(query);
    return rows;
  }

  async findById(id) {
    const query = `SELECT * FROM reporte WHERE id = $1;`;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  async create({ comunidad_id, usuario_id, tipo_id, ubicacion_texto, latitud, longitud, descripcion, foto_url }) {
    const query = `
      INSERT INTO reporte (comunidad_id, usuario_id, tipo_id, ubicacion_texto, latitud, longitud, descripcion, foto_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [comunidad_id, usuario_id, tipo_id, ubicacion_texto, latitud, longitud, descripcion, foto_url];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM reporte WHERE id = $1 RETURNING id;`;
    const { rows } = await db.query(query, [id]);
    return rows.length > 0;
  }
}

module.exports = new ReporteRepository();