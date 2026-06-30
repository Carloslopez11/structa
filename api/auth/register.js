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
    // Check if user exists
    const existing = await db.query('SELECT email FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Auto-migrate (safe to run multiple times, only runs on register)
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
    } catch (e) {
      console.log('Migration skipped/failed:', e);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    await db.query(
      'INSERT INTO users (email, count, is_pro, password_hash) VALUES ($1, 0, false, $2)',
      [email, passwordHash]
    );

    // Create JWT
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });

    // Set HTTPOnly cookie
    res.setHeader('Set-Cookie', serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }));

    res.status(201).json({ message: 'Usuario registrado exitosamente', email });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
