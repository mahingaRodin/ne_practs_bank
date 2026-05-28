const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

function calculateCharge(entryDateTime, exitDateTime, feePerHour) {
  const ms = new Date(exitDateTime) - new Date(entryDateTime);
  const hours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
  return hours * feePerHour;
}

function generateTicketNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${ts}-${rand}`;
}

module.exports = { validateRequest, calculateCharge, generateTicketNumber };
