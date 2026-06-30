const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'structa-fallback-secret-key-1234';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/token=([^;]+)/);
    
    if (!tokenMatch) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const token = tokenMatch[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    res.status(200).json({ email: decoded.email, isPro: decoded.isPro });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}
