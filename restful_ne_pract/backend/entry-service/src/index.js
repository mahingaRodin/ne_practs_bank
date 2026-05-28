const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { body } = require('express-validator');
const prisma = require('../../shared/prisma/client');
const { createLogger } = require('../../shared/utils/logger');
const { authMiddleware, requireRole } = require('../../shared/utils/jwt');
const { AppError, errorHandler, asyncHandler, paginate, paginatedResponse } = require('../../shared/utils/errors');
const { validateRequest, calculateCharge, generateTicketNumber } = require('../../shared/utils/helpers');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.ENTRY_PORT || 3103;
const logger = createLogger('entry-service');

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post(
  '/api/entries',
  authMiddleware,
  requireRole('admin', 'parking_attendant'),
  [
    body('plateNumber').trim().notEmpty().withMessage('Plate number is required'),
    body('parkingCode').trim().notEmpty().withMessage('Parking code is required'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const plateNumber = req.body.plateNumber.trim().toUpperCase();
    const parkingCode = req.body.parkingCode.trim().toUpperCase();

    const parking = await prisma.parking.findUnique({ where: { code: parkingCode } });
    if (!parking) throw new AppError('Parking not found', 404);
    if (parking.availableSpaces <= 0) throw new AppError('No available spaces in this parking', 400);

    const activeEntry = await prisma.carEntry.findFirst({
      where: { plateNumber, parkingCode, exitDateTime: null },
    });
    if (activeEntry) throw new AppError('Vehicle already has an active entry in this parking', 409);

    const ticketNumber = generateTicketNumber();
    const entryDateTime = req.body.entryDateTime ? new Date(req.body.entryDateTime) : new Date();

    const [entry] = await prisma.$transaction([
      prisma.carEntry.create({
        data: {
          plateNumber,
          parkingCode,
          entryDateTime,
          exitDateTime: null,
          chargedAmount: 0,
          ticketNumber,
        },
        include: { parking: true },
      }),
      prisma.parking.update({
        where: { code: parkingCode },
        data: { availableSpaces: { decrement: 1 } },
      }),
    ]);

    logger.info(`Car entry: ${plateNumber} at ${parkingCode}, ticket ${ticketNumber}`);

    res.status(201).json({
      success: true,
      message: 'Car entry registered successfully',
      data: {
        entry,
        ticket: {
          ticketNumber: entry.ticketNumber,
          plateNumber: entry.plateNumber,
          parkingCode: entry.parkingCode,
          parkingName: entry.parking.name,
          location: entry.parking.location,
          entryDateTime: entry.entryDateTime,
          feePerHour: entry.parking.feePerHour,
        },
      },
    });
  })
);

app.post(
  '/api/entries/exit',
  authMiddleware,
  requireRole('admin', 'parking_attendant'),
  [
    body('ticketNumber').optional().trim(),
    body('plateNumber').optional().trim(),
    body('parkingCode').optional().trim(),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { ticketNumber, plateNumber, parkingCode } = req.body;

    if (!ticketNumber && !plateNumber) {
      throw new AppError('Provide ticket number or plate number', 400);
    }

    const where = ticketNumber
      ? { ticketNumber, exitDateTime: null }
      : {
          plateNumber: plateNumber.trim().toUpperCase(),
          exitDateTime: null,
          ...(parkingCode && { parkingCode: parkingCode.trim().toUpperCase() }),
        };

    const entry = await prisma.carEntry.findFirst({
      where,
      include: { parking: true },
    });

    if (!entry) throw new AppError('Active car entry not found', 404);

    const exitDateTime = new Date();
    const chargedAmount = calculateCharge(entry.entryDateTime, exitDateTime, entry.parking.feePerHour);
    const durationMs = exitDateTime - new Date(entry.entryDateTime);
    const hoursParked = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));

    const [updatedEntry] = await prisma.$transaction([
      prisma.carEntry.update({
        where: { id: entry.id },
        data: { exitDateTime, chargedAmount },
        include: { parking: true },
      }),
      prisma.parking.update({
        where: { code: entry.parkingCode },
        data: { availableSpaces: { increment: 1 } },
      }),
    ]);

    logger.info(`Car exit: ${entry.plateNumber}, charged ${chargedAmount} RWF`);

    res.json({
      success: true,
      message: 'Car exit processed successfully',
      data: {
        entry: updatedEntry,
        bill: {
          ticketNumber: updatedEntry.ticketNumber,
          plateNumber: updatedEntry.plateNumber,
          parkingCode: updatedEntry.parkingCode,
          parkingName: updatedEntry.parking.name,
          entryDateTime: updatedEntry.entryDateTime,
          exitDateTime: updatedEntry.exitDateTime,
          hoursParked,
          feePerHour: updatedEntry.parking.feePerHour,
          chargedAmount: updatedEntry.chargedAmount,
        },
      },
    });
  })
);

app.get(
  '/api/entries',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const status = req.query.status;

    const where = {};
    if (status === 'active') where.exitDateTime = null;
    if (status === 'completed') where.exitDateTime = { not: null };

    const [entries, total] = await Promise.all([
      prisma.carEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { parking: { select: { name: true, location: true, feePerHour: true } } },
        orderBy: { entryDateTime: 'desc' },
      }),
      prisma.carEntry.count({ where }),
    ]);

    res.json(paginatedResponse(entries, total, page, limit));
  })
);

app.get(
  '/api/entries/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const entry = await prisma.carEntry.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: { parking: true },
    });
    if (!entry) throw new AppError('Entry not found', 404);
    res.json({ success: true, data: entry });
  })
);

app.get(
  '/api/entries/:id/download',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const entry = await prisma.carEntry.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: { parking: true },
    });
    if (!entry) throw new AppError('Entry not found', 404);

    let receiptContent = '';
    const border = '='.repeat(46);
    const dashBorder = '-'.repeat(46);

    const padLine = (label, value) => {
      const spacing = 46 - label.length - value.length;
      return spacing > 0 ? `${label}${' '.repeat(spacing)}${value}` : `${label} ${value}`;
    };

    if (!entry.exitDateTime) {
      // Vehicle is currently parked (Ticket Generation)
      receiptContent = [
        border,
        '               XWZ PARKING LTD',
        '             KIGALI, RWANDA',
        border,
        '               PARKING TICKET',
        border,
        padLine('TICKET NO:', entry.ticketNumber),
        padLine('PLATE NO:', entry.plateNumber),
        padLine('PARKING CODE:', entry.parkingCode),
        padLine('PARKING NAME:', entry.parking.name),
        padLine('LOCATION:', entry.parking.location),
        padLine('ENTRY TIME:', new Date(entry.entryDateTime).toLocaleString()),
        padLine('FEE PER HOUR:', `${entry.parking.feePerHour} RWF`),
        border,
        '        Please keep this ticket safe.',
        '    You will need it to process your exit.',
        border
      ].join('\n');
    } else {
      // Vehicle has exited (Receipt/Bill Generation)
      const durationMs = new Date(entry.exitDateTime) - new Date(entry.entryDateTime);
      const hoursParked = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));

      receiptContent = [
        border,
        '               XWZ PARKING LTD',
        '             KIGALI, RWANDA',
        border,
        '               PARKING BILL',
        border,
        padLine('TICKET NO:', entry.ticketNumber),
        padLine('PLATE NO:', entry.plateNumber),
        padLine('PARKING CODE:', entry.parkingCode),
        padLine('PARKING NAME:', entry.parking.name),
        padLine('LOCATION:', entry.parking.location),
        padLine('ENTRY TIME:', new Date(entry.entryDateTime).toLocaleString()),
        padLine('EXIT TIME:', new Date(entry.exitDateTime).toLocaleString()),
        padLine('DURATION:', `${hoursParked} Hour(s)`),
        padLine('FEE PER HOUR:', `${entry.parking.feePerHour} RWF`),
        dashBorder,
        padLine('TOTAL CHARGED:', `${entry.chargedAmount} RWF`),
        border,
        '      Thank you for choosing XWZ Parking!',
        '                 Drive safely.',
        border
      ].join('\n');
    }

    res.setHeader('Content-Type', 'text/plain');
    const filename = `receipt_${entry.ticketNumber}.txt`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    logger.info(`Downloaded ticket receipt ${entry.ticketNumber} (exited: ${!!entry.exitDateTime})`);
    res.status(200).send(receiptContent);
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'entry-service' }));

app.use(errorHandler(logger));

app.listen(PORT, () => logger.info(`Entry service running on port ${PORT}`));
