const nodemailer = require('nodemailer');

class NewsletterService {
  constructor() {
    this.transporter = null;
  }

  validateEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      throw Object.assign(new Error('A valid email address is required'), { statusCode: 400 });
    }

    return normalizedEmail;
  }

  getTransporter() {
    if (this.transporter) return this.transporter;

    const user = String(process.env.SMTP_USER || '').trim();
    const pass = String(process.env.SMTP_PASS || '').trim();

    if (!user || !pass) {
      throw Object.assign(
        new Error('Newsletter email is not configured. Set SMTP_USER and SMTP_PASS.'),
        { statusCode: 500 }
      );
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    return this.transporter;
  }

  buildHtml(email) {
    return `
      <div style="font-family: Inter, Arial, sans-serif; background:#f9fafb; padding:32px; color:#111827;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
          <div style="padding:24px 28px; background:#111827; color:#ffffff;">
            <h1 style="margin:0; font-size:24px;">Chain Newsletter</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">Thanks for subscribing to the Chain newsletter.</p>
            <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
              We will send product updates, useful HR insights and platform news to <strong>${email}</strong>.
            </p>
            <p style="margin:0; font-size:15px; line-height:1.7; color:#6b7280;">
              If you did not request this subscription, you can ignore this message.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  buildText(email) {
    return [
      'Thanks for subscribing to the Chain newsletter.',
      `We will send product updates, useful HR insights and platform news to ${email}.`,
      'If you did not request this subscription, you can ignore this message.',
    ].join('\n\n');
  }

  async subscribe(rawEmail) {
    const email = this.validateEmail(rawEmail);
    const transporter = this.getTransporter();
    const fromEmail = String(process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '').trim();
    const fromName = String(process.env.SMTP_FROM_NAME || 'Chain').trim();

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Chain newsletter subscription confirmed',
      text: this.buildText(email),
      html: this.buildHtml(email),
    });

    return { email };
  }
}

module.exports = new NewsletterService();
