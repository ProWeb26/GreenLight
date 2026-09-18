const authService = require('../services/authService');

class AuthController {
  async login(req, res) {
    const { username, password } = req.body || {};

    if (username === undefined || username === null || typeof username !== 'string') {
      return res.status(400).json({
        error: 'El campo "username" es obligatorio y debe ser una cadena de texto.',
        field: 'username'
      });
    }

    if (password === undefined || password === null || typeof password !== 'string') {
      return res.status(400).json({
        error: 'El campo "password" es obligatorio y debe ser una cadena de texto.',
        field: 'password'
      });
    }

    try {
      const session = authService.login(username, password);
      return res.status(200).json({
        message: 'Inicio de sesión exitoso.',
        ...session
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        error: err.message,
        field: err.statusCode === 401 ? 'password' : null
      });
    }
  }
}

module.exports = new AuthController();