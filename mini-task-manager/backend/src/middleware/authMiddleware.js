const authService = require('../services/authService');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Se requiere un token de acceso.',
      field: 'authorization'
    });
  }

  const token = header.slice(7);

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(err.statusCode || 401).json({
      error: err.message,
      field: 'authorization'
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere el rol "${role}".`
      });
    }
    return next();
  };
}

module.exports = { authMiddleware, requireRole };