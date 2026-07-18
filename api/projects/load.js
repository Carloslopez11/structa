const db = require('../_db');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id, email } = req.query;

        if (!id || !email) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const query = `
            SELECT data, project_name, client_name
            FROM projects
            WHERE id = $1 AND user_email = $2;
        `;
        
        const result = await db.query(query, [id, email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        return res.status(200).json({
            success: true,
            project: result.rows[0]
        });

    } catch (error) {
        console.error('Error loading project:', error);
        return res.status(500).json({ error: 'Error loading project from database' });
    }
};
