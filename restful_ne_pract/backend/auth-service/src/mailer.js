const nodemailer = require('nodemailer');

/**
 * Creates a Nodemailer transporter using Gmail SMTP.
 * Requires SMTP_USER and SMTP_PASS environment variables.
 * SMTP_PASS should be a Gmail App Password (not your regular Gmail password).
 *
 * How to get an App Password:
 * 1. Go to https://myaccount.google.com/security
 * 2. Enable 2-Step Verification
 * 3. Go to App passwords -> Generate one for "Mail"
 * 4. Use that 16-char password as SMTP_PASS
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'agressive.one04@gmail.com',
    pass: process.env.SMTP_PASS, // App Password from Google Account
  },
});

/**
 * Send an OTP verification email.
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} firstName - Recipient first name for personalization
 * @returns {Promise<void>}
 */
async function sendOtpEmail(toEmail, otpCode, firstName = 'User') {
  const mailOptions = {
    from: `"XWZ Parking System" <${process.env.SMTP_USER || 'agressive.one04@gmail.com'}>`,
    to: toEmail,
    subject: '🔐 Your XWZ Parking System Verification Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Email Verification</title>
      </head>
      <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(99,102,241,0.3);border-radius:16px;overflow:hidden;max-width:600px;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
                      🅿️ XWZ Parking System
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                      Kigali Smart Parking Management
                    </p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="margin:0 0 12px;color:#e2e8f0;font-size:22px;font-weight:600;">
                      Verify Your Email Address
                    </h2>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                      Hello <strong style="color:#c7d2fe;">${firstName}</strong>,<br/><br/>
                      Welcome to XWZ Parking System! To complete your registration, please use the verification code below.
                    </p>

                    <!-- OTP Box -->
                    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15));border:2px solid rgba(99,102,241,0.5);border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
                      <div style="font-size:48px;font-weight:800;letter-spacing:12px;color:#a5b4fc;font-family:monospace;">
                        ${otpCode}
                      </div>
                      <p style="margin:12px 0 0;color:#64748b;font-size:13px;">
                        ⏰ This code expires in <strong style="color:#f59e0b;">10 minutes</strong>
                      </p>
                    </div>

                    <p style="margin:24px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
                      If you did not request this code, please ignore this email. Your account will not be activated without verification.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:rgba(0,0,0,0.3);padding:20px 32px;border-top:1px solid rgba(99,102,241,0.2);">
                    <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
                      © ${new Date().getFullYear()} XWZ LTD · Kigali, Rwanda · All rights reserved
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Hello ${firstName},\n\nYour XWZ Parking System verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\n© ${new Date().getFullYear()} XWZ LTD`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send a generic notification email.
 * @param {string} toEmail
 * @param {string} subject
 * @param {string} htmlBody
 * @param {string} textBody
 */
async function sendEmail(toEmail, subject, htmlBody, textBody) {
  const mailOptions = {
    from: `"XWZ Parking System" <${process.env.SMTP_USER || 'agressive.one04@gmail.com'}>`,
    to: toEmail,
    subject,
    html: htmlBody,
    text: textBody,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail, sendEmail, transporter };
