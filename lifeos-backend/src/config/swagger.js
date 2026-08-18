const swaggerJsdoc = require('swagger-jsdoc');
const { env } = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LifeOS API',
      version: '1.0.0',
      description: 'API Documentation for LifeOS - Personal Productivity & Life Management Platform',
      contact: {
        name: 'Developer',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Development server',
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'], // Path to the API docs (assuming you add swagger annotations there)
};

const specs = swaggerJsdoc(options);

module.exports = specs;
