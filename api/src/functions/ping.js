const { app } = require('@azure/functions');

app.http('ping', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': 'https://gpz03.github.io',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };

        if (request.method === 'OPTIONS') {
            return {
                status: 204,
                headers: corsHeaders
            };
        }

        context.log('Ping function processed a request.');

        const serverTime = new Date().toISOString();
        const region = process.env.REGION_NAME || "East US 2 (Azure Static Web Apps Managed)";

        return {
            status: 200,
            headers: corsHeaders,
            jsonBody: {
                message: "Success! Direct connection to Azure Serverless Backend established.",
                serverTime: serverTime,
                region: region,
                architecture: process.arch,
                platform: process.platform,
                nodeVersion: process.version,
                githubPatConfigured: !!process.env.GITHUB_PAT
            }
        };
    }
});
