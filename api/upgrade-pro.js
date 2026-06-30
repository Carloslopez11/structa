const db = require('./_db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required to upgrade" });

    // Upsert user to true
    let userResult = await db.query('SELECT email FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
        await db.query('INSERT INTO users (email, count, is_pro) VALUES ($1, 0, true)', [email]);
    } else {
        await db.query('UPDATE users SET is_pro = true WHERE email = $1', [email]);
    }

    res.status(200).json({ message: `Success! ${email} upgraded to Pro.` });
  } catch (error) {
    console.error("Error upgrading user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
