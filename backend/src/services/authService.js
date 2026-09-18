const jwt = require('jsonwebtoken');
const { MOCK_USERS } = require('../data/mockUsers');

class AuthService {
  login(username, password) {
    const user = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      const error = new Error('Credenciales inválidas. Verifique usuario y contraseña.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      nombre: user.nombre
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nombre: user.nombre
      }
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const error = new Error('Token inválido o expirado.');
      error.statusCode = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }
  }
}

module.exports = new AuthService();