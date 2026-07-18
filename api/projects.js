const db = require('./_db');

module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { user_email, project_name, client_name, data } = req.body;

            if (!user_email || !project_name || !data) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

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

        } else if (req.method === 'GET') {
            const { id, email } = req.query;

            if (id) {
                // LOAD
                if (!email) return res.status(400).json({ error: 'Missing email parameter' });
                const query = `
                    SELECT data, project_name, client_name
                    FROM projects
                    WHERE id = $1 AND user_email = $2;
                `;
                const result = await db.query(query, [id, email]);
                if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
                
                return res.status(200).json({ success: true, project: result.rows[0] });
            } else {
                // LIST
                if (!email) return res.status(400).json({ error: 'Missing email parameter' });
                const query = `
                    SELECT id, project_name, client_name, created_at
                    FROM projects
                    WHERE user_email = $1
                    ORDER BY created_at DESC;
                `;
                const result = await db.query(query, [email]);
                return res.status(200).json({ success: true, projects: result.rows });
            }

        } else if (req.method === 'DELETE') {
            const { id, email } = req.body;

            if (!id || !email) return res.status(400).json({ error: 'Missing required parameters' });

            const query = `
                DELETE FROM projects
                WHERE id = $1 AND user_email = $2
                RETURNING id;
            `;
            const result = await db.query(query, [id, email]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

            return res.status(200).json({ success: true, message: 'Project deleted' });
            
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
};
