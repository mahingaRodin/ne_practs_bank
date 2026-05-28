const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
const { createLogger } = require('../../shared/utils/logger');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3100;
const logger = createLogger('api-gateway');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3101',
  parking: process.env.PARKING_SERVICE_URL || 'http://localhost:3102',
  entry: process.env.ENTRY_SERVICE_URL || 'http://localhost:3103',
  report: process.env.REPORT_SERVICE_URL || 'http://localhost:3104',
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: 'Too many requests, please try again later' },
  })
);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    services: Object.keys(services),
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function proxyOptions(target, serviceName, basePath) {
  return {
    target,
    changeOrigin: true,
    pathRewrite: (path) => `${basePath}${path}`,
    on: {
      error: (err, req, res) => {
        logger.error(`Proxy error [${serviceName}]: ${err.message}`);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: `${serviceName} is unavailable. Ensure all services are running.`,
          });
        }
      },
    },
  };
}

app.use('/api/auth', createProxyMiddleware(proxyOptions(services.auth, 'auth-service', '/api/auth')));
app.use('/api/parkings', createProxyMiddleware(proxyOptions(services.parking, 'parking-service', '/api/parkings')));
app.use('/api/entries', createProxyMiddleware(proxyOptions(services.entry, 'entry-service', '/api/entries')));
app.use('/api/reports', createProxyMiddleware(proxyOptions(services.report, 'report-service', '/api/reports')));

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`API Gateway running on http://localhost:${PORT}`);
  logger.info(`Swagger UI: http://localhost:${PORT}/api-docs`);
});
