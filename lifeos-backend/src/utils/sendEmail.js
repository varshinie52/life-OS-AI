const nodemailer = require('nodemailer');
const { env } = require('../config/env');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const message = {
    from: env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML version
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;
