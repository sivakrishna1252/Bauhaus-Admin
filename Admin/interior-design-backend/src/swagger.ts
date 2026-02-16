import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Interior Design Client Portal API',
            version: '1.0.0',
            description: 'API documentation for the Interior Design firm backend system.',
        },
        servers: [
            {
                url: 'http://72.60.219.145:5004',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./src/modules/**/*.routes.ts', './src/index.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
