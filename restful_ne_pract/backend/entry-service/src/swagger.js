const swaggerJsdoc = require('swagger-jsdoc');

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Entry Service API',
      version: '1.0.0',
      description: 'Car entry/exit, ticket and bill generation',
    },
    servers: [{ url: 'http://localhost:3103' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/index.js'],
});
