import nodemailer from 'nodemailer';

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_PASSWORD !== 'REPLACE_WITH_GMAIL_APP_PASSWORD');

let transporter = null;
const getTransporter = () => {
  if (!transporter && isConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
};

/**
 * Sends an email with a PDF attachment. No-ops (logs only) until real SMTP
 * credentials are set — same dry-run pattern as whatsappService.
 */
const sendPdfEmail = async ({ to, subject, text, filename, pdfBuffer }) => {
  if (!to) return { skipped: 'no recipient email on file' };

  if (!isConfigured()) {
    console.log(`[Email:DRY-RUN] -> ${to}: "${subject}" (attachment: ${filename})`);
    return { dryRun: true };
  }

  return getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    attachments: [{ filename, content: pdfBuffer }],
  });
};

export { sendPdfEmail, isConfigured };
