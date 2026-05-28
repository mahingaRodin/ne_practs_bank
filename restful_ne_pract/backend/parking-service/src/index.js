const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { body } = require('express-validator');
const prisma = require('../../shared/prisma/client');
const { createLogger } = require('../../shared/utils/logger');
const { authMiddleware, requireRole } = require('../../shared/utils/jwt');
const { AppError, errorHandler, asyncHandler, paginate, paginatedResponse } = require('../../shared/utils/errors');
const { validateRequest } = require('../../shared/utils/helpers');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PARKING_PORT || 3102;
const logger = createLogger('parking-service');

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post(
  '/api/parkings',
  authMiddleware,
  requireRole('admin'),
  [
    body('code').trim().notEmpty().withMessage('Parking code is required'),
    body('name').trim().notEmpty().withMessage('Parking name is required'),
    body('totalSpaces').isInt({ min: 1 }).withMessage('Total spaces must be at least 1'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('feePerHour').isFloat({ min: 0 }).withMessage('Fee per hour must be non-negative'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { code, name, totalSpaces, location, feePerHour } = req.body;

    const existing = await prisma.parking.findUnique({ where: { code } });
    if (existing) throw new AppError('Parking code already exists', 409);

    const parking = await prisma.parking.create({
      data: {
        code: code.toUpperCase(),
        name,
        totalSpaces,
        availableSpaces: totalSpaces,
        location,
        feePerHour,
      },
    });

    logger.info(`Parking registered: ${code} by admin ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Parking registered successfully', data: parking });
  })
);

app.get(
  '/api/parkings',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const search = req.query.search?.trim();

    const where = search
      ? {
          OR: [
            { code: { contains: search } },
            { name: { contains: search } },
            { location: { contains: search } },
          ],
        }
      : {};

    const [parkings, total] = await Promise.all([
      prisma.parking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.parking.count({ where }),
    ]);

    res.json(paginatedResponse(parkings, total, page, limit));
  })
);

app.get(
  '/api/parkings/:code',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const parking = await prisma.parking.findUnique({
      where: { code: req.params.code.toUpperCase() },
    });
    if (!parking) throw new AppError('Parking not found', 404);
    res.json({ success: true, data: parking });
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'parking-service' }));

app.use(errorHandler(logger));

app.listen(PORT, () => logger.info(`Parking service running on port ${PORT}`));
