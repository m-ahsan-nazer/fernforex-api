const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  // const msg = { from: config.email.from, to, subject, text };
  const msg = { from: config.email.from, to, subject, html: text };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const resetPasswordUrl = `www.fernforex.co.nz/reset-password?token=${token}`;
  const text = `<b>Kia ora</b>,
<p>To reset your password, click on this link: <a href=${resetPasswordUrl}>reset FernForex 
account password</a>.</p><p>If you did not request any password resets, then ignore this email.</p>`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `www.fernforex.co.nz/verify-email?token=${token}`;
  const text = `<b>Kia ora</b>,
<p>To verify your email, click on this link: <a href=${verificationEmailUrl}>verify FernForex 
account</a>.</p><p>If you did not create an account, then ignore this email.</p>`;

  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
