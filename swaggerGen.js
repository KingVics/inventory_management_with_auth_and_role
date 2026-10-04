import swaggerAutogen from 'swagger-autogen';
const autogenInstance = swaggerAutogen(); // Leave this empty

const doc = {
    info: {
        title: 'Inventory Management System API',
        description: 'API documentation for the Inventory Management System',
        version: '1.0.0'
    },
    host: 'localhost:3000',
    schemes: ['http'],
    // SWAGGER 2.0 AUTHENTICATION: Change "components.securitySchemes" to this:
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Enter your JWT token in this format: Bearer <your_token_here>'
        }
    },
    // Keep this to apply it globally to all generated endpoints
    security: [
        {
            bearerAuth: []
        }
    ]
};

const outputFile = '../swagger.json';
const endpointsFiles = ['./server.js', './route/*.js'];

autogenInstance(outputFile, endpointsFiles, doc);
