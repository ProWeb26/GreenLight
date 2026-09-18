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

  async getSummary() {
    const query = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'activo')::int AS activos,
        COUNT(*) FILTER (WHERE estado <> 'activo')::int AS cerrados,
        COUNT(*) FILTER (WHERE date_trunc('month', fecha_creacion) = date_trunc('month', CURRENT_TIMESTAMP))::int AS este_mes
      FROM reporte;
    `;
    const { rows } = await db.query(query);
    return rows[0];
  }

  async countByEstado() {
    const query = `
      SELECT estado, COUNT(*)::int AS total
      FROM reporte
      GROUP BY estado
      ORDER BY total DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
  }

  async countByMonth(limit = 6) {
    const query = `
      SELECT
        to_char(fecha_creacion, 'YYYY-MM') AS mes,
        COUNT(*)::int AS total
      FROM reporte
      GROUP BY to_char(fecha_creacion, 'YYYY-MM')
      ORDER BY mes DESC
      LIMIT $1;
    `;
    const { rows } = await db.query(query, [limit]);
    return rows.reverse();
  }

  async findRecent(limit = 5) {
    const query = `
      SELECT id, ubicacion_texto, tipo_id, descripcion, estado, fecha_creacion
      FROM reporte
      ORDER BY fecha_creacion DESC
      LIMIT $1;
    `;
    const { rows } = await db.query(query, [limit]);
    return rows;
  }
}

module.exports = new ReporteRepository();