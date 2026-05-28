const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { query } = require('express-validator');
const prisma = require('../../shared/prisma/client');
const { createLogger } = require('../../shared/utils/logger');
const { authMiddleware, requireRole } = require('../../shared/utils/jwt');
const { AppError, errorHandler, asyncHandler, paginate, paginatedResponse } = require('../../shared/utils/errors');
const { validateRequest } = require('../../shared/utils/helpers');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.REPORT_PORT || 3104;
const logger = createLogger('report-service');

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function parseDateRange(startDate, endDate) {
  if (!startDate || !endDate) throw new AppError('startDate and endDate query parameters are required', 400);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new AppError('Invalid date format', 400);
  if (start > end) throw new AppError('startDate must be before endDate', 400);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function toCsvValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

app.get(
  '/api/reports/outgoing',
  authMiddleware,
  requireRole('admin'),
  [
    query('startDate').notEmpty().withMessage('startDate is required'),
    query('endDate').notEmpty().withMessage('endDate is required'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { start, end } = parseDateRange(req.query.startDate, req.query.endDate);
    const { page, limit } = paginate(req.query.page, req.query.limit);

    const where = {
      exitDateTime: { not: null, gte: start, lte: end },
    };

    const [entries, total, aggregate] = await Promise.all([
      prisma.carEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { parking: { select: { name: true, location: true } } },
        orderBy: { exitDateTime: 'desc' },
      }),
      prisma.carEntry.count({ where }),
      prisma.carEntry.aggregate({
        where,
        _sum: { chargedAmount: true },
      }),
    ]);

    logger.info(`Outgoing report: ${start.toISOString()} to ${end.toISOString()}, ${total} records`);

    res.json({
      ...paginatedResponse(entries, total, page, limit),
      summary: {
        startDate: start,
        endDate: end,
        totalRecords: total,
        totalAmountCharged: aggregate._sum.chargedAmount || 0,
      },
    });
  })
);

app.get(
  '/api/reports/outgoing/download',
  authMiddleware,
  requireRole('admin'),
  [
    query('startDate').notEmpty().withMessage('startDate is required'),
    query('endDate').notEmpty().withMessage('endDate is required'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { start, end } = parseDateRange(req.query.startDate, req.query.endDate);

    const where = {
      exitDateTime: { not: null, gte: start, lte: end },
    };

    const entries = await prisma.carEntry.findMany({
      where,
      include: { parking: { select: { name: true, location: true } } },
      orderBy: { exitDateTime: 'desc' },
    });

    const csvRows = [
      ['Ticket Number', 'Plate Number', 'Parking Code', 'Parking Name', 'Location', 'Entry Time', 'Exit Time', 'Charged Amount (RWF)'].map(toCsvValue).join(',')
    ];

    for (const entry of entries) {
      csvRows.push([
        entry.ticketNumber,
        entry.plateNumber,
        entry.parkingCode,
        entry.parking.name,
        entry.parking.location,
        entry.entryDateTime.toISOString(),
        entry.exitDateTime.toISOString(),
        entry.chargedAmount
      ].map(toCsvValue).join(','));
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=outgoing_report_${req.query.startDate}_to_${req.query.endDate}.csv`);
    logger.info(`Outgoing report CSV downloaded: ${start.toISOString()} to ${end.toISOString()}, ${entries.length} records`);
    res.status(200).send(csvContent);
  })
);

app.get(
  '/api/reports/entered',
  authMiddleware,
  requireRole('admin'),
  [
    query('startDate').notEmpty().withMessage('startDate is required'),
    query('endDate').notEmpty().withMessage('endDate is required'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { start, end } = parseDateRange(req.query.startDate, req.query.endDate);
    const { page, limit } = paginate(req.query.page, req.query.limit);

    const where = {
      entryDateTime: { gte: start, lte: end },
    };

    const [entries, total] = await Promise.all([
      prisma.carEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { parking: { select: { name: true, location: true } } },
        orderBy: { entryDateTime: 'desc' },
      }),
      prisma.carEntry.count({ where }),
    ]);

    logger.info(`Entered report: ${start.toISOString()} to ${end.toISOString()}, ${total} records`);

    res.json({
      ...paginatedResponse(entries, total, page, limit),
      summary: {
        startDate: start,
        endDate: end,
        totalRecords: total,
      },
    });
  })
);

app.get(
  '/api/reports/entered/download',
  authMiddleware,
  requireRole('admin'),
  [
    query('startDate').notEmpty().withMessage('startDate is required'),
    query('endDate').notEmpty().withMessage('endDate is required'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { start, end } = parseDateRange(req.query.startDate, req.query.endDate);

    const where = {
      entryDateTime: { gte: start, lte: end },
    };

    const entries = await prisma.carEntry.findMany({
      where,
      include: { parking: { select: { name: true, location: true } } },
      orderBy: { entryDateTime: 'desc' },
    });

    const csvRows = [
      ['Ticket Number', 'Plate Number', 'Parking Code', 'Parking Name', 'Location', 'Entry Time', 'Status'].map(toCsvValue).join(',')
    ];

    for (const entry of entries) {
      csvRows.push([
        entry.ticketNumber,
        entry.plateNumber,
        entry.parkingCode,
        entry.parking.name,
        entry.parking.location,
        entry.entryDateTime.toISOString(),
        entry.exitDateTime ? 'Exited' : 'Still Parked'
      ].map(toCsvValue).join(','));
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=entered_report_${req.query.startDate}_to_${req.query.endDate}.csv`);
    logger.info(`Entered report CSV downloaded: ${start.toISOString()} to ${end.toISOString()}, ${entries.length} records`);
    res.status(200).send(csvContent);
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'report-service' }));

app.use(errorHandler(logger));

app.listen(PORT, () => logger.info(`Report service running on port ${PORT}`));
