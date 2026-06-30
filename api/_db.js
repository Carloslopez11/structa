const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  // Add ssl configuration if needed, usually Contabo doesn't require it unless configured
});

// Auto-migration: ensure password_hash column exists
async function ensureSchema() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `);
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// Fire migration immediately
ensureSchema();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
