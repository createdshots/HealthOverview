// api/admin/azure-config.js
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Return Azure configuration for frontend
        const config = {
            clientId: process.env.AZURE_CLIENT_ID,
            tenantId: process.env.AZURE_TENANT_ID,
            allowedGroups: process.env.ADMIN_GROUPS 
                ? process.env.ADMIN_GROUPS.split(',').map(g => g.trim())
                : ['HealthOverview-Admins', 'HealthOverview-Moderators', 'HealthOverview-Support']
        };

        // Don't expose the client secret
        res.status(200).json(config);

    } catch (error) {
        console.error('Error getting Azure config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}