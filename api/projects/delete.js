const db = require('../_db');

module.exports = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id, email } = req.body;

        if (!id || !email) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const query = `
            DELETE FROM projects
            WHERE id = $1 AND user_email = $2
            RETURNING id;
        `;
        
        const result = await db.query(query, [id, email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        return res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({ error: 'Error deleting project from database' });
    }
};
