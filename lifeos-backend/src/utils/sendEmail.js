const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const ApiError = require('./ApiError');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true') {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  const rawPass = env.SMTP_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '');
  const port = Number(env.SMTP_PORT || 587);
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    auth: {
      user: env.SMTP_USER,
      pass: cleanPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

let transporterInstance = null;

const getTransporter = () => {
  if (!transporterInstance) {
    transporterInstance = createTransporter();
  }
  return transporterInstance;
};

const verifyTransporter = async () => {
  const transporter = getTransporter();
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error(`[SMTP Verification Failed] Host: ${env.SMTP_HOST}, User: ${env.SMTP_USER}, Code: ${error.code}, Message: ${error.message}`);
    throw new ApiError(500, `SMTP Connection Error (${error.code || 'FAIL'}): ${error.message}`);
  }
};

const sendEmail = async (options) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.error('[Email Error] SMTP credentials not configured.');
    throw new ApiError(500, 'Email service is not configured on the server. Missing SMTP credentials.');
  }

  const isTestEmail =
    process.env.NODE_ENV === 'test' ||
    process.env.E2E_TEST === 'true' ||
    (options.email && (options.email.endsWith('@lifeos.dev') || options.email.endsWith('@test.com') || options.email.includes('qa.test.')));

  const transporter = isTestEmail
    ? nodemailer.createTransport({ jsonTransport: true })
    : getTransporter();

  const message = {
    from: env.EMAIL_FROM || `LifeOS <${env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message || options.text || 'LifeOS Notification',
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`[Email Dispatched] MessageID: ${info.messageId || 'JSON_TEST_MODE'} to ${options.email}`);
    return info;
  } catch (error) {
    console.error(`[Nodemailer Error] Failed to send email to ${options.email}: ${error.message}`);
    throw new ApiError(500, `Failed to send email (${error.code || 'SMTP_ERROR'}): ${error.message}`);
  }
};

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.verifyTransporter = verifyTransporter;

