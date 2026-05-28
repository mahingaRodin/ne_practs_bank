const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const prisma = require('../../shared/prisma/client');
const { createLogger } = require('../../shared/utils/logger');
const { signToken, authMiddleware, requireRole } = require('../../shared/utils/jwt');
const { AppError, errorHandler, asyncHandler, paginate, paginatedResponse } = require('../../shared/utils/errors');
const { validateRequest } = require('../../shared/utils/helpers');
const swaggerSpec = require('./swagger');
const { sendOtpEmail } = require('./mailer');

const app = express();
const PORT = process.env.AUTH_PORT || 3101;
const logger = createLogger('auth-service');

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
app.post(
  '/api/auth/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['admin', 'parking_attendant']).withMessage('Invalid role'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role = 'parking_attendant' } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already registered', 409);

    const hashed = await bcrypt.hash(password, 12);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: { 
        firstName, 
        lastName, 
        email, 
        password: hashed, 
        role,
        isVerified: false,
        otpCode,
        otpExpiry
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isVerified: true, otpCode: true, createdAt: true },
    });

    // Send OTP via email
    logger.info(`User registered, OTP generated for: ${email}`);
    console.log('\n' + '='.repeat(60));
    console.log(`✉️  SENDING OTP EMAIL TO: ${email}`);
    console.log(`🔑  OTP CODE (backup): \x1b[36m${otpCode}\x1b[0m`);
    console.log('='.repeat(60) + '\n');

    try {
      await sendOtpEmail(email, otpCode, firstName);
      logger.info(`OTP email sent successfully to: ${email}`);
    } catch (emailErr) {
      logger.error(`Failed to send OTP email to ${email}: ${emailErr.message}`);
      // Don't block registration — user can still see OTP in server logs (dev mode)
    }

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful. Check your email for the OTP verification code.', 
      data: { 
        email: user.email
      } 
    });
  })
);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify email using OTP code
 *     tags: [Auth]
 */
app.post(
  '/api/auth/verify-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otpCode').isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 digits'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, otpCode } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    if (user.isVerified) {
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      return res.json({
        success: true,
        message: 'Email already verified',
        data: {
          user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
          token
        }
      });
    }

    if (user.otpCode !== otpCode) {
      throw new AppError('Invalid OTP verification code', 400);
    }

    if (new Date() > new Date(user.otpExpiry)) {
      throw new AppError('OTP verification code has expired. Please request a new one.', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null
      }
    });

    const token = signToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });
    logger.info(`User email verified: ${email}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: { 
          id: updatedUser.id, 
          firstName: updatedUser.firstName, 
          lastName: updatedUser.lastName, 
          email: updatedUser.email, 
          role: updatedUser.role 
        },
        token
      }
    });
  })
);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP code
 *     tags: [Auth]
 */
app.post(
  '/api/auth/resend-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    if (user.isVerified) {
      throw new AppError('Email is already verified', 400);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiry
      }
    });

    logger.info(`Resending OTP to: ${email}`);
    console.log('\n' + '='.repeat(60));
    console.log(`✉️  RESENDING OTP EMAIL TO: ${email}`);
    console.log(`🔑  NEW OTP CODE (backup): \x1b[36m${otpCode}\x1b[0m`);
    console.log('='.repeat(60) + '\n');

    try {
      await sendOtpEmail(email, otpCode, user.firstName);
      logger.info(`OTP resend email sent successfully to: ${email}`);
    } catch (emailErr) {
      logger.error(`Failed to resend OTP email to ${email}: ${emailErr.message}`);
    }

    res.json({
      success: true,
      message: 'New OTP verification code has been sent to your email.',
      data: {
        email: user.email
      }
    });
  })
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
app.post(
  '/api/auth/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid email or password', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid email or password', 401);

    if (!user.isVerified) {
      throw new AppError('Email is not verified. Please verify your email first.', 403);
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
        token,
      },
    });
  })
);

app.get(
  '/api/auth/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user });
  })
);

app.get(
  '/api/auth/users',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    res.json(paginatedResponse(users, total, page, limit));
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

app.use(errorHandler(logger));

app.listen(PORT, () => logger.info(`Auth service running on port ${PORT}`));
