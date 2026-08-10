/**
 * Nodemailer Email Service for Billing Platform
 * Handles real SMTP email sending configured via environment variables.
 */

const nodemailer = require('nodemailer');

// Configure SMTP Transporter using environment variables
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASSWORD || '';
  const fromName = process.env.EMAIL_FROM_NAME || 'Billing Platform';
  const fromEmail = process.env.EMAIL_FROM || user;

  if (!user || !pass) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
  });

  return { transporter, fromAddress: `"${fromName}" <${fromEmail}>` };
};

/**
 * Send OTP Verification Email using Nodemailer
 */
const sendOTPEmailNodemailer = async (toEmail, firstName, otp) => {
  const { transporter, fromAddress } = createTransporter();

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: 'Your Billing Platform verification code',
    text: `Hi ${firstName},\n\nYour email verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\n🔒 Security Notice: Never share this code with anyone.\n\n— Billing Platform Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 0; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px; text-align: center;">
            <div style="margin-bottom: 8px;"><span style="display:inline-block; padding: 6px 16px; background: rgba(255,255,255,0.2); border-radius: 8px; color: white; font-weight: bold; font-size: 18px;">[LOGO] BILLING PLATFORM</span></div>
            <h2 style="color: white; margin: 0; font-size: 20px;">Verification Code</h2>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 16px; color: #0f172a; font-weight: bold;">Hi ${firstName},</p>
            <p style="color: #475569; font-size: 14px;">Use the verification code below to confirm your account:</p>
            <div style="text-align: center; background: #f1f5f9; padding: 20px; border-radius: 12px; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #2563eb; font-family: monospace; margin: 24px 0; border: 1px solid #cbd5e1;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #64748b; text-align: center; font-weight: bold;">⏱️ Expires in 10 minutes</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #991b1b;">🔒 Security Warning: Never share this code with anyone.</p>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">© 2026 Billing Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send Welcome Email using Nodemailer
 */
const sendWelcomeEmailNodemailer = async (toEmail, firstName) => {
  const { transporter, fromAddress } = createTransporter();

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: 'Welcome to Billing Platform!',
    text: `Hi ${firstName},\n\nYour account has been verified successfully. Welcome to Billing Platform!\n\nLog in at: http://localhost:5173/login\n\n— Billing Platform Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 0; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px; text-align: center;">
            <div style="margin-bottom: 8px;"><span style="display:inline-block; padding: 6px 16px; background: rgba(255,255,255,0.2); border-radius: 8px; color: white; font-weight: bold; font-size: 18px;">[LOGO] BILLING PLATFORM</span></div>
            <h2 style="color: white; margin: 0; font-size: 20px;">Account Verified</h2>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 16px; color: #0f172a; font-weight: bold;">Welcome, ${firstName}! 🎉</p>
            <p style="color: #475569; font-size: 14px;">Your email has been verified successfully and your account is active.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="http://localhost:5173/login" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Sign In Now</a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">© 2026 Billing Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send Profile Incomplete Email using Nodemailer
 */
const sendProfileIncompleteEmailNodemailer = async (toEmail, fullName, missingFields = []) => {
  const { transporter, fromAddress } = createTransporter();

  const missingListText = missingFields.map((f) => `- ${f}`).join('\n');
  const missingListHtml = missingFields.map((f) => `<li style="margin-bottom:6px; font-weight:600;">${f}</li>`).join('');

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: 'Complete Your Billing Platform Profile',
    text: `Hi ${fullName},\n\nYour profile information is incomplete. Please update your details.\n\nMissing details:\n${missingListText}\n\nUpdate profile: http://localhost:5173/profile\n\n— Billing Platform Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 0; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px; text-align: center;">
            <div style="margin-bottom: 8px;"><span style="display:inline-block; padding: 6px 16px; background: rgba(255,255,255,0.2); border-radius: 8px; color: white; font-weight: bold; font-size: 18px;">[LOGO] BILLING PLATFORM</span></div>
            <h2 style="color: white; margin: 0; font-size: 20px;">Complete Your Profile</h2>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 16px; color: #0f172a; font-weight: bold;">Hi ${fullName},</p>
            <p style="color: #475569; font-size: 14px;">Your profile information is incomplete. Please update your details to optimize your account security and billing.</p>
            <div style="background: #fffbe6; padding: 16px 20px; border-radius: 12px; border: 1px solid #ffe58f; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #873800; font-size: 13px;">⚠️ Missing Profile Details:</p>
              <ul style="margin: 0; padding-left: 20px; color: #431407; font-size: 13px;">
                ${missingListHtml || '<li>Name, Email, Mobile Number, or Address</li>'}
              </ul>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="http://localhost:5173/profile" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Complete Profile</a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">© 2026 Billing Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOTPEmailNodemailer,
  sendWelcomeEmailNodemailer,
  sendProfileIncompleteEmailNodemailer,
};
