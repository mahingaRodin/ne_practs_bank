const swaggerJsdoc = require('swagger-jsdoc');

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Parking Service API',
      version: '1.0.0',
      description: 'Parking lot registration and availability',
    },
    servers: [{ url: 'http://localhost:3102' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/index.js'],
});
