module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'XWZ Parking Management System API',
    version: '1.0.0',
    description:
      'Microservices API Gateway for XWZ LTD Parking Management. All requests go through port 3000.',
  },
  servers: [{ url: 'http://localhost:3100', description: 'API Gateway' }],
  tags: [
    { name: 'Auth', description: 'User registration and authentication' },
    { name: 'Parking', description: 'Parking lot management' },
    { name: 'Entry', description: 'Car entry and exit' },
    { name: 'Reports', description: 'Parking reports' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'parking_attendant'] },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['admin', 'parking_attendant'] },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
      Parking: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          totalSpaces: { type: 'integer' },
          availableSpaces: { type: 'integer' },
          location: { type: 'string' },
          feePerHour: { type: 'number' },
        },
      },
      CarEntry: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          plateNumber: { type: 'string' },
          parkingCode: { type: 'string' },
          entryDateTime: { type: 'string', format: 'date-time' },
          exitDateTime: { type: 'string', format: 'date-time', nullable: true },
          chargedAmount: { type: 'number' },
          ticketNumber: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: { 201: { description: 'User registered with JWT token' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: { 200: { description: 'Login successful' } },
      },
    },
    '/api/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email registration using 6-digit OTP code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otpCode'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  otpCode: { type: 'string', minLength: 6, maxLength: 6 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Email verified and session token returned' } },
      },
    },
    '/api/auth/resend-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Resend 6-digit verification code to email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OTP regenerated and sent' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Current user' } },
      },
    },
    '/api/auth/users': {
      get: {
        tags: ['Auth'],
        summary: 'List all users (admin only, paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Paginated user list' } },
      },
    },
    '/api/parkings': {
      get: {
        tags: ['Parking'],
        summary: 'List parkings (paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated parking list' } },
      },
      post: {
        tags: ['Parking'],
        summary: 'Register parking (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Parking' } } },
        },
        responses: { 201: { description: 'Parking created' } },
      },
    },
    '/api/parkings/{code}': {
      get: {
        tags: ['Parking'],
        summary: 'Get parking by code',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Parking details' } },
      },
    },
    '/api/entries': {
      get: {
        tags: ['Entry'],
        summary: 'List car entries (paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'completed'] } },
        ],
        responses: { 200: { description: 'Paginated entries' } },
      },
      post: {
        tags: ['Entry'],
        summary: 'Register car entry and generate ticket',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plateNumber', 'parkingCode'],
                properties: {
                  plateNumber: { type: 'string' },
                  parkingCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Entry created with ticket' } },
      },
    },
    '/api/entries/exit': {
      post: {
        tags: ['Entry'],
        summary: 'Process car exit and generate bill',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ticketNumber: { type: 'string' },
                  plateNumber: { type: 'string' },
                  parkingCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Exit processed with bill' } },
      },
    },
    '/api/entries/{id}/download': {
      get: {
        tags: ['Entry'],
        summary: 'Download a beautifully formatted plain text parking ticket or bill receipt',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Plain text receipt file streamed' } },
      },
    },
    '/api/reports/outgoing': {
      get: {
        tags: ['Reports'],
        summary: 'Outgoing cars report with total charged (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Outgoing report with summary' } },
      },
    },
    '/api/reports/outgoing/download': {
      get: {
        tags: ['Reports'],
        summary: 'Download outgoing cars CSV report (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'CSV file streamed' } },
      },
    },
    '/api/reports/entered': {
      get: {
        tags: ['Reports'],
        summary: 'Entered cars report (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Entered cars report' } },
      },
    },
    '/api/reports/entered/download': {
      get: {
        tags: ['Reports'],
        summary: 'Download entered cars CSV report (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'CSV file streamed' } },
      },
    },
  },
};
