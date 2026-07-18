const db = require('../_db');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Missing email parameter' });
        }

        const query = `
            SELECT id, project_name, client_name, created_at
            FROM projects
            WHERE user_email = $1
            ORDER BY created_at DESC;
        `;
        
        const result = await db.query(query, [email]);

        return res.status(200).json({
            success: true,
            projects: result.rows
        });

    } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ error: 'Error fetching projects from database' });
    }
};
