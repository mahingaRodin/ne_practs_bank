const swaggerJsdoc = require('swagger-jsdoc');

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Report Service API',
      version: '1.0.0',
      description: 'Parking reports with date range filtering',
    },
    servers: [{ url: 'http://localhost:3104' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/index.js'],
});
