const { app } = require('@azure/functions');

app.http('ping', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Ping function processed a request.');

        const serverTime = new Date().toISOString();
        // Since we are deploying to East US 2, we can hardcode this or use process.env.REGION_NAME if available
        const region = process.env.REGION_NAME || "East US 2 (Azure Static Web Apps Managed)";

        return {
            status: 200,
            jsonBody: {
                message: "Success! Direct connection to Azure Serverless Backend established.",
                serverTime: serverTime,
                region: region,
                architecture: process.arch,
                platform: process.platform,
                nodeVersion: process.version
            }
        };
    }
});
