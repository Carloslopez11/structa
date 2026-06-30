const db = require('../_db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { serialize } = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET || 'structa-fallback-secret-key-1234';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const userResult = await db.query('SELECT email, password_hash, is_pro FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    // Verify password
    if (!user.password_hash) {
       return res.status(401).json({ error: 'Cuenta no tiene contraseña configurada. Por favor regístrese.'});
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Create JWT
    const token = jwt.sign({ email: user.email, isPro: user.is_pro }, JWT_SECRET, { expiresIn: '7d' });

    // Set HTTPOnly cookie
    res.setHeader('Set-Cookie', serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }));

    res.status(200).json({ message: 'Login exitoso', email: user.email, isPro: user.is_pro });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
