import swaggerAutogen from 'swagger-autogen';
const autogenInstance = swaggerAutogen({ openapi: '3.0.0' });

const doc = {
    info: {
        title: 'Inventory Management System API',
        description: 'API documentation for the Inventory Management System',
        version: '1.0.0'
    },
    host: 'localhost:3000',
    schemes: ['http'],
    securityDefinitions: {
        sessionCookie: {
            type: 'apiKey',
            in: 'cookie',
            name: 'inventory.sid',
            description: 'Passport session cookie set after GitHub sign-in'
        }
    },
    security: [
        {
            sessionCookie: []
        }
    ]
};

const outputFile = '../swagger.json';
const endpointsFiles = ['./server.js', './route/*.js'];

autogenInstance(outputFile, endpointsFiles, doc);
