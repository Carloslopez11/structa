const db = require('../_db');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { user_email, project_name, client_name, data } = req.body;

        if (!user_email || !project_name || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Insert new project
        const query = `
            INSERT INTO projects (user_email, project_name, client_name, data)
            VALUES ($1, $2, $3, $4)
            RETURNING id, created_at;
        `;
        
        const values = [user_email, project_name, client_name || '', JSON.stringify(data)];
        const result = await db.query(query, values);

        return res.status(200).json({
            success: true,
            project: {
                id: result.rows[0].id,
                created_at: result.rows[0].created_at
            }
        });

    } catch (error) {
        console.error('Error saving project:', error);
        return res.status(500).json({ error: 'Error saving project to database' });
    }
};
